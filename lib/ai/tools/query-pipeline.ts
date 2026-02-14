/**
 * Read-only pipeline query tool
 * Allows AI agent to query investor data using safe, allowlisted query patterns
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { computeIsStalled } from '@/lib/stage-definitions';
import { sanitizeToolOutput } from '@/lib/ai/security';

/**
 * Allowlisted query intents
 * Each intent maps to a safe, predefined query pattern
 */
const queryIntents = [
  'stalled_investors',
  'investors_by_stage',
  'high_value_pipeline',
  'recent_activity',
  'pipeline_summary',
  'upcoming_actions',
] as const;

/**
 * Query pipeline tool
 * Provides read-only access to investor pipeline data
 */
export const queryPipelineTool = tool({
  description: `Query the investor pipeline using safe, predefined patterns.
Examples:
- "Show me stalled investors" → stalled_investors
- "What's in Active Due Diligence?" → investors_by_stage with stage filter
- "High value deals?" → high_value_pipeline with minValue filter
- "Recent activity" → recent_activity with timeframeDays filter
- "Pipeline summary" → pipeline_summary (counts by stage)
- "Upcoming actions" → upcoming_actions (next_action_date within 7 days)`,
  inputSchema: z.object({
    intent: z
      .enum(queryIntents)
      .describe('The type of query to execute'),
    filters: z
      .object({
        stage: z.string().optional().describe('Filter by specific stage'),
        minValue: z.number().optional().describe('Minimum estimated value'),
        maxValue: z.number().optional().describe('Maximum estimated value'),
        timeframeDays: z.number().optional().describe('Days for timeframe filters (default: 30 for stalled, 7 for recent)'),
        conviction: z.string().optional().describe('Filter by internal conviction'),
      })
      .optional(),
  }),
  execute: async ({ intent, filters }) => {
    const supabase = await createClient();

    // Start with base query - exclude soft-deleted
    let query = supabase
      .from('investors')
      .select('id, firm_name, stage, est_value, last_action_date, stage_entry_date, internal_conviction, next_action, next_action_date')
      .is('deleted_at', null);

    // Apply intent-specific logic
    switch (intent) {
      case 'stalled_investors': {
        // Compute stalled status client-side after fetch
        // We'll fetch all and filter after
        break;
      }

      case 'investors_by_stage': {
        if (filters?.stage) {
          query = query.eq('stage', filters.stage);
        }
        break;
      }

      case 'high_value_pipeline': {
        const minValue = filters?.minValue ?? 1000000; // Default $1M+
        query = query.gte('est_value', minValue);
        if (filters?.maxValue) {
          query = query.lte('est_value', filters.maxValue);
        }
        break;
      }

      case 'recent_activity': {
        const days = filters?.timeframeDays ?? 7;
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - days);
        query = query.gte('last_action_date', recentDate.toISOString().split('T')[0]);
        break;
      }

      case 'pipeline_summary': {
        // Fetch all, group client-side
        break;
      }

      case 'upcoming_actions': {
        const days = filters?.timeframeDays ?? 7;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        query = query
          .not('next_action_date', 'is', null)
          .lte('next_action_date', futureDate.toISOString().split('T')[0]);
        break;
      }
    }

    // Apply optional filters
    if (filters?.conviction) {
      query = query.eq('internal_conviction', filters.conviction);
    }

    // Limit results
    query = query.limit(50);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Pipeline query failed: ${error.message}`);
    }

    if (!data) {
      return {
        count: 0,
        investors: [],
        summary: 'No investors found matching criteria',
      };
    }

    // Post-process based on intent
    let filteredData = data;

    if (intent === 'stalled_investors') {
      // Compute stalled status for each investor
      const days = filters?.timeframeDays ?? 30;
      filteredData = data.filter(inv =>
        computeIsStalled(inv.last_action_date, inv.stage as any, days, inv.stage_entry_date)
      );
    }

    // For pipeline_summary, group by stage
    if (intent === 'pipeline_summary') {
      const summary: Record<string, number> = {};
      data.forEach(inv => {
        summary[inv.stage] = (summary[inv.stage] || 0) + 1;
      });

      return {
        count: data.length,
        by_stage: summary,
        summary: `Pipeline has ${data.length} active investors across ${Object.keys(summary).length} stages`,
      };
    }

    // Calculate days since last action for display
    const enrichedData = filteredData.map(inv => {
      const daysSinceAction = inv.last_action_date
        ? Math.floor(
            (Date.now() - new Date(inv.last_action_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      const isStalled = computeIsStalled(inv.last_action_date, inv.stage as any, 30, inv.stage_entry_date);

      return {
        firm_name: inv.firm_name,
        stage: inv.stage,
        est_value: inv.est_value,
        days_since_action: daysSinceAction,
        internal_conviction: inv.internal_conviction,
        next_action: inv.next_action,
        next_action_date: inv.next_action_date,
        stalled: isStalled,
      };
    });

    // Sanitize output - remove any sensitive fields
    const sanitized = sanitizeToolOutput(enrichedData);

    return {
      count: sanitized.length,
      investors: sanitized,
      summary: `Found ${sanitized.length} investors matching "${intent}"${filters?.stage ? ` in stage "${filters.stage}"` : ''}`,
    };
  },
});
