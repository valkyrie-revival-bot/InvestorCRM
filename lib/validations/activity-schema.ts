/**
 * Zod validation schemas for activity data
 * Used by forms and server actions for input validation
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

// User-creatable activity types (exclude system types: stage_change, field_update)
export const USER_ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting'] as const;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new activity
 * Used by quick-add modal and activity logging forms
 */
export const activityCreateSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  activity_type: z.enum(USER_ACTIVITY_TYPES, {
    message: 'Select an activity type',
  }),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be 2000 characters or less'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Optional next action fields
  set_next_action: z.boolean().optional().default(false),
  next_action: z.string().max(500).optional().nullable(),
  next_action_date: z.string().optional().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
