/**
 * Log activity tool
 * Creates activity records for AI-initiated notes
 * Direct execution (no confirmation) - append-only operations are low risk
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * User-creatable activity types
 * System types (stage_change, field_update) cannot be manually created
 */
const userActivityTypes = ['note', 'call', 'email', 'meeting'] as const;

/**
 * Log activity tool - creates activity records directly
 * No confirmation needed (append-only, can't corrupt existing data)
 */
export const logActivityTool = tool({
  description:
    'Log an activity for an investor. Executes immediately without confirmation (activities are append-only audit trail).',
  inputSchema: z.object({
    firmName: z.string().min(1).describe('Firm name (fuzzy match)'),
    activityType: z
      .enum(userActivityTypes)
      .describe('Type of activity: note, call, email, or meeting'),
    description: z
      .string()
      .min(5)
      .max(500)
      .describe('Activity description (5-500 characters)'),
  }),
  execute: async ({ firmName, activityType, description }) => {
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

    // Fuzzy match firm name
    const { data: investors, error: searchError } = await supabase
      .from('investors')
      .select('id, firm_name')
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

    // Single match - create activity
    const investor = investors[0];

    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        investor_id: investor.id,
        activity_type: activityType,
        description,
        created_by: user.id,
        metadata: {
          source: 'ai_bdr_agent',
        },
      })
      .select()
      .single();

    if (insertError || !activity) {
      return {
        status: 'error',
        message: `Failed to create activity: ${insertError?.message || 'Unknown error'}`,
      };
    }

    // Update last_action_date
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('investors')
      .update({ last_action_date: today })
      .eq('id', investor.id);

    return {
      status: 'success',
      message: `Activity logged for ${investor.firm_name}: "${description}"`,
      activityId: activity.id,
      firmName: investor.firm_name,
    };
  },
});
