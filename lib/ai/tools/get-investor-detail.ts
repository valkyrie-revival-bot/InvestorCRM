/**
 * Get investor detail tool
 * Fetches detailed investor information by firm name (fuzzy matching)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sanitizeToolOutput } from '@/lib/ai/security';
import { computeIsStalled } from '@/lib/stage-definitions';

/**
 * Get investor detail tool
 * Uses fuzzy matching on firm name to find investors
 * Returns full details including contacts and recent activities
 */
export const getInvestorDetailTool = tool({
  description: `Fetch detailed information about a specific investor by firm name.
Use this when the user mentions a firm name or asks about a specific investor.
Examples: "what about Sequoia?", "tell me about Blackstone", "how's Goldman doing?"`,
  inputSchema: z.object({
    firmName: z.string().describe('The firm name to search for (supports partial matching)'),
  }),
  execute: async ({ firmName }) => {
    const supabase = await createClient();

    // Fuzzy search on firm name using case-insensitive LIKE
    const { data: investors, error: searchError } = await supabase
      .from('investors')
      .select('*')
      .ilike('firm_name', `%${firmName}%`)
      .is('deleted_at', null);

    if (searchError) {
      throw new Error(`Investor search failed: ${searchError.message}`);
    }

    if (!investors || investors.length === 0) {
      return {
        found: false,
        matches: 0,
        message: `No investors found matching "${firmName}". Try a different search term.`,
      };
    }

    // If multiple matches, return list for clarification
    if (investors.length > 1) {
      return {
        found: true,
        matches: investors.length,
        message: `Found ${investors.length} investors matching "${firmName}". Please be more specific.`,
        investors: investors.map(inv => ({
          firm_name: inv.firm_name,
          stage: inv.stage,
          relationship_owner: inv.relationship_owner,
        })),
      };
    }

    // Single match - fetch full details
    const investor = investors[0];

    // Fetch contacts for this investor
    const { data: contacts } = await supabase
      .from('contacts')
      .select('name, title')
      .eq('investor_id', investor.id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false });

    // Fetch recent activities (last 10)
    const { data: activities } = await supabase
      .from('activities')
      .select('activity_type, description, created_at')
      .eq('investor_id', investor.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Compute derived fields
    const isStalled = computeIsStalled(investor.last_action_date, investor.stage as any, 30, investor.stage_entry_date);

    const daysInStage = investor.stage_entry_date
      ? Math.floor(
          (Date.now() - new Date(investor.stage_entry_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const daysSinceAction = investor.last_action_date
      ? Math.floor(
          (Date.now() - new Date(investor.last_action_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Build response with sanitized data
    const response = {
      found: true,
      matches: 1,
      investor: {
        firm_name: investor.firm_name,
        relationship_owner: investor.relationship_owner,
        stage: investor.stage,
        days_in_stage: daysInStage,
        stalled: isStalled,
        est_value: investor.est_value,
        allocator_type: investor.allocator_type,
        internal_conviction: investor.internal_conviction,
        internal_priority: investor.internal_priority,
        last_action_date: investor.last_action_date,
        days_since_action: daysSinceAction,
        next_action: investor.next_action,
        next_action_date: investor.next_action_date,
        current_strategy_notes: investor.current_strategy_notes,
        current_strategy_date: investor.current_strategy_date,
        key_objection_risk: investor.key_objection_risk,
      },
      contacts: sanitizeToolOutput(contacts || [], ['email', 'phone']),
      recent_activities: activities?.map(act => ({
        type: act.activity_type,
        description: act.description,
        created_at: act.created_at,
      })) || [],
    };

    return response;
  },
});
