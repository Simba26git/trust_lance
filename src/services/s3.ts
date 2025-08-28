import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

// Initialize S3 client
let s3Client: S3Client;

export function initializeS3() {
  const config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
  };

  // For local development with MinIO
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT;
    config.forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === 'true';
  }

  // Set credentials
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  s3Client = new S3Client(config);
  
  logger.info('S3 client initialized', {
    region: config.region,
    endpoint: config.endpoint || 'default',
    bucket: process.env.AWS_S3_BUCKET,
  });
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    
    logger.info(`File uploaded to S3: ${key}`, {
      bucket: process.env.AWS_S3_BUCKET,
      key,
      contentType,
    });

    return key;
  } catch (error) {
    logger.error(`Failed to upload file to S3: ${key}`, error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a file from S3
 */
export async function downloadFile(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);
    
    logger.info(`File downloaded from S3: ${key}`, {
      bucket: process.env.AWS_S3_BUCKET,
      key,
      size: buffer.length,
    });

    return buffer;
  } catch (error) {
    logger.error(`Failed to download file from S3: ${key}`, error);
    throw new Error(`S3 download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    
    logger.info(`File deleted from S3: ${key}`, {
      bucket: process.env.AWS_S3_BUCKET,
      key,
    });
  } catch (error) {
    logger.error(`Failed to delete file from S3: ${key}`, error);
    throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a presigned URL for file access
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info(`Generated presigned URL for: ${key}`, {
      bucket: process.env.AWS_S3_BUCKET,
      key,
      expiresIn,
    });

    return url;
  } catch (error) {
    logger.error(`Failed to generate presigned URL for: ${key}`, error);
    throw new Error(`Presigned URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Generate unique file key with timestamp and random suffix
 */
export function generateFileKey(originalName: string, prefix: string = 'uploads'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${prefix}/${timestamp}_${random}_${cleanName}`;
}

/**
 * Get file URL for public access (if bucket is public)
 */
export function getPublicUrl(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  if (process.env.AWS_ENDPOINT) {
    // For MinIO or custom S3 endpoint
    return `${process.env.AWS_ENDPOINT}/${bucket}/${key}`;
  }
  
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Validate file upload constraints
 */
export function validateUpload(file: any): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024; // MB to bytes
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || '50'}MB` 
    };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  return { valid: true };
}

export default {
  initializeS3,
  uploadFile,
  downloadFile,
  deleteFile,
  generatePresignedUrl,
  fileExists,
  generateFileKey,
  getPublicUrl,
  validateUpload,
};
