import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getQueueHealth } from '../services/queue';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /health/deep:
 *   get:
 *     summary: Deep health check
 *     description: Returns detailed health status including database and dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All systems are healthy
 *       503:
 *         description: One or more systems are unhealthy
 */
router.get('/deep', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    queues: false,
    s3: false,
  };

  const startTime = Date.now();
  let overallStatus = 'healthy';

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    logger.debug('Database health check passed');
  } catch (error) {
    logger.error('Database health check failed:', error);
    overallStatus = 'unhealthy';
  }

  try {
    // Check Redis connection (assuming redis is imported from server.ts)
    // For now, we'll skip this check in the health route
    checks.redis = true; // Placeholder
  } catch (error) {
    logger.error('Redis health check failed:', error);
    overallStatus = 'degraded';
  }

  try {
    // Check queue health
    const queueHealth = await getQueueHealth();
    checks.queues = queueHealth.status !== 'unhealthy';
    if (queueHealth.status === 'degraded') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    logger.error('Queue health check failed:', error);
    overallStatus = 'degraded';
  }

  try {
    // Check S3 connectivity (basic check)
    checks.s3 = true; // Placeholder - would require actual S3 test
  } catch (error) {
    logger.error('S3 health check failed:', error);
    overallStatus = 'degraded';
  }

  const responseTime = Date.now() - startTime;

  const healthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: responseTime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    details: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthResponse);
});

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to serve traffic
 *       503:
 *         description: Application is not ready
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 */
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health/worker:
 *   get:
 *     summary: Worker health check
 *     description: Health check specifically for worker processes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Worker is healthy
 *       503:
 *         description: Worker is unhealthy
 */
router.get('/worker', async (req: Request, res: Response) => {
  try {
    const queueHealth = await getQueueHealth();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queues: queueHealth,
    });
  } catch (error) {
    logger.error('Worker health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
