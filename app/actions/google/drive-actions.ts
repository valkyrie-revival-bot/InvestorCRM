'use server';

/**
 * Google Drive server actions
 * Operations for linking/unlinking Drive files to investor records
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import { DriveLink } from '@/types/google';

/**
 * Link a Google Drive file to an investor record
 * Creates drive_links entry and logs activity to timeline
 */
export async function linkDriveFileToInvestor(params: {
  investorId: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  thumbnailUrl?: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Insert into drive_links table
    const { error: linkError } = await supabase
      .from('drive_links')
      .insert({
        investor_id: params.investorId,
        file_id: params.fileId,
        file_name: params.fileName,
        file_url: params.fileUrl,
        mime_type: params.mimeType,
        thumbnail_url: params.thumbnailUrl ?? null,
        linked_by: user.id,
      });

    if (linkError) {
      console.error('Failed to insert drive link:', linkError);
      throw linkError;
    }

    // Log activity to timeline
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        investor_id: params.investorId,
        activity_type: 'note',
        description: `Linked document: ${params.fileName}`,
        metadata: {
          type: 'drive_link',
          file_id: params.fileId,
          file_url: params.fileUrl,
          mime_type: params.mimeType,
        },
        created_by: user.id,
      });

    if (activityError) {
      console.error('Failed to log activity for drive link:', activityError);
      throw activityError;
    }

    // Revalidate investor detail page
    revalidatePath(`/investors/${params.investorId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error linking Drive file:', error);
    return { error: error.message || 'Failed to link Drive file' };
  }
}

/**
 * Unlink a Google Drive file from an investor record
 * Deletes drive_links entry and logs activity to timeline
 */
export async function unlinkDriveFile(params: {
  linkId: string;
  investorId: string;
  fileName: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Delete from drive_links table
    const { error: deleteError } = await supabase
      .from('drive_links')
      .delete()
      .eq('id', params.linkId);

    if (deleteError) {
      console.error('Failed to delete drive link:', deleteError);
      throw deleteError;
    }

    // Log activity to timeline
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        investor_id: params.investorId,
        activity_type: 'note',
        description: `Unlinked document: ${params.fileName}`,
        metadata: {
          type: 'drive_unlink',
        },
        created_by: user.id,
      });

    if (activityError) {
      console.error('Failed to log activity for drive unlink:', activityError);
      throw activityError;
    }

    // Revalidate investor detail page
    revalidatePath(`/investors/${params.investorId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error unlinking Drive file:', error);
    return { error: error.message || 'Failed to unlink Drive file' };
  }
}

/**
 * Get all Drive file links for an investor
 * Returns links ordered by creation date (newest first)
 */
export async function getDriveLinks(
  investorId: string
): Promise<{ data: DriveLink[] } | { error: string }> {
  try {
    const supabase = await createClient();
    const { createAdminClient } = await import('@/lib/supabase/server');
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Fetch all drive links for investor
    const { data, error } = await dbClient
      .from('drive_links')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch drive links:', error);
      throw error;
    }

    return { data: data as DriveLink[] };
  } catch (error: any) {
    console.error('Error fetching Drive links:', error);
    return { error: error.message || 'Failed to fetch Drive links' };
  }
}
