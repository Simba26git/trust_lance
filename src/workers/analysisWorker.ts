import { Job } from 'bullmq';
import { PrismaClient, UploadStatus, AnalysisVerdict } from '@prisma/client';
import { logger } from '../utils/logger';
import { calculateAuthenticityScore, shouldEscalate, ScoringInputs } from '../utils/scoring';
import { downloadFile, uploadFile } from '../services/s3';
import { extractMetadata } from '../services/metadata';
import { calculatePhash, findPhashMatches } from '../services/phash';
import { reverseImageSearch } from '../services/reverseImage';
import { detectDeepfake } from '../services/deepfake';
import { checkTruepicVerification } from '../services/truepic';
import { generatePdfReport } from '../services/reports';
import { addWebhookJob, addBillingJob } from '../services/queue';
import { checkSellerIdentity } from '../services/identity';
import { runHeuristicChecks } from '../services/heuristics';

const prisma = new PrismaClient();

export interface AnalysisJobData {
  uploadId: string;
  organisationId: string;
  merchantId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  escalated?: boolean;
  retryCount?: number;
}

/**
 * Main analysis worker function
 * Processes uploaded files through the complete authenticity verification pipeline
 */
export async function analysisWorker(job: Job<AnalysisJobData>): Promise<void> {
  const { uploadId, organisationId, merchantId, escalated = false } = job.data;
  const startTime = Date.now();
  
  logger.info(`Starting analysis for upload ${uploadId}`, {
    uploadId,
    organisationId,
    merchantId,
    escalated,
  });

  try {
    // Step 1: Get upload record and validate
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        organisation: true,
        merchant: true,
      },
    });

    if (!upload) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    if (upload.status !== UploadStatus.PENDING && upload.status !== UploadStatus.PROCESSING) {
      logger.warn(`Upload ${uploadId} is not in pending/processing status: ${upload.status}`);
      return;
    }

    // Update status to processing
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.PROCESSING },
    });

    // Step 2: Download file for processing
    logger.info(`Downloading file for analysis: ${upload.storedS3Key}`);
    const fileBuffer = await downloadFile(upload.storedS3Key);
    
    // Step 3: Extract metadata (EXIF, C2PA)
    logger.info(`Extracting metadata for upload ${uploadId}`);
    const metadata = await extractMetadata(fileBuffer, upload.contentType);
    
    // Step 4: Calculate perceptual hash
    logger.info(`Calculating perceptual hash for upload ${uploadId}`);
    const phash = await calculatePhash(fileBuffer);
    
    // Step 5: Find pHash matches in our database
    logger.info(`Searching for pHash matches for upload ${uploadId}`);
    const phashMatches = await findPhashMatches(phash, 8); // Hamming distance <= 8
    
    // Step 6: Basic heuristic checks
    logger.info(`Running heuristic checks for upload ${uploadId}`);
    const heuristics = await runHeuristicChecks(fileBuffer, upload, metadata);
    
    // Step 7: Prepare initial scoring inputs
    const scoringInputs: Partial<ScoringInputs> = {
      c2paFound: metadata.c2pa?.found || false,
      c2paIssuer: metadata.c2pa?.issuer,
      c2paSignedDate: metadata.c2pa?.signedDate,
      exifPresent: metadata.exif?.present || false,
      exifFields: metadata.exif?.fields,
      exifConsistent: metadata.exif?.consistent || false,
      phashMatches: phashMatches.map(match => ({
        url: match.url,
        hammingDistance: match.hammingDistance,
        source: match.source,
      })),
      suspiciousAspectRatio: heuristics.suspiciousAspectRatio,
      lowResolutionUpscale: heuristics.lowResolutionUpscale,
      hasWatermarks: heuristics.hasWatermarks,
      multipleUploadsFromIP: heuristics.multipleUploadsFromIP,
      reverseImageMatches: [], // Will be populated if escalated
    };

    // Step 8: Decide whether to escalate to expensive checks
    const needsEscalation = escalated || shouldEscalate(scoringInputs, 0.4);
    
    let analysisPartial = false;
    let partialReason = '';

    if (needsEscalation) {
      logger.info(`Escalating upload ${uploadId} for expensive checks`);
      
      try {
        // Step 9a: Reverse image search
        logger.info(`Performing reverse image search for upload ${uploadId}`);
        const reverseMatches = await reverseImageSearch(fileBuffer);
        scoringInputs.reverseImageMatches = reverseMatches.map(match => ({
          url: match.url,
          confidence: match.confidence,
          source: match.source,
        }));
      } catch (error) {
        logger.warn(`Reverse image search failed for upload ${uploadId}:`, error);
        analysisPartial = true;
        partialReason += 'Reverse image search failed; ';
      }

      try {
        // Step 9b: Deepfake detection
        if (upload.contentType.startsWith('image/')) {
          logger.info(`Running deepfake detection for upload ${uploadId}`);
          const deepfakeResult = await detectDeepfake(fileBuffer, 'image');
          scoringInputs.deepfakeScore = deepfakeResult.probability;
          scoringInputs.deepfakeProvider = deepfakeResult.provider;
        }
      } catch (error) {
        logger.warn(`Deepfake detection failed for upload ${uploadId}:`, error);
        analysisPartial = true;
        partialReason += 'Deepfake detection failed; ';
      }

      try {
        // Step 9c: TruePic verification (if applicable)
        if (metadata.truepic?.id) {
          logger.info(`Checking TruePic verification for upload ${uploadId}`);
          const truepicResult = await checkTruepicVerification(metadata.truepic.id);
          scoringInputs.truepicVerified = truepicResult.verified;
        }
      } catch (error) {
        logger.warn(`TruePic verification failed for upload ${uploadId}:`, error);
        analysisPartial = true;
        partialReason += 'TruePic verification failed; ';
      }
    }

    // Step 10: Seller identity checks (if merchant provided)
    if (merchantId) {
      try {
        logger.info(`Checking seller identity for upload ${uploadId}`);
        const identityScore = await checkSellerIdentity(merchantId);
        scoringInputs.sellerIdentityScore = identityScore;
      } catch (error) {
        logger.warn(`Seller identity check failed for upload ${uploadId}:`, error);
        analysisPartial = true;
        partialReason += 'Seller identity check failed; ';
      }
    }

    // Step 11: Calculate final authenticity score
    logger.info(`Calculating authenticity score for upload ${uploadId}`);
    const scoringResult = calculateAuthenticityScore(scoringInputs as ScoringInputs);
    
    // Step 12: Generate PDF report
    logger.info(`Generating PDF report for upload ${uploadId}`);
    const reportPdf = await generatePdfReport(upload, scoringResult, metadata);
    const reportS3Key = `reports/${uploadId}.pdf`;
    await uploadFile(reportS3Key, reportPdf, 'application/pdf');

    // Step 13: Save analysis results to database
    const processingTime = Date.now() - startTime;
    
    await prisma.analysisResult.create({
      data: {
        uploadId,
        c2paFound: scoringInputs.c2paFound || false,
        c2paIssuer: scoringInputs.c2paIssuer,
        c2paSignedDate: scoringInputs.c2paSignedDate,
        exifPresent: scoringInputs.exifPresent || false,
        exifFields: scoringInputs.exifFields || {},
        phash,
        phashMatches: scoringInputs.phashMatches || [],
        reverseMatches: scoringInputs.reverseImageMatches || [],
        deepfakeScore: scoringInputs.deepfakeScore,
        deepfakeProvider: scoringInputs.deepfakeProvider,
        truepicVerified: scoringInputs.truepicVerified,
        sellerIdentityScore: scoringInputs.sellerIdentityScore,
        aggregatedScore: scoringResult.aggregatedScore,
        verdict: mapVerdictToEnum(scoringResult.verdict),
        evidence: scoringResult.evidence,
        reportPdfS3Key: reportS3Key,
        analysisVersion: 'v1.0.0',
        analysisPartial,
        partialReason: partialReason.trim(),
        processingTimeMs: processingTime,
        completedAt: new Date(),
      },
    });

    // Step 14: Update upload status
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: UploadStatus.COMPLETED },
    });

    // Step 15: Add to review queue if suspect
    if (scoringResult.verdict === 'suspect' || analysisPartial) {
      await prisma.analysisReview.create({
        data: {
          analysisResultId: (await prisma.analysisResult.findUnique({
            where: { uploadId },
          }))!.id,
          originalScore: scoringResult.aggregatedScore,
          priority: scoringResult.verdict === 'suspect' ? 'HIGH' : 'NORMAL',
          slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        },
      });
    }

    // Step 16: Send webhooks
    const webhookPayload = {
      type: 'analysis.complete',
      data: {
        upload_id: uploadId,
        aggregated_score: scoringResult.aggregatedScore,
        verdict: scoringResult.verdict,
        analysis_url: `${process.env.API_BASE_URL}/api/v1/analysis/${uploadId}`,
      },
    };

    // Send webhook to merchant (if configured)
    if (upload.merchant?.webhookSecret) {
      await addWebhookJob({
        uploadId,
        url: upload.merchant.shopUrl + '/webhooks/trustlens',
        payload: webhookPayload,
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Send webhook to organisation (if configured)
    if (upload.organisation?.settings?.webhookUrl) {
      await addWebhookJob({
        uploadId,
        url: upload.organisation.settings.webhookUrl,
        payload: webhookPayload,
        retryCount: 0,
        maxRetries: 3,
      });
    }

    // Step 17: Update billing usage
    await addBillingJob({
      organisationId,
      eventType: 'usage_increment',
      metadata: {
        uploadId,
        processingTimeMs: processingTime,
        escalated: needsEscalation,
      },
    });

    logger.info(`Analysis completed for upload ${uploadId}`, {
      uploadId,
      score: scoringResult.aggregatedScore,
      verdict: scoringResult.verdict,
      processingTimeMs: processingTime,
      escalated: needsEscalation,
      partial: analysisPartial,
    });

  } catch (error) {
    logger.error(`Analysis failed for upload ${uploadId}:`, error);
    
    // Update upload status to failed
    await prisma.upload.update({
      where: { id: uploadId },
      data: { 
        status: UploadStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Re-throw error to trigger job retry
    throw error;
  }
}

/**
 * Map string verdict to Prisma enum
 */
function mapVerdictToEnum(verdict: string): AnalysisVerdict {
  switch (verdict) {
    case 'safe':
      return AnalysisVerdict.SAFE;
    case 'caution':
      return AnalysisVerdict.CAUTION;
    case 'suspect':
      return AnalysisVerdict.SUSPECT;
    default:
      return AnalysisVerdict.SUSPECT;
  }
}
