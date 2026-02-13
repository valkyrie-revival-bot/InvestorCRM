/**
 * Strategy advisor tool
 * Provides strategic context to help Claude reason about investor relationships
 * Does NOT generate recommendations - provides data for the LLM to analyze
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { computeIsStalled } from '@/lib/stage-definitions';

/**
 * Request types for strategy context
 */
const requestTypes = [
  'next_steps',
  'risk_assessment',
  'prioritization',
  'objection_handling',
] as const;

/**
 * Strategy advisor tool
 * Fetches comprehensive context for strategic analysis
 * The tool returns data, Claude provides the insights
 */
export const strategyAdvisorTool = tool({
  description: `Get strategic context for an investor relationship to help analyze next steps, assess risks, prioritize actions, or address objections.
Provide the investor's UUID and the type of strategic question.`,
  inputSchema: z.object({
    investorId: z.string().uuid().describe('The investor UUID'),
    requestType: z
      .enum(requestTypes)
      .describe('Type of strategic analysis needed'),
  }),
  execute: async ({ investorId, requestType }) => {
    const supabase = await createClient();

    // Fetch investor data
    const { data: investor, error: investorError } = await supabase
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .is('deleted_at', null)
      .single();

    if (investorError || !investor) {
      throw new Error(
        `Investor not found: ${investorError?.message || 'No investor with this ID'}`
      );
    }

    // Fetch recent activities (last 5)
    const { data: activities } = await supabase
      .from('activities')
      .select('activity_type, description, created_at')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Compute derived metrics
    const isStalled = computeIsStalled(investor.last_action_date, investor.stage as any);

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

    // Build strategic context based on request type
    const baseContext = {
      firm_name: investor.firm_name,
      relationship_owner: investor.relationship_owner,
      stage: investor.stage,
      days_in_stage: daysInStage,
      stalled: isStalled,
      days_since_action: daysSinceAction,
      est_value: investor.est_value,
      allocator_type: investor.allocator_type,
      internal_conviction: investor.internal_conviction,
      internal_priority: investor.internal_priority,
    };

    const strategyContext = {
      current_strategy_notes: investor.current_strategy_notes,
      current_strategy_date: investor.current_strategy_date,
      last_strategy_notes: investor.last_strategy_notes,
      last_strategy_date: investor.last_strategy_date,
      key_objection_risk: investor.key_objection_risk,
    };

    const actionContext = {
      next_action: investor.next_action,
      next_action_date: investor.next_action_date,
      recent_activities: activities?.map(act => ({
        type: act.activity_type,
        description: act.description,
        date: act.created_at,
      })) || [],
    };

    // Return contextual data for Claude to analyze
    return {
      request_type: requestType,
      investor: baseContext,
      strategy: strategyContext,
      actions: actionContext,
      analysis_guidance: getAnalysisGuidance(requestType),
    };
  },
});

/**
 * Provide guidance to Claude on what to focus on for each request type
 * This helps structure the LLM's reasoning
 */
function getAnalysisGuidance(requestType: typeof requestTypes[number]): string {
  switch (requestType) {
    case 'next_steps':
      return 'Analyze current stage, recent activities, and strategy notes to recommend concrete next steps. Consider timeline, relationship momentum, and stage exit criteria.';

    case 'risk_assessment':
      return 'Evaluate key objections/risks, days since last action, conviction level, and stalled status. Identify red flags and mitigation strategies.';

    case 'prioritization':
      return 'Consider est_value, internal_conviction, internal_priority, stage proximity to close, and relationship momentum. Recommend priority level with rationale.';

    case 'objection_handling':
      return 'Analyze key_objection_risk field and strategy notes. Suggest approaches to address concerns and advance the relationship.';

    default:
      return 'Analyze the provided context and offer strategic insights.';
  }
}
