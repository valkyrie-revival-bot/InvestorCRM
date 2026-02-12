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
import type { Investor, InvestorWithContacts } from '@/types/investors';

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

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Insert investor with entry_date set to today
    const { data: investor, error: insertError } = await supabase
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

    // Log activity
    await supabase.from('activities').insert({
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

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Fetch investor
    const { data: investor, error: investorError } = await supabase
      .from('investors')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (investorError || !investor) {
      return { error: investorError?.message || 'Investor not found' };
    }

    // Fetch associated contacts (non-deleted, ordered by is_primary DESC)
    const { data: contacts, error: contactsError } = await supabase
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
 * Get all non-deleted investors
 * Ordered by updated_at DESC
 */
export async function getInvestors(): Promise<
  { data: Investor[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Fetch all non-deleted investors
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (investorsError) {
      return { error: investorsError.message };
    }

    return { data: investors || [] };
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

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
