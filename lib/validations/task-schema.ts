/**
 * Zod validation schemas for task operations
 */

import { z } from 'zod';

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'completed', 'cancelled']);

// Task priority enum
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

// Create task schema
export const taskCreateSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  priority: taskPrioritySchema.default('medium'),
});

// Update task schema
export const taskUpdateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
});

// Export types
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
