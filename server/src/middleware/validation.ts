import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../types';
import { logger } from '../utils/logger';

/**
 * Middleware factory to validate request data using Zod schemas
 */
export const validate = (schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
          }))
        );

        logger.warn('Validation error', {
          endpoint: req.path,
          method: req.method,
          errors: validationError.details,
          body: req.body,
          query: req.query,
          params: req.params,
        });

        res.status(validationError.statusCode).json({
          success: false,
          error: {
            code: validationError.code,
            message: validationError.message,
            details: validationError.details,
          },
        });
        return;
      }

      logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };
};