import { test as setup, expect } from '@playwright/test';

/**
 * Manual authentication setup for production testing
 *
 * This will open a browser where you can manually sign in with Google.
 * Once authenticated, the session will be saved for automated tests.
 *
 * Run: npx playwright test --config=playwright.config.prod.ts tests/e2e/production/manual-auth.setup.ts --headed
 */
setup('manual authentication', async ({ page }) => {
  console.log('\n========================================');
  console.log('MANUAL AUTHENTICATION REQUIRED');
  console.log('========================================\n');
  console.log('1. A browser window will open');
  console.log('2. Navigate through the landing page to login');
  console.log('3. Sign in with your Google account');
  console.log('4. Wait for the dashboard to load');
  console.log('5. This terminal will show "Authentication complete" when done\n');

  // Navigate to production
  await page.goto('https://valhros.com');

  // Check if on landing page
  const crmCard = page.locator('a[href="/login"]');
  const onLanding = await crmCard.isVisible({ timeout: 3000 }).catch(() => false);

  if (onLanding) {
    console.log('Landing page detected. Please click the "Investor CRM" card to proceed to login...');

    // Wait for user to click (or auto-click)
    await Promise.race([
      page.waitForURL(/\/login/, { timeout: 60000 }),
      crmCard.click().then(() => page.waitForLoadState('networkidle'))
    ]);
  }

  console.log('Login page loaded. Please sign in with Google...');

  // Wait for user to authenticate
  // Look for either the dashboard nav or a successful redirect
  await page.waitForFunction(
    () => {
      return document.querySelector('nav') !== null ||
             window.location.pathname === '/' ||
             window.location.pathname.startsWith('/investors');
    },
    { timeout: 120000 } // 2 minutes for manual login
  );

  console.log('Authentication detected! Waiting for navigation to complete...');
  await page.waitForLoadState('networkidle');

  // Verify we have access to protected routes
  const nav = await page.locator('nav').isVisible();
  if (!nav) {
    // Try navigating to dashboard
    await page.goto('https://valhros.com/');
    await page.waitForTimeout(2000);
  }

  // Final check
  const authenticated = await page.locator('nav').isVisible();
  if (!authenticated) {
    throw new Error('Authentication verification failed - nav not visible');
  }

  console.log('\n✓ Authentication successful!');
  console.log('Saving session state...\n');

  // Save authentication state
  await page.context().storageState({ path: './tests/.auth/prod-user.json' });

  console.log('========================================');
  console.log('Session saved to ./tests/.auth/prod-user.json');
  console.log('You can now run automated tests!');
  console.log('========================================\n');
});
