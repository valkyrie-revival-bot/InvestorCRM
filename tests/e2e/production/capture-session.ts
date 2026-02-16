import { chromium } from '@playwright/test';

/**
 * Quick script to capture authenticated session
 * Run: npx tsx tests/e2e/production/capture-session.ts
 */
async function captureSession() {
  console.log('Opening browser to capture your session...');
  console.log('Please sign in if not already signed in.\n');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome' // Use your actual Chrome browser
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to production
  await page.goto('https://valhros.com');

  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Sign in with Google if you see the login page');
  console.log('2. Wait until you see the Dashboard or Pipeline');
  console.log('3. Press ENTER in this terminal when you\'re logged in\n');

  // Wait for user to press enter
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  // Check if actually logged in
  const nav = await page.locator('nav').isVisible().catch(() => false);

  if (!nav) {
    console.error('❌ Navigation not found. Are you logged in?');
    await browser.close();
    process.exit(1);
  }

  console.log('\n✅ Session detected! Saving...');

  // Save session
  await context.storageState({ path: './tests/.auth/prod-user.json' });

  console.log('✅ Session saved to ./tests/.auth/prod-user.json');
  console.log('\nYou can now run: npm run test:prod\n');

  await browser.close();
}

captureSession().catch(console.error);
