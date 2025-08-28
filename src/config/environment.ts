// TrustLens - Environment Configuration
// Centralizes all environment variable management with validation and defaults

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables from .env file
dotenv.config();

interface Config {
  // Server Configuration
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  HOST: string;
  API_BASE_URL: string;
  
  // Database Configuration
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  DATABASE_POOL_SIZE: number;
  
  // Redis Configuration
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  
  // AWS S3 Configuration
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET_NAME: string;
  S3_BUCKET_REGION: string;
  S3_ENDPOINT?: string; // For MinIO/local development
  
  // Authentication Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
  
  // API Keys for External Services
  SENSITY_API_KEY?: string;
  TRUEPIC_API_KEY?: string;
  TINEYE_API_KEY?: string;
  GOOGLE_VISION_API_KEY?: string;
  OPENAI_API_KEY?: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // File Upload Configuration
  MAX_FILE_SIZE: number;
  ALLOWED_MIME_TYPES: string[];
  
  // Queue Configuration
  QUEUE_CONCURRENCY: number;
  QUEUE_MAX_RETRIES: number;
  QUEUE_RETRY_DELAY: number;
  
  // Monitoring & Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SENTRY_DSN?: string;
  WEBHOOK_TIMEOUT: number;
  
  // Feature Flags
  ENABLE_C2PA_VERIFICATION: boolean;
  ENABLE_DEEPFAKE_DETECTION: boolean;
  ENABLE_REVERSE_SEARCH: boolean;
  ENABLE_METADATA_ANALYSIS: boolean;
  ENABLE_PDF_REPORTS: boolean;
  ENABLE_WEBHOOKS: boolean;
  
  // Business Logic
  FREE_TIER_MONTHLY_LIMIT: number;
  PRO_TIER_MONTHLY_LIMIT: number;
  ENTERPRISE_TIER_MONTHLY_LIMIT: number;
  
  // Development/Testing
  DISABLE_AUTH?: boolean;
  MOCK_EXTERNAL_APIS?: boolean;
  TEST_DATABASE_URL?: string;
}

/**
 * Parse environment variable as integer with default
 */
function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as boolean with default
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse comma-separated string into array
 */
function parseStringArray(value: string | undefined, defaultValue: string[]): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    } else {
      logger.warn(message + ' - Using defaults for development');
    }
  }
}

/**
 * Create configuration object with validation and defaults
 */
function createConfig(): Config {
  // Validate required variables (will warn in dev, throw in production)
  validateRequiredEnvVars();

  const nodeEnv = (process.env.NODE_ENV as Config['NODE_ENV']) || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';

  return {
    // Server Configuration
    NODE_ENV: nodeEnv,
    PORT: parseInteger(process.env.PORT, 3000),
    HOST: process.env.HOST || '0.0.0.0',
    API_BASE_URL: process.env.API_BASE_URL || 
      (isDevelopment ? 'http://localhost:3000' : 'https://api.trustlens.com'),
    
    // Database Configuration
    DATABASE_URL: process.env.DATABASE_URL || 
      'postgresql://trustlens:password@localhost:5432/trustlens_dev',
    DATABASE_SSL: parseBoolean(process.env.DATABASE_SSL, isProduction),
    DATABASE_POOL_SIZE: parseInteger(process.env.DATABASE_POOL_SIZE, 10),
    
    // Redis Configuration
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: parseInteger(process.env.REDIS_DB, 0),
    
    // AWS S3 Configuration
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'trustlens-uploads',
    S3_BUCKET_REGION: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1',
    S3_ENDPOINT: process.env.S3_ENDPOINT, // For MinIO: http://localhost:9000
    
    // Authentication Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    BCRYPT_ROUNDS: parseInteger(process.env.BCRYPT_ROUNDS, 12),
    
    // API Keys for External Services
    SENSITY_API_KEY: process.env.SENSITY_API_KEY,
    TRUEPIC_API_KEY: process.env.TRUEPIC_API_KEY,
    TINEYE_API_KEY: process.env.TINEYE_API_KEY,
    GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    
    // File Upload Configuration
    MAX_FILE_SIZE: parseInteger(process.env.MAX_FILE_SIZE, 50 * 1024 * 1024), // 50MB
    ALLOWED_MIME_TYPES: parseStringArray(
      process.env.ALLOWED_MIME_TYPES,
      [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'image/bmp',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo', // AVI
        'video/webm'
      ]
    ),
    
    // Queue Configuration
    QUEUE_CONCURRENCY: parseInteger(process.env.QUEUE_CONCURRENCY, 5),
    QUEUE_MAX_RETRIES: parseInteger(process.env.QUEUE_MAX_RETRIES, 3),
    QUEUE_RETRY_DELAY: parseInteger(process.env.QUEUE_RETRY_DELAY, 5000), // 5 seconds
    
    // Monitoring & Logging
    LOG_LEVEL: (process.env.LOG_LEVEL as Config['LOG_LEVEL']) || 
      (isDevelopment ? 'debug' : 'info'),
    SENTRY_DSN: process.env.SENTRY_DSN,
    WEBHOOK_TIMEOUT: parseInteger(process.env.WEBHOOK_TIMEOUT, 10000), // 10 seconds
    
    // Feature Flags
    ENABLE_C2PA_VERIFICATION: parseBoolean(process.env.ENABLE_C2PA_VERIFICATION, true),
    ENABLE_DEEPFAKE_DETECTION: parseBoolean(process.env.ENABLE_DEEPFAKE_DETECTION, true),
    ENABLE_REVERSE_SEARCH: parseBoolean(process.env.ENABLE_REVERSE_SEARCH, true),
    ENABLE_METADATA_ANALYSIS: parseBoolean(process.env.ENABLE_METADATA_ANALYSIS, true),
    ENABLE_PDF_REPORTS: parseBoolean(process.env.ENABLE_PDF_REPORTS, true),
    ENABLE_WEBHOOKS: parseBoolean(process.env.ENABLE_WEBHOOKS, true),
    
    // Business Logic
    FREE_TIER_MONTHLY_LIMIT: parseInteger(process.env.FREE_TIER_MONTHLY_LIMIT, 50),
    PRO_TIER_MONTHLY_LIMIT: parseInteger(process.env.PRO_TIER_MONTHLY_LIMIT, 1000),
    ENTERPRISE_TIER_MONTHLY_LIMIT: parseInteger(process.env.ENTERPRISE_TIER_MONTHLY_LIMIT, 10000),
    
    // Development/Testing
    DISABLE_AUTH: parseBoolean(process.env.DISABLE_AUTH, false),
    MOCK_EXTERNAL_APIS: parseBoolean(process.env.MOCK_EXTERNAL_APIS, isDevelopment),
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL
  };
}

// Create and export configuration
export const config = createConfig();

// Log configuration summary (without sensitive data)
if (config.NODE_ENV !== 'test') {
  logger.info('Configuration loaded', {
    environment: config.NODE_ENV,
    port: config.PORT,
    database: config.DATABASE_URL.includes('localhost') ? 'localhost' : 'remote',
    redis: config.REDIS_URL.includes('localhost') ? 'localhost' : 'remote',
    s3Bucket: config.S3_BUCKET_NAME,
    features: {
      c2pa: config.ENABLE_C2PA_VERIFICATION,
      deepfake: config.ENABLE_DEEPFAKE_DETECTION,
      reverseSearch: config.ENABLE_REVERSE_SEARCH,
      metadata: config.ENABLE_METADATA_ANALYSIS,
      pdfReports: config.ENABLE_PDF_REPORTS,
      webhooks: config.ENABLE_WEBHOOKS
    },
    externalApis: {
      sensity: !!config.SENSITY_API_KEY,
      truepic: !!config.TRUEPIC_API_KEY,
      tineye: !!config.TINEYE_API_KEY,
      googleVision: !!config.GOOGLE_VISION_API_KEY,
      openai: !!config.OPENAI_API_KEY
    }
  });
}

// Export individual configurations for convenience
export const {
  NODE_ENV,
  PORT,
  HOST,
  DATABASE_URL,
  REDIS_URL,
  JWT_SECRET,
  LOG_LEVEL,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
} = config;

// Export type for use in other modules
export type { Config };

// Utility function to check if running in specific environment
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
export const isStaging = config.NODE_ENV === 'staging';

// Utility function to get tier limits
export function getTierLimit(tier: 'FREE' | 'PRO' | 'ENTERPRISE'): number {
  switch (tier) {
    case 'FREE': return config.FREE_TIER_MONTHLY_LIMIT;
    case 'PRO': return config.PRO_TIER_MONTHLY_LIMIT;
    case 'ENTERPRISE': return config.ENTERPRISE_TIER_MONTHLY_LIMIT;
    default: return config.FREE_TIER_MONTHLY_LIMIT;
  }
}

// Utility function to check if external service is available
export function isExternalServiceEnabled(service: string): boolean {
  switch (service.toLowerCase()) {
    case 'sensity': return !!config.SENSITY_API_KEY;
    case 'truepic': return !!config.TRUEPIC_API_KEY;
    case 'tineye': return !!config.TINEYE_API_KEY;
    case 'google-vision': return !!config.GOOGLE_VISION_API_KEY;
    case 'openai': return !!config.OPENAI_API_KEY;
    default: return false;
  }
}

// Utility function to get S3 configuration
export function getS3Config() {
  return {
    region: config.AWS_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    bucket: config.S3_BUCKET_NAME,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: !!config.S3_ENDPOINT // Required for MinIO
  };
}

// Utility function to get database configuration
export function getDatabaseConfig() {
  return {
    url: config.DATABASE_URL,
    ssl: config.DATABASE_SSL,
    poolSize: config.DATABASE_POOL_SIZE
  };
}

// Utility function to get Redis configuration
export function getRedisConfig() {
  return {
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
  };
}
