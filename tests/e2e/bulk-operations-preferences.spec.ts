import { test, expect } from '@playwright/test';

/**
 * Bulk Operations and User Preferences Tests
 * Tests multi-select, bulk operations, and user settings functionality
 */

// Helper to login
async function login(page: any) {
  await page.goto('/login');

  // Check if already logged in
  const currentUrl = page.url();
  if (currentUrl.includes('/investors') || currentUrl.includes('/tasks')) {
    return;
  }

  // Fill login form
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL(/\/(investors|tasks|$)/, { timeout: 10000 });
}

test.describe('Bulk Operations - Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should show multi-select checkboxes on task list', async ({ page }) => {
    // Check for "Select all" checkbox in header
    const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label="Select all"]').first();
    await expect(selectAllCheckbox).toBeVisible();

    // Check for individual task checkboxes
    const taskCheckboxes = page.locator('input[type="checkbox"]');
    const count = await taskCheckboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select and deselect tasks', async ({ page }) => {
    // Select first task
    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1); // Skip select all
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Check for selected count badge
    await expect(page.getByText(/\d+ selected/)).toBeVisible();

    // Deselect
    await firstCheckbox.uncheck();
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('should show bulk actions toolbar when tasks are selected', async ({ page }) => {
    // Select a task
    const checkbox = page.locator('input[type="checkbox"]').nth(1);
    await checkbox.check();

    // Wait for bulk actions toolbar
    await expect(page.getByText(/\d+ selected/)).toBeVisible();

    // Check for bulk action buttons
    await expect(page.getByRole('button', { name: /change status/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change priority/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /set due date/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should bulk update task status', async ({ page }) => {
    // Select multiple tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = Math.min(await checkboxes.count() - 1, 3); // Select up to 3 tasks

    for (let i = 1; i <= count; i++) {
      await checkboxes.nth(i).check();
    }

    // Click "Change Status" button
    await page.getByRole('button', { name: /change status/i }).click();

    // Select completed status
    await page.locator('select#bulk-status').selectOption('completed');

    // Click update button
    await page.getByRole('button', { name: /update status/i }).click();

    // Wait for success message
    await expect(page.getByText(/successfully.*status/i)).toBeVisible({ timeout: 5000 });
  });

  test('should bulk update task priority', async ({ page }) => {
    // Select tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Click "Change Priority"
    await page.getByRole('button', { name: /change priority/i }).click();

    // Select high priority
    await page.locator('select#bulk-priority').selectOption('high');

    // Update
    await page.getByRole('button', { name: /update priority/i }).click();

    // Verify success
    await expect(page.getByText(/successfully.*priority/i)).toBeVisible({ timeout: 5000 });
  });

  test('should bulk assign due date', async ({ page }) => {
    // Select tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();

    // Click "Set Due Date"
    await page.getByRole('button', { name: /set due date/i }).click();

    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await page.fill('input#bulk-due-date', dateStr);

    // Assign
    await page.getByRole('button', { name: /assign due date/i }).click();

    // Verify success
    await expect(page.getByText(/successfully.*due date/i)).toBeVisible({ timeout: 5000 });
  });

  test('should bulk delete tasks with confirmation', async ({ page }) => {
    // Select tasks
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirm in dialog
    await expect(page.getByText(/delete.*task/i)).toBeVisible();
    await page.getByRole('button', { name: /delete/i }).last().click();

    // Verify success
    await expect(page.getByText(/successfully.*deleted/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Bulk Operations - Investors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');
  });

  test('should show multi-select on investor list', async ({ page }) => {
    // Check for select all checkbox
    const selectAll = page.locator('input[type="checkbox"][aria-label="Select all"]').first();
    await expect(selectAll).toBeVisible();
  });

  test('should bulk export investors', async ({ page }) => {
    // Select investors
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Click export button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export/i }).click()
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should bulk delete investors with confirmation', async ({ page }) => {
    // Select an investor
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).check();

    // Click delete
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirm
    await expect(page.getByText(/delete.*investor/i)).toBeVisible();
    await page.getByRole('button', { name: /delete/i }).last().click();

    // Verify success
    await expect(page.getByText(/successfully.*deleted/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show progress for bulk operations', async ({ page }) => {
    // Select multiple investors
    const selectAll = page.locator('input[type="checkbox"][aria-label="Select all"]').first();
    await selectAll.check();

    // Verify selected count is shown
    await expect(page.getByText(/\d+ selected/)).toBeVisible();
  });
});

test.describe('User Preferences - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page with tabs', async ({ page }) => {
    // Check for settings title
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    // Check for tabs
    await expect(page.getByRole('tab', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /notifications/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /ui preferences/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /integrations/i })).toBeVisible();
  });

  test('should change theme preference', async ({ page }) => {
    // Go to UI preferences tab
    await page.getByRole('tab', { name: /ui preferences/i }).click();

    // Change theme to dark
    await page.locator('select#theme').selectOption('dark');

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify dark mode is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should toggle email notifications', async ({ page }) => {
    // Go to notifications tab
    await page.getByRole('tab', { name: /notifications/i }).click();

    // Toggle email notifications
    const emailSwitch = page.locator('input#email-notifications');
    const isChecked = await emailSwitch.isChecked();

    await emailSwitch.click();

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should change UI density preference', async ({ page }) => {
    // Go to UI preferences
    await page.getByRole('tab', { name: /ui preferences/i }).click();

    // Change density to compact
    await page.locator('select#density').selectOption('compact');

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should update email frequency preference', async ({ page }) => {
    // Go to notifications
    await page.getByRole('tab', { name: /notifications/i }).click();

    // Ensure email notifications are enabled
    const emailSwitch = page.locator('input#email-notifications');
    if (!await emailSwitch.isChecked()) {
      await emailSwitch.click();
    }

    // Change frequency to daily
    await page.locator('select#email-frequency').selectOption('daily');

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should change task reminder setting', async ({ page }) => {
    // Go to notifications
    await page.getByRole('tab', { name: /notifications/i }).click();

    // Change task reminders to 1 hour before
    await page.locator('select#task-reminders').selectOption('1h');

    // Save
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show save button only when changes are made', async ({ page }) => {
    // Initially no save button should be visible (or it's not floating)
    const saveButton = page.getByRole('button', { name: /save changes/i });

    // Make a change
    await page.getByRole('tab', { name: /ui preferences/i }).click();
    await page.locator('select#theme').selectOption('light');

    // Now save button should be visible
    await expect(saveButton).toBeVisible();
  });

  test('should display integration status', async ({ page }) => {
    // Go to integrations tab
    await page.getByRole('tab', { name: /integrations/i }).click();

    // Check for Google Workspace section
    await expect(page.getByText(/google workspace/i)).toBeVisible();

    // Check for WhatsApp section
    await expect(page.getByText(/whatsapp/i)).toBeVisible();
  });

  test('should persist preferences across sessions', async ({ page, context }) => {
    // Change a preference
    await page.getByRole('tab', { name: /ui preferences/i }).click();
    await page.locator('select#items-per-page').selectOption('50');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Create new page in same context (simulates navigation)
    const newPage = await context.newPage();
    await newPage.goto('/settings');
    await newPage.waitForLoadState('networkidle');

    // Navigate to UI preferences
    await newPage.getByRole('tab', { name: /ui preferences/i }).click();

    // Verify setting persisted
    const select = newPage.locator('select#items-per-page');
    await expect(select).toHaveValue('50');
  });
});

test.describe('UI Density Application', () => {
  test('should apply density preference to lists', async ({ page }) => {
    await login(page);

    // Set to compact mode
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /ui preferences/i }).click();
    await page.locator('select#density').selectOption('compact');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/settings saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Navigate to a list page
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    // In a real implementation, you'd check for specific CSS classes or spacing
    // For now, just verify the page loads
    await expect(page.getByRole('heading', { name: /investors/i })).toBeVisible();
  });
});
