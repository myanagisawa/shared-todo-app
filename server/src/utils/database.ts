import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseManager {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log slow queries
      DatabaseManager.instance.$on('query', (e) => {
        if (e.duration > 1000) {
          logger.warn('Slow query detected', {
            query: e.query,
            duration: `${e.duration}ms`,
            params: e.params,
          });
        }
      });

      // Log errors
      DatabaseManager.instance.$on('error', (e) => {
        logger.error('Database error', {
          target: e.target,
          message: e.message,
        });
      });

      // Log info
      DatabaseManager.instance.$on('info', (e) => {
        logger.info('Database info', {
          target: e.target,
          message: e.message,
        });
      });

      // Log warnings
      DatabaseManager.instance.$on('warn', (e) => {
        logger.warn('Database warning', {
          target: e.target,
          message: e.message,
        });
      });
    }
    return DatabaseManager.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const db = DatabaseManager.getInstance();
      await db.$queryRaw`SELECT 1`;
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error });
      return false;
    }
  }
}

export const prisma = DatabaseManager.getInstance();
export { DatabaseManager };