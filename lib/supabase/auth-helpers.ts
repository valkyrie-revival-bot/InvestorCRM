import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/lib/supabase/server';
import { AppRole, JWTPayload } from '@/types/auth';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

/**
 * Get current authenticated user
 * Supports E2E test mode
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);

  return user;
}

/**
 * Get current user's role from JWT
 * @returns AppRole or null if not authenticated
 */
export async function getCurrentRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  try {
    const payload = jwtDecode<JWTPayload>(session.access_token);
    return payload.user_role ?? 'member';
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return 'member';
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * @returns User object (guaranteed non-null)
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Require admin role - redirect to dashboard if not admin
 * @returns User object (guaranteed non-null and admin)
 */
export async function requireAdmin() {
  const user = await requireAuth();

  // In E2E test mode, bypass admin check
  if (process.env.E2E_TEST_MODE === 'true') {
    return user;
  }

  const role = await getCurrentRole();

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return user;
}

/**
 * Log an audit event to app_audit_log table
 * Automatically fills user_id and user_email from current session
 */
export async function logAuditEvent(params: {
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { error } = await supabase.from('app_audit_log').insert({
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    event_type: params.eventType,
    resource_type: params.resourceType ?? null,
    resource_id: params.resourceId ?? null,
    action: params.action,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
    metadata: params.metadata ?? null,
    ip_address: null, // Could be populated from headers in API routes
    user_agent: null, // Could be populated from headers in API routes
  });

  if (error) {
    console.error('Failed to log audit event:', error);
  }
}
