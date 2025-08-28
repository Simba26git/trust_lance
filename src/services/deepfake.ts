// TrustLens - Deepfake Detection Service
// Integrates with third-party deepfake detection APIs and provides local analysis

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

export interface DeepfakeDetectionResult {
  score: number; // 0-100, higher means more likely to be deepfake
  confidence: number; // 0-100, confidence in the score
  detected_faces: number;
  technology_used: string;
  processing_time: number;
  detailed_analysis?: {
    face_regions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      deepfake_probability: number;
      confidence: number;
    }>;
    temporal_consistency?: number; // For videos
    compression_artifacts?: boolean;
    manipulation_indicators: string[];
  };
}

export interface SensityApiResponse {
  status: string;
  result: {
    detection_score: number;
    confidence: number;
    faces: Array<{
      bbox: [number, number, number, number];
      deepfake_score: number;
      confidence: number;
    }>;
    metadata: {
      processing_time: number;
      model_version: string;
    };
  };
}

export interface TruePicResponse {
  authenticity_score: number;
  confidence: number;
  manipulation_detected: boolean;
  analysis: {
    face_count: number;
    temporal_anomalies?: boolean;
    compression_analysis: boolean;
    detection_details: string[];
  };
}

export class DeepfakeDetectionService {
  private static instance: DeepfakeDetectionService;
  private sensityApiKey: string;
  private truepicApiKey: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.sensityApiKey = config.SENSITY_API_KEY || '';
    this.truepicApiKey = config.TRUEPIC_API_KEY || '';
    
    if (!this.sensityApiKey && !this.truepicApiKey) {
      logger.warn('No deepfake detection API keys configured');
    }
  }

  public static getInstance(): DeepfakeDetectionService {
    if (!DeepfakeDetectionService.instance) {
      DeepfakeDetectionService.instance = new DeepfakeDetectionService();
    }
    return DeepfakeDetectionService.instance;
  }

  /**
   * Analyze file for deepfake content using multiple detection methods
   */
  async analyzeForDeepfake(
    filePath: string,
    mimeType: string,
    uploadId: string
  ): Promise<DeepfakeDetectionResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting deepfake detection analysis', { uploadId, mimeType });

      // Determine if file is image or video
      const isVideo = mimeType.startsWith('video/');
      const isImage = mimeType.startsWith('image/');

      if (!isImage && !isVideo) {
        throw new Error('Unsupported file type for deepfake detection');
      }

      // Run multiple detection methods in parallel
      const detectionPromises: Promise<Partial<DeepfakeDetectionResult>>[] = [];

      // Primary detection using Sensity AI
      if (this.sensityApiKey) {
        detectionPromises.push(this.analyzeBySensity(filePath, isVideo, uploadId));
      }

      // Secondary detection using TruePic
      if (this.truepicApiKey) {
        detectionPromises.push(this.analyzeByTruePic(filePath, isVideo, uploadId));
      }

      // Local analysis as fallback
      detectionPromises.push(this.analyzeLocally(filePath, isVideo, uploadId));

      // Wait for all analyses to complete
      const results = await Promise.allSettled(detectionPromises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<Partial<DeepfakeDetectionResult>> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulResults.length === 0) {
        throw new Error('All deepfake detection methods failed');
      }

      // Aggregate results from multiple sources
      const aggregatedResult = this.aggregateDetectionResults(successfulResults);
      
      const processingTime = Date.now() - startTime;
      aggregatedResult.processing_time = processingTime;

      logger.info('Deepfake detection completed', {
        uploadId,
        score: aggregatedResult.score,
        confidence: aggregatedResult.confidence,
        faces: aggregatedResult.detected_faces,
        processingTime
      });

      return aggregatedResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Deepfake detection failed', { uploadId, error, processingTime });
      
      // Return neutral result with low confidence on failure
      return {
        score: 50,
        confidence: 10,
        detected_faces: 0,
        technology_used: 'Error - Analysis Failed',
        processing_time: processingTime,
        detailed_analysis: {
          face_regions: [],
          manipulation_indicators: ['Analysis failed due to technical error']
        }
      };
    }
  }

  /**
   * Analyze using Sensity AI API
   */
  private async analyzeBySensity(
    filePath: string,
    isVideo: boolean,
    uploadId: string
  ): Promise<Partial<DeepfakeDetectionResult>> {
    try {
      logger.info('Analyzing with Sensity AI', { uploadId, isVideo });

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('type', isVideo ? 'video' : 'image');

      const response = await this.makeApiRequestWithRetry(
        'https://api.sensity.ai/v1/detect',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sensityApiKey}`,
            ...formData.getHeaders()
          },
          data: formData,
          timeout: 60000, // 60 seconds timeout
          maxContentLength: 100 * 1024 * 1024, // 100MB
          maxBodyLength: 100 * 1024 * 1024
        }
      );

      const sensityResult: SensityApiResponse = response.data;

      if (sensityResult.status !== 'success') {
        throw new Error(`Sensity API returned error status: ${sensityResult.status}`);
      }

      // Convert Sensity response to our format
      const faceRegions = sensityResult.result.faces.map(face => ({
        x: face.bbox[0],
        y: face.bbox[1],
        width: face.bbox[2] - face.bbox[0],
        height: face.bbox[3] - face.bbox[1],
        deepfake_probability: face.deepfake_score,
        confidence: face.confidence
      }));

      return {
        score: sensityResult.result.detection_score,
        confidence: sensityResult.result.confidence,
        detected_faces: sensityResult.result.faces.length,
        technology_used: `Sensity AI ${sensityResult.result.metadata.model_version}`,
        detailed_analysis: {
          face_regions: faceRegions,
          manipulation_indicators: this.generateManipulationIndicators(sensityResult.result.detection_score)
        }
      };

    } catch (error) {
      logger.error('Sensity AI analysis failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Analyze using TruePic API
   */
  private async analyzeByTruePic(
    filePath: string,
    isVideo: boolean,
    uploadId: string
  ): Promise<Partial<DeepfakeDetectionResult>> {
    try {
      logger.info('Analyzing with TruePic', { uploadId, isVideo });

      const formData = new FormData();
      formData.append('media', fs.createReadStream(filePath));
      formData.append('analysis_type', 'deepfake_detection');

      const response = await this.makeApiRequestWithRetry(
        'https://api.truepic.com/v2/analyze',
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.truepicApiKey,
            ...formData.getHeaders()
          },
          data: formData,
          timeout: 60000
        }
      );

      const truepicResult: TruePicResponse = response.data;

      // Convert manipulation score (0-100) to deepfake score (0-100)
      const deepfakeScore = truepicResult.manipulation_detected ? 
        (100 - truepicResult.authenticity_score) : 
        (100 - truepicResult.authenticity_score) * 0.5;

      return {
        score: Math.round(deepfakeScore),
        confidence: truepicResult.confidence,
        detected_faces: truepicResult.analysis.face_count,
        technology_used: 'TruePic Analysis Engine',
        detailed_analysis: {
          face_regions: [], // TruePic doesn't provide face regions
          temporal_consistency: isVideo ? !truepicResult.analysis.temporal_anomalies : undefined,
          compression_artifacts: truepicResult.analysis.compression_analysis,
          manipulation_indicators: truepicResult.analysis.detection_details
        }
      };

    } catch (error) {
      logger.error('TruePic analysis failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Local deepfake detection analysis (fallback method)
   */
  private async analyzeLocally(
    filePath: string,
    isVideo: boolean,
    uploadId: string
  ): Promise<Partial<DeepfakeDetectionResult>> {
    try {
      logger.info('Performing local deepfake analysis', { uploadId, isVideo });

      // This is a simplified local analysis
      // In production, you'd integrate with libraries like:
      // - FaceSwapper detection models
      // - DeepFaceLab detection
      // - Custom trained models

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Heuristic analysis based on file characteristics
      let suspicionScore = 0;
      const indicators: string[] = [];

      // Check file size patterns
      if (isVideo) {
        // Videos that are too perfect in compression might be generated
        const sizePerMB = fileSize / (1024 * 1024);
        if (sizePerMB < 1 && stats.mtimeMs > 0) {
          suspicionScore += 10;
          indicators.push('Unusually small file size for video quality');
        }
      } else {
        // Images with perfect compression ratios might be generated
        if (fileSize < 100 * 1024) { // Less than 100KB
          suspicionScore += 5;
          indicators.push('Very small file size for image');
        }
      }

      // Check file creation patterns
      const now = Date.now();
      const fileAge = now - stats.ctimeMs;
      const oneHour = 60 * 60 * 1000;

      if (fileAge < oneHour) {
        suspicionScore += 5;
        indicators.push('Recently created file');
      }

      // Mock face detection (in production, use actual computer vision)
      const estimatedFaces = this.estimateFaceCount(filePath, isVideo);

      // Additional heuristics could include:
      // - Analyzing metadata patterns
      // - Checking compression artifacts
      // - Examining color histograms
      // - Detecting unnatural smoothness

      return {
        score: Math.min(suspicionScore, 30), // Cap local analysis at 30% suspicion
        confidence: 40, // Lower confidence for local analysis
        detected_faces: estimatedFaces,
        technology_used: 'TrustLens Local Analysis v1.0',
        detailed_analysis: {
          face_regions: [], // Local analysis doesn't provide precise regions
          manipulation_indicators: indicators
        }
      };

    } catch (error) {
      logger.error('Local deepfake analysis failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Aggregate results from multiple detection sources
   */
  private aggregateDetectionResults(
    results: Partial<DeepfakeDetectionResult>[]
  ): DeepfakeDetectionResult {
    if (results.length === 0) {
      throw new Error('No detection results to aggregate');
    }

    // Calculate weighted averages
    let totalScore = 0;
    let totalConfidence = 0;
    let totalWeight = 0;
    let maxFaces = 0;
    const technologies: string[] = [];
    const allIndicators: string[] = [];
    const allFaceRegions: any[] = [];

    results.forEach(result => {
      if (result.score !== undefined && result.confidence !== undefined) {
        // Weight by confidence level
        const weight = result.confidence / 100;
        totalScore += result.score * weight;
        totalConfidence += result.confidence * weight;
        totalWeight += weight;
      }

      if (result.detected_faces !== undefined) {
        maxFaces = Math.max(maxFaces, result.detected_faces);
      }

      if (result.technology_used) {
        technologies.push(result.technology_used);
      }

      if (result.detailed_analysis?.manipulation_indicators) {
        allIndicators.push(...result.detailed_analysis.manipulation_indicators);
      }

      if (result.detailed_analysis?.face_regions) {
        allFaceRegions.push(...result.detailed_analysis.face_regions);
      }
    });

    const aggregatedScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    const aggregatedConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 20;

    return {
      score: Math.round(aggregatedScore),
      confidence: Math.round(aggregatedConfidence),
      detected_faces: maxFaces,
      technology_used: technologies.join(' + '),
      processing_time: 0, // Will be set by caller
      detailed_analysis: {
        face_regions: allFaceRegions,
        manipulation_indicators: [...new Set(allIndicators)] // Remove duplicates
      }
    };
  }

  /**
   * Make API request with retry logic
   */
  private async makeApiRequestWithRetry(url: string, config: any): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await axios(url, config);
      } catch (error) {
        lastError = error;
        logger.warn(`API request attempt ${attempt} failed`, { url, error });

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate manipulation indicators based on score
   */
  private generateManipulationIndicators(score: number): string[] {
    const indicators: string[] = [];

    if (score > 80) {
      indicators.push('High probability of deepfake content');
      indicators.push('Strong manipulation signals detected');
    } else if (score > 60) {
      indicators.push('Moderate manipulation indicators present');
      indicators.push('Potential deepfake characteristics detected');
    } else if (score > 40) {
      indicators.push('Some suspicious patterns detected');
    } else if (score > 20) {
      indicators.push('Minor authenticity concerns');
    } else {
      indicators.push('Content appears authentic');
    }

    return indicators;
  }

  /**
   * Estimate face count (placeholder for actual face detection)
   */
  private estimateFaceCount(filePath: string, isVideo: boolean): number {
    // This is a placeholder implementation
    // In production, you'd use actual face detection libraries like:
    // - OpenCV with Haar cascades
    // - dlib face detection
    // - MediaPipe Face Detection
    // - Face-api.js

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Rough estimation based on file size
    if (isVideo) {
      // Larger video files might have more faces
      if (fileSize > 50 * 1024 * 1024) return 3; // 50MB+
      if (fileSize > 10 * 1024 * 1024) return 2; // 10MB+
      return 1;
    } else {
      // For images, assume 1-2 faces typically
      if (fileSize > 2 * 1024 * 1024) return 2; // 2MB+
      return 1;
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get detection service status
   */
  async getServiceStatus(): Promise<{
    sensity_available: boolean;
    truepic_available: boolean;
    local_analysis_available: boolean;
  }> {
    const status = {
      sensity_available: false,
      truepic_available: false,
      local_analysis_available: true // Always available
    };

    // Test Sensity API availability
    if (this.sensityApiKey) {
      try {
        await axios.get('https://api.sensity.ai/v1/status', {
          headers: { 'Authorization': `Bearer ${this.sensityApiKey}` },
          timeout: 5000
        });
        status.sensity_available = true;
      } catch (error) {
        logger.warn('Sensity API not available', { error });
      }
    }

    // Test TruePic API availability
    if (this.truepicApiKey) {
      try {
        await axios.get('https://api.truepic.com/v2/status', {
          headers: { 'X-API-Key': this.truepicApiKey },
          timeout: 5000
        });
        status.truepic_available = true;
      } catch (error) {
        logger.warn('TruePic API not available', { error });
      }
    }

    return status;
  }
}
