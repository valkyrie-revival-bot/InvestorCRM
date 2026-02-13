/**
 * Update investor tool
 * Returns confirmation request for human-in-the-loop approval
 * Does NOT directly mutate data - implements privilege minimization pattern
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Editable field types for investor records
 * Limited to safe fields that don't break system invariants
 */
const editableFields = [
  'stage',
  'internal_conviction',
  'est_value',
  'next_action',
  'next_action_date',
  'current_strategy_notes',
  'key_objection_risk',
] as const;

/**
 * Update investor tool - proposes changes with confirmation
 * Tool proposes, human disposes (privilege minimization)
 */
export const updateInvestorTool = tool({
  description:
    'Propose an update to an investor record field. Returns confirmation request for user approval. Does not execute update directly.',
  inputSchema: z.object({
    firmName: z.string().min(1).describe('Firm name to update (fuzzy match)'),
    field: z
      .enum(editableFields)
      .describe('Field to update: stage, internal_conviction, est_value, next_action, next_action_date, current_strategy_notes, key_objection_risk'),
    newValue: z
      .union([z.string(), z.number()])
      .describe('New value for the field'),
    reason: z
      .string()
      .min(5)
      .describe('Reason for the update (minimum 5 characters)'),
  }),
  execute: async ({ firmName, field, newValue, reason }) => {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        status: 'error',
        message: 'Unauthorized - user not authenticated',
      };
    }

    // Fuzzy match firm name (case-insensitive, partial match)
    const { data: investors, error: searchError } = await supabase
      .from('investors')
      .select('id, firm_name, stage, internal_conviction, est_value, next_action, next_action_date, current_strategy_notes, key_objection_risk')
      .ilike('firm_name', `%${firmName}%`)
      .is('deleted_at', null)
      .limit(5);

    if (searchError) {
      return {
        status: 'error',
        message: `Database error: ${searchError.message}`,
      };
    }

    if (!investors || investors.length === 0) {
      return {
        status: 'error',
        message: `No investor found matching "${firmName}". Try a different search term.`,
      };
    }

    if (investors.length > 1) {
      return {
        status: 'clarification_needed',
        message: `Multiple investors match "${firmName}". Please be more specific.`,
        matches: investors.map((inv) => inv.firm_name),
      };
    }

    // Single match found - prepare confirmation
    const investor = investors[0];
    const currentValue = investor[field as keyof typeof investor];

    return {
      status: 'confirmation_required',
      investorId: investor.id,
      firmName: investor.firm_name,
      field,
      currentValue,
      newValue,
      reason,
      message: `I'd like to update ${investor.firm_name}. Here's what will change:\n\n**Field:** ${field}\n**Current value:** ${currentValue || '(empty)'}\n**New value:** ${newValue}\n**Reason:** ${reason}\n\nShall I proceed?`,
    };
  },
});
