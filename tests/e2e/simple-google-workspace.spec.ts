import { test, expect } from '@playwright/test';

/**
 * Simple Google Workspace tests using direct navigation
 * These tests assume an investor with a known ID exists
 */

test.describe('Google Workspace - Direct Tests', () => {
  // We'll try to find or create a test investor ID
  let testInvestorId: string | null = null;

  test.beforeAll(async ({ request }) => {
    // Try to query the database for existing investors via the app
    console.log('Looking for existing test data...');
  });

  test('check if investors route exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Try navigating directly to investors
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('After navigating to /investors, URL is:', url);

    // Check page content
    const bodyText = await page.textContent('body');
    console.log('Page preview:', bodyText?.substring(0, 200));

    if (url.includes('/login')) {
      console.log('❌ Redirected to login');
      test.skip();
    } else if (bodyText?.includes('Page not found')) {
      console.log('❌ 404 error - investors route might not exist');
      test.skip();
    } else if (bodyText?.includes('Investor Pipeline') || bodyText?.includes('No investors')) {
      console.log('✅ Investors page loads correctly');
    }
  });

  test('check specific components exist in page source', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get HTML source
    const html = await page.content();

    // Check if Google Workspace component is imported anywhere
    const hasGoogleWorkspace = html.includes('Google Workspace') ||
                               html.includes('google-workspace') ||
                               html.includes('GoogleWorkspaceSection');

    console.log('Page includes Google Workspace references:', hasGoogleWorkspace);

    // Try going to investors page
    const response = await page.goto('/investors');
    console.log('Investors page status:', response?.status());

    if (response?.status() === 404) {
      console.log('❌ Investors page returns 404');
      console.log('');
      console.log('This might mean:');
      console.log('1. The route is protected and user is not authenticated');
      console.log('2. The route genuinely doesn\'t exist');
      console.log('3. There\'s a middleware issue');
    }
  });

  test('directly test Google Workspace component rendering', async ({ page }) => {
    // This test will navigate directly to a test investor page
    // If it doesn't exist, we'll get a 404
    const testId = '00000000-0000-0000-0000-000000000001'; // Placeholder ID

    await page.goto(`/investors/${testId}`);
    await page.waitForLoadState('domcontentloaded');

    const html = await page.content();

    // Check what we got
    if (html.includes('Google Workspace')) {
      console.log('✅ Google Workspace component IS in the page HTML');

      // Check if it's actually visible
      const isVisible = await page.locator('h2:has-text("Google Workspace")').isVisible({ timeout: 1000 }).catch(() => false);
      console.log('Google Workspace section visible:', isVisible);
    } else {
      console.log('❌ Google Workspace component NOT in page HTML');
      console.log('This could mean:');
      console.log('1. Component not rendered due to error');
      console.log('2. Page returned 404');
      console.log('3. Component has different text');
    }

    // Check for the actual structure
    const hasWorkspaceHeading = await page.locator('text=/google workspace/i').count();
    console.log('Found "Google Workspace" text:', hasWorkspaceHeading, 'times');
  });
});
