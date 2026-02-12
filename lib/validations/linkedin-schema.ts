/**
 * Zod validation schemas for LinkedIn contact data
 * Used by CSV import and contact management forms
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { z } from 'zod';
import type { RelationshipType, DetectedVia, TeamMember } from '@/types/linkedin';
import { TEAM_MEMBERS } from '@/types/linkedin';

// ============================================================================
// CSV ROW VALIDATION
// ============================================================================

/**
 * Schema for a single LinkedIn CSV row after header transformation
 * Handles optional fields, empty strings, and date parsing
 */
export const linkedInContactRowSchema = z.object({
  // Required fields
  first_name: z.string()
    .min(1, 'First name is required')
    .max(200, 'First name must be 200 characters or less')
    .transform(s => s.trim()),

  last_name: z.string()
    .min(1, 'Last name is required')
    .max(200, 'Last name must be 200 characters or less')
    .transform(s => s.trim()),

  // Optional fields - transform empty strings to null
  linkedin_url: z.string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal(''))
    .transform(v => v && v.trim() !== '' ? v.trim() : null)
    .nullable(),

  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform(v => v && v.trim() !== '' ? v.trim() : null)
    .nullable(),

  company: z.string()
    .max(500, 'Company name too long')
    .optional()
    .or(z.literal(''))
    .transform(v => v && v.trim() !== '' ? v.trim() : null)
    .nullable(),

  position: z.string()
    .max(500, 'Position title too long')
    .optional()
    .or(z.literal(''))
    .transform(v => v && v.trim() !== '' ? v.trim() : null)
    .nullable(),

  // Date transformation: "10 Feb 2026" → "2026-02-10"
  connected_on: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => {
      if (!val || val.trim() === '') return null;

      // LinkedIn date format: "DD MMM YYYY" (e.g., "10 Feb 2026")
      const date = new Date(val);

      // Validate the parsed date
      if (isNaN(date.getTime())) {
        return null; // Invalid date → null (don't fail validation)
      }

      // Return ISO date string (YYYY-MM-DD)
      return date.toISOString().split('T')[0];
    })
    .nullable(),
});

export type LinkedInContactRowInput = z.infer<typeof linkedInContactRowSchema>;

// ============================================================================
// CONTACT VALIDATION
// ============================================================================

/**
 * Schema for creating a new LinkedIn contact
 * Used by import process after CSV parsing
 */
export const createLinkedInContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(200),
  last_name: z.string().min(1, 'Last name is required').max(200),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  company: z.string().max(500).optional().nullable(),
  position: z.string().max(500).optional().nullable(),
  normalized_company: z.string().max(500).optional().nullable(),
  connected_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional().nullable(),
  team_member_name: z.enum(TEAM_MEMBERS as unknown as [TeamMember, ...TeamMember[]], {
    message: 'Invalid team member name',
  }),
});

export type CreateLinkedInContactInput = z.infer<typeof createLinkedInContactSchema>;

/**
 * Schema for updating an existing LinkedIn contact
 * All fields optional
 */
export const updateLinkedInContactSchema = createLinkedInContactSchema.partial();

export type UpdateLinkedInContactInput = z.infer<typeof updateLinkedInContactSchema>;

// ============================================================================
// RELATIONSHIP VALIDATION
// ============================================================================

/**
 * Valid relationship types
 */
const relationshipTypes: RelationshipType[] = [
  'works_at',
  'former_colleague',
  'knows_decision_maker',
  'industry_overlap',
  'geographic_proximity',
];

/**
 * Valid detection methods
 */
const detectedViaTypes: DetectedVia[] = [
  'company_match',
  'manual',
  'email_match',
  'name_match',
];

/**
 * Schema for creating a new investor relationship
 */
export const createInvestorRelationshipSchema = z.object({
  investor_id: z.string().uuid('Invalid investor ID'),
  linkedin_contact_id: z.string().uuid('Invalid LinkedIn contact ID'),
  relationship_type: z.enum(relationshipTypes as [RelationshipType, ...RelationshipType[]]),
  path_strength: z.number()
    .min(0, 'Path strength must be between 0 and 1')
    .max(1, 'Path strength must be between 0 and 1'),
  path_description: z.string().max(1000, 'Description too long').optional().nullable(),
  detected_via: z.enum(detectedViaTypes as [DetectedVia, ...DetectedVia[]]),
});

export type CreateInvestorRelationshipInput = z.infer<typeof createInvestorRelationshipSchema>;

/**
 * Schema for updating an existing investor relationship
 * All fields optional
 */
export const updateInvestorRelationshipSchema = createInvestorRelationshipSchema.partial();

export type UpdateInvestorRelationshipInput = z.infer<typeof updateInvestorRelationshipSchema>;

// ============================================================================
// BATCH VALIDATION HELPERS
// ============================================================================

/**
 * Validate and transform array of parsed CSV rows
 * Returns validated data and any validation errors
 */
export function validateLinkedInRows(rows: unknown[]) {
  const validated: Array<{ row: number; data: LinkedInContactRowInput }> = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const result = linkedInContactRowSchema.safeParse(rows[i]);

    if (result.success) {
      validated.push({ row: i + 1, data: result.data });
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          row: i + 1,
          field: issue.path.join('.'),
          message: issue.message,
        });
      }
    }
  }

  return { validated, errors };
}

/**
 * Validate a single LinkedIn contact field
 * Used for inline editing
 */
export function validateLinkedInContactField(
  field: string,
  value: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  const fieldSchema = createLinkedInContactSchema.shape[
    field as keyof typeof createLinkedInContactSchema.shape
  ];

  if (!fieldSchema) {
    return {
      success: false,
      error: `Unknown field: ${field}`,
    };
  }

  try {
    const validatedValue = fieldSchema.parse(value);
    return {
      success: true,
      data: validatedValue,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation failed',
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}
