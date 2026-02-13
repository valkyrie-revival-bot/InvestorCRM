import { test, expect } from '@playwright/test';

/**
 * Simple auth check test to understand the authentication state
 */
test('check authentication status', async ({ page }) => {
  console.log('='.repeat(80));
  console.log('AUTH CHECK TEST');
  console.log('='.repeat(80));

  // Try to access dashboard
  await page.goto('/dashboard');
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('Current URL:', url);

  // Check page content
  const title = await page.title();
  console.log('Page title:', title);

  const bodyText = await page.textContent('body');
  const preview = bodyText?.substring(0, 200) || 'No body text';
  console.log('Page preview:', preview);

  // Check for indicators
  if (url.includes('/login')) {
    console.log('❌ Redirected to login - NOT AUTHENTICATED');
    console.log('');
    console.log('To fix:');
    console.log('1. Open http://localhost:3003 in your browser');
    console.log('2. Log in with valid credentials');
    console.log('3. Tests will then work in headed mode using same session');
  } else if (bodyText?.includes('Dashboard') || bodyText?.includes('Investors')) {
    console.log('✅ AUTHENTICATED - Dashboard accessible');
  } else {
    console.log('⚠️  Unknown state');
  }

  console.log('='.repeat(80));
});

test('check investors page', async ({ page }) => {
  await page.goto('/investors');
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('Investors page URL:', url);

  if (url.includes('/login')) {
    console.log('❌ Cannot access investors - need auth');
    test.skip();
  } else {
    const investorLinks = await page.locator('a[href^="/investors/"]').count();
    console.log(`Found ${investorLinks} investor links`);

    if (investorLinks > 0) {
      const firstLink = await page.locator('a[href^="/investors/"]').first().getAttribute('href');
      console.log('First investor:', firstLink);
    }
  }
});
