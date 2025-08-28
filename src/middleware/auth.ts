import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Extend Express Request type to include user and organisation
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organisationId?: string;
        organisation?: any;
      };
      apiKey?: {
        id: string;
        organisationId: string;
        scopes: string[];
        rateLimitPerMin: number;
      };
    }
  }
}

// JWT Authentication Middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    // Check for API Key authentication first
    if (apiKey) {
      return await authenticateApiKey(req, res, next, apiKey);
    }

    // Check for Bearer token authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_TOKEN',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication configuration error',
        code: 'AUTH_CONFIG_ERROR',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organisations: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organisationId: user.organisations[0]?.organisationId,
      organisation: user.organisations[0]?.organisation,
    };

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

// API Key Authentication
async function authenticateApiKey(req: Request, res: Response, next: NextFunction, apiKey: string) {
  try {
    // Hash the provided API key to compare with stored hash
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Find API key in database
    const storedApiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        organisation: true,
      },
    });

    if (!storedApiKey || !storedApiKey.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
    }

    // Check if API key has expired
    if (storedApiKey.expiresAt && storedApiKey.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has expired',
        code: 'API_KEY_EXPIRED',
      });
    }

    // Check if organisation is active
    if (!storedApiKey.organisation.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Organisation is not active',
        code: 'ORGANISATION_INACTIVE',
      });
    }

    // TODO: Implement rate limiting per API key
    // This would check Redis for rate limit counters

    // Attach API key information to request
    req.apiKey = {
      id: storedApiKey.id,
      organisationId: storedApiKey.organisationId,
      scopes: storedApiKey.scopes as string[],
      rateLimitPerMin: storedApiKey.rateLimitPerMin,
    };

    req.user = {
      id: `api_key_${storedApiKey.id}`,
      email: 'api@system.local',
      role: 'API_USER',
      organisationId: storedApiKey.organisationId,
      organisation: storedApiKey.organisation,
    };

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: storedApiKey.id },
      data: { lastUsed: new Date() },
    });

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// Scope-based authorization for API keys
export const requireScope = (requiredScopes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey && !req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // If using JWT token (not API key), allow based on user role
    if (!req.apiKey && req.user) {
      if (['ADMIN', 'SUPPORT'].includes(req.user.role)) {
        return next(); // Admins and support have all scopes
      }
    }

    // Check API key scopes
    if (req.apiKey) {
      const hasAllScopes = requiredScopes.every(scope => 
        req.apiKey!.scopes.includes(scope) || req.apiKey!.scopes.includes('*')
      );

      if (!hasAllScopes) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'API key does not have required scopes',
          code: 'INSUFFICIENT_SCOPES',
          required: requiredScopes,
          available: req.apiKey.scopes,
        });
      }
    }

    next();
  };
};

// Organization membership check
export const requireOrganisation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.organisationId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Organisation membership required',
        code: 'ORGANISATION_REQUIRED',
      });
    }

    // Verify organisation is active
    const organisation = await prisma.organisation.findUnique({
      where: { id: req.user.organisationId },
    });

    if (!organisation || !organisation.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Organisation is not active',
        code: 'ORGANISATION_INACTIVE',
      });
    }

    next();
  } catch (error) {
    logger.error('Organisation check error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Organisation verification failed',
      code: 'ORG_CHECK_ERROR',
    });
  }
};

// Generate JWT token
export const generateToken = (userId: string, expiresIn: string = '24h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
};
