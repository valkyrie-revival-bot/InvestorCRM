import { Page } from '@playwright/test';

/**
 * Test authentication helper
 * Sets up Supabase session cookies for E2E tests
 */

/**
 * Mock Supabase auth session
 * This creates a session-like object that the Supabase client will accept
 */
export interface MockSession {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: number;
}

/**
 * Create a mock Supabase session for testing
 * Note: This is for E2E testing only and requires proper Supabase setup
 */
export function createMockSession(): MockSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock_access_token_for_testing',
    refresh_token: 'mock_refresh_token_for_testing',
    user_id: 'test-user-id',
    expires_at: now + 3600, // 1 hour from now
  };
}

/**
 * Set up authentication cookies for Playwright tests
 * This simulates a logged-in user by setting the required Supabase cookies
 */
export async function setupAuthCookies(page: Page) {
  const session = createMockSession();

  // Supabase stores auth data in cookies
  // The cookie names follow this pattern: sb-{project-ref}-auth-token
  // We'll use a generic name that should work
  await page.context().addCookies([
    {
      name: 'sb-auth-token',
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: {
          id: session.user_id,
          email: 'test@example.com',
        },
      }),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Alternative: Use localStorage for Supabase auth
 * Some Supabase configurations store session in localStorage
 */
export async function setupAuthLocalStorage(page: Page) {
  const session = createMockSession();

  await page.addInitScript((sessionData) => {
    // Supabase stores session data in localStorage
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        currentSession: {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at,
          user: {
            id: sessionData.user_id,
            email: 'test@example.com',
          },
        },
      })
    );
  }, session);
}

/**
 * Check if user is authenticated by checking for redirects
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes('/login') && !url.includes('/auth/');
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 5000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await isAuthenticated(page)) {
      return true;
    }
    await page.waitForTimeout(100);
  }

  return false;
}
