import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('app_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by event type if provided
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
