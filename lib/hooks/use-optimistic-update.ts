'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Investor } from '@/types/investors';
import type { OptimisticUpdateResult } from '@/types/realtime';

interface UseOptimisticUpdateReturn {
  updateInvestor: (
    investorId: string,
    currentVersion: number,
    field: string,
    value: unknown
  ) => Promise<OptimisticUpdateResult<Investor>>;
  isUpdating: boolean;
}

/**
 * Optimistic update hook with version-based conflict detection
 * Updates investor field with version check to detect concurrent edits
 *
 * Uses Supabase browser client directly for atomic version-checked updates.
 * RLS policies protect the update, and version check happens at database level.
 *
 * @returns updateInvestor function and isUpdating state
 */
export function useOptimisticUpdate(): UseOptimisticUpdateReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  /**
   * Update investor field with version check
   *
   * @param investorId - Investor UUID
   * @param currentVersion - Current version number from local state
   * @param field - Field name to update
   * @param value - New value for the field
   * @returns OptimisticUpdateResult with success/conflict status
   */
  const updateInvestor = async (
    investorId: string,
    currentVersion: number,
    field: string,
    value: unknown
  ): Promise<OptimisticUpdateResult<Investor>> => {
    setIsUpdating(true);

    try {
      console.log('[useOptimisticUpdate] Updating investor:', {
        investorId,
        currentVersion,
        field,
        value,
      });

      const { data, error } = await supabase
        .from('investors')
        .update({
          [field]: value,
          version: currentVersion + 1, // Increment version
          updated_at: new Date().toISOString(),
        })
        .eq('id', investorId)
        .eq('version', currentVersion) // Critical: check current version for conflict detection
        .select()
        .single();

      if (error) {
        console.error('[useOptimisticUpdate] Update error:', error);
        return {
          success: false,
          conflict: false,
          error: error.message,
        };
      }

      if (!data) {
        // No rows updated = version mismatch (another user edited)
        console.warn('[useOptimisticUpdate] Version conflict detected');
        return {
          success: false,
          conflict: true,
          error: 'This record was modified by another user. Please refresh and try again.',
        };
      }

      console.log('[useOptimisticUpdate] Update succeeded:', data);
      return {
        success: true,
        conflict: false,
        data,
      };
    } catch (err) {
      console.error('[useOptimisticUpdate] Unexpected error:', err);
      return {
        success: false,
        conflict: false,
        error: err instanceof Error ? err.message : 'Update failed',
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateInvestor,
    isUpdating,
  };
}
