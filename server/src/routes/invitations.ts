import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { acceptInvitationSchema, uuidSchema } from '../utils/validation';
import { AuthService } from '../utils/auth';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, ValidationError, NotFoundError } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Define params schema for token validation
const invitationParamsSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * GET /api/v1/invitations/:token
 * Get invitation details by token
 */
router.get('/:token', 
  validate({ params: invitationParamsSchema }), 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      // Verify token format
      if (!AuthService.verifyInvitationToken(token)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid invitation token',
          },
        });
        return;
      }

      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              content: true,
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

      if (!invitation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        });
        return;
      }

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVITATION_EXPIRED',
            message: 'Invitation has expired',
          },
        });
        return;
      }

      logger.info('Invitation details retrieved', {
        invitationId: invitation.id,
        token,
        email: invitation.email,
      });

      res.json({
        success: true,
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            note: invitation.note,
            invitedBy: invitation.invitedBy,
          },
        },
      });
    } catch (error) {
      logger.error('Invitation retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.params.token,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve invitation',
        },
      });
    }
  }
);

/**
 * POST /api/v1/invitations/:token/accept
 * Accept an invitation to join a note
 */
router.post('/:token/accept',
  authenticateToken,
  validate({ params: invitationParamsSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Verify token format
      if (!AuthService.verifyInvitationToken(token)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid invitation token',
          },
        });
        return;
      }

      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token },
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

      if (!invitation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        });
        return;
      }

      // Check if invitation has expired
      if (invitation.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVITATION_EXPIRED',
            message: 'Invitation has expired',
          },
        });
        return;
      }

      // Check if invitation email matches current user
      if (invitation.email !== userEmail) {
        res.status(403).json({
          success: false,
          error: {
            code: 'EMAIL_MISMATCH',
            message: 'Invitation email does not match your account email',
          },
        });
        return;
      }

      // Check if user is already a collaborator
      const existingCollaboration = await prisma.noteUser.findUnique({
        where: {
          noteId_userId: {
            noteId: invitation.noteId,
            userId,
          },
        },
      });

      if (existingCollaboration) {
        // Delete the invitation since user is already a collaborator
        await prisma.invitation.delete({
          where: { id: invitation.id },
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_COLLABORATOR',
            message: 'You are already a collaborator on this note',
          },
        });
        return;
      }

      // Add user to note and delete invitation
      const [noteUser] = await prisma.$transaction([
        prisma.noteUser.create({
          data: {
            noteId: invitation.noteId,
            userId,
            role: invitation.role,
          },
          include: {
            user: {
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
        }),
        prisma.invitation.delete({
          where: { id: invitation.id },
        }),
      ]);

      logger.info('Invitation accepted successfully', {
        invitationId: invitation.id,
        userId,
        noteId: invitation.noteId,
        role: invitation.role,
        userEmail,
      });

      res.json({
        success: true,
        data: {
          message: 'Invitation accepted successfully',
          noteUser: {
            user: noteUser.user,
            role: noteUser.role,
            note: noteUser.note,
            createdAt: noteUser.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Invitation acceptance failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.params.token,
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
          message: 'Failed to accept invitation',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/invitations/:token
 * Decline an invitation
 */
router.delete('/:token',
  validate({ params: invitationParamsSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      // Verify token format
      if (!AuthService.verifyInvitationToken(token)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid invitation token',
          },
        });
        return;
      }

      // Find and delete invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!invitation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        });
        return;
      }

      await prisma.invitation.delete({
        where: { id: invitation.id },
      });

      logger.info('Invitation declined', {
        invitationId: invitation.id,
        token,
        email: invitation.email,
        noteId: invitation.noteId,
      });

      res.json({
        success: true,
        data: {
          message: 'Invitation declined successfully',
        },
      });
    } catch (error) {
      logger.error('Invitation decline failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.params.token,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to decline invitation',
        },
      });
    }
  }
);

export default router;