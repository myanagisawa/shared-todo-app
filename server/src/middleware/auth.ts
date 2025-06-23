import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../utils/auth';
import { AuthenticatedRequest, AuthenticationError } from '../types';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authHeader);
    
    const decoded = AuthService.verifyToken(token);
    
    // Add user info to request
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    logger.info('User authenticated', {
      userId: decoded.id,
      email: decoded.email,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      ip: req.ip,
    });

    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * If token is provided, validates it, but doesn't require authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = AuthService.extractTokenFromHeader(authHeader);
      const decoded = AuthService.verifyToken(token);
      
      (req as AuthenticatedRequest).user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't return an error, just continue without user
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
    });
    
    next();
  }
};