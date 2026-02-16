import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  console.log('Starting authentication flow...');

  // Navigate to production
  await page.goto('https://valhros.com');
  console.log('Navigated to valhros.com');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if already authenticated
  const isAuthenticated = await page.locator('nav').isVisible().catch(() => false);

  if (isAuthenticated) {
    console.log('Already authenticated, saving state...');
    await page.context().storageState({ path: './tests/.auth/prod-user.json' });
    return;
  }

  // Look for sign in button - "Sign in with Google"
  const signInButton = page.locator('button:has-text("Sign in with Google")');
  const signInVisible = await signInButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (!signInVisible) {
    console.error('Sign in button not found. Page content:', await page.content());
    throw new Error('Could not find "Sign in with Google" button');
  }

  console.log('Clicking "Sign in with Google"...');
  await signInButton.click();

  // Wait for either Google OAuth or direct navigation to dashboard
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL after sign in:', currentUrl);

  // If redirected to Google OAuth, handle it
  if (currentUrl.includes('accounts.google.com')) {
    console.log('Google OAuth detected, entering credentials...');

    const email = process.env.PROD_TEST_EMAIL || process.env.TEST_EMAIL;
    const password = process.env.PROD_TEST_PASSWORD || process.env.TEST_PASSWORD;

    if (!email || !password) {
      throw new Error('PROD_TEST_EMAIL and PROD_TEST_PASSWORD environment variables required');
    }

    // Fill email
    await page.fill('input[type="email"]', email);
    await page.click('#identifierNext');
    await page.waitForTimeout(2000);

    // Fill password
    await page.fill('input[type="password"]', password);
    await page.click('#passwordNext');

    // Wait for redirect back
    await page.waitForURL(/valhros\.com/, { timeout: 30000 });
    console.log('Redirected back to valhros.com');
  }

  // Wait for navigation to be visible (sign of successful auth)
  await page.waitForSelector('nav', { timeout: 10000 });
  console.log('Navigation visible, authentication successful');

  // Verify we can access a protected route
  const navLinks = await page.locator('nav a').allTextContents();
  console.log('Navigation links:', navLinks);

  // Save auth state
  await page.context().storageState({ path: './tests/.auth/prod-user.json' });
  console.log('Auth state saved to ./tests/.auth/prod-user.json');
});
