import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheckResult {
  name: string;
  status: 'ok' | 'error';
  message?: string;
  latency?: number;
}

/**
 * Health check endpoint
 * Checks database connection, auth service, and returns overall system status
 *
 * GET /api/health
 * Returns: { status: "ok" | "error", checks: {...}, timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, HealthCheckResult> = {};

  // Check database connection
  try {
    const dbStartTime = Date.now();
    const supabase = await getSupabaseClient();

    // Simple query to test database connectivity
    const { error } = await supabase.from('investors').select('id').limit(1);

    const dbLatency = Date.now() - dbStartTime;

    if (error) {
      checks.database = {
        name: 'Database',
        status: 'error',
        message: error.message,
        latency: dbLatency,
      };
    } else {
      checks.database = {
        name: 'Database',
        status: 'ok',
        latency: dbLatency,
      };
    }
  } catch (error) {
    checks.database = {
      name: 'Database',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check auth service
  try {
    const authStartTime = Date.now();
    const supabase = await getSupabaseClient();

    // Check if we can get session info (tests auth service)
    const { error } = await supabase.auth.getSession();

    const authLatency = Date.now() - authStartTime;

    if (error) {
      checks.auth = {
        name: 'Auth Service',
        status: 'error',
        message: error.message,
        latency: authLatency,
      };
    } else {
      checks.auth = {
        name: 'Auth Service',
        status: 'ok',
        latency: authLatency,
      };
    }
  } catch (error) {
    checks.auth = {
      name: 'Auth Service',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every((check) => check.status === 'ok');
  const overallStatus = allHealthy ? 'ok' : 'error';

  const totalLatency = Date.now() - startTime;

  const response = {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    latency: totalLatency,
  };

  // Log health check result
  if (overallStatus === 'error') {
    log.error('Health check failed', response);
  } else {
    log.debug('Health check passed', { latency: totalLatency });
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
