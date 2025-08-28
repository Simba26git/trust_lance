// TrustLens - Upload Routes
// Handles file uploads and initiates analysis pipeline

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { S3Service } from '../services/s3';
import { QueueService } from '../services/queue';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { validateFileType, validateFileSize } from '../middleware/validation';
import { config } from '../config/environment';

const router = Router();
const prisma = new PrismaClient();
const s3Service = S3Service.getInstance();
const queueService = QueueService.getInstance();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (config.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

/**
 * POST /api/v1/uploads
 * Upload file for authenticity analysis
 */
router.post('/', 
  authMiddleware,
  upload.single('file'),
  validateFileType,
  validateFileSize,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please upload a file for analysis'
        });
      }

      if (!req.user?.organisation_id) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Valid organization membership required'
        });
      }

      const uploadId = uuidv4();
      const organisation = await prisma.organisation.findUnique({
        where: { id: req.user.organisation_id }
      });

      if (!organisation) {
        return res.status(404).json({
          error: 'Organization not found',
          message: 'Your organization could not be found'
        });
      }

      // Check credit limits
      if (organisation.credits_remaining <= 0) {
        return res.status(402).json({
          error: 'Insufficient credits',
          message: 'Your organization has no remaining credits. Please upgrade your plan.',
          credits_remaining: organisation.credits_remaining
        });
      }

      // Generate S3 key
      const s3Key = `uploads/${organisation.id}/${uploadId}/${req.file.originalname}`;
      
      logger.info('Starting file upload', {
        uploadId,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        organisationId: organisation.id
      });

      // Upload to S3
      const s3Result = await s3Service.uploadFile({
        key: s3Key,
        body: req.file.buffer,
        contentType: req.file.mimetype,
        metadata: {
          uploadId,
          organisationId: organisation.id,
          uploadedBy: req.user.id,
          originalName: req.file.originalname
        }
      });

      // Create upload record in database
      const upload = await prisma.upload.create({
        data: {
          id: uploadId,
          filename: req.file.originalname,
          original_filename: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          s3_key: s3Key,
          s3_bucket: config.S3_BUCKET_NAME,
          organisation_id: organisation.id,
          uploaded_by: req.user.id,
          status: 'UPLOADED',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Deduct credit (optimistically)
      await prisma.organisation.update({
        where: { id: organisation.id },
        data: {
          credits_remaining: {
            decrement: 1
          }
        }
      });

      // Add analysis job to queue
      await queueService.addAnalysisJob({
        uploadId,
        s3Key,
        mimeType: req.file.mimetype,
        organisationId: organisation.id,
        uploadedBy: req.user.id,
        priority: organisation.subscription_tier === 'ENTERPRISE' ? 'high' : 'normal'
      });

      logger.info('File uploaded successfully', {
        uploadId,
        s3Key,
        location: s3Result.location
      });

      // Return upload confirmation
      res.status(200).json({
        success: true,
        upload_id: uploadId,
        filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        status: 'UPLOADED',
        message: 'File uploaded successfully. Analysis will begin shortly.',
        estimated_completion: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
        credits_remaining: organisation.credits_remaining - 1
      });

    } catch (error) {
      logger.error('Upload failed', {
        error,
        filename: req.file?.originalname,
        organisationId: req.user?.organisation_id
      });
      
      next(error);
    }
  }
);

/**
 * GET /api/v1/uploads/:uploadId
 * Get upload status and basic information
 */
router.get('/:uploadId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;

      const upload = await prisma.upload.findFirst({
        where: {
          id: uploadId,
          organisation_id: req.user?.organisation_id
        },
        include: {
          analysis_result: {
            select: {
              id: true,
              verdict: true,
              aggregated_score: true,
              risk_level: true,
              processing_time: true,
              created_at: true
            }
          }
        }
      });

      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: 'The requested upload could not be found'
        });
      }

      res.json({
        upload_id: upload.id,
        filename: upload.filename,
        original_filename: upload.original_filename,
        file_size: upload.file_size,
        mime_type: upload.mime_type,
        status: upload.status,
        uploaded_at: upload.created_at,
        updated_at: upload.updated_at,
        analysis: upload.analysis_result ? {
          verdict: upload.analysis_result.verdict,
          score: upload.analysis_result.aggregated_score,
          risk_level: upload.analysis_result.risk_level,
          processing_time: upload.analysis_result.processing_time,
          completed_at: upload.analysis_result.created_at
        } : null
      });

    } catch (error) {
      logger.error('Failed to get upload', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/uploads
 * List uploads for organization with pagination
 */
router.get('/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const status = req.query.status as string;
      const verdict = req.query.verdict as string;

      // Build where clause
      const where: any = {
        organisation_id: req.user?.organisation_id
      };

      if (status) {
        where.status = status;
      }

      if (verdict) {
        where.analysis_result = {
          verdict: verdict
        };
      }

      // Get uploads with pagination
      const [uploads, totalCount] = await Promise.all([
        prisma.upload.findMany({
          where,
          include: {
            analysis_result: {
              select: {
                verdict: true,
                aggregated_score: true,
                risk_level: true,
                processing_time: true
              }
            },
            uploaded_by_user: {
              select: {
                email: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          skip: offset,
          take: limit
        }),
        prisma.upload.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        uploads: uploads.map(upload => ({
          upload_id: upload.id,
          filename: upload.filename,
          file_size: upload.file_size,
          mime_type: upload.mime_type,
          status: upload.status,
          uploaded_at: upload.created_at,
          uploaded_by: upload.uploaded_by_user?.email,
          analysis: upload.analysis_result ? {
            verdict: upload.analysis_result.verdict,
            score: upload.analysis_result.aggregated_score,
            risk_level: upload.analysis_result.risk_level,
            processing_time: upload.analysis_result.processing_time
          } : null
        })),
        pagination: {
          page,
          limit,
          total_count: totalCount,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });

    } catch (error) {
      logger.error('Failed to list uploads', {
        organisationId: req.user?.organisation_id,
        error
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/uploads/:uploadId
 * Delete upload and associated analysis data
 */
router.delete('/:uploadId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;

      // Check if user has permission to delete this upload
      const upload = await prisma.upload.findFirst({
        where: {
          id: uploadId,
          organisation_id: req.user?.organisation_id
        }
      });

      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: 'The requested upload could not be found'
        });
      }

      // Check if user is admin or the uploader
      if (req.user?.role !== 'ADMIN' && upload.uploaded_by !== req.user?.id) {
        return res.status(403).json({
          error: 'Permission denied',
          message: 'You do not have permission to delete this upload'
        });
      }

      logger.info('Deleting upload', {
        uploadId,
        s3Key: upload.s3_key,
        organisationId: req.user?.organisation_id
      });

      // Delete from S3
      try {
        await s3Service.deleteFile(upload.s3_key);
      } catch (s3Error) {
        logger.warn('Failed to delete file from S3', {
          uploadId,
          s3Key: upload.s3_key,
          error: s3Error
        });
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database (this will cascade to analysis_result)
      await prisma.upload.delete({
        where: { id: uploadId }
      });

      res.json({
        success: true,
        message: 'Upload deleted successfully',
        upload_id: uploadId
      });

    } catch (error) {
      logger.error('Failed to delete upload', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/uploads/:uploadId/reanalyze
 * Rerun analysis on existing upload
 */
router.post('/:uploadId/reanalyze',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;

      // Check if upload exists and user has access
      const upload = await prisma.upload.findFirst({
        where: {
          id: uploadId,
          organisation_id: req.user?.organisation_id
        },
        include: {
          organisation: true
        }
      });

      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: 'The requested upload could not be found'
        });
      }

      // Check if organization has credits for reanalysis
      if (upload.organisation.credits_remaining <= 0) {
        return res.status(402).json({
          error: 'Insufficient credits',
          message: 'Your organization has no remaining credits for reanalysis'
        });
      }

      // Update upload status
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'PROCESSING',
          updated_at: new Date()
        }
      });

      // Deduct credit for reanalysis
      await prisma.organisation.update({
        where: { id: upload.organisation_id },
        data: {
          credits_remaining: {
            decrement: 1
          }
        }
      });

      // Add reanalysis job to queue with high priority
      await queueService.addAnalysisJob({
        uploadId,
        s3Key: upload.s3_key,
        mimeType: upload.mime_type,
        organisationId: upload.organisation_id,
        uploadedBy: req.user?.id || upload.uploaded_by,
        priority: 'high',
        isReanalysis: true
      });

      logger.info('Reanalysis started', {
        uploadId,
        organisationId: upload.organisation_id,
        requestedBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'Reanalysis started successfully',
        upload_id: uploadId,
        estimated_completion: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        credits_remaining: upload.organisation.credits_remaining - 1
      });

    } catch (error) {
      logger.error('Failed to start reanalysis', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

export default router;
