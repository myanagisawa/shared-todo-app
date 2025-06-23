import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { createTaskSchema, updateTaskSchema, uuidSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, ValidationError, NotFoundError, AuthorizationError } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Define params schemas
const taskParamsSchema = z.object({
  id: uuidSchema,
});

const noteTaskParamsSchema = z.object({
  noteId: uuidSchema,
});

const taskWithNoteParamsSchema = z.object({
  noteId: uuidSchema,
  id: uuidSchema,
});

// Apply authentication middleware to all task routes
router.use(authenticateToken);

/**
 * POST /api/v1/tasks/notes/:noteId
 * Create a new task in a note
 */
router.post('/notes/:noteId',
  validate({ 
    params: noteTaskParamsSchema,
    body: createTaskSchema.omit({ noteId: true })
  }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { noteId } = req.params;
      const { title, description, priority, dueDate, assigneeId } = req.body;
      const userId = req.user.id;

      // Check if user has access to the note (author or collaborator with editor+ role)
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { authorId: userId },
            {
              noteUsers: {
                some: {
                  userId,
                  role: {
                    in: ['editor', 'admin'],
                  },
                },
              },
            },
          ],
        },
        include: {
          noteUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!note) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found or insufficient permissions to create tasks',
          },
        });
        return;
      }

      // If assigneeId is provided, verify the assignee has access to the note
      if (assigneeId) {
        const hasAccess = note.authorId === assigneeId || 
          note.noteUsers.some(nu => nu.userId === assigneeId);

        if (!hasAccess) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ASSIGNEE',
              message: 'Assignee must have access to the note',
            },
          });
          return;
        }
      }

      // Parse dueDate if provided
      let parsedDueDate: Date | undefined;
      if (dueDate) {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DUE_DATE',
              message: 'Invalid due date format',
            },
          });
          return;
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority,
          dueDate: parsedDueDate,
          noteId,
          assigneeId,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      logger.info('Task created successfully', {
        taskId: task.id,
        noteId,
        userId,
        title: task.title,
        assigneeId: task.assigneeId,
      });

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      logger.error('Task creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.noteId,
        userId: req.user?.id,
        title: req.body?.title,
      });

      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Task creation failed due to server error',
        },
      });
    }
  }
);

/**
 * GET /api/v1/tasks/notes/:noteId
 * Get tasks for a specific note with pagination and filtering
 */
router.get('/notes/:noteId',
  validate({ 
    params: noteTaskParamsSchema,
    query: paginationSchema.extend({
      status: z.enum(['pending', 'in_progress', 'completed', 'on_hold']).optional(),
      assigneeId: uuidSchema.optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    })
  }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { noteId } = req.params;
      const { page = 1, limit = 20, status, assigneeId, priority } = req.query as any;
      const userId = req.user.id;
      const skip = (page - 1) * limit;

      // Check if user has access to the note
      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { authorId: userId },
            {
              noteUsers: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      });

      if (!note) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found or access denied',
          },
        });
        return;
      }

      // Build filter conditions
      const where: any = {
        noteId,
      };

      if (status) where.status = status;
      if (assigneeId) where.assigneeId = assigneeId;
      if (priority) where.priority = priority;

      // Get tasks with pagination
      const [tasks, totalCount] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' }, // pending first, then in_progress, completed, on_hold
            { priority: 'desc' }, // high priority first
            { dueDate: 'asc' }, // earliest due date first
            { createdAt: 'desc' }, // newest first
          ],
          skip,
          take: limit,
        }),
        prisma.task.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      logger.info('Note tasks retrieved successfully', {
        noteId,
        userId,
        count: tasks.length,
        page,
        totalCount,
        filters: { status, assigneeId, priority },
      });

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logger.error('Note tasks retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.noteId,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve note tasks',
        },
      });
    }
  }
);

/**
 * GET /api/v1/tasks/:id
 * Get a specific task by ID
 */
router.get('/:id',
  validate({ params: taskParamsSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const task = await prisma.task.findFirst({
        where: {
          id,
          note: {
            OR: [
              { authorId: userId },
              {
                noteUsers: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!task) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found or access denied',
          },
        });
        return;
      }

      logger.info('Task retrieved successfully', {
        taskId: task.id,
        noteId: task.noteId,
        userId,
        title: task.title,
      });

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      logger.error('Task retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: req.params.id,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve task',
        },
      });
    }
  }
);

/**
 * PUT /api/v1/tasks/:id
 * Update a task
 */
router.put('/:id',
  validate({ 
    params: taskParamsSchema,
    body: updateTaskSchema
  }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = { ...req.body };

      // Parse dueDate if provided
      if (updateData.dueDate) {
        const parsedDueDate = new Date(updateData.dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DUE_DATE',
              message: 'Invalid due date format',
            },
          });
          return;
        }
        updateData.dueDate = parsedDueDate;
      }

      // Check if task exists and user has edit permission
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          note: {
            OR: [
              { authorId: userId },
              {
                noteUsers: {
                  some: {
                    userId,
                    role: {
                      in: ['editor', 'admin'],
                    },
                  },
                },
              },
            ],
          },
        },
        include: {
          note: {
            include: {
              noteUsers: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found or insufficient permissions',
          },
        });
        return;
      }

      // If assigneeId is being updated, verify the assignee has access to the note
      if (updateData.assigneeId !== undefined && updateData.assigneeId !== null) {
        const hasAccess = existingTask.note.authorId === updateData.assigneeId || 
          existingTask.note.noteUsers.some(nu => nu.userId === updateData.assigneeId);

        if (!hasAccess) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ASSIGNEE',
              message: 'Assignee must have access to the note',
            },
          });
          return;
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      logger.info('Task updated successfully', {
        taskId: updatedTask.id,
        noteId: updatedTask.noteId,
        userId,
        title: updatedTask.title,
        status: updatedTask.status,
        assigneeId: updatedTask.assigneeId,
      });

      res.json({
        success: true,
        data: updatedTask,
      });
    } catch (error) {
      logger.error('Task update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: req.params.id,
        userId: req.user?.id,
      });

      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Task update failed due to server error',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task (only by author or admin)
 */
router.delete('/:id',
  validate({ params: taskParamsSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if task exists and user has delete permission
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          OR: [
            { authorId: userId }, // Task author can delete
            {
              note: {
                OR: [
                  { authorId: userId }, // Note author can delete any task
                  {
                    noteUsers: {
                      some: {
                        userId,
                        role: 'admin', // Note admin can delete any task
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      });

      if (!existingTask) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found or insufficient permissions',
          },
        });
        return;
      }

      await prisma.task.delete({
        where: { id },
      });

      logger.info('Task deleted successfully', {
        taskId: id,
        noteId: existingTask.noteId,
        userId,
        title: existingTask.title,
      });

      res.json({
        success: true,
        data: {
          message: 'Task deleted successfully',
          taskId: id,
        },
      });
    } catch (error) {
      logger.error('Task deletion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId: req.params.id,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Task deletion failed due to server error',
        },
      });
    }
  }
);

export default router;