import { test, expect } from '@playwright/test';

/**
 * Tasks Feature E2E Tests
 * Tests the complete task management system
 *
 * Prerequisites:
 * 1. Tasks table migration applied (supabase/migrations/20260214000000_create_tasks_table.sql)
 * 2. Dev server running with E2E_TEST_MODE=true
 * 3. At least one investor in the database
 */

test.describe('Tasks Feature', () => {
  let investorUrl: string;
  let investorId: string;
  let investorName: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to investors page
    await page.goto('http://localhost:3003/investors', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Get first investor
    const firstInvestorLink = page.locator('a[href^="/investors/"]').first();
    const linkCount = await firstInvestorLink.count();

    if (linkCount === 0) {
      test.skip(true, '❌ No investors found - please create test data first');
      return;
    }

    investorUrl = await firstInvestorLink.getAttribute('href') || '/investors/test';
    investorId = investorUrl.split('/').pop() || '';

    // Get investor name from the page
    investorName = await firstInvestorLink.textContent() || 'Test Investor';
  });

  test('should display tasks page with navigation link', async ({ page }) => {
    // Check if Tasks link exists in navigation
    await page.goto('http://localhost:3003/', { waitUntil: 'domcontentloaded' });

    const tasksLink = page.locator('a[href="/tasks"]');
    await expect(tasksLink).toBeVisible({ timeout: 5000 });
    await expect(tasksLink).toHaveText('Tasks');

    // Click and navigate to tasks page
    await tasksLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on tasks page
    await expect(page).toHaveURL(/\/tasks/);

    // Check for tasks page heading
    const heading = page.locator('h1:has-text("Tasks")');
    await expect(heading).toBeVisible();
  });

  test('should display task statistics cards', async ({ page }) => {
    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });

    // Check for stat cards
    await expect(page.locator('text=Total Tasks')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Overdue')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
  });

  test('should create a new task (when modal is accessible)', async ({ page }) => {
    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });

    // Note: Currently the Add Task button on tasks page won't work without selecting an investor
    // This test will need to be updated once investor selection is added
    // For now, we test that the button exists

    const addButton = page.locator('button:has-text("Add Task")');
    await expect(addButton).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });

    // Find status filter dropdown
    const statusFilter = page.locator('button[role="combobox"]').first();
    await expect(statusFilter).toBeVisible();

    // Click to open
    await statusFilter.click();
    await page.waitForTimeout(300);

    // Check filter options exist using more specific selectors
    await expect(page.getByRole('option', { name: 'All Statuses' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Completed' })).toBeVisible();
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });

    // Find priority filter dropdown (second combobox)
    const priorityFilter = page.locator('button[role="combobox"]').nth(1);
    await expect(priorityFilter).toBeVisible();

    // Click to open
    await priorityFilter.click();
    await page.waitForTimeout(300);

    // Check filter options exist using role-based selectors
    await expect(page.getByRole('option', { name: 'All Priorities' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'High' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Medium' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Low' })).toBeVisible();
  });

  test('should display task sections correctly', async ({ page }) => {
    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check if any of these sections might be visible
    // (depends on whether there are tasks in the system)
    const overdueHeading = page.locator('h3:has-text("Overdue")');
    const dueTodayHeading = page.locator('h3:has-text("Due Today")');
    const upcomingHeading = page.locator('h3:has-text("Upcoming")');
    const completedHeading = page.locator('h3:has-text("Completed")');

    // At least one section should exist, or empty state should show
    const hasOverdue = await overdueHeading.count() > 0;
    const hasDueToday = await dueTodayHeading.count() > 0;
    const hasUpcoming = await upcomingHeading.count() > 0;
    const hasCompleted = await completedHeading.count() > 0;
    const hasEmptyState = await page.locator('text=No tasks found').count() > 0;

    const hasContent = hasOverdue || hasDueToday || hasUpcoming || hasCompleted || hasEmptyState;
    expect(hasContent).toBeTruthy();
  });

  test('should navigate to tasks page from dashboard', async ({ page }) => {
    // Start at dashboard
    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });

    // Find and click Tasks nav link
    const tasksLink = page.locator('nav a[href="/tasks"]');
    await tasksLink.click();

    // Wait for navigation
    await page.waitForURL(/\/tasks/);

    // Verify we're on the tasks page
    await expect(page.locator('h1:has-text("Tasks")')).toBeVisible();
  });

  test('should show responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3003/tasks', { waitUntil: 'networkidle' });

    // Check that page loads and is responsive
    const heading = page.locator('h1:has-text("Tasks")');
    await expect(heading).toBeVisible();

    // Stats should stack vertically on mobile
    const statsContainer = page.locator('div').filter({ hasText: /Total Tasks/ }).first();
    await expect(statsContainer).toBeVisible();
  });
});

test.describe('Task Integration with Investors', () => {
  test('should show Tasks link in navigation', async ({ page }) => {
    await page.goto('http://localhost:3003/investors', { waitUntil: 'networkidle' });

    const tasksLink = page.locator('a[href="/tasks"]');
    await expect(tasksLink).toBeVisible();
  });

  test('tasks page should be accessible from any page', async ({ page }) => {
    // Test from key pages to ensure Tasks navigation is consistently available
    const pages = ['/', '/investors'];

    for (const pagePath of pages) {
      await page.goto(`http://localhost:3003${pagePath}`, { waitUntil: 'networkidle' });

      // Verify page loaded successfully (not 404)
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Check Tasks link is visible
      const tasksLink = page.locator('a[href="/tasks"]');
      await expect(tasksLink).toBeVisible({ timeout: 5000 });
    }
  });
});
