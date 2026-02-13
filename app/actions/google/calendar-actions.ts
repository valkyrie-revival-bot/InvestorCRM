'use server';

/**
 * Google Calendar server actions
 * Schedule meetings, link events to investors, retrieve calendar events
 */

import { google } from 'googleapis';
import { revalidatePath } from 'next/cache';
import { createGoogleClient } from '@/lib/google/client';
import { withRetry } from '@/lib/google/retry';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import type { CalendarEvent, CalendarEventInsert } from '@/types/google';

// ============================================================================
// SCHEDULE MEETING
// ============================================================================

export interface ScheduleMeetingParams {
  investorId: string;
  summary: string;
  description?: string;
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
  attendees?: string[]; // Email addresses
  timezone?: string;
}

export interface ScheduleMeetingResult {
  success?: boolean;
  eventUrl?: string;
  error?: string;
}

/**
 * Schedule a Google Calendar meeting linked to an investor
 * Creates Calendar event and logs activity
 *
 * @param params - Meeting details
 * @returns Success status with event URL or error
 */
export async function scheduleInvestorMeeting(
  params: ScheduleMeetingParams
): Promise<ScheduleMeetingResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Create authenticated Google client
    const oauth2Client = await createGoogleClient(user.id);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Default timezone if not provided
    const timezone = params.timezone || 'America/New_York';

    // Create calendar event
    const eventResponse = await withRetry(() =>
      calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: params.summary,
          description: params.description || undefined,
          start: {
            dateTime: params.startTime,
            timeZone: timezone,
          },
          end: {
            dateTime: params.endTime,
            timeZone: timezone,
          },
          attendees: params.attendees
            ? params.attendees.map((email) => ({ email }))
            : undefined,
          reminders: {
            useDefault: true,
          },
        },
      })
    );

    const event = eventResponse.data;

    if (!event.id) {
      return { error: 'Failed to create calendar event' };
    }

    // Store in calendar_events table
    const supabase = await createClient();

    const calendarEventData: CalendarEventInsert = {
      investor_id: params.investorId,
      event_id: event.id,
      summary: params.summary,
      description: params.description || null,
      start_time: params.startTime,
      end_time: params.endTime,
      event_url: event.htmlLink || null,
      attendees: params.attendees || null,
      created_by: user.id,
    };

    const { error: dbError } = await supabase
      .from('calendar_events')
      .insert(calendarEventData);

    if (dbError) {
      console.error('Failed to store calendar event:', dbError);
      // Event was created in Google Calendar, just log the error
    }

    // Log activity to investor timeline
    const { error: activityError } = await supabase.from('activities').insert({
      investor_id: params.investorId,
      activity_type: 'meeting',
      description: `Scheduled: ${params.summary}`,
      metadata: {
        event_id: event.id,
        start_time: params.startTime,
        end_time: params.endTime,
        attendees: params.attendees || null,
        event_url: event.htmlLink || null,
      },
      created_by: user.id,
    });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the whole operation if activity logging fails
    }

    // Revalidate investor page
    revalidatePath(`/investors/${params.investorId}`);

    return {
      success: true,
      eventUrl: event.htmlLink || undefined,
    };
  } catch (error: any) {
    console.error('Schedule meeting error:', error);

    // Handle authentication errors
    if (
      error?.message?.includes('invalid_grant') ||
      error?.message?.includes('User has not authorized')
    ) {
      return { error: 'google_auth_required' };
    }

    return { error: error?.message || 'Failed to schedule meeting' };
  }
}

// ============================================================================
// GET CALENDAR EVENTS
// ============================================================================

export interface GetCalendarEventsResult {
  data?: CalendarEvent[];
  error?: string;
}

/**
 * Get all calendar events for an investor
 *
 * @param investorId - Investor UUID
 * @returns Array of calendar events or error
 */
export async function getCalendarEvents(
  investorId: string
): Promise<GetCalendarEventsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('investor_id', investorId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Failed to fetch calendar events:', error);
      return { error: 'Failed to fetch calendar events' };
    }

    return { data: data as CalendarEvent[] };
  } catch (error: any) {
    console.error('Get calendar events error:', error);
    return { error: error?.message || 'Failed to fetch calendar events' };
  }
}
