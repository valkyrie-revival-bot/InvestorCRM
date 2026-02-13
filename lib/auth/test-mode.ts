/**
 * E2E Test Mode helpers for bypassing authentication in tests
 */

import type { User } from '@supabase/supabase-js';

/**
 * Check if we're running in E2E test mode
 */
export function isE2ETestMode(): boolean {
  return process.env.E2E_TEST_MODE === 'true';
}

/**
 * Get a mock user for E2E tests
 */
export function getMockTestUser(): User {
  return {
    id: 'a4e7b6a9-b37d-48f2-9d0c-4a89b98f90aa',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'playwright-test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { email_verified: true },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Auth check wrapper that bypasses in E2E test mode
 * Use this in server actions instead of direct supabase.auth.getUser()
 */
export async function getAuthenticatedUser(
  supabase: any
): Promise<{ user: User | null; error: any }> {
  // In E2E test mode, return mock user
  if (isE2ETestMode()) {
    return { user: getMockTestUser(), error: null };
  }

  // Normal flow: check actual auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}
