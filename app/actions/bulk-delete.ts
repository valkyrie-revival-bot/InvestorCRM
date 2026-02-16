'use server';

/**
 * Bulk delete server action
 * Alternative to API route - uses server action pattern
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function bulkDeleteInvestors(investorIds: string[]): Promise<
  { success: true; message: string; error?: never } | { success?: never; error: string; message?: never }
> {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Validate input
    if (!Array.isArray(investorIds) || investorIds.length === 0) {
      return { error: 'No investors selected' };
    }

    if (investorIds.length > 500) {
      return { error: 'Cannot delete more than 500 investors at once' };
    }

    // Use raw SQL query through RPC to bypass RLS
    const { error: deleteError } = await supabase.rpc('bulk_soft_delete_investors', {
      p_investor_ids: investorIds,
      p_user_id: user.id
    });

    if (deleteError) {
      console.error('Bulk delete error:', deleteError);
      return { error: deleteError.message };
    }

    // Revalidate the investors page
    revalidatePath('/investors');

    return {
      success: true,
      message: `Successfully deleted ${investorIds.length} investor${investorIds.length !== 1 ? 's' : ''}`,
    };
  } catch (error) {
    console.error('Bulk delete exception:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete investors' };
  }
}
