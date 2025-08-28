import pino from 'pino';

// Create logger instance with configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{time} [{level}] {msg}',
    },
  } : undefined,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'apiKey',
      'secretKey',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'set-cookie',
    ],
    censor: '[REDACTED]',
  },
});

// Helper functions for structured logging
export const logError = (message: string, error: Error, context?: Record<string, any>) => {
  logger.error({
    message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn({
    message,
    ...context,
  });
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info({
    message,
    ...context,
  });
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug({
    message,
    ...context,
  });
};

// Request ID generator for tracing
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Performance timing utility
export const createTimer = () => {
  const start = process.hrtime.bigint();
  
  return {
    end: () => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1000000; // Convert to milliseconds
    },
  };
};

export default logger;
