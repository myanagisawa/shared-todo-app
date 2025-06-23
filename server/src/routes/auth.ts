import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../utils/auth';
import { validate } from '../middleware/validation';
import { loginSchema, registerSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { AuthenticationError, ValidationError } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', validate({ body: registerSchema }), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists',
        },
      });
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
    });

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Registration failed due to server error',
      },
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, user.password);

    if (!isValidPassword) {
      logger.warn('Failed login attempt', {
        email,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
    });

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed due to server error',
      },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (in JWT implementation, this is mainly for logging)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In JWT implementation, we don't need to invalidate tokens server-side
    // The client should remove the token from storage
    
    logger.info('User logged out', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Logout failed due to server error',
      },
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // This endpoint will be used with authenticateToken middleware
    // to get current user info
    res.json({
      success: true,
      data: {
        message: 'Authentication endpoint - requires middleware implementation',
      },
    });
  } catch (error) {
    logger.error('Get user profile failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile',
      },
    });
  }
});

export default router;