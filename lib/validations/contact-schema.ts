/**
 * Zod validation schemas for contact data
 * Used by forms and server actions for input validation
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for contact create/update operations
 * Name is required, all other fields are optional
 */
export const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(200, 'Contact name must be 200 characters or less'),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be 50 characters or less').optional().nullable(),
  title: z.string().max(200, 'Title must be 200 characters or less').optional().nullable(),
  notes: z.string().optional().nullable(),
  is_primary: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ContactInput = z.infer<typeof contactSchema>;
