'use server';

/**
 * Server actions for saved filters
 * Handles CRUD operations for user-saved filter configurations
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

// Types
export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  entity_type: 'investor' | 'interaction' | 'task' | 'meeting';
  filter_config: any; // JSON object with filter conditions
  is_public: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedFilterInput {
  name: string;
  description?: string;
  entity_type: 'investor' | 'interaction' | 'task' | 'meeting';
  filter_config: any;
  is_public?: boolean;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Save a new filter configuration
 */
export async function createSavedFilter(input: SavedFilterInput): Promise<
  { data: SavedFilter; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { data: filter, error: insertError } = await dbClient
      .from('saved_filters')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description || null,
        entity_type: input.entity_type,
        filter_config: input.filter_config,
        is_public: input.is_public || false,
      })
      .select()
      .single();

    if (insertError || !filter) {
      console.error('Failed to save filter:', insertError);
      return { error: insertError?.message || 'Failed to save filter' };
    }

    revalidatePath('/investors');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    return { data: filter };
  } catch (error) {
    console.error('Create saved filter error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to save filter' };
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all saved filters for current user and public filters
 */
export async function getSavedFilters(entityType?: string): Promise<
  { data: SavedFilter[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    let query = dbClient
      .from('saved_filters')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    query = query.order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    const { data: filters, error } = await query;

    if (error) {
      console.error('Failed to fetch saved filters:', error);
      return { error: error.message };
    }

    return { data: filters || [] };
  } catch (error) {
    console.error('Get saved filters error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch saved filters' };
  }
}

/**
 * Get a single saved filter by ID
 */
export async function getSavedFilter(id: string): Promise<
  { data: SavedFilter; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { data: filter, error } = await dbClient
      .from('saved_filters')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single();

    if (error || !filter) {
      console.error('Failed to fetch saved filter:', error);
      return { error: error?.message || 'Filter not found' };
    }

    return { data: filter };
  } catch (error) {
    console.error('Get saved filter error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch saved filter' };
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a saved filter
 */
export async function updateSavedFilter(
  id: string,
  updates: Partial<SavedFilterInput>
): Promise<
  { data: SavedFilter; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { data: filter, error: updateError } = await dbClient
      .from('saved_filters')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Only owner can update
      .select()
      .single();

    if (updateError || !filter) {
      console.error('Failed to update saved filter:', updateError);
      return { error: updateError?.message || 'Failed to update filter' };
    }

    revalidatePath('/investors');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    return { data: filter };
  } catch (error) {
    console.error('Update saved filter error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to update filter' };
  }
}

/**
 * Track filter usage
 */
export async function trackFilterUsage(id: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Get current filter
    const { data: filter } = await dbClient
      .from('saved_filters')
      .select('use_count')
      .eq('id', id)
      .single();

    if (!filter) {
      return { error: 'Filter not found' };
    }

    // Update use count and last used timestamp
    const { error: updateError } = await dbClient
      .from('saved_filters')
      .update({
        use_count: (filter.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to track filter usage:', updateError);
      return { error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Track filter usage error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to track filter usage' };
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a saved filter
 */
export async function deleteSavedFilter(id: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { error: deleteError } = await dbClient
      .from('saved_filters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Only owner can delete

    if (deleteError) {
      console.error('Failed to delete saved filter:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/investors');
    revalidatePath('/tasks');
    revalidatePath('/meetings');
    return { success: true };
  } catch (error) {
    console.error('Delete saved filter error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to delete filter' };
  }
}
