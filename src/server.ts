import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { register } from 'prom-client';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Import routes
import authRoutes from './routes/auth';
import uploadRoutes from './routes/uploads';
import analysisRoutes from './routes/analysis';
import merchantRoutes from './routes/merchants';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import healthRoutes from './routes/health';
import billingRoutes from './routes/billing';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { validateRequest } from './middleware/validation';

// Import services
import { createQueues } from './services/queue';
import { initializeMetrics } from './services/metrics';
import { initializeS3 } from './services/s3';

// Load environment variables
config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// Initialize database and cache connections
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Create Express application
const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};
app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(pinoHttp({ logger }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Metrics endpoint (before other routes)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Bull Board for queue monitoring (admin only)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Initialize queues and Bull Board
let queues: any = {};
async function initializeQueues() {
  try {
    queues = await createQueues();
    const { addQueue } = createBullBoard({
      queues: [
        new BullMQAdapter(queues.analysisQueue),
        new BullMQAdapter(queues.webhookQueue),
        new BullMQAdapter(queues.billingQueue),
      ],
      serverAdapter,
    });
    
    app.use('/admin/queues', authenticateToken, serverAdapter.getRouter());
    logger.info('Bull Board initialized for queue monitoring');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
  }
}

// API routes with authentication
app.use('/api/auth', authRoutes);
app.use('/api/uploads', authenticateToken, uploadRoutes);
app.use('/api/analysis', authenticateToken, analysisRoutes);
app.use('/api/merchants', authenticateToken, merchantRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);

// Webhook routes (no auth, use webhook signatures)
app.use('/webhooks', webhookRoutes);

// Serve static files for badge widget
app.use('/badge', express.static('public/badge'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    // Close Redis connection
    redis.disconnect();
    logger.info('Redis connection closed');
    
    // Close queue connections
    if (queues.analysisQueue) {
      await queues.analysisQueue.close();
    }
    if (queues.webhookQueue) {
      await queues.webhookQueue.close();
    }
    if (queues.billingQueue) {
      await queues.billingQueue.close();
    }
    logger.info('Queues closed');
    
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize services
    await initializeS3();
    await initializeMetrics();
    await initializeQueues();
    
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected successfully');
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 TrustLens API server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`📊 Queue Monitor: http://localhost:${PORT}/admin/queues`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('🔧 Development mode enabled');
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server };
export default app;
