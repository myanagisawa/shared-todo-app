import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Note validation schemas
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim(),
  content: z
    .string()
    .optional(),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim()
    .optional(),
  content: z
    .string()
    .optional(),
  isArchived: z
    .boolean()
    .optional(),
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim(),
  description: z
    .string()
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high'])
    .default('medium'),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .or(z.date().optional()),
  noteId: z
    .string()
    .uuid('Invalid note ID'),
  assigneeId: z
    .string()
    .uuid('Invalid assignee ID')
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim()
    .optional(),
  description: z
    .string()
    .optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'on_hold'])
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional(),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .or(z.date().optional())
    .nullable(),
  assigneeId: z
    .string()
    .uuid('Invalid assignee ID')
    .optional()
    .nullable(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0')
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
});

// Search schema
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .trim()
    .optional(),
});

// UUID schema
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

// Note user invitation schema
export const inviteUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  role: z
    .enum(['viewer', 'editor', 'admin'])
    .default('viewer'),
});

// Update user role schema
export const updateUserRoleSchema = z.object({
  role: z
    .enum(['viewer', 'editor', 'admin']),
});

// File upload validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function validateFileUpload(file: Express.Multer.File): boolean {
  return (
    file.size <= MAX_FILE_SIZE &&
    ALLOWED_FILE_TYPES.includes(file.mimetype)
  );
}

// Type exports for the validated data
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type InviteUserData = z.infer<typeof inviteUserSchema>;
export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;