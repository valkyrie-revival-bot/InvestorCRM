/**
 * Create investor tool
 * Returns confirmation request for human-in-the-loop approval
 * Checks for duplicates before proposing creation
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { INVESTOR_STAGES } from '@/lib/validations/investor-schema';

/**
 * Create investor tool - proposes new investor with confirmation
 * Never auto-executes — returns confirmation payload for client-side approval
 */
export const createInvestorTool = tool({
  description:
    'Propose creation of a new investor record. Returns confirmation request for user approval. Does not create the record directly.',
  inputSchema: z.object({
    firm_name: z.string().min(1).describe('Name of the investment firm'),
    stage: z
      .enum(INVESTOR_STAGES as [string, ...string[]])
      .describe(
        'Pipeline stage: Not Yet Approached, Initial Contact, First Conversation Held, Materials Shared, NDA / Data Room, Active Due Diligence, LPA / Legal, Won, Committed, Lost, Passed, Delayed'
      ),
    relationship_owner: z
      .string()
      .min(1)
      .describe('Name of the person who owns this relationship'),
    est_value: z
      .number()
      .positive()
      .optional()
      .describe('Estimated investment value in dollars (e.g. 5000000 for $5M)'),
    notes: z.string().optional().describe('Optional initial notes about this investor'),
  }),
  execute: async ({ firm_name, stage, relationship_owner, est_value, notes }) => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized - user not authenticated' };
    }

    // Check for potential duplicates
    const { data: existing } = await supabase
      .from('investors')
      .select('id, firm_name, stage')
      .ilike('firm_name', `%${firm_name}%`)
      .is('deleted_at', null)
      .limit(3);

    if (existing && existing.length > 0) {
      return {
        status: 'confirmation_required',
        firm_name,
        stage,
        relationship_owner,
        est_value,
        notes,
        possibleDuplicates: existing.map((inv) => ({ id: inv.id, firm_name: inv.firm_name, stage: inv.stage })),
        message: `I'd like to create a new investor record. Note: ${existing.length} similar firm(s) already exist.`,
      };
    }

    return {
      status: 'confirmation_required',
      firm_name,
      stage,
      relationship_owner,
      est_value,
      notes,
      possibleDuplicates: [],
      message: `I'd like to create a new investor record for ${firm_name}.`,
    };
  },
});
