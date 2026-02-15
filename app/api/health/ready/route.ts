import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Kubernetes readiness probe endpoint
 * Returns 200 if the application is ready to serve traffic
 * Returns 503 if the application is not ready
 *
 * GET /api/health/ready
 * Returns: { ready: boolean, timestamp: string }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();

    // Test critical dependencies
    const { error } = await supabase.from('investors').select('id').limit(1);

    if (error) {
      log.warn('Readiness check failed', { error: error.message });
      return NextResponse.json(
        {
          ready: false,
          reason: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ready: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    log.error('Readiness check error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ready: false,
        reason: 'Internal error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
