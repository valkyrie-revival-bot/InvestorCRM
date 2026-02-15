/**
 * Data export API endpoint
 * Supports streaming CSV and Excel exports for investors, activities, tasks, and meetings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase/dynamic';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import {
  exportInvestorsToCSV,
  exportInvestorsToExcel,
} from '@/lib/export/investors-exporter';
import {
  exportActivitiesToCSV,
  exportActivitiesToExcel,
  type ActivityWithInvestor,
} from '@/lib/export/activities-exporter';
import {
  exportTasksToCSV,
  exportTasksToExcel,
} from '@/lib/export/tasks-exporter';
import {
  exportMeetingsToCSV,
  exportMeetingsToExcel,
} from '@/lib/export/meetings-exporter';

type ExportType = 'investors' | 'activities' | 'tasks' | 'meetings';
type ExportFormat = 'csv' | 'excel';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const params = await context.params;
    const type = params.type as ExportType;
    const { searchParams } = new URL(request.url);

    // Get format (default: csv)
    const format = (searchParams.get('format') || 'csv') as ExportFormat;

    // Auth check
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client in E2E test mode
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await getSupabaseAdminClient() : supabase;

    // Parse filters from query params
    const filters: Record<string, any> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'format') {
        filters[key] = value;
      }
    }

    // Export based on type
    switch (type) {
      case 'investors':
        return await exportInvestors(dbClient, format, filters);

      case 'activities':
        return await exportActivities(dbClient, format, filters);

      case 'tasks':
        return await exportTasks(dbClient, format, filters);

      case 'meetings':
        return await exportMeetings(dbClient, format, filters);

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Export investors
 */
async function exportInvestors(
  dbClient: any,
  format: ExportFormat,
  filters: Record<string, any>
) {
  // Build query
  let query = dbClient
    .from('investors')
    .select('*, contacts!inner(*)')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  // Apply filters
  if (filters.stage) {
    query = query.eq('stage', filters.stage);
  }
  if (filters.relationship_owner) {
    query = query.eq('relationship_owner', filters.relationship_owner);
  }
  if (filters.allocator_type) {
    query = query.eq('allocator_type', filters.allocator_type);
  }
  if (filters.stalled === 'true') {
    query = query.eq('stalled', true);
  }
  if (filters.date_from) {
    query = query.gte('entry_date', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('entry_date', filters.date_to);
  }

  const { data: investors, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch investors: ${error.message}`);
  }

  // Transform data to include primary contact
  const investorsWithContacts = investors.map((inv: any) => {
    const contacts = Array.isArray(inv.contacts) ? inv.contacts : [];
    const primary_contact = contacts.find((c: any) => c.is_primary) || null;
    return {
      ...inv,
      contacts,
      primary_contact,
    };
  });

  // Generate export
  if (format === 'csv') {
    const csv = exportInvestorsToCSV(investorsWithContacts, filters);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="investors_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } else {
    const buffer = await exportInvestorsToExcel(investorsWithContacts, filters);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="investors_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }
}

/**
 * Export activities
 */
async function exportActivities(
  dbClient: any,
  format: ExportFormat,
  filters: Record<string, any>
) {
  // Build query
  let query = dbClient
    .from('activities')
    .select(`
      *,
      investor:investors!inner(firm_name)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.investor_id) {
    query = query.eq('investor_id', filters.investor_id);
  }
  if (filters.activity_type) {
    query = query.eq('activity_type', filters.activity_type);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // Limit to reasonable number for export
  const limit = parseInt(filters.limit || '10000');
  query = query.limit(limit);

  const { data: activities, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  // Transform data
  const activitiesWithInvestor: ActivityWithInvestor[] = activities.map((act: any) => ({
    ...act,
    investor_firm_name: act.investor?.firm_name || '',
  }));

  // Generate export
  if (format === 'csv') {
    const csv = exportActivitiesToCSV(activitiesWithInvestor, filters);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activities_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } else {
    const buffer = await exportActivitiesToExcel(activitiesWithInvestor, filters);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="activities_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }
}

/**
 * Export tasks
 */
async function exportTasks(
  dbClient: any,
  format: ExportFormat,
  filters: Record<string, any>
) {
  // Build query
  let query = dbClient
    .from('tasks')
    .select(`
      *,
      investor:investors!inner(firm_name, stage)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false });

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }
  if (filters.investor_id) {
    query = query.eq('investor_id', filters.investor_id);
  }

  // Handle date-based filters
  const today = new Date().toISOString().split('T')[0];
  if (filters.overdue === 'true') {
    query = query.lt('due_date', today).eq('status', 'pending');
  }
  if (filters.due_soon === 'true') {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    query = query
      .gte('due_date', today)
      .lte('due_date', weekFromNow.toISOString().split('T')[0])
      .eq('status', 'pending');
  }

  const { data: tasks, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  // Generate export
  if (format === 'csv') {
    const csv = exportTasksToCSV(tasks, filters);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tasks_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } else {
    const buffer = await exportTasksToExcel(tasks, filters);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="tasks_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }
}

/**
 * Export meetings
 */
async function exportMeetings(
  dbClient: any,
  format: ExportFormat,
  filters: Record<string, any>
) {
  // Build query
  let query = dbClient
    .from('meetings')
    .select(`
      *,
      transcript:meeting_transcripts(*),
      investor:investors!inner(firm_name, stage)
    `)
    .order('meeting_date', { ascending: false });

  // Apply filters
  if (filters.investor_id) {
    query = query.eq('investor_id', filters.investor_id);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.date_from) {
    query = query.gte('meeting_date', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('meeting_date', filters.date_to);
  }

  const { data: meetings, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch meetings: ${error.message}`);
  }

  // Transform nested transcript array to single object
  const transformedMeetings = meetings.map((meeting: any) => ({
    ...meeting,
    transcript: meeting.transcript?.[0] || null,
  }));

  // Generate export
  if (format === 'csv') {
    const csv = exportMeetingsToCSV(transformedMeetings, filters);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="meetings_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } else {
    const buffer = await exportMeetingsToExcel(transformedMeetings, filters);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="meetings_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  }
}
