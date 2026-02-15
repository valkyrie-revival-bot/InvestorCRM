'use server';

/**
 * Server actions for meeting intelligence
 * Handles creating meetings, storing recordings, and retrieving intelligence data
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import type {
  Meeting,
  MeetingWithDetails,
  MeetingCreateInput,
  MeetingStats,
} from '@/types/meetings';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new meeting record
 */
export async function createMeeting(input: MeetingCreateInput): Promise<
  { data: Meeting; error?: never } | { data?: never; error: string }
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

    // Insert meeting
    const { data: meeting, error: insertError } = await dbClient
      .from('meetings')
      .insert({
        investor_id: input.investor_id,
        calendar_event_id: input.calendar_event_id || null,
        meeting_title: input.meeting_title,
        meeting_date: input.meeting_date,
        duration_minutes: input.duration_minutes || null,
        recording_filename: input.recording_filename || null,
        recording_mime_type: input.recording_mime_type || null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !meeting) {
      console.error('Failed to create meeting:', insertError);
      return { error: insertError?.message || 'Failed to create meeting' };
    }

    revalidatePath(`/investors/${input.investor_id}`);
    revalidatePath('/meetings');
    return { data: meeting };
  } catch (error) {
    console.error('Create meeting error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create meeting' };
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all meetings with optional filtering and pagination
 */
export async function getMeetings(filters?: {
  investor_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<
  { data: MeetingWithDetails[]; error?: never } | { data?: never; error: string }
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

    // Build query - select only needed fields
    let query = dbClient
      .from('meetings')
      .select(`
        id,
        investor_id,
        calendar_event_id,
        meeting_title,
        meeting_date,
        duration_minutes,
        recording_url,
        recording_filename,
        status,
        created_by,
        created_at,
        processed_at,
        transcript:meeting_transcripts(
          id,
          summary,
          key_topics,
          sentiment,
          action_items,
          objections
        ),
        investor:investors (
          firm_name,
          stage
        )
      `);

    // Apply filters
    if (filters?.investor_id) {
      query = query.eq('investor_id', filters.investor_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Order by meeting date (most recent first)
    query = query.order('meeting_date', { ascending: false });

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Failed to fetch meetings:', error);
      return { error: error.message };
    }

    // Transform nested transcript array to single object
    const transformedMeetings = (meetings || []).map((meeting: any) => ({
      ...meeting,
      transcript: meeting.transcript?.[0] || null,
    }));

    return { data: transformedMeetings };
  } catch (error) {
    console.error('Get meetings error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch meetings' };
  }
}

/**
 * Get a single meeting by ID with full details
 */
export async function getMeeting(id: string): Promise<
  { data: MeetingWithDetails; error?: never } | { data?: never; error: string }
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

    const { data: meeting, error } = await dbClient
      .from('meetings')
      .select(`
        *,
        transcript:meeting_transcripts(*),
        investor:investors (
          firm_name,
          stage
        )
      `)
      .eq('id', id)
      .single();

    if (error || !meeting) {
      console.error('Failed to fetch meeting:', error);
      return { error: error?.message || 'Meeting not found' };
    }

    // Transform nested transcript array to single object
    const transformedMeeting = {
      ...meeting,
      transcript: meeting.transcript?.[0] || null,
    };

    return { data: transformedMeeting };
  } catch (error) {
    console.error('Get meeting error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch meeting' };
  }
}

/**
 * Get meeting statistics (cached for 5 minutes)
 */
export async function getMeetingStats(): Promise<
  { data: MeetingStats; error?: never } | { data?: never; error: string }
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

    // Use cached version if available (TTL: 5 minutes)
    const { cached, CacheKeys } = await import('@/lib/cache');

    const stats = await cached(
      CacheKeys.meetingStats(),
      async () => {
        // Get all meetings (select only needed fields)
        const { data: meetings, error } = await dbClient
          .from('meetings')
          .select('status, meeting_date, duration_minutes');

        if (error) {
          throw new Error(error.message);
        }

        // Calculate stats
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return {
          total: meetings.length,
          pending: meetings.filter(m => m.status === 'pending').length,
          processing: meetings.filter(m => m.status === 'processing').length,
          completed: meetings.filter(m => m.status === 'completed').length,
          failed: meetings.filter(m => m.status === 'failed').length,
          this_month: meetings.filter(
            m => new Date(m.meeting_date) >= firstOfMonth
          ).length,
          avg_duration_minutes:
            meetings.length > 0
              ? Math.round(
                  meetings
                    .filter(m => m.duration_minutes !== null)
                    .reduce((sum, m) => sum + (m.duration_minutes || 0), 0) /
                    meetings.filter(m => m.duration_minutes !== null).length
                )
              : null,
        };
      },
      300 // 5 minutes
    );

    return { data: stats };
  } catch (error) {
    console.error('Get meeting stats error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch meeting stats' };
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update meeting status
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: string,
  processingError?: string
): Promise<
  { data: Meeting; error?: never } | { data?: never; error: string }
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

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString();
    }

    if (processingError) {
      updateData.processing_error = processingError;
    }

    const { data: meeting, error: updateError } = await dbClient
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId)
      .select()
      .single();

    if (updateError || !meeting) {
      console.error('Failed to update meeting:', updateError);
      return { error: updateError?.message || 'Failed to update meeting' };
    }

    revalidatePath(`/investors/${meeting.investor_id}`);
    revalidatePath('/meetings');
    return { data: meeting };
  } catch (error) {
    console.error('Update meeting status error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to update meeting status' };
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a meeting (hard delete)
 */
export async function deleteMeeting(id: string): Promise<
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

    // Get investor_id before deleting (for revalidation)
    const { data: meeting } = await dbClient
      .from('meetings')
      .select('investor_id')
      .eq('id', id)
      .single();

    const { error: deleteError } = await dbClient
      .from('meetings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete meeting:', deleteError);
      return { error: deleteError.message };
    }

    revalidatePath('/meetings');
    if (meeting) {
      revalidatePath(`/investors/${meeting.investor_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete meeting error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to delete meeting' };
  }
}
