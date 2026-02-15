import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const supabase = await createClient();

    // Fetch user metrics
    const { count: totalUsers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    // Active users today (from audit logs)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: activeLogs } = await supabase
      .from('app_audit_log')
      .select('user_id')
      .gte('created_at', today.toISOString());

    const activeToday = new Set(activeLogs?.map((log) => log.user_id).filter(Boolean)).size;

    // Database metrics (mock for now - would need direct pg access for real metrics)
    const databaseMetrics = {
      size: '125 MB',
      connectionPoolSize: 20,
      activeConnections: 5,
    };

    // API metrics (from audit logs - simplified)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentLogs } = await supabase
      .from('app_audit_log')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString());

    const requestsLastHour = recentLogs?.length || 0;
    const errorsLastHour = 0; // Would need error tracking

    // Integration status checks
    let supabaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      const { error } = await supabase.from('user_roles').select('id').limit(1);
      if (error) supabaseStatus = 'degraded';
    } catch {
      supabaseStatus = 'down';
    }

    let googleStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      googleStatus = 'degraded';
    }

    const metrics = {
      users: {
        total: totalUsers || 0,
        activeToday,
      },
      database: databaseMetrics,
      api: {
        requestsLastHour,
        errorsLastHour,
        avgResponseTime: 150, // Mock value
      },
      integrations: {
        supabase: supabaseStatus,
        google: googleStatus,
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in GET /api/admin/health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
