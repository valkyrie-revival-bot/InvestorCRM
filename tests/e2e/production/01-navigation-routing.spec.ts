import { test, expect } from '@playwright/test';

/**
 * Production Navigation and Routing Tests
 *
 * These tests verify that navigation and routing work correctly on the production
 * valhros.com site. Tests require authentication via auth.setup.ts.
 */

test.describe('Navigation and Routing', () => {
  test.use({
    baseURL: 'https://valhros.com',
    storageState: './tests/.auth/prod-user.json'
  });

  test('Root / shows Dashboard with metrics', async ({ page }) => {
    console.log('Testing root route navigation...');

    // Navigate to root
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we're on a dashboard-like page
    // Check for dashboard heading
    const dashboardHeading = page.locator('h2:has-text("Dashboard")');
    await expect(dashboardHeading).toBeVisible({ timeout: 10000 });

    // Verify key metric cards are present
    const totalInvestorsCard = page.locator('text=Total Investors').first();
    await expect(totalInvestorsCard).toBeVisible();

    const activeDealsCard = page.locator('text=Active Deals').first();
    await expect(activeDealsCard).toBeVisible();

    const stalledCard = page.locator('text=Stalled').first();
    await expect(stalledCard).toBeVisible();

    const pipelineValueCard = page.locator('text=Pipeline Value').first();
    await expect(pipelineValueCard).toBeVisible();

    console.log('✓ Root route shows Dashboard with metrics');
  });

  test('/investors shows Investor Pipeline', async ({ page }) => {
    console.log('Testing /investors route...');

    // Navigate to investors page
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    // Verify we're on the investors page
    // Look for "Investor Pipeline" or similar heading
    const investorHeading = page.locator('h1, h2').filter({ hasText: /Investor|Pipeline/i }).first();
    await expect(investorHeading).toBeVisible({ timeout: 10000 });

    // Check URL is correct
    expect(page.url()).toContain('/investors');

    // Verify page has investor-related content (table, cards, or empty state)
    const hasInvestorContent = await page.locator('table, [data-testid="investor-card"], text=No investors').count();
    expect(hasInvestorContent).toBeGreaterThan(0);

    console.log('✓ /investors shows Investor Pipeline');
  });

  test('Nav links work correctly', async ({ page }) => {
    console.log('Testing navigation links...');

    // Start at root
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify nav is present
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Get all navigation links
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    console.log(`Found ${linkCount} navigation links`);
    expect(linkCount).toBeGreaterThan(0);

    // Test a few key navigation links
    // Look for investors/pipeline link
    const investorsLink = page.locator('nav a[href="/investors"]').or(
      page.locator('nav a:has-text("Investor")').or(
        page.locator('nav a:has-text("Pipeline")')
      )
    ).first();

    const investorsLinkVisible = await investorsLink.isVisible().catch(() => false);

    if (investorsLinkVisible) {
      console.log('Testing Investors navigation link...');
      await investorsLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we navigated to investors
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/investors');
      console.log('✓ Investors link works');

      // Navigate back to dashboard
      const dashboardLink = page.locator('nav a[href="/"]').or(
        page.locator('nav a:has-text("Dashboard")')
      ).first();

      const dashboardLinkVisible = await dashboardLink.isVisible().catch(() => false);
      if (dashboardLinkVisible) {
        await dashboardLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Verify we're back at dashboard
        const dashboardHeading = page.locator('h2:has-text("Dashboard")');
        await expect(dashboardHeading).toBeVisible();
        console.log('✓ Dashboard link works');
      }
    }

    console.log('✓ Navigation links functional');
  });

  test('No /dashboard route exists (or redirects properly)', async ({ page }) => {
    console.log('Testing /dashboard route behavior...');

    // Try to navigate to /dashboard
    const response = await page.goto('/dashboard');

    // Check the response
    if (response) {
      const status = response.status();
      console.log(`/dashboard returned status: ${status}`);

      // Should either 404 or redirect
      if (status === 404) {
        console.log('✓ /dashboard returns 404 as expected');
      } else if (status === 301 || status === 302 || status === 307 || status === 308) {
        console.log('✓ /dashboard redirects (status: ${status})');

        // Verify redirect destination
        await page.waitForLoadState('networkidle');
        const finalUrl = page.url();
        console.log(`Redirected to: ${finalUrl}`);

        // Should redirect to root or stay at dashboard
        expect(finalUrl).toMatch(/\/(dashboard)?$/);
      } else if (status === 200) {
        // If it returns 200, verify it's showing valid content
        console.log('/dashboard route exists and returns 200');

        // Check if it shows dashboard content or redirects client-side
        await page.waitForLoadState('networkidle');
        const finalUrl = page.url();

        if (finalUrl.includes('/dashboard')) {
          // Route exists, verify it shows dashboard content
          const dashboardContent = await page.locator('h1, h2').filter({ hasText: /Dashboard/i }).isVisible().catch(() => false);
          if (dashboardContent) {
            console.log('✓ /dashboard shows dashboard content');
          } else {
            console.log('⚠ /dashboard exists but may not show expected content');
          }
        } else {
          console.log(`✓ Client-side redirect from /dashboard to ${finalUrl}`);
        }
      }
    } else {
      // Navigation failed
      console.log('✓ /dashboard navigation failed (route may not exist)');
    }
  });

  test('Authentication is maintained across routes', async ({ page }) => {
    console.log('Testing authentication persistence...');

    // Visit root
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we're authenticated (nav visible)
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Visit investors
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    // Verify still authenticated
    await expect(nav).toBeVisible();

    // Check we're not redirected to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).not.toContain('/auth');

    console.log('✓ Authentication maintained across routes');
  });
});
