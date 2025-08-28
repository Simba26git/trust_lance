// TrustLens - Metadata Extraction Service
// Extracts and analyzes metadata from uploaded files

import ExifReader from 'exifreader';
import sharp from 'sharp';
import ffprobe from 'ffprobe-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface ImageMetadata {
  camera_info?: string;
  software_used?: string;
  gps_location?: string;
  timestamp_consistency: boolean;
  editing_detected: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  color_profile?: string;
  compression_quality?: number;
  exif_data: Record<string, any>;
  suspicious_indicators: string[];
}

export interface VideoMetadata {
  codec_info: string;
  duration: number;
  bitrate: number;
  frame_rate: number;
  dimensions: {
    width: number;
    height: number;
  };
  audio_tracks: number;
  creation_time?: Date;
  editing_software?: string;
  suspicious_indicators: string[];
}

export class MetadataService {
  private static instance: MetadataService;

  public static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  /**
   * Extract comprehensive metadata from image file
   */
  async extractImageMetadata(filePath: string, mimeType: string): Promise<ImageMetadata> {
    try {
      logger.info('Extracting image metadata', { filePath, mimeType });

      // Use Sharp for basic image info
      const sharpInfo = await sharp(filePath).metadata();
      
      // Use ExifReader for detailed EXIF data
      const buffer = await sharp(filePath).toBuffer();
      const exifData = ExifReader.load(buffer, { expanded: true });

      const metadata: ImageMetadata = {
        dimensions: {
          width: sharpInfo.width || 0,
          height: sharpInfo.height || 0
        },
        color_profile: sharpInfo.space,
        compression_quality: this.estimateJpegQuality(sharpInfo),
        exif_data: exifData,
        timestamp_consistency: true,
        editing_detected: false,
        suspicious_indicators: []
      };

      // Extract camera information
      if (exifData.ifd0?.Make?.description && exifData.ifd0?.Model?.description) {
        metadata.camera_info = `${exifData.ifd0.Make.description} ${exifData.ifd0.Model.description}`;
      }

      // Extract software information
      if (exifData.ifd0?.Software?.description) {
        metadata.software_used = exifData.ifd0.Software.description;
        
        // Check for editing software
        const editingSoftware = [
          'photoshop', 'gimp', 'lightroom', 'capture one', 'luminar',
          'affinity photo', 'canva', 'pixlr', 'fotor'
        ];
        
        if (editingSoftware.some(software => 
          metadata.software_used!.toLowerCase().includes(software)
        )) {
          metadata.editing_detected = true;
          metadata.suspicious_indicators.push('Editing software detected in metadata');
        }
      }

      // Extract GPS location
      if (exifData.gps?.GPSLatitude && exifData.gps?.GPSLongitude) {
        const lat = this.convertDMSToDD(
          exifData.gps.GPSLatitude.description,
          exifData.gps.GPSLatitudeRef?.description
        );
        const lon = this.convertDMSToDD(
          exifData.gps.GPSLongitude.description,
          exifData.gps.GPSLongitudeRef?.description
        );
        
        if (lat && lon) {
          metadata.gps_location = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
      }

      // Analyze timestamp consistency
      metadata.timestamp_consistency = this.analyzeTimestampConsistency(exifData);
      if (!metadata.timestamp_consistency) {
        metadata.suspicious_indicators.push('Inconsistent timestamps detected');
      }

      // Check for missing or suspicious EXIF data
      this.analyzeSuspiciousExifPatterns(exifData, metadata);

      // Analyze compression artifacts
      await this.analyzeCompressionArtifacts(filePath, metadata);

      logger.info('Image metadata extracted successfully', {
        camera: metadata.camera_info,
        software: metadata.software_used,
        editingDetected: metadata.editing_detected,
        suspiciousCount: metadata.suspicious_indicators.length
      });

      return metadata;

    } catch (error) {
      logger.error('Failed to extract image metadata', { filePath, error });
      throw new Error(`Metadata extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract comprehensive metadata from video file
   */
  async extractVideoMetadata(filePath: string, mimeType: string): Promise<VideoMetadata> {
    try {
      logger.info('Extracting video metadata', { filePath, mimeType });

      // Use ffprobe to extract video metadata
      const { stdout } = await execAsync(
        `"${ffprobe}" -v quiet -print_format json -show_format -show_streams "${filePath}"`
      );

      const probeData = JSON.parse(stdout);
      const videoStream = probeData.streams.find((stream: any) => stream.codec_type === 'video');
      const audioStreams = probeData.streams.filter((stream: any) => stream.codec_type === 'audio');

      if (!videoStream) {
        throw new Error('No video stream found in file');
      }

      const metadata: VideoMetadata = {
        codec_info: `${videoStream.codec_name} (${videoStream.profile || 'unknown profile'})`,
        duration: parseFloat(probeData.format.duration) || 0,
        bitrate: parseInt(probeData.format.bit_rate) || 0,
        frame_rate: this.parseFrameRate(videoStream.r_frame_rate),
        dimensions: {
          width: videoStream.width || 0,
          height: videoStream.height || 0
        },
        audio_tracks: audioStreams.length,
        suspicious_indicators: []
      };

      // Extract creation time
      if (probeData.format.tags?.creation_time) {
        metadata.creation_time = new Date(probeData.format.tags.creation_time);
      }

      // Detect editing software from metadata
      const possibleSoftwareFields = [
        'encoder', 'software', 'application_name', 'comment'
      ];

      for (const field of possibleSoftwareFields) {
        if (probeData.format.tags?.[field]) {
          metadata.editing_software = probeData.format.tags[field];
          break;
        }
      }

      // Analyze suspicious patterns
      this.analyzeVideoSuspiciousPatterns(probeData, metadata);

      logger.info('Video metadata extracted successfully', {
        codec: metadata.codec_info,
        duration: metadata.duration,
        editingSoftware: metadata.editing_software,
        suspiciousCount: metadata.suspicious_indicators.length
      });

      return metadata;

    } catch (error) {
      logger.error('Failed to extract video metadata', { filePath, error });
      throw new Error(`Video metadata extraction failed: ${error.message}`);
    }
  }

  /**
   * Estimate JPEG compression quality
   */
  private estimateJpegQuality(sharpInfo: sharp.Metadata): number | undefined {
    // This is a simplified estimation
    // In a real implementation, you'd analyze quantization tables
    if (sharpInfo.format === 'jpeg') {
      // Estimate based on file size vs dimensions
      const pixelCount = (sharpInfo.width || 0) * (sharpInfo.height || 0);
      const bytesPerPixel = sharpInfo.size ? sharpInfo.size / pixelCount : 0;
      
      if (bytesPerPixel > 2) return 95;
      if (bytesPerPixel > 1.5) return 85;
      if (bytesPerPixel > 1) return 75;
      if (bytesPerPixel > 0.5) return 65;
      return 50;
    }
    return undefined;
  }

  /**
   * Convert DMS (Degrees Minutes Seconds) to DD (Decimal Degrees)
   */
  private convertDMSToDD(dmsString: string, ref?: string): number | null {
    try {
      // Parse DMS format like "40° 44' 54.36"" 
      const parts = dmsString.match(/(\d+)°?\s*(\d+)'?\s*([\d.]+)"?/);
      if (!parts) return null;

      const degrees = parseInt(parts[1]);
      const minutes = parseInt(parts[2]);
      const seconds = parseFloat(parts[3]);

      let dd = degrees + minutes / 60 + seconds / 3600;

      // Apply reference (N/S for latitude, E/W for longitude)
      if (ref && (ref === 'S' || ref === 'W')) {
        dd = -dd;
      }

      return dd;
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze timestamp consistency across different EXIF fields
   */
  private analyzeTimestampConsistency(exifData: any): boolean {
    try {
      const timestamps: Date[] = [];

      // Collect various timestamp fields
      const timestampFields = [
        'DateTime',
        'DateTimeOriginal', 
        'DateTimeDigitized',
        'CreateDate',
        'ModifyDate'
      ];

      for (const field of timestampFields) {
        if (exifData.exif?.[field]?.description) {
          const date = new Date(exifData.exif[field].description);
          if (!isNaN(date.getTime())) {
            timestamps.push(date);
          }
        }
      }

      if (timestamps.length < 2) {
        return true; // Can't check consistency with less than 2 timestamps
      }

      // Check if all timestamps are within reasonable range (e.g., 1 hour)
      const maxDiff = Math.max(...timestamps.map(t => t.getTime())) - 
                     Math.min(...timestamps.map(t => t.getTime()));
      
      return maxDiff <= 3600000; // 1 hour in milliseconds

    } catch (error) {
      return false; // Assume inconsistent if we can't parse
    }
  }

  /**
   * Analyze suspicious patterns in EXIF data
   */
  private analyzeSuspiciousExifPatterns(exifData: any, metadata: ImageMetadata): void {
    // Check for completely missing EXIF data
    if (!exifData.exif || Object.keys(exifData.exif).length === 0) {
      metadata.suspicious_indicators.push('EXIF data completely missing');
    }

    // Check for suspicious software patterns
    const suspiciousSoftware = [
      'unknown', 'modified', 'edited', 'fake', 'generated'
    ];

    if (metadata.software_used) {
      const softwareLower = metadata.software_used.toLowerCase();
      if (suspiciousSoftware.some(pattern => softwareLower.includes(pattern))) {
        metadata.suspicious_indicators.push('Suspicious software name detected');
      }
    }

    // Check for impossible camera settings
    if (exifData.exif?.ISO?.description) {
      const iso = parseInt(exifData.exif.ISO.description);
      if (iso > 102400 || iso < 25) {
        metadata.suspicious_indicators.push('Unusual ISO value detected');
      }
    }

    // Check for GPS coordinates but no camera GPS capability
    if (metadata.gps_location && metadata.camera_info) {
      const cameraModel = metadata.camera_info.toLowerCase();
      // List of cameras known to not have GPS
      const noGpsCameras = ['canon eos 5d', 'nikon d850', 'sony a7iii'];
      if (noGpsCameras.some(model => cameraModel.includes(model))) {
        metadata.suspicious_indicators.push('GPS data present on camera without GPS capability');
      }
    }
  }

  /**
   * Analyze compression artifacts for signs of manipulation
   */
  private async analyzeCompressionArtifacts(filePath: string, metadata: ImageMetadata): Promise<void> {
    try {
      // This is a simplified analysis
      // In production, you'd use more sophisticated techniques like:
      // - JPEG block artifact analysis
      // - Double compression detection
      // - Error level analysis

      const stats = await sharp(filePath).stats();
      
      // Check for unusual statistical properties
      const channels = stats.channels;
      if (channels && channels.length >= 3) {
        const [r, g, b] = channels;
        
        // Check for unusual color distribution patterns
        const rVariance = r.stdev * r.stdev;
        const gVariance = g.stdev * g.stdev;
        const bVariance = b.stdev * b.stdev;
        
        // If one channel has significantly different variance, it might indicate manipulation
        const maxVariance = Math.max(rVariance, gVariance, bVariance);
        const minVariance = Math.min(rVariance, gVariance, bVariance);
        
        if (maxVariance / minVariance > 10) {
          metadata.suspicious_indicators.push('Unusual color channel variance detected');
        }
      }

    } catch (error) {
      logger.warn('Failed to analyze compression artifacts', { filePath, error });
    }
  }

  /**
   * Parse frame rate string to number
   */
  private parseFrameRate(frameRateString: string): number {
    if (!frameRateString) return 0;
    
    // Handle fraction format like "30000/1001"
    if (frameRateString.includes('/')) {
      const [numerator, denominator] = frameRateString.split('/').map(Number);
      return numerator / denominator;
    }
    
    return parseFloat(frameRateString);
  }

  /**
   * Analyze suspicious patterns in video metadata
   */
  private analyzeVideoSuspiciousPatterns(probeData: any, metadata: VideoMetadata): void {
    // Check for missing creation time
    if (!metadata.creation_time) {
      metadata.suspicious_indicators.push('No creation timestamp found');
    }

    // Check for unusual frame rates
    if (metadata.frame_rate > 120 || metadata.frame_rate < 1) {
      metadata.suspicious_indicators.push('Unusual frame rate detected');
    }

    // Check for multiple video streams (possible sign of manipulation)
    const videoStreams = probeData.streams.filter((stream: any) => stream.codec_type === 'video');
    if (videoStreams.length > 1) {
      metadata.suspicious_indicators.push('Multiple video streams detected');
    }

    // Check for very low or very high bitrates
    if (metadata.bitrate > 0) {
      const pixelsPerSecond = metadata.dimensions.width * metadata.dimensions.height * metadata.frame_rate;
      const bitsPerPixel = metadata.bitrate / pixelsPerSecond;
      
      if (bitsPerPixel < 0.01 || bitsPerPixel > 1) {
        metadata.suspicious_indicators.push('Unusual bitrate for video quality detected');
      }
    }

    // Check for suspicious codec combinations
    const suspiciousCodecs = ['rawvideo', 'ffv1', 'utvideo'];
    const codecName = probeData.streams[0]?.codec_name?.toLowerCase();
    if (suspiciousCodecs.includes(codecName)) {
      metadata.suspicious_indicators.push('Unusual codec detected for consumer video');
    }

    // Check for editing software indicators
    if (metadata.editing_software) {
      const editingSoftware = [
        'premiere', 'final cut', 'davinci', 'after effects', 'vegas',
        'avid', 'kdenlive', 'openshot', 'filmora'
      ];
      
      const softwareLower = metadata.editing_software.toLowerCase();
      if (editingSoftware.some(software => softwareLower.includes(software))) {
        metadata.suspicious_indicators.push('Professional editing software detected');
      }
    }
  }

  /**
   * Generate metadata analysis summary
   */
  generateMetadataSummary(metadata: ImageMetadata | VideoMetadata): {
    authenticity_score: number;
    risk_factors: string[];
    technical_details: Record<string, any>;
  } {
    const isImage = 'exif_data' in metadata;
    const suspiciousCount = metadata.suspicious_indicators.length;
    
    // Calculate authenticity score (0-100, higher is more authentic)
    let score = 100;
    
    // Deduct points for each suspicious indicator
    score -= suspiciousCount * 15;
    
    // Additional scoring logic
    if (isImage) {
      const imgMeta = metadata as ImageMetadata;
      
      // Bonus for complete EXIF data
      if (Object.keys(imgMeta.exif_data).length > 10) {
        score += 10;
      }
      
      // Bonus for camera info
      if (imgMeta.camera_info) {
        score += 5;
      }
      
      // Penalty for editing detection
      if (imgMeta.editing_detected) {
        score -= 20;
      }
      
      // Penalty for timestamp inconsistency
      if (!imgMeta.timestamp_consistency) {
        score -= 25;
      }
    }
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    return {
      authenticity_score: Math.round(score),
      risk_factors: metadata.suspicious_indicators,
      technical_details: {
        metadata_completeness: isImage ? 
          Object.keys((metadata as ImageMetadata).exif_data).length > 5 : true,
        editing_detected: isImage ? (metadata as ImageMetadata).editing_detected : false,
        suspicious_indicators_count: suspiciousCount
      }
    };
  }
}
