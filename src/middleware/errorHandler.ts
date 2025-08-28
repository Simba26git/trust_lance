import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 * Handles all errors thrown in the application and returns appropriate responses
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Request error:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    code: error.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    organisationId: req.user?.organisationId,
  });

  // Report to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: req.url,
        method: req.method,
      },
      extra: {
        statusCode: error.statusCode,
        code: error.code,
        userId: req.user?.id,
        organisationId: req.user?.organisationId,
      },
    });
  }

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    code = 'CONFLICT';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    switch ((error as any).code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this data already exists';
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'The requested record was not found';
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
    details = undefined;
  }

  // Send error response
  const errorResponse: any = {
    error: getErrorType(statusCode),
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  };

  if (details && process.env.NODE_ENV !== 'production') {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.request_id = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Get error type based on status code
 */
function getErrorType(statusCode: number): string {
  switch (Math.floor(statusCode / 100)) {
    case 4:
      return 'Client Error';
    case 5:
      return 'Server Error';
    default:
      return 'Error';
  }
}

/**
 * Create an API error with specific properties
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = createApiError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

/**
 * Validation error handler
 */
export function handleValidationError(errors: any[]): ApiError {
  const details = errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
  }));

  return createApiError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    { errors: details }
  );
}
