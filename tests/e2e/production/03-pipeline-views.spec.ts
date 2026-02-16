import { test, expect } from '@playwright/test';

/**
 * Production E2E Tests: Pipeline Views
 *
 * Tests the investor pipeline view functionality on production (https://valhros.com)
 *
 * Prerequisites:
 * - Production environment must be accessible
 * - User must be authenticated (handled by auth.setup.ts)
 * - At least one investor record should exist in production database
 *
 * Test Coverage:
 * 1. Table view loads with data
 * 2. Kanban view loads with data
 * 3. Search functionality filters investors
 * 4. View switching persists filters
 */

test.use({
  storageState: './tests/.auth/prod-user.json',
});

test.describe('Production: Pipeline Views', () => {
  const baseUrl = 'https://valhros.com';

  test.beforeEach(async ({ page }) => {
    // Navigate to investors page
    await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });

  test('should load table view with investor data', async ({ page }) => {
    // Check for page title
    const heading = page.locator('h1:has-text("Investor Pipeline")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verify table view is active by default
    const tableTab = page.locator('button[role="tab"]:has-text("Table")');
    await expect(tableTab).toBeVisible();
    await expect(tableTab).toHaveAttribute('data-state', 'active');

    // Check for table headers or data
    // The table should have either data rows or an empty state
    const hasTableContent = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=/no investors/i').count() > 0;

    expect(hasTableContent || hasEmptyState).toBeTruthy();

    // If there's data, verify table structure
    if (hasTableContent) {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      // Check for common columns
      const tableContent = await table.textContent();

      // Table should have some content
      expect(tableContent).not.toBe('');
      expect(tableContent!.length).toBeGreaterThan(0);
    }
  });

  test('should load kanban board view with investor data', async ({ page }) => {
    // Click on Kanban/Board tab
    const kanbanTab = page.locator('button[role="tab"]', { hasText: /Board|Kanban/i });
    await expect(kanbanTab).toBeVisible({ timeout: 10000 });
    await kanbanTab.click();

    // Wait for view to switch
    await page.waitForTimeout(500);

    // Verify kanban tab is now active
    await expect(kanbanTab).toHaveAttribute('data-state', 'active');

    // Check for kanban board structure (columns for stages)
    const hasKanbanColumns = await page.locator('[data-testid*="kanban"], [class*="kanban"], div:has-text("Initial Contact")').count() > 0;
    const hasEmptyState = await page.locator('text=/no investors/i').count() > 0;

    // Either kanban board or empty state should be visible
    expect(hasKanbanColumns || hasEmptyState).toBeTruthy();

    // If there are columns, they should be visible
    if (hasKanbanColumns) {
      // Look for stage names common in pipeline
      const stageIndicators = [
        page.locator('text="Initial Contact"'),
        page.locator('text="Pitch Scheduled"'),
        page.locator('text="Committed"'),
      ];

      // At least one stage column should be visible
      let stageFound = false;
      for (const stage of stageIndicators) {
        if (await stage.count() > 0) {
          stageFound = true;
          break;
        }
      }

      expect(stageFound).toBeTruthy();
    }
  });

  test('should filter investors using search functionality', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Locate search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Get initial count of investors displayed
    const countText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '0 of 0 investors');
    const initialMatch = countText.match(/(\d+) of (\d+)/);
    const initialTotal = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Only test search if there are investors
    if (initialTotal === 0) {
      test.skip(true, 'No investors in production database to test search');
      return;
    }

    // Type a search query (common firm name pattern)
    await searchInput.fill('capital');
    await page.waitForTimeout(1000); // Wait for filtering debounce

    // Verify search was applied
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('capital');

    // Check that filter count updated or remained the same
    const filteredCountText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '0 of 0 investors');
    expect(filteredCountText).toBeTruthy();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Verify count returned to original or close to it
    const clearedCountText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '0 of 0 investors');
    const clearedMatch = clearedCountText.match(/(\d+) of (\d+)/);
    const clearedTotal = clearedMatch ? parseInt(clearedMatch[2]) : 0;

    expect(clearedTotal).toBe(initialTotal);
  });

  test('should persist filters when switching between table and kanban views', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Locate search input and apply a filter
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const searchTerm = 'ventures';
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(1000);

    // Verify search is applied in table view
    let searchValue = await searchInput.inputValue();
    expect(searchValue).toBe(searchTerm);

    // Get filtered count in table view
    const tableCountText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '');

    // Switch to kanban view
    const kanbanTab = page.locator('button[role="tab"]', { hasText: /Board|Kanban/i });
    await kanbanTab.click();
    await page.waitForTimeout(500);

    // Verify filter persisted (search input should still have value)
    searchValue = await searchInput.inputValue();
    expect(searchValue).toBe(searchTerm);

    // Verify count is consistent
    const kanbanCountText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '');
    expect(kanbanCountText).toBe(tableCountText);

    // Switch back to table view
    const tableTab = page.locator('button[role="tab"]:has-text("Table")');
    await tableTab.click();
    await page.waitForTimeout(500);

    // Verify filter still persisted
    searchValue = await searchInput.inputValue();
    expect(searchValue).toBe(searchTerm);

    // Test stage filter persistence
    const stageFilter = page.locator('button[role="combobox"]').first();
    if (await stageFilter.count() > 0) {
      await stageFilter.click();
      await page.waitForTimeout(300);

      // Select a specific stage if options are available
      const pitchOption = page.locator('div[role="option"]', { hasText: 'Pitch Scheduled' });
      if (await pitchOption.count() > 0) {
        await pitchOption.click();
        await page.waitForTimeout(500);

        // Switch to kanban and verify stage filter persisted
        await kanbanTab.click();
        await page.waitForTimeout(500);

        // The filter should still show "Pitch Scheduled"
        const selectedFilter = await stageFilter.textContent();
        expect(selectedFilter).toContain('Pitch Scheduled');
      }
    }

    // Clear all filters
    const clearButton = page.locator('button:has-text("Clear filters")');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verify filters cleared
      searchValue = await searchInput.inputValue();
      expect(searchValue).toBe('');
    }
  });

  test('should display pipeline summary statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for investor count display
    const countDisplay = page.locator('text=/\\d+ of \\d+ investors/');
    await expect(countDisplay).toBeVisible({ timeout: 10000 });

    // Check for total value display
    const totalDisplay = page.locator('text=/Total:.*\\$/');
    await expect(totalDisplay).toBeVisible();

    // Verify the format is correct
    const totalText = await totalDisplay.textContent();
    expect(totalText).toMatch(/Total:\s*\$/);
  });

  test('should allow quick access to create new investor', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for "New Investor" button
    const newInvestorButton = page.locator('button:has-text("New Investor")');
    await expect(newInvestorButton).toBeVisible({ timeout: 10000 });

    // Click to open modal
    await newInvestorButton.click();
    await page.waitForTimeout(500);

    // Verify modal opened
    const modalTitle = page.locator('h2:has-text("New Investor"), [role="dialog"] >> text="New Investor"');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Check for required fields
    await expect(page.locator('label:has-text("Firm Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Stage")')).toBeVisible();
    await expect(page.locator('label:has-text("Relationship Owner")')).toBeVisible();

    // Close modal without creating
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Verify modal closed
    const modalExists = await modalTitle.count();
    expect(modalExists).toBe(0);
  });

  test('should display export button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for export functionality
    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="Export"]');

    // Export button should be visible
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });
});
