import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Programmatic auth setup for Playwright tests
 * Uses Supabase client directly to set auth cookies
 */

setup('authenticate via API', async ({ page, context }) => {
  console.log('Setting up authentication...');

  // Navigate to a page first to establish context
  await page.goto('http://localhost:3003/login');
  await page.waitForLoadState('networkidle');

  // Inject Supabase auth tokens directly via page script
  // This simulates what happens after a successful login
  await page.evaluate(() => {
    const supabaseUrl = 'https://yafhsopwagozbymqyhhs.supabase.co';
    const projectRef = 'yafhsopwagozbymqyhhs';
    const accessToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ijk1OWM5YTE2LTMwYmEtNDI0OC05YTc3LWJmNzg3NTFlZWQxNCIsInR5cCI6IkpXVCJ9.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MDk2MDMxMn1dLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwiYXVkIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoicGxheXdyaWdodC10ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzcwOTYzOTEyLCJpYXQiOjE3NzA5NjAzMTIsImlzX2Fub255bW91cyI6ZmFsc2UsImlzcyI6Imh0dHBzOi8veWFmaHNvcHdhZ296YnltcXloaHMuc3VwYWJhc2UuY28vYXV0aC92MSIsInBob25lIjoiIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzZXNzaW9uX2lkIjoiY2EyY2IwODgtNWMxOC00YmJmLWFhOTYtZGQ3NzY4MzA2NmQ4Iiwic3ViIjoiYTRlN2I2YTktYjM3ZC00OGYyLTlkMGMtNGE4OWI5OGY5MGFhIiwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInVzZXJfcm9sZSI6Im1lbWJlciJ9.9S0cFs27OU_xfizHt5wdCYHymR9qXEsFG78YzhMlv2qK5Tsdb8YxPm77x9JyzfZ0D5UZq4xqxacJqNzfLkZVFg';
    const refreshToken = 'vteszc636oo6';

    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'a4e7b6a9-b37d-48f2-9d0c-4a89b98f90aa',
        email: 'playwright-test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
      },
    };

    // Set in localStorage (Supabase SSR might check here first)
    const storageKey = `sb-${projectRef}-auth-token`;
    localStorage.setItem(storageKey, JSON.stringify(session));

    // Also try setting a cookie
    document.cookie = `${storageKey}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=3600`;

    console.log('Auth tokens set in localStorage and cookies');
  });

  // Give it a moment to settle
  await page.waitForTimeout(1000);

  // Now try navigating to a protected route
  await page.goto('http://localhost:3003/investors');
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('After auth setup, URL is:', url);

  if (url.includes('/login')) {
    console.log('⚠️  Still redirected to login. Auth setup may not have worked.');
    console.log('Tests will likely be skipped.');
  } else {
    console.log('✅ Auth successful! Can access protected routes.');
  }

  // Save the storage state
  await page.context().storageState({ path: authFile });
  console.log(`✅ Auth state saved to ${authFile}`);
});
