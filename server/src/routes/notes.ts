import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { createNoteSchema, updateNoteSchema, uuidSchema, paginationSchema, inviteUserSchema, updateNoteUserRoleSchema } from '../utils/validation';
import { z } from 'zod';

// Define params schema for ID validation
const noteParamsSchema = z.object({
  id: uuidSchema,
});
import { logger } from '../utils/logger';
import { AuthService } from '../utils/auth';
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

/**
 * POST /api/v1/notes/:id/invite
 * Invite a user to share a note
 */
router.post('/:id/invite', 
  validate({ 
    params: noteParamsSchema,
    body: inviteUserSchema 
  }), 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const userId = req.user.id;

      // Check if note exists and user has admin permission
      const note = await prisma.note.findFirst({
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

      if (!note) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found or insufficient permissions to invite users',
          },
        });
      }

      // Check if user being invited exists
      const invitedUser = await prisma.user.findUnique({
        where: { email },
      });

      if (invitedUser) {
        // Check if user is already a collaborator
        const existingCollaboration = await prisma.noteUser.findUnique({
          where: {
            noteId_userId: {
              noteId: id,
              userId: invitedUser.id,
            },
          },
        });

        if (existingCollaboration) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'USER_ALREADY_COLLABORATOR',
              message: 'User is already a collaborator on this note',
            },
          });
        }

        // If user exists and is not a collaborator, add them directly
        const noteUser = await prisma.noteUser.create({
          data: {
            noteId: id,
            userId: invitedUser.id,
            role,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        logger.info('User added to note directly', {
          noteId: id,
          invitedUserId: invitedUser.id,
          invitedEmail: email,
          role,
          invitedById: userId,
        });

        return res.status(201).json({
          success: true,
          data: {
            type: 'direct_addition',
            noteUser,
            message: 'User added to note successfully',
          },
        });
      }

      // User doesn't exist, create invitation
      // Check for existing invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email,
          noteId: id,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingInvitation) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVITATION_ALREADY_EXISTS',
            message: 'An active invitation already exists for this email',
          },
        });
      }

      // Generate invitation token
      const token = AuthService.generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const invitation = await prisma.invitation.create({
        data: {
          email,
          noteId: id,
          invitedById: userId,
          role,
          token,
          expiresAt,
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.info('Note invitation created', {
        invitationId: invitation.id,
        noteId: id,
        invitedEmail: email,
        role,
        invitedById: userId,
        expiresAt,
      });

      res.status(201).json({
        success: true,
        data: {
          type: 'invitation_created',
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            note: invitation.note,
            invitedBy: invitation.invitedBy,
          },
          message: 'Invitation created successfully',
          invitationUrl: `${process.env.CLIENT_URL}/invitations/${token}`,
        },
      });
    } catch (error) {
      logger.error('Note invitation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.id,
        userId: req.user?.id,
        email: req.body?.email,
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
          message: 'Invitation failed due to server error',
        },
      });
    }
  }
);

/**
 * GET /api/v1/notes/:id/users
 * Get users with access to a note
 */
router.get('/:id/users', 
  validate({ params: noteParamsSchema }), 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if user has access to this note
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
            orderBy: {
              createdAt: 'asc',
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

      // Format response
      const users = [
        {
          user: note.author,
          role: 'owner' as const,
          createdAt: note.createdAt,
        },
        ...note.noteUsers.map(nu => ({
          user: nu.user,
          role: nu.role,
          createdAt: nu.createdAt,
        })),
      ];

      logger.info('Note users retrieved', {
        noteId: id,
        userId,
        userCount: users.length,
      });

      res.json({
        success: true,
        data: {
          noteId: id,
          users,
        },
      });
    } catch (error) {
      logger.error('Note users retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.id,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve note users',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/notes/:id/users/:userId
 * Remove a user's access to a note
 */
router.delete('/:id/users/:userId', 
  validate({ 
    params: z.object({
      id: uuidSchema,
      userId: uuidSchema,
    })
  }), 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.user.id;

      // Check if current user has admin permission
      const note = await prisma.note.findFirst({
        where: {
          id,
          OR: [
            { authorId: currentUserId },
            {
              noteUsers: {
                some: {
                  userId: currentUserId,
                  role: 'admin',
                },
              },
            },
          ],
        },
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found or insufficient permissions',
          },
        });
      }

      // Prevent removing the note author
      if (note.authorId === targetUserId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_REMOVE_AUTHOR',
            message: 'Cannot remove the note author',
          },
        });
      }

      // Check if target user has access to this note
      const noteUser = await prisma.noteUser.findUnique({
        where: {
          noteId_userId: {
            noteId: id,
            userId: targetUserId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!noteUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User does not have access to this note',
          },
        });
      }

      // Remove access
      await prisma.noteUser.delete({
        where: {
          noteId_userId: {
            noteId: id,
            userId: targetUserId,
          },
        },
      });

      logger.info('User access removed from note', {
        noteId: id,
        removedUserId: targetUserId,
        removedUserEmail: noteUser.user.email,
        removedById: currentUserId,
      });

      res.json({
        success: true,
        data: {
          message: 'User access removed successfully',
          removedUser: noteUser.user,
        },
      });
    } catch (error) {
      logger.error('User access removal failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        noteId: req.params.id,
        targetUserId: req.params.userId,
        currentUserId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove user access',
        },
      });
    }
  }
);

export default router;