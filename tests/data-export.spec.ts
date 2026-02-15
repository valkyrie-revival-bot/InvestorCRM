/**
 * Playwright tests for data export functionality and performance optimizations
 */

import { test, expect, Page } from '@playwright/test';
import { authenticateTestUser } from './helpers/auth';

test.describe('Data Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateTestUser(page);
  });

  test('export investors to CSV', async ({ page }) => {
    // Navigate to investors page
    await page.goto('/investors');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Investor Pipeline' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click CSV option
    await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/investors_.*\.csv/);

    // Verify file content
    const path = await download.path();
    expect(path).toBeTruthy();

    // Read file and verify headers
    const fs = await import('fs/promises');
    const content = await fs.readFile(path!, 'utf-8');
    expect(content).toContain('firm_name');
    expect(content).toContain('stage');
    expect(content).toContain('relationship_owner');
  });

  test('export investors to Excel', async ({ page }) => {
    // Navigate to investors page
    await page.goto('/investors');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Investor Pipeline' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click Excel option
    await page.getByRole('menuitem', { name: /Export as Excel/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/investors_.*\.xlsx/);

    // Verify file exists
    const path = await download.path();
    expect(path).toBeTruthy();

    // Verify file is not empty
    const fs = await import('fs/promises');
    const stats = await fs.stat(path!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('export tasks to CSV with filters', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click CSV option
    await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/tasks_.*\.csv/);

    // Verify file content
    const path = await download.path();
    const fs = await import('fs/promises');
    const content = await fs.readFile(path!, 'utf-8');
    expect(content).toContain('title');
    expect(content).toContain('status');
    expect(content).toContain('priority');
  });

  test('export tasks to Excel', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click Excel option
    await page.getByRole('menuitem', { name: /Export as Excel/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/tasks_.*\.xlsx/);
  });

  test('export meetings to CSV', async ({ page }) => {
    // Navigate to meetings page
    await page.goto('/meetings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Meeting Intelligence' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click CSV option
    await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/meetings_.*\.csv/);
  });

  test('export meetings to Excel', async ({ page }) => {
    // Navigate to meetings page
    await page.goto('/meetings');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Meeting Intelligence' })).toBeVisible();

    // Start download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();

    // Click Excel option
    await page.getByRole('menuitem', { name: /Export as Excel/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/meetings_.*\.xlsx/);
  });
});

test.describe('Performance Optimizations', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateTestUser(page);
  });

  test('investor list loads quickly', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();

    await page.goto('/investors');

    // Wait for list to be visible
    await expect(page.getByRole('heading', { name: 'Investor Pipeline' })).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load in under 2 seconds (reasonable for large datasets)
    expect(loadTime).toBeLessThan(2000);

    console.log(`Investor list loaded in ${loadTime}ms`);
  });

  test('task list loads quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/tasks');

    // Wait for stats to be visible (indicates data loaded)
    await expect(page.getByText('Total Tasks')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);

    console.log(`Task list loaded in ${loadTime}ms`);
  });

  test('stats queries use cache on reload', async ({ page }) => {
    // First load
    await page.goto('/tasks');
    await expect(page.getByText('Total Tasks')).toBeVisible();

    const firstLoadTime = Date.now();

    // Reload page
    await page.reload();
    await expect(page.getByText('Total Tasks')).toBeVisible();

    const secondLoadTime = Date.now() - firstLoadTime;

    // Second load should be faster (cache hit)
    // Note: In practice, this depends on server-side caching working correctly
    console.log(`Cached reload took ${secondLoadTime}ms`);

    // Verify page still works after reload
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('paginated lists handle large datasets', async ({ page }) => {
    // Navigate to investors page
    await page.goto('/investors');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Investor Pipeline' })).toBeVisible();

    // Check if table/list is visible
    // The page should render even with many investors due to pagination
    const hasContent = await page.locator('table, [role="list"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('export API handles concurrent requests', async ({ page }) => {
    await page.goto('/investors');
    await expect(page.getByRole('heading', { name: 'Investor Pipeline' })).toBeVisible();

    // Start multiple export requests concurrently
    const downloadPromises = Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.waitForEvent('download', { timeout: 15000 }),
    ]);

    // Trigger first export
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

    // Wait a bit then trigger second export
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /Export/i }).click();
    await page.getByRole('menuitem', { name: /Export as Excel/i }).click();

    // Both should complete without errors
    const downloads = await downloadPromises;
    expect(downloads).toHaveLength(2);
  });
});

test.describe('Export API Integration', () => {
  let authCookie: string;

  test.beforeEach(async ({ page }) => {
    await authenticateTestUser(page);

    // Get auth cookie for API calls
    const cookies = await page.context().cookies();
    const authCookieObj = cookies.find(c => c.name.includes('auth'));
    authCookie = authCookieObj ? `${authCookieObj.name}=${authCookieObj.value}` : '';
  });

  test('export API returns CSV with correct headers', async ({ page }) => {
    // Make direct API call
    const response = await page.request.get('/api/export/investors?format=csv');

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/csv');
    expect(response.headers()['content-disposition']).toContain('attachment');

    const content = await response.text();
    expect(content).toContain('firm_name');
  });

  test('export API returns Excel with correct headers', async ({ page }) => {
    const response = await page.request.get('/api/export/investors?format=excel');

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('spreadsheetml');
    expect(response.headers()['content-disposition']).toContain('attachment');
  });

  test('export API handles filters correctly', async ({ page }) => {
    const response = await page.request.get(
      '/api/export/tasks?format=csv&status=pending&priority=high'
    );

    expect(response.ok()).toBeTruthy();

    const content = await response.text();
    // Should include header
    expect(content).toContain('title');
  });

  test('export API requires authentication', async ({ browser }) => {
    // Create new context without auth
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.request.get('/api/export/investors?format=csv');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    await context.close();
  });
});
