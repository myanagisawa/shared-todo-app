import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { createNoteSchema, updateNoteSchema, uuidSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Define params schema for ID validation
const noteParamsSchema = z.object({
  id: uuidSchema,
});
import { logger } from '../utils/logger';
import { AuthenticatedRequest, ValidationError, NotFoundError, AuthorizationError } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all note routes
router.use(authenticateToken);

/**
 * POST /api/v1/notes
 * Create a new note
 */
router.post('/', validate({ body: createNoteSchema }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const note = await prisma.note.create({
      data: {
        title,
        content,
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
        _count: {
          select: {
            tasks: true,
            files: true,
          },
        },
      },
    });

    logger.info('Note created successfully', {
      noteId: note.id,
      userId,
      title: note.title,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    logger.error('Note creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      title: req.body?.title,
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
        message: 'Note creation failed due to server error',
      },
    });
  }
});

/**
 * GET /api/v1/notes
 * Get user's notes with pagination
 */
router.get('/', validate({ query: paginationSchema }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (page - 1) * limit;

    // Get notes where user is author or has access
    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where: {
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
          isArchived: false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          _count: {
            select: {
              tasks: true,
              files: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.note.count({
        where: {
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
          isArchived: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('Notes retrieved successfully', {
      userId,
      count: notes.length,
      page,
      totalCount,
    });

    res.json({
      success: true,
      data: {
        notes,
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
    logger.error('Notes retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve notes',
      },
    });
  }
});

/**
 * GET /api/v1/notes/:id
 * Get a specific note by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findFirst({
      where: {
        id,
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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        files: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found or access denied',
        },
      });
    }

    logger.info('Note retrieved successfully', {
      noteId: note.id,
      userId,
      title: note.title,
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    logger.error('Note retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      noteId: req.params.id,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve note',
      },
    });
  }
});

/**
 * PUT /api/v1/notes/:id
 * Update a note
 */
router.put('/:id', 
  validate({ 
    params: noteParamsSchema,
    body: updateNoteSchema 
  }), 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Check if note exists and user has edit permission
      const existingNote = await prisma.note.findFirst({
        where: {
          id,
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
      });

      if (!existingNote) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found or insufficient permissions',
          },
        });
      }

      const updatedNote = await prisma.note.update({
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
          _count: {
            select: {
              tasks: true,
              files: true,
            },
          },
        },
      });

      logger.info('Note updated successfully', {
        noteId: updatedNote.id,
        userId,
        title: updatedNote.title,
      });

      res.json({
        success: true,
        data: updatedNote,
      });
    } catch (error) {
      logger.error('Note update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.id,
        userId: req.user?.id,
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
          message: 'Note update failed due to server error',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/notes/:id
 * Delete a note (only by author or admin)
 */
router.delete('/:id', validate({ params: noteParamsSchema }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if note exists and user has delete permission (author or admin role)
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            noteUsers: {
              some: {
                userId,
                role: 'admin',
              },
            },
          },
        ],
      },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found or insufficient permissions',
        },
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    logger.info('Note deleted successfully', {
      noteId: id,
      userId,
      title: existingNote.title,
    });

    res.json({
      success: true,
      data: {
        message: 'Note deleted successfully',
        noteId: id,
      },
    });
  } catch (error) {
    logger.error('Note deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      noteId: req.params.id,
      userId: req.user?.id,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Note deletion failed due to server error',
      },
    });
  }
});

export default router;