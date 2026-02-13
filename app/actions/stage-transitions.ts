'use server';

/**
 * Server actions for stage transition validation and execution
 * Handles all stage changes (kanban drag-and-drop and UI-driven transitions)
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  isValidTransition,
  getExitCriteria,
  isTerminalStage,
  type ExitCriterion,
} from '@/lib/stage-definitions';
import type { Investor, InvestorStage } from '@/types/investors';

/**
 * Update an investor's stage with validation and exit criteria checking
 *
 * @param investorId - Investor ID to update
 * @param newStage - Target stage
 * @param options - Optional validation bypass settings
 * @returns Success with updated investor OR error with validation details
 */
export async function updateInvestorStage(
  investorId: string,
  newStage: string,
  options?: {
    checklistConfirmed?: boolean; // User confirmed exit checklist items
    overrideReason?: string; // User provided override reason
  }
): Promise<
  | { success: true; data: Investor }
  | {
      success: false;
      error: string;
      validationRequired?: true;
      exitCriteria?: ExitCriterion[];
      fromStage?: string;
      toStage?: string;
    }
> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Fetch current investor record
    const { data: investor, error: fetchError } = await supabase
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !investor) {
      return {
        success: false,
        error: fetchError?.message || 'Investor not found',
      };
    }

    const fromStage = investor.stage as InvestorStage;

    // 3. No-op if stage unchanged
    if (fromStage === newStage) {
      return { success: true, data: investor };
    }

    // 4. Transition validation
    if (!isValidTransition(fromStage, newStage as InvestorStage)) {
      return {
        success: false,
        error: `Invalid stage transition from ${fromStage} to ${newStage}`,
      };
    }

    // 5. Exit criteria check
    const exitCriteria = getExitCriteria(fromStage);
    const hasExitCriteria = exitCriteria.length > 0;
    const hasChecklistConfirmed = options?.checklistConfirmed === true;
    const hasOverrideReason =
      options?.overrideReason && options.overrideReason.length >= 10;

    // If criteria exist AND user hasn't confirmed AND hasn't overridden, require validation
    if (hasExitCriteria && !hasChecklistConfirmed && !hasOverrideReason) {
      return {
        success: false,
        error: 'Exit criteria not met',
        validationRequired: true,
        exitCriteria,
        fromStage,
        toStage: newStage,
      };
    }

    // 6. Perform update
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: updatedInvestor, error: updateError } = await supabase
      .from('investors')
      .update({
        stage: newStage,
        last_action_date: today, // Update last action date
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorId)
      .select()
      .single();

    if (updateError || !updatedInvestor) {
      return {
        success: false,
        error: updateError?.message || 'Failed to update stage',
      };
    }

    // 7. Log activity
    let activityDescription = '';
    let activityMetadata: Record<string, unknown> = {
      from_stage: fromStage,
      to_stage: newStage,
    };

    if (hasOverrideReason) {
      // Override case
      activityDescription = `Stage changed from ${fromStage} to ${newStage} (OVERRIDE)`;
      activityMetadata = {
        ...activityMetadata,
        override_reason: options.overrideReason,
        overridden_by: user.id,
      };
    } else if (hasChecklistConfirmed) {
      // Normal case with checklist
      activityDescription = `Stage changed from ${fromStage} to ${newStage}`;
      activityMetadata = {
        ...activityMetadata,
        checklist_confirmed: true,
      };
    } else {
      // No criteria needed (terminal -> active, or stage has no exit criteria)
      activityDescription = `Stage changed from ${fromStage} to ${newStage}`;
    }

    await supabase.from('activities').insert({
      investor_id: investorId,
      activity_type: 'stage_change',
      description: activityDescription,
      metadata: activityMetadata,
      created_by: user.id,
    });

    // 8. Revalidate paths
    revalidatePath('/investors');
    revalidatePath(`/investors/${investorId}`);

    // 9. Return success
    return { success: true, data: updatedInvestor };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update stage' };
  }
}
