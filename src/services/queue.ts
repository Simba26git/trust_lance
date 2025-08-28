import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { analysisWorker } from '../workers/analysisWorker';
import { webhookWorker } from '../workers/webhookWorker';
import { billingWorker } from '../workers/billingWorker';

// Queue configurations
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Analysis Queue - For processing uploaded images/videos
export const analysisQueue = new Queue('analysis', queueConfig);

// Webhook Queue - For delivering webhooks to merchants/clients
export const webhookQueue = new Queue('webhooks', queueConfig);

// Billing Queue - For processing billing events and usage tracking
export const billingQueue = new Queue('billing', queueConfig);

// Analysis Worker
export const analysisWorkerInstance = new Worker(
  'analysis',
  async (job: Job) => {
    try {
      logger.info(`Processing analysis job ${job.id}`, { uploadId: job.data.uploadId });
      await analysisWorker(job);
      logger.info(`Completed analysis job ${job.id}`, { uploadId: job.data.uploadId });
    } catch (error) {
      logger.error(`Failed analysis job ${job.id}:`, error);
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: parseInt(process.env.ANALYSIS_WORKER_CONCURRENCY || '5'),
  }
);

// Webhook Worker
export const webhookWorkerInstance = new Worker(
  'webhooks',
  async (job: Job) => {
    try {
      logger.info(`Processing webhook job ${job.id}`, { url: job.data.url });
      await webhookWorker(job);
      logger.info(`Completed webhook job ${job.id}`, { url: job.data.url });
    } catch (error) {
      logger.error(`Failed webhook job ${job.id}:`, error);
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY || '10'),
  }
);

// Billing Worker
export const billingWorkerInstance = new Worker(
  'billing',
  async (job: Job) => {
    try {
      logger.info(`Processing billing job ${job.id}`, { orgId: job.data.organisationId });
      await billingWorker(job);
      logger.info(`Completed billing job ${job.id}`, { orgId: job.data.organisationId });
    } catch (error) {
      logger.error(`Failed billing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    ...queueConfig,
    concurrency: parseInt(process.env.BILLING_WORKER_CONCURRENCY || '3'),
  }
);

// Job types and interfaces
export interface AnalysisJobData {
  uploadId: string;
  organisationId: string;
  merchantId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  escalated?: boolean;
  retryCount?: number;
}

export interface WebhookJobData {
  uploadId: string;
  url: string;
  payload: any;
  signature?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface BillingJobData {
  organisationId: string;
  eventType: 'usage_increment' | 'monthly_bill' | 'overage_charge';
  metadata: any;
}

// Queue management functions
export async function addAnalysisJob(
  data: AnalysisJobData,
  options: {
    priority?: number;
    delay?: number;
    attempts?: number;
  } = {}
): Promise<Job> {
  const jobOptions = {
    priority: options.priority || 0,
    delay: options.delay || 0,
    attempts: options.attempts || 3,
    removeOnComplete: 100,
    removeOnFail: 50,
  };

  return analysisQueue.add('process-upload', data, jobOptions);
}

export async function addWebhookJob(
  data: WebhookJobData,
  options: {
    delay?: number;
    attempts?: number;
  } = {}
): Promise<Job> {
  const jobOptions = {
    delay: options.delay || 0,
    attempts: options.attempts || 3,
    removeOnComplete: 50,
    removeOnFail: 25,
  };

  return webhookQueue.add('deliver-webhook', data, jobOptions);
}

export async function addBillingJob(
  data: BillingJobData,
  options: {
    delay?: number;
  } = {}
): Promise<Job> {
  const jobOptions = {
    delay: options.delay || 0,
    attempts: 5,
    removeOnComplete: 200,
    removeOnFail: 100,
  };

  return billingQueue.add('process-billing', data, jobOptions);
}

// Queue monitoring and health check functions
export async function getQueueStats() {
  const [analysisStats, webhookStats, billingStats] = await Promise.all([
    analysisQueue.getJobCounts(),
    webhookQueue.getJobCounts(),
    billingQueue.getJobCounts(),
  ]);

  return {
    analysis: analysisStats,
    webhooks: webhookStats,
    billing: billingStats,
  };
}

export async function getQueueHealth() {
  try {
    const stats = await getQueueStats();
    const totalJobs = Object.values(stats.analysis).reduce((sum, count) => sum + count, 0);
    const failedJobs = stats.analysis.failed || 0;
    
    const health = {
      status: 'healthy',
      queues: stats,
      alerts: [] as string[],
    };

    // Check for potential issues
    if (failedJobs > 10) {
      health.alerts.push(`High number of failed analysis jobs: ${failedJobs}`);
    }
    
    if ((stats.analysis.waiting || 0) > 100) {
      health.alerts.push(`High number of waiting analysis jobs: ${stats.analysis.waiting}`);
    }
    
    if ((stats.webhooks.waiting || 0) > 50) {
      health.alerts.push(`High number of waiting webhook jobs: ${stats.webhooks.waiting}`);
    }

    if (health.alerts.length > 0) {
      health.status = 'degraded';
    }

    return health;
  } catch (error) {
    logger.error('Failed to get queue health:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      queues: {},
      alerts: ['Failed to connect to queue system'],
    };
  }
}

// Clean up completed/failed jobs periodically
export async function cleanupQueues() {
  try {
    const [cleanedAnalysis, cleanedWebhooks, cleanedBilling] = await Promise.all([
      analysisQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'), // Keep completed jobs for 24 hours
      webhookQueue.clean(24 * 60 * 60 * 1000, 50, 'completed'),
      billingQueue.clean(7 * 24 * 60 * 60 * 1000, 200, 'completed'), // Keep billing jobs for 7 days
    ]);

    logger.info('Queue cleanup completed', {
      cleaned: {
        analysis: cleanedAnalysis,
        webhooks: cleanedWebhooks,
        billing: cleanedBilling,
      },
    });

    return {
      analysis: cleanedAnalysis,
      webhooks: cleanedWebhooks,
      billing: cleanedBilling,
    };
  } catch (error) {
    logger.error('Failed to cleanup queues:', error);
    throw error;
  }
}

// Initialize all queues and workers
export async function createQueues() {
  logger.info('Initializing queues and workers...');

  // Set up event listeners for monitoring
  analysisQueue.on('error', (error) => {
    logger.error('Analysis queue error:', error);
  });

  webhookQueue.on('error', (error) => {
    logger.error('Webhook queue error:', error);
  });

  billingQueue.on('error', (error) => {
    logger.error('Billing queue error:', error);
  });

  // Worker event listeners
  analysisWorkerInstance.on('completed', (job) => {
    logger.info(`Analysis job ${job.id} completed successfully`);
  });

  analysisWorkerInstance.on('failed', (job, err) => {
    logger.error(`Analysis job ${job?.id} failed:`, err);
  });

  webhookWorkerInstance.on('completed', (job) => {
    logger.info(`Webhook job ${job.id} completed successfully`);
  });

  webhookWorkerInstance.on('failed', (job, err) => {
    logger.error(`Webhook job ${job?.id} failed:`, err);
  });

  billingWorkerInstance.on('completed', (job) => {
    logger.info(`Billing job ${job.id} completed successfully`);
  });

  billingWorkerInstance.on('failed', (job, err) => {
    logger.error(`Billing job ${job?.id} failed:`, err);
  });

  logger.info('Queues and workers initialized successfully');

  return {
    analysisQueue,
    webhookQueue,
    billingQueue,
    analysisWorker: analysisWorkerInstance,
    webhookWorker: webhookWorkerInstance,
    billingWorker: billingWorkerInstance,
  };
}

// Graceful shutdown
export async function shutdownQueues() {
  logger.info('Shutting down queues and workers...');

  await Promise.all([
    analysisWorkerInstance.close(),
    webhookWorkerInstance.close(),
    billingWorkerInstance.close(),
  ]);

  await Promise.all([
    analysisQueue.close(),
    webhookQueue.close(),
    billingQueue.close(),
  ]);

  logger.info('Queues and workers shut down successfully');
}
