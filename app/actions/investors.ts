'use server';

/**
 * Server actions for investor CRUD operations
 * Handles validation, auth, database operations, and activity logging
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  investorCreateSchema,
  validateInvestorField,
  type InvestorCreateInput,
} from '@/lib/validations/investor-schema';
import {
  activityCreateSchema,
  type ActivityCreateInput,
} from '@/lib/validations/activity-schema';
import type { Investor, InvestorWithContacts, Activity } from '@/types/investors';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

// ============================================================================
// TYPES
// ============================================================================

interface StrategyHistoryEntry {
  id: string;
  investor_id: string;
  strategy_notes: string;
  strategy_date: string | null;
  created_at: string;
  created_by: string | null;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new investor record
 * Validates input, logs creation activity, and sets entry_date to today
 */
export async function createInvestor(formData: InvestorCreateInput): Promise<
  { data: Investor; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = investorCreateSchema.parse(formData);

    // Get authenticated user (supports E2E test mode)
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Insert investor with entry_date set to today
    const { data: investor, error: insertError } = await dbClient
      .from('investors')
      .insert({
        firm_name: validated.firm_name,
        stage: validated.stage,
        relationship_owner: validated.relationship_owner,
        entry_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !investor) {
      return { error: insertError?.message || 'Failed to create investor' };
    }

    // Log activity (use same client to bypass RLS in E2E mode)
    await dbClient.from('activities').insert({
      investor_id: investor.id,
      activity_type: 'note',
      description: 'Investor record created',
      created_by: user.id,
    });

    revalidatePath('/investors');
    return { data: investor };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create investor' };
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get a single investor with its contacts
 * Returns InvestorWithContacts including primary contact
 */
export async function getInvestor(id: string): Promise<
  { data: InvestorWithContacts; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Fetch investor
    const { data: investor, error: investorError } = await dbClient
      .from('investors')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (investorError || !investor) {
      return { error: investorError?.message || 'Investor not found' };
    }

    // Fetch associated contacts (non-deleted, ordered by is_primary DESC)
    const { data: contacts, error: contactsError } = await dbClient
      .from('contacts')
      .select('*')
      .eq('investor_id', id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (contactsError) {
      return { error: contactsError.message };
    }

    // Find primary contact
    const primary_contact = contacts?.find((c) => c.is_primary) || null;

    return {
      data: {
        ...investor,
        contacts: contacts || [],
        primary_contact,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch investor' };
  }
}

/**
 * Get all non-deleted investors with primary contact names
 * Ordered by updated_at DESC
 */
export async function getInvestors(): Promise<
  { data: InvestorWithContacts[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Fetch all non-deleted investors
    const { data: investors, error: investorsError } = await dbClient
      .from('investors')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false});

    if (investorsError) {
      return { error: investorsError.message };
    }

    // Fetch all primary contacts for these investors
    const investorIds = investors?.map(inv => inv.id) || [];
    const { data: contacts } = await dbClient
      .from('contacts')
      .select('*')
      .in('investor_id', investorIds)
      .eq('is_primary', true)
      .is('deleted_at', null);

    // Map contacts to investors
    const investorsWithContacts = investors?.map(investor => {
      const primary_contact = contacts?.find(c => c.investor_id === investor.id) || null;
      return {
        ...investor,
        contacts: primary_contact ? [primary_contact] : [],
        primary_contact,
      };
    }) || [];

    return { data: investorsWithContacts };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch investors' };
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a single field on an investor record
 * CRITICAL: Updates only the specified field to prevent race conditions
 * Does NOT call revalidatePath (inline edit should not trigger full page reload)
 */
export async function updateInvestorField(
  investorId: string,
  field: string,
  value: unknown
): Promise<
  { data: Investor; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate field and value
    const validation = validateInvestorField(field, value);
    if (!validation.success) {
      return { error: validation.error };
    }

    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get old value for activity log
    const { data: oldRecord, error: oldError } = await supabase
      .from('investors')
      .select(`${field}`)
      .eq('id', investorId)
      .single();

    if (oldError) {
      return { error: oldError.message };
    }

    const oldValue = oldRecord?.[field as keyof typeof oldRecord];

    // Update single field only (prevents race conditions)
    const { data: updatedInvestor, error: updateError } = await supabase
      .from('investors')
      .update({
        [field]: validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorId)
      .select()
      .single();

    if (updateError || !updatedInvestor) {
      return { error: updateError?.message || 'Failed to update investor' };
    }

    // Log activity
    await supabase.from('activities').insert({
      investor_id: investorId,
      activity_type: 'field_update',
      description: `Updated ${field}`,
      metadata: {
        field,
        old_value: oldValue,
        new_value: validation.data,
      },
      created_by: user.id,
    });

    // Do NOT revalidatePath here (inline edit should not trigger full page reload)
    return { data: updatedInvestor };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to update investor field' };
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Soft delete an investor (set deleted_at timestamp)
 */
export async function softDeleteInvestor(investorId: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Soft delete by setting deleted_at
    const { error: deleteError } = await supabase
      .from('investors')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // Log activity
    await supabase.from('activities').insert({
      investor_id: investorId,
      activity_type: 'note',
      description: 'Investor soft-deleted',
      created_by: user.id,
    });

    revalidatePath('/investors');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to delete investor' };
  }
}

/**
 * Restore a soft-deleted investor (clear deleted_at)
 * IMPORTANT: Uses admin client because RLS SELECT policy filters out deleted records
 */
export async function restoreInvestor(investorId: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    // Use admin client to bypass RLS SELECT filter
    const adminClient = createAdminClient();

    // Verify user is authenticated with regular client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Restore by clearing deleted_at (using admin client)
    const { error: restoreError } = await adminClient
      .from('investors')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorId);

    if (restoreError) {
      return { error: restoreError.message };
    }

    // Log activity (using regular client, now that record is restored)
    await supabase.from('activities').insert({
      investor_id: investorId,
      activity_type: 'note',
      description: 'Investor restored',
      created_by: user.id,
    });

    revalidatePath('/investors');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to restore investor' };
  }
}

// ============================================================================
// ACTIVITIES
// ============================================================================

/**
 * Get activities for an investor, ordered by created_at DESC
 * Returns last 50 activities by default
 */
export async function getActivities(
  investorId: string,
  limit: number = 50
): Promise<
  { data: Activity[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { data: activities, error } = await dbClient
      .from('activities')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: error.message };
    }

    return { data: activities || [] };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch activities' };
  }
}

/**
 * Create a new activity for an investor
 * Validates input, creates activity, updates last_action_date, and optionally sets next_action
 */
export async function createActivity(input: ActivityCreateInput): Promise<
  { data: Activity; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = activityCreateSchema.parse(input);

    // Get authenticated user (supports E2E test mode)
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Insert activity
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        investor_id: validated.investor_id,
        activity_type: validated.activity_type,
        description: validated.description,
        metadata: validated.metadata || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !activity) {
      return { error: insertError?.message || 'Failed to create activity' };
    }

    // Update investor's last_action_date to today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const investorUpdate: { last_action_date: string; next_action?: string | null; next_action_date?: string | null } = {
      last_action_date: today,
    };

    // If set_next_action is true and next_action is provided, update next action fields
    if (validated.set_next_action && validated.next_action) {
      investorUpdate.next_action = validated.next_action;
      investorUpdate.next_action_date = validated.next_action_date || null;
    }

    const { error: updateError } = await supabase
      .from('investors')
      .update(investorUpdate)
      .eq('id', validated.investor_id);

    if (updateError) {
      // Activity was created, but investor update failed - log but don't fail
      console.error('Failed to update investor after activity creation:', updateError);
    }

    // Revalidate the detail page to show new activity
    revalidatePath(`/investors/${validated.investor_id}`);

    return { data: activity };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create activity' };
  }
}

/**
 * Get strategy history for an investor, ordered by created_at DESC
 * Returns all historical strategy versions
 */
export async function getStrategyHistory(investorId: string): Promise<
  { data: StrategyHistoryEntry[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Query strategy_history table
    const { data: history, error } = await supabase
      .from('strategy_history')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: history || [] };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch strategy history' };
  }
}
