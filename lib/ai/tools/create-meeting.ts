/**
 * Create meeting tool
 * Direct execution - logs meeting and creates activity record immediately
 * No confirmation required (safe to append meeting records)
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Create meeting tool - logs meeting directly without confirmation
 * Also creates an activity record on the investor timeline
 */
export const createMeetingTool = tool({
  description:
    'Log a meeting with an investor. Executes immediately without confirmation (meetings are append-only records). Also adds a meeting activity to the investor timeline.',
  inputSchema: z.object({
    firm_name: z.string().min(1).describe('Firm name (fuzzy match)'),
    meeting_title: z.string().min(1).describe('Title or subject of the meeting'),
    meeting_date: z
      .string()
      .describe('Meeting date as ISO 8601 string (e.g. 2026-02-21T14:00:00Z) or YYYY-MM-DD'),
    duration_minutes: z
      .number()
      .positive()
      .optional()
      .describe('Duration of the meeting in minutes'),
    notes: z.string().optional().describe('Meeting notes or agenda items'),
  }),
  execute: async ({ firm_name, meeting_title, meeting_date, duration_minutes, notes }) => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { status: 'error', message: 'Unauthorized - user not authenticated' };
    }

    // Resolve investor by firm name
    const { data: investors, error: searchError } = await supabase
      .from('investors')
      .select('id, firm_name')
      .ilike('firm_name', `%${firm_name}%`)
      .is('deleted_at', null)
      .limit(5);

    if (searchError) {
      return { status: 'error', message: `Database error: ${searchError.message}` };
    }

    if (!investors || investors.length === 0) {
      return {
        status: 'error',
        message: `No investor found matching "${firm_name}". Try a different search term.`,
      };
    }

    if (investors.length > 1) {
      return {
        status: 'clarification_needed',
        message: `Multiple investors match "${firm_name}". Please be more specific.`,
        matches: investors.map((inv) => inv.firm_name),
      };
    }

    const investor = investors[0];

    // Normalize meeting date
    const normalizedDate = meeting_date.includes('T')
      ? meeting_date
      : `${meeting_date}T00:00:00Z`;

    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        investor_id: investor.id,
        meeting_title,
        meeting_date: normalizedDate,
        duration_minutes: duration_minutes || null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (meetingError || !meeting) {
      return {
        status: 'error',
        message: `Failed to create meeting: ${meetingError?.message || 'Unknown error'}`,
      };
    }

    // Create activity record for timeline visibility
    const activityDescription = notes
      ? `Meeting: ${meeting_title} — ${notes}`
      : `Meeting: ${meeting_title}`;

    await supabase.from('activities').insert({
      investor_id: investor.id,
      activity_type: 'meeting',
      description: activityDescription,
      created_by: user.id,
      metadata: { source: 'ai_bdr_agent', meeting_id: meeting.id },
    });

    // Update last_action_date
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('investors')
      .update({ last_action_date: today })
      .eq('id', investor.id);

    const dateLabel = new Date(normalizedDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      status: 'success',
      message: `Meeting logged with ${investor.firm_name} on ${dateLabel}: "${meeting_title}"`,
      meetingId: meeting.id,
      firmName: investor.firm_name,
      meetingDate: dateLabel,
      meetingTitle: meeting_title,
    };
  },
});
