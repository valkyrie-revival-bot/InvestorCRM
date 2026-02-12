/**
 * Zod validation schemas for investor data
 * Used by forms and server actions for input validation
 */

import { z } from 'zod';
import type { InvestorStage, AllocatorType } from '@/types/investors';

// ============================================================================
// CONSTANTS
// ============================================================================

export const INVESTOR_STAGES: InvestorStage[] = [
  'Not Yet Approached',
  'Initial Contact',
  'First Conversation Held',
  'Materials Shared',
  'NDA / Data Room',
  'Active Due Diligence',
  'LPA / Legal',
  'Won',
  'Committed',
  'Lost',
  'Passed',
  'Delayed',
];

export const ALLOCATOR_TYPES: AllocatorType[] = [
  'Family Office',
  'HNWI',
  'Endowment',
  'Foundation',
  'Pension',
  'Fund of Funds',
  'Sovereign Wealth',
  'Insurance',
  'Other',
];

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new investor
 * Only required fields - used by quick create modal
 */
export const investorCreateSchema = z.object({
  firm_name: z.string().min(1, 'Firm name is required').max(200, 'Firm name must be 200 characters or less'),
  stage: z.string().min(1, 'Stage is required').refine(
    (val) => INVESTOR_STAGES.includes(val as InvestorStage),
    { message: 'Invalid stage value' }
  ),
  relationship_owner: z.string().min(1, 'Relationship owner is required').max(100, 'Relationship owner must be 100 characters or less'),
});

/**
 * Schema for updating an investor
 * All fields are optional - used by inline field edits
 */
export const investorUpdateSchema = z.object({
  firm_name: z.string().min(1, 'Firm name cannot be empty').max(200, 'Firm name must be 200 characters or less').optional(),
  stage: z.string().refine(
    (val) => INVESTOR_STAGES.includes(val as InvestorStage),
    { message: 'Invalid stage value' }
  ).optional(),
  relationship_owner: z.string().min(1, 'Relationship owner cannot be empty').max(100, 'Relationship owner must be 100 characters or less').optional(),
  partner_source: z.string().max(200, 'Partner source must be 200 characters or less').optional().nullable(),
  est_value: z.number().nonnegative('Estimated value must be 0 or greater').optional().nullable(),
  entry_date: z.string().optional().nullable(),
  last_action_date: z.string().optional().nullable(),
  stalled: z.boolean().optional(),
  allocator_type: z.string().refine(
    (val) => val === '' || ALLOCATOR_TYPES.includes(val as AllocatorType),
    { message: 'Invalid allocator type' }
  ).optional().nullable(),
  internal_conviction: z.string().optional().nullable(),
  internal_priority: z.string().optional().nullable(),
  investment_committee_timing: z.string().optional().nullable(),
  next_action: z.string().optional().nullable(),
  next_action_date: z.string().optional().nullable(),
  current_strategy_notes: z.string().optional().nullable(),
  current_strategy_date: z.string().optional().nullable(),
  last_strategy_notes: z.string().optional().nullable(),
  last_strategy_date: z.string().optional().nullable(),
  key_objection_risk: z.string().optional().nullable(),
});

// ============================================================================
// FIELD VALIDATION HELPERS
// ============================================================================

/**
 * Validate a single investor field
 * Returns validation result with typed value or error message
 */
export function validateInvestorField(
  field: string,
  value: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  // Check if field exists in update schema
  const fieldSchema = investorUpdateSchema.shape[field as keyof typeof investorUpdateSchema.shape];

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

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type InvestorCreateInput = z.infer<typeof investorCreateSchema>;
export type InvestorUpdateInput = z.infer<typeof investorUpdateSchema>;
