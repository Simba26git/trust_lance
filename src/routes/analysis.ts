// TrustLens - Analysis Results Routes
// Provides detailed analysis results and reports

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PDFReportService } from '../services/pdf-report';
import { S3Service } from '../services/s3';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { config } from '../config/environment';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const pdfReportService = PDFReportService.getInstance();
const s3Service = S3Service.getInstance();

/**
 * GET /api/v1/analysis/:uploadId
 * Get comprehensive analysis results
 */
router.get('/:uploadId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      const includeDetailed = req.query.detailed === 'true';

      // Find analysis result with upload info
      const analysisResult = await prisma.analysis_result.findFirst({
        where: {
          upload_id: uploadId,
          upload: {
            organisation_id: req.user?.organisation_id
          }
        },
        include: {
          upload: {
            select: {
              id: true,
              filename: true,
              original_filename: true,
              file_size: true,
              mime_type: true,
              status: true,
              created_at: true,
              uploaded_by_user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      if (!analysisResult) {
        // Check if upload exists but analysis is not complete
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

        return res.status(202).json({
          upload_id: uploadId,
          status: upload.status,
          message: 'Analysis is still in progress',
          estimated_completion: new Date(Date.now() + 60 * 1000).toISOString()
        });
      }

      // Prepare response data
      const responseData: any = {
        upload_id: uploadId,
        upload_info: {
          filename: analysisResult.upload.filename,
          original_filename: analysisResult.upload.original_filename,
          file_size: analysisResult.upload.file_size,
          mime_type: analysisResult.upload.mime_type,
          uploaded_at: analysisResult.upload.created_at,
          uploaded_by: analysisResult.upload.uploaded_by_user?.email
        },
        analysis: {
          verdict: analysisResult.verdict,
          aggregated_score: analysisResult.aggregated_score,
          risk_level: analysisResult.risk_level,
          confidence: analysisResult.confidence,
          processing_time: analysisResult.processing_time,
          completed_at: analysisResult.created_at
        }
      };

      // Add detailed analysis if requested
      if (includeDetailed) {
        responseData.detailed_analysis = {
          c2pa_verification: analysisResult.c2pa_verification,
          deepfake_detection: analysisResult.deepfake_detection,
          reverse_image_search: analysisResult.reverse_image_search,
          metadata_analysis: analysisResult.metadata_analysis,
          factor_scores: {
            c2pa_score: analysisResult.c2pa_score,
            deepfake_score: analysisResult.deepfake_score,
            reverse_search_score: analysisResult.reverse_search_score,
            metadata_score: analysisResult.metadata_score
          },
          factor_weights: {
            c2pa_weight: analysisResult.c2pa_weight,
            deepfake_weight: analysisResult.deepfake_weight,
            reverse_search_weight: analysisResult.reverse_search_weight,
            metadata_weight: analysisResult.metadata_weight
          },
          risk_factors: analysisResult.risk_factors,
          positive_indicators: analysisResult.positive_indicators,
          reasoning: analysisResult.reasoning
        };
      } else {
        // Provide summary for non-detailed requests
        responseData.summary = {
          risk_factors_count: Array.isArray(analysisResult.risk_factors) ? 
            analysisResult.risk_factors.length : 0,
          positive_indicators_count: Array.isArray(analysisResult.positive_indicators) ? 
            analysisResult.positive_indicators.length : 0,
          primary_concerns: Array.isArray(analysisResult.risk_factors) ? 
            analysisResult.risk_factors.slice(0, 3) : [],
          key_strengths: Array.isArray(analysisResult.positive_indicators) ? 
            analysisResult.positive_indicators.slice(0, 3) : []
        };
      }

      res.json(responseData);

    } catch (error) {
      logger.error('Failed to get analysis result', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analysis/:uploadId/report
 * Generate and download PDF report
 */
router.get('/:uploadId/report',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      const format = req.query.format as string || 'pdf';

      if (format !== 'pdf') {
        return res.status(400).json({
          error: 'Invalid format',
          message: 'Only PDF format is currently supported'
        });
      }

      // Get analysis result with all related data
      const analysisResult = await prisma.analysis_result.findFirst({
        where: {
          upload_id: uploadId,
          upload: {
            organisation_id: req.user?.organisation_id
          }
        },
        include: {
          upload: {
            include: {
              organisation: {
                select: {
                  name: true
                }
              },
              uploaded_by_user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      if (!analysisResult) {
        return res.status(404).json({
          error: 'Analysis not found',
          message: 'Analysis result not found or not accessible'
        });
      }

      // Check if PDF reports are enabled
      if (!config.ENABLE_PDF_REPORTS) {
        return res.status(503).json({
          error: 'PDF reports disabled',
          message: 'PDF report generation is currently disabled'
        });
      }

      logger.info('Generating PDF report', {
        uploadId,
        organisationId: req.user?.organisation_id
      });

      // Prepare report data
      const reportData = {
        upload_id: uploadId,
        filename: analysisResult.upload.filename,
        uploaded_at: analysisResult.upload.created_at,
        analysis_completed_at: analysisResult.created_at,
        organisation_name: analysisResult.upload.organisation.name,
        verdict: analysisResult.verdict,
        aggregated_score: analysisResult.aggregated_score,
        risk_level: analysisResult.risk_level,
        confidence: analysisResult.confidence || 0,
        
        c2pa_verification: analysisResult.c2pa_verification,
        deepfake_detection: analysisResult.deepfake_detection,
        reverse_image_search: analysisResult.reverse_image_search,
        metadata_analysis: {
          ...analysisResult.metadata_analysis,
          file_size: analysisResult.upload.file_size,
          dimensions: analysisResult.metadata_analysis?.dimensions || { width: 0, height: 0 }
        },
        
        factor_scores: {
          c2pa_score: analysisResult.c2pa_score || 50,
          deepfake_score: analysisResult.deepfake_score || 50,
          reverse_search_score: analysisResult.reverse_search_score || 50,
          metadata_score: analysisResult.metadata_score || 50
        },
        
        risk_factors: Array.isArray(analysisResult.risk_factors) ? 
          analysisResult.risk_factors : [],
        positive_indicators: Array.isArray(analysisResult.positive_indicators) ? 
          analysisResult.positive_indicators : [],
        processing_time: analysisResult.processing_time || 0
      };

      // Generate temporary file path
      const tempDir = '/tmp/trustlens-reports';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const reportFileName = `trustlens-report-${uploadId}-${Date.now()}.pdf`;
      const reportPath = path.join(tempDir, reportFileName);

      // Generate PDF report
      await pdfReportService.generateReport(reportData, reportPath);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the PDF file
      const fileStream = fs.createReadStream(reportPath);
      fileStream.pipe(res);

      // Clean up temporary file after sending
      fileStream.on('end', () => {
        fs.unlink(reportPath, (err) => {
          if (err) {
            logger.warn('Failed to clean up temporary PDF file', {
              reportPath,
              error: err
            });
          }
        });
      });

      logger.info('PDF report generated and sent', {
        uploadId,
        reportFileName,
        organisationId: req.user?.organisation_id
      });

    } catch (error) {
      logger.error('Failed to generate PDF report', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analysis/:uploadId/download
 * Download original file with analysis overlay (if applicable)
 */
router.get('/:uploadId/download',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      const withOverlay = req.query.overlay === 'true';

      // Get upload information
      const upload = await prisma.upload.findFirst({
        where: {
          id: uploadId,
          organisation_id: req.user?.organisation_id
        },
        include: {
          analysis_result: {
            select: {
              verdict: true,
              aggregated_score: true,
              risk_level: true
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

      logger.info('Downloading file', {
        uploadId,
        s3Key: upload.s3_key,
        withOverlay
      });

      // Get file from S3
      const fileData = await s3Service.getFile(upload.s3_key);

      // Set response headers
      res.setHeader('Content-Type', upload.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${upload.original_filename}"`);
      res.setHeader('Content-Length', upload.file_size.toString());

      // If overlay requested and analysis exists, add watermark (simplified)
      if (withOverlay && upload.analysis_result) {
        // In production, you would overlay the verdict/score on the image
        // For now, just add custom headers
        res.setHeader('X-TrustLens-Verdict', upload.analysis_result.verdict);
        res.setHeader('X-TrustLens-Score', upload.analysis_result.aggregated_score.toString());
        res.setHeader('X-TrustLens-Risk', upload.analysis_result.risk_level);
      }

      // Stream the file data
      res.send(fileData);

    } catch (error) {
      logger.error('Failed to download file', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/analysis/:uploadId/verdict
 * Update analysis verdict (admin only)
 */
router.post('/:uploadId/verdict',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uploadId } = req.params;
      const { verdict, reason } = req.body;

      // Check admin permissions
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Permission denied',
          message: 'Only administrators can update verdicts'
        });
      }

      // Validate verdict
      const validVerdicts = ['GENUINE', 'SUSPICIOUS', 'FAKE'];
      if (!validVerdicts.includes(verdict)) {
        return res.status(400).json({
          error: 'Invalid verdict',
          message: 'Verdict must be one of: GENUINE, SUSPICIOUS, FAKE'
        });
      }

      // Find and update analysis result
      const analysisResult = await prisma.analysis_result.findFirst({
        where: {
          upload_id: uploadId,
          upload: {
            organisation_id: req.user?.organisation_id
          }
        }
      });

      if (!analysisResult) {
        return res.status(404).json({
          error: 'Analysis not found',
          message: 'Analysis result not found or not accessible'
        });
      }

      // Update verdict with admin override
      const updatedResult = await prisma.analysis_result.update({
        where: { id: analysisResult.id },
        data: {
          verdict: verdict,
          admin_override: true,
          admin_override_reason: reason,
          admin_override_by: req.user.id,
          admin_override_at: new Date(),
          updated_at: new Date()
        }
      });

      logger.info('Analysis verdict updated by admin', {
        uploadId,
        oldVerdict: analysisResult.verdict,
        newVerdict: verdict,
        adminId: req.user.id,
        reason
      });

      res.json({
        success: true,
        message: 'Verdict updated successfully',
        upload_id: uploadId,
        old_verdict: analysisResult.verdict,
        new_verdict: verdict,
        reason: reason,
        updated_by: req.user.email,
        updated_at: updatedResult.updated_at
      });

    } catch (error) {
      logger.error('Failed to update verdict', {
        uploadId: req.params.uploadId,
        error
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analysis/stats
 * Get analysis statistics for organization
 */
router.get('/stats',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period } = req.query; // 'day', 'week', 'month', 'year'
      const periodDays = period === 'day' ? 1 : 
                        period === 'week' ? 7 : 
                        period === 'month' ? 30 : 
                        period === 'year' ? 365 : 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get analysis statistics
      const [
        totalAnalyses,
        genuineCount,
        suspiciousCount,
        fakeCount,
        avgScore,
        avgProcessingTime
      ] = await Promise.all([
        // Total analyses
        prisma.analysis_result.count({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            created_at: {
              gte: startDate
            }
          }
        }),

        // Genuine count
        prisma.analysis_result.count({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            verdict: 'GENUINE',
            created_at: {
              gte: startDate
            }
          }
        }),

        // Suspicious count
        prisma.analysis_result.count({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            verdict: 'SUSPICIOUS',
            created_at: {
              gte: startDate
            }
          }
        }),

        // Fake count
        prisma.analysis_result.count({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            verdict: 'FAKE',
            created_at: {
              gte: startDate
            }
          }
        }),

        // Average score
        prisma.analysis_result.aggregate({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            created_at: {
              gte: startDate
            }
          },
          _avg: {
            aggregated_score: true
          }
        }),

        // Average processing time
        prisma.analysis_result.aggregate({
          where: {
            upload: {
              organisation_id: req.user?.organisation_id
            },
            created_at: {
              gte: startDate
            }
          },
          _avg: {
            processing_time: true
          }
        })
      ]);

      res.json({
        period: period || 'month',
        period_days: periodDays,
        start_date: startDate,
        end_date: new Date(),
        statistics: {
          total_analyses: totalAnalyses,
          verdict_distribution: {
            genuine: genuineCount,
            suspicious: suspiciousCount,
            fake: fakeCount
          },
          verdict_percentages: {
            genuine: totalAnalyses > 0 ? Math.round((genuineCount / totalAnalyses) * 100) : 0,
            suspicious: totalAnalyses > 0 ? Math.round((suspiciousCount / totalAnalyses) * 100) : 0,
            fake: totalAnalyses > 0 ? Math.round((fakeCount / totalAnalyses) * 100) : 0
          },
          average_score: avgScore._avg.aggregated_score ? 
            Math.round(avgScore._avg.aggregated_score) : 0,
          average_processing_time: avgProcessingTime._avg.processing_time ? 
            Math.round(avgProcessingTime._avg.processing_time) : 0
        }
      });

    } catch (error) {
      logger.error('Failed to get analysis statistics', {
        organisationId: req.user?.organisation_id,
        error
      });
      next(error);
    }
  }
);

export default router;
