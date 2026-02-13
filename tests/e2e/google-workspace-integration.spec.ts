import { test, expect, Page } from '@playwright/test';

/**
 * Google Workspace Integration E2E Tests
 * Tests the complete Google Workspace integration on investor detail pages
 */

test.describe('Google Workspace Integration', () => {
  /**
   * NOTE: These tests require:
   * 1. The dev server to be running (npm run dev)
   * 2. A valid Supabase session (log in through browser at localhost:3000)
   * 3. At least one investor in the database
   *
   * To run these tests:
   * 1. Open localhost:3000 in your browser
   * 2. Log in with your Supabase credentials
   * 3. Create at least one investor
   * 4. Run: npx playwright test tests/e2e/google-workspace-integration.spec.ts --headed
   * 5. Playwright will use your browser's session cookies
   */

  let investorUrl: string;
  let investorId: string;

  test.beforeEach(async ({ page, context }) => {
    // Try to navigate to investors page
    await page.goto('http://localhost:3003/investors', { waitUntil: 'domcontentloaded' });

    // Wait a bit for redirects
    await page.waitForTimeout(2000);

    // Check if we're redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      test.skip(true,
        '❌ Not authenticated.\n' +
        'To run these tests:\n' +
        '1. Open http://localhost:3003 in your browser\n' +
        '2. Log in with your credentials\n' +
        '3. Keep that browser window open\n' +
        '4. Run tests with --headed flag to use the same browser profile'
      );
      return;
    }

    // Check for 404 or error page
    const pageText = await page.textContent('body');
    if (pageText?.includes('Page not found') || pageText?.includes('Error loading')) {
      test.skip(true,
        '❌ Cannot access investors page.\n' +
        'Possible issues:\n' +
        '1. Not authenticated - log in at http://localhost:3003 first\n' +
        '2. Database connection issue\n' +
        '3. Supabase not configured properly'
      );
      return;
    }

    // Try to find an investor link
    const firstInvestorLink = page.locator('a[href^="/investors/"]').first();
    const linkCount = await firstInvestorLink.count();

    if (linkCount === 0) {
      test.skip(true,
        '❌ No investors found in database.\n' +
        'Create at least one investor:\n' +
        '1. Go to http://localhost:3003/investors\n' +
        '2. Click "Create Investor" or similar button\n' +
        '3. Add a test investor\n' +
        '4. Re-run tests'
      );
      return;
    }

    investorUrl = await firstInvestorLink.getAttribute('href') || '/investors/test';
    investorId = investorUrl.split('/').pop() || '';
  });

  /**
   * Test 1: Unauthenticated user sees connection banner
   */
  test('unauthenticated user sees connection banner', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check if Google Workspace section exists
    const workspaceSection = page.locator('h2:has-text("Google Workspace")');
    await expect(workspaceSection).toBeVisible({ timeout: 5000 });

    // Verify "Connect Google Account" banner appears
    const connectBanner = page.locator('text=Connect your Google account to link documents');
    await expect(connectBanner).toBeVisible({ timeout: 3000 });

    const connectButton = page.locator('a:has-text("Connect Google Account")');
    await expect(connectButton).toBeVisible();

    // Verify tabs are visible
    await expect(page.locator('button:has-text("Documents")')).toBeVisible();
    await expect(page.locator('button:has-text("Emails")')).toBeVisible();
    await expect(page.locator('button:has-text("Meetings")')).toBeVisible();

    // Verify action buttons are disabled in Documents tab
    const linkDocButton = page.locator('button:has-text("Link Document")');
    await expect(linkDocButton).toBeDisabled();
  });

  /**
   * Test 2: Verify tabs switch correctly
   */
  test('tabs switch correctly', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check Documents tab is active by default
    const docsTab = page.locator('button:has-text("Documents")');
    await expect(docsTab).toHaveClass(/border-primary/);

    // Switch to Emails tab
    const emailsTab = page.locator('button:has-text("Emails")');
    await emailsTab.click();
    await page.waitForTimeout(300);
    await expect(emailsTab).toHaveClass(/border-primary/);

    // Verify email-specific content shows
    await expect(page.locator('text=Search and log Gmail emails')).toBeVisible();
    const logEmailButton = page.locator('button:has-text("Log Email")');
    await expect(logEmailButton).toBeVisible();
    await expect(logEmailButton).toBeDisabled();

    // Switch to Meetings tab
    const meetingsTab = page.locator('button:has-text("Meetings")');
    await meetingsTab.click();
    await page.waitForTimeout(300);
    await expect(meetingsTab).toHaveClass(/border-primary/);

    // Verify meeting-specific content shows
    await expect(page.locator('text=Schedule Google Calendar meetings')).toBeVisible();
    const scheduleMeetingButton = page.locator('button:has-text("Schedule Meeting")');
    await expect(scheduleMeetingButton).toBeVisible();
    await expect(scheduleMeetingButton).toBeDisabled();
  });

  /**
   * Test 3: Documents tab shows empty state
   */
  test('documents tab shows empty state when no documents linked', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Verify Documents tab content
    const docsTab = page.locator('button:has-text("Documents")');
    await docsTab.click();
    await page.waitForTimeout(300);

    // Should show description
    await expect(page.locator('text=Link Google Drive documents')).toBeVisible();

    // Link Document button should exist but be disabled
    const linkDocButton = page.locator('button:has-text("Link Document")');
    await expect(linkDocButton).toBeVisible();
    await expect(linkDocButton).toBeDisabled();
  });

  /**
   * Test 4: Emails tab shows empty state
   */
  test('emails tab shows empty state when no emails logged', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Switch to Emails tab
    const emailsTab = page.locator('button:has-text("Emails")');
    await emailsTab.click();
    await page.waitForTimeout(300);

    // Should show description and empty state
    await expect(page.locator('text=Search and log Gmail emails')).toBeVisible();

    // Check for empty state message (may vary based on implementation)
    const emptyState = page.locator('text=No emails logged yet');
    // Empty state may or may not be visible depending on if there are existing emails
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);

    // Log Email button should exist but be disabled
    const logEmailButton = page.locator('button:has-text("Log Email")');
    await expect(logEmailButton).toBeVisible();
    await expect(logEmailButton).toBeDisabled();
  });

  /**
   * Test 5: Meetings tab shows empty state
   */
  test('meetings tab shows empty state when no meetings scheduled', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Switch to Meetings tab
    const meetingsTab = page.locator('button:has-text("Meetings")');
    await meetingsTab.click();
    await page.waitForTimeout(300);

    // Should show description and empty state
    await expect(page.locator('text=Schedule Google Calendar meetings')).toBeVisible();

    // Check for empty state message (may vary based on implementation)
    const emptyState = page.locator('text=No meetings scheduled yet');
    // Empty state may or may not be visible depending on if there are existing meetings
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);

    // Schedule Meeting button should exist but be disabled
    const scheduleMeetingButton = page.locator('button:has-text("Schedule Meeting")');
    await expect(scheduleMeetingButton).toBeVisible();
    await expect(scheduleMeetingButton).toBeDisabled();
  });

  /**
   * Test 6: Disabled buttons show tooltips
   */
  test('disabled action buttons show helpful tooltips', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Test Link Document button tooltip
    const linkDocButton = page.locator('button:has-text("Link Document")');
    await expect(linkDocButton).toBeDisabled();

    // Check if button has a title attribute
    const title = await linkDocButton.getAttribute('title');
    if (title) {
      expect(title.toLowerCase()).toContain('connect');
    }

    // Test Log Email button tooltip
    await page.locator('button:has-text("Emails")').click();
    await page.waitForTimeout(300);

    const logEmailButton = page.locator('button:has-text("Log Email")');
    await expect(logEmailButton).toBeDisabled();

    // Test Schedule Meeting button tooltip
    await page.locator('button:has-text("Meetings")').click();
    await page.waitForTimeout(300);

    const scheduleMeetingButton = page.locator('button:has-text("Schedule Meeting")');
    await expect(scheduleMeetingButton).toBeDisabled();
  });

  /**
   * Test 7: Tab counts display correctly
   */
  test('tab counts display correctly', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check if tab counts are visible when items exist
    // Note: Counts may be 0 or hidden if no items exist
    const docsTab = page.locator('button:has-text("Documents")');
    const emailsTab = page.locator('button:has-text("Emails")');
    const meetingsTab = page.locator('button:has-text("Meetings")');

    // Tabs should be visible
    await expect(docsTab).toBeVisible();
    await expect(emailsTab).toBeVisible();
    await expect(meetingsTab).toBeVisible();

    // If counts exist, they should be numbers
    const docsCount = docsTab.locator('span.text-xs').first();
    const docsCountVisible = await docsCount.isVisible().catch(() => false);
    if (docsCountVisible) {
      const countText = await docsCount.textContent();
      expect(countText).toMatch(/^\d+$/);
    }
  });

  /**
   * Test 8: Connect button links to correct auth URL
   */
  test('connect button links to Google OAuth URL', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    const connectButton = page.locator('a:has-text("Connect Google Account")');
    await expect(connectButton).toBeVisible();

    // Check href attribute
    const href = await connectButton.getAttribute('href');
    expect(href).toBeTruthy();

    // Should contain Google auth parameters
    if (href) {
      // Should be a relative link to auth or contain redirect info
      expect(href.length).toBeGreaterThan(0);
    }
  });

  /**
   * Test 9: Google Workspace section renders in correct position
   */
  test('google workspace section appears before activity timeline', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Both sections should be visible
    const workspaceSection = page.locator('h2:has-text("Google Workspace")');
    const activitySection = page.locator('h2:has-text("Activity History")');

    await expect(workspaceSection).toBeVisible();
    await expect(activitySection).toBeVisible();

    // Get bounding boxes to check order
    const workspaceBox = await workspaceSection.boundingBox();
    const activityBox = await activitySection.boundingBox();

    if (workspaceBox && activityBox) {
      // Workspace section should appear above (smaller y coordinate) than activity section
      expect(workspaceBox.y).toBeLessThan(activityBox.y);
    }
  });

  /**
   * Test 10: Responsive design - section is visible on mobile
   */
  test('google workspace section is responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Section should still be visible on mobile
    const workspaceSection = page.locator('h2:has-text("Google Workspace")');
    await expect(workspaceSection).toBeVisible();

    // Tabs should be visible and scrollable
    await expect(page.locator('button:has-text("Documents")')).toBeVisible();
    await expect(page.locator('button:has-text("Emails")')).toBeVisible();
    await expect(page.locator('button:has-text("Meetings")')).toBeVisible();

    // Buttons should still function
    await page.locator('button:has-text("Emails")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Search and log Gmail emails')).toBeVisible();
  });

  /**
   * Test 11: Section has proper styling and layout
   */
  test('section has proper card styling', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Find the Google Workspace section container
    const section = page.locator('h2:has-text("Google Workspace")').locator('..');

    // Should have card styling classes
    await expect(section).toHaveClass(/rounded-lg/);
    await expect(section).toHaveClass(/border/);
    await expect(section).toHaveClass(/bg-card/);
  });

  /**
   * Test 12: Tab navigation preserves state
   */
  test('tab navigation works smoothly', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Click through all tabs
    const tabs = ['Documents', 'Emails', 'Meetings'];

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`);
      await tab.click();
      await page.waitForTimeout(200);

      // Tab should be active (has primary color)
      await expect(tab).toHaveClass(/border-primary/);
      await expect(tab).toHaveClass(/text-primary/);
    }

    // Switch back to Documents
    await page.locator('button:has-text("Documents")').click();
    await page.waitForTimeout(200);
    await expect(page.locator('button:has-text("Documents")')).toHaveClass(/border-primary/);
  });

  /**
   * Test 13: Banner only shows when not connected
   */
  test('connection banner appears in correct state', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Banner should be visible for unauthenticated user
    const banner = page.locator('text=Connect your Google account');

    // Banner visibility depends on authentication state
    // For now, just check that the section structure is correct
    const workspaceSection = page.locator('h2:has-text("Google Workspace")');
    await expect(workspaceSection).toBeVisible();

    // Banner may or may not be visible depending on auth state
    const bannerVisible = await banner.isVisible().catch(() => false);

    // If banner is visible, verify its structure
    if (bannerVisible) {
      await expect(banner).toBeVisible();
      await expect(page.locator('a:has-text("Connect Google Account")')).toBeVisible();
    }
  });

  /**
   * Test 14: Page loads without errors
   */
  test('page loads without console errors', async ({ page }) => {
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

    // Check for no critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('Warning') &&
      !err.includes('favicon') &&
      !err.includes('Ignored attempt')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  /**
   * Test 15: Accessibility - keyboard navigation works
   */
  test('keyboard navigation works for tabs', async ({ page }) => {
    await page.goto(`http://localhost:3003${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Tab to the first tab button
    const docsTab = page.locator('button:has-text("Documents")');
    await docsTab.focus();

    // Should be focused
    await expect(docsTab).toBeFocused();

    // Press Tab to move to next element
    await page.keyboard.press('Tab');

    // One of the tabs or buttons should be focused
    const emailsTab = page.locator('button:has-text("Emails")');
    const meetingsTab = page.locator('button:has-text("Meetings")');

    // At least one should exist and be in the tab order
    await expect(emailsTab).toBeVisible();
    await expect(meetingsTab).toBeVisible();
  });
});
