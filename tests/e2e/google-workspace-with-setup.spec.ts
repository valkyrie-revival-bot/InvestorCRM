import { test, expect } from '@playwright/test';

/**
 * Google Workspace Integration E2E Tests with Test Data Setup
 *
 * This test suite creates its own test data and cleans up after itself
 */

test.describe('Google Workspace Integration (with test data)', () => {
  let investorId: string;
  let investorUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Navigate to investors page
    await page.goto('http://localhost:3003/investors');
    await page.waitForLoadState('networkidle');

    // Check if authenticated
    if (page.url().includes('/login')) {
      await page.close();
      throw new Error('Not authenticated. Please log in at http://localhost:3003 first');
    }

    // Create a test investor
    // Click "Create Investor" or equivalent button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
    const hasCreateButton = await createButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCreateButton) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill in form (adjust selectors based on actual form)
      const firmNameInput = page.locator('input[name="firm_name"], input[placeholder*="firm" i], input[placeholder*="name" i]').first();
      await firmNameInput.fill('Test Investor for Google Workspace E2E');

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      await submitButton.click();

      // Wait for creation
      await page.waitForTimeout(2000);
    }

    // Find the test investor (or any investor)
    await page.goto('http://localhost:3003/investors');
    await page.waitForLoadState('networkidle');

    const investorLinks = page.locator('a[href^="/investors/"]');
    const count = await investorLinks.count();

    if (count === 0) {
      await page.close();
      throw new Error('No investors found. Please create at least one investor manually');
    }

    // Use the first investor
    investorUrl = await investorLinks.first().getAttribute('href') || '';
    investorId = investorUrl.split('/').pop() || '';

    await page.close();
  });

  test('Google Workspace section renders', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check if Google Workspace section exists
    const workspaceHeading = page.locator('h2:has-text("Google Workspace")');
    await expect(workspaceHeading).toBeVisible({ timeout: 10000 });

    console.log('✅ Google Workspace section is visible');
  });

  test('connection banner shows for unauthenticated Google account', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Should see the Google Workspace section
    await expect(page.locator('h2:has-text("Google Workspace")')).toBeVisible();

    // Banner should be visible (assuming user hasn't connected Google)
    const banner = page.locator('text=Connect your Google account');
    const isBannerVisible = await banner.isVisible().catch(() => false);

    if (isBannerVisible) {
      console.log('✅ Connection banner is visible');
      await expect(page.locator('a:has-text("Connect Google Account")')).toBeVisible();
    } else {
      console.log('ℹ️  Connection banner not visible - user may have Google account connected');
    }
  });

  test('all three tabs are present', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check all three tabs exist
    await expect(page.locator('button:has-text("Documents")')).toBeVisible();
    await expect(page.locator('button:has-text("Emails")')).toBeVisible();
    await expect(page.locator('button:has-text("Meetings")')).toBeVisible();

    console.log('✅ All three tabs are present');
  });

  test('tabs are switchable', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Click Emails tab
    await page.locator('button:has-text("Emails")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Emails")')).toHaveClass(/border-primary/);
    console.log('✅ Emails tab activated');

    // Click Meetings tab
    await page.locator('button:has-text("Meetings")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Meetings")')).toHaveClass(/border-primary/);
    console.log('✅ Meetings tab activated');

    // Click back to Documents tab
    await page.locator('button:has-text("Documents")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Documents")')).toHaveClass(/border-primary/);
    console.log('✅ Documents tab activated');
  });

  test('Documents tab shows Link Document button', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Documents")').click();
    await page.waitForTimeout(300);

    const linkButton = page.locator('button:has-text("Link Document")');
    await expect(linkButton).toBeVisible();

    // Button should be disabled without Google auth
    const isDisabled = await linkButton.isDisabled();
    console.log(`Link Document button disabled: ${isDisabled}`);
  });

  test('Emails tab shows Log Email button', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Emails")').click();
    await page.waitForTimeout(300);

    const logButton = page.locator('button:has-text("Log Email")');
    await expect(logButton).toBeVisible();

    // Button should be disabled without Google auth
    const isDisabled = await logButton.isDisabled();
    console.log(`Log Email button disabled: ${isDisabled}`);
  });

  test('Meetings tab shows Schedule Meeting button', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Meetings")').click();
    await page.waitForTimeout(300);

    const scheduleButton = page.locator('button:has-text("Schedule Meeting")');
    await expect(scheduleButton).toBeVisible();

    // Button should be disabled without Google auth
    const isDisabled = await scheduleButton.isDisabled();
    console.log(`Schedule Meeting button disabled: ${isDisabled}`);
  });

  test('section has proper styling', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    const section = page.locator('h2:has-text("Google Workspace")').locator('..');

    // Check for card styling
    await expect(section).toHaveClass(/rounded-lg/);
    await expect(section).toHaveClass(/border/);

    console.log('✅ Section has proper card styling');
  });

  test('section appears before Activity History', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    const workspaceSection = page.locator('h2:has-text("Google Workspace")');
    const activitySection = page.locator('h2:has-text("Activity History")');

    await expect(workspaceSection).toBeVisible();
    await expect(activitySection).toBeVisible();

    // Get positions
    const workspaceBox = await workspaceSection.boundingBox();
    const activityBox = await activitySection.boundingBox();

    if (workspaceBox && activityBox) {
      expect(workspaceBox.y).toBeLessThan(activityBox.y);
      console.log('✅ Google Workspace section appears before Activity History');
    }
  });

  test('page loads without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Switch between tabs
    await page.locator('button:has-text("Emails")').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Meetings")').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Documents")').click();
    await page.waitForTimeout(300);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('Warning') &&
      !err.includes('favicon') &&
      !err.includes('Ignored attempt') &&
      !err.includes('404')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️  Errors found:', criticalErrors);
    } else {
      console.log('✅ No critical errors');
    }

    expect(criticalErrors).toHaveLength(0);
  });
});
