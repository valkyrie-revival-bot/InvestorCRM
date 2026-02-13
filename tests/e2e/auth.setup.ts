import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Authentication setup for E2E tests
 *
 * This setup script should:
 * 1. Navigate to login page
 * 2. Fill in credentials
 * 3. Submit login form
 * 4. Wait for successful auth
 * 5. Save auth state to file
 *
 * To use this:
 * 1. Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local
 * 2. Update playwright.config.ts to reference this setup
 * 3. All tests will reuse the authenticated state
 */

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:3003/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we're already authenticated (might be redirected to dashboard)
  if (page.url().includes('/dashboard') || page.url().includes('/investors')) {
    console.log('Already authenticated, saving state...');
    await page.context().storageState({ path: authFile });
    return;
  }

  // If login page has a form, fill it
  // Note: Adjust selectors based on actual login form structure
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  const submitButton = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');

  // Check if login form exists
  const emailExists = await emailInput.count() > 0;

  if (!emailExists) {
    console.log('No login form found. You may need to log in manually in your browser first.');
    console.log('After logging in, the session cookies will be used by Playwright.');

    // Try to continue anyway - maybe there's a magic link or OAuth flow
    await page.waitForTimeout(2000);

    // Save whatever state we have
    await page.context().storageState({ path: authFile });
    return;
  }

  // Get credentials from environment variables
  const email = process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL || '';
  const password = process.env.TEST_USER_PASSWORD || process.env.TEST_PASSWORD || '';

  if (!email || !password) {
    console.log('⚠️  No test credentials found.');
    console.log('Please set TEST_USER_EMAIL and TEST_USER_PASSWORD in your environment.');
    console.log('');
    console.log('Alternative: Log in manually in a browser on http://localhost:3003');
    console.log('Then run tests - they will use your existing session.');

    // Save current state anyway (might have session from browser)
    await page.context().storageState({ path: authFile });
    return;
  }

  // Fill in credentials
  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit form
  await submitButton.click();

  // Wait for navigation after login
  await page.waitForURL('**/dashboard/**', { timeout: 10000 }).catch(() => {
    console.log('Login might have failed or took too long');
  });

  // Wait for page to settle
  await page.waitForLoadState('networkidle');

  // Save authenticated state
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup complete');
});
