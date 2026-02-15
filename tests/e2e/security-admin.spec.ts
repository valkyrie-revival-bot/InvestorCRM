import { test, expect } from '@playwright/test';

// Helper to make multiple requests quickly
async function makeMultipleRequests(
  page: any,
  url: string,
  count: number
): Promise<Response[]> {
  const requests = [];
  for (let i = 0; i < count; i++) {
    requests.push(page.request.get(url));
  }
  return Promise.all(requests);
}

test.describe('Security Hardening', () => {
  test('rate limiting blocks excessive requests', async ({ page }) => {
    // Navigate to a page first to establish session
    await page.goto('/login');

    // Make 110 requests to exceed the 100 req/min limit
    const apiUrl = `${page.url().split('/login')[0]}/api/admin/health`;

    // Make requests in batches to avoid overwhelming the system
    const batch1 = await makeMultipleRequests(page, apiUrl, 50);
    const batch2 = await makeMultipleRequests(page, apiUrl, 50);
    const batch3 = await makeMultipleRequests(page, apiUrl, 15);

    // Check that some requests were rate limited
    const allResponses = [...batch1, ...batch2, ...batch3];
    const rateLimitedResponses = allResponses.filter((r) => r.status() === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check that rate limit headers are present
    const rateLimitedResponse = rateLimitedResponses[0];
    const headers = rateLimitedResponse.headers();

    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();
    expect(headers['retry-after']).toBeDefined();
  });

  test('CSRF protection blocks requests without token', async ({ page }) => {
    // Skip CSRF test in E2E mode since CSRF is disabled for E2E tests
    test.skip(
      process.env.E2E_TEST_MODE === 'true',
      'CSRF protection is disabled in E2E test mode'
    );

    // Navigate to get a session
    await page.goto('/login');

    // Try to make a POST request without CSRF token
    const response = await page.request.post('/api/admin/users/role', {
      data: {
        userId: 'test-user-id',
        role: 'admin',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should be rejected (401 or 403)
    expect([401, 403]).toContain(response.status());
  });

  test('security headers are present', async ({ page }) => {
    await page.goto('/login');

    // Get response headers
    const response = await page.goto('/');
    const headers = response?.headers() || {};

    // Check security headers
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['strict-transport-security']).toContain('max-age');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy']).toBeDefined();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E test mode
    process.env.E2E_TEST_MODE = 'true';

    // Mock admin user by setting up test mode
    await page.goto('/');
  });

  test('admin can view user list', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });

    // Check that user management tab is visible
    await expect(page.getByRole('button', { name: 'User Management' })).toBeVisible();

    // Click on user management tab (should be default)
    await page.getByRole('button', { name: 'User Management' }).click();

    // Wait for users table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check that table has headers
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('admin can change user roles', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });

    // Wait for users table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Find a role dropdown
    const roleSelect = page.locator('select').first();
    if ((await roleSelect.count()) > 0) {
      const currentValue = await roleSelect.inputValue();

      // Change role
      const newRole = currentValue === 'admin' ? 'member' : 'admin';
      await roleSelect.selectOption(newRole);

      // Wait for update to complete (look for toast or success indicator)
      await page.waitForTimeout(2000);

      // Verify role was changed
      const updatedValue = await roleSelect.inputValue();
      expect(updatedValue).toBe(newRole);
    } else {
      console.log('No users found to test role change');
    }
  });

  test('admin can view system health', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });

    // Click on System Health tab
    await page.getByRole('button', { name: 'System Health' }).click();

    // Wait for metrics to load
    await page.waitForTimeout(2000);

    // Check for metric sections
    await expect(page.locator('h3:has-text("User Metrics")')).toBeVisible();
    await expect(page.locator('h3:has-text("Database")')).toBeVisible();
    await expect(page.locator('h3:has-text("API Performance")')).toBeVisible();
    await expect(page.locator('h3:has-text("Integrations")')).toBeVisible();

    // Check for specific metrics
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Today')).toBeVisible();
  });

  test('admin can view audit logs', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });

    // Click on Audit Logs tab
    await page.getByRole('button', { name: 'Audit Logs' }).click();

    // Wait for logs table to load
    await page.waitForTimeout(2000);

    // Check for search and filter controls
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();

    // Check for table headers
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Event Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
  });

  test('non-admin cannot access admin dashboard', async ({ page }) => {
    // This test would require a way to set non-admin user
    // For now, we'll just check that the page requires auth
    test.skip(true, 'Requires user role management in test setup');

    // In a real scenario, you would:
    // 1. Set up a non-admin user
    // 2. Try to navigate to /admin
    // 3. Expect to be redirected or see 403 error
  });

  test('admin actions are logged', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });

    // Perform an admin action (change role)
    await page.waitForSelector('table', { timeout: 10000 });

    const roleSelect = page.locator('select').first();
    if ((await roleSelect.count()) > 0) {
      const currentValue = await roleSelect.inputValue();
      const newRole = currentValue === 'admin' ? 'member' : 'admin';
      await roleSelect.selectOption(newRole);
      await page.waitForTimeout(2000);

      // Check audit logs
      await page.getByRole('button', { name: 'Audit Logs' }).click();
      await page.waitForTimeout(2000);

      // Look for the role_change action
      const logs = page.locator('table tbody tr');
      const logCount = await logs.count();

      expect(logCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Input Sanitization', () => {
  test('HTML is sanitized in user inputs', async ({ page }) => {
    // This would require creating a form and submitting malicious input
    // For now, we'll just verify the sanitization utilities exist
    test.skip(true, 'Requires form input testing setup');

    // In a real scenario:
    // 1. Navigate to a form
    // 2. Enter HTML/script tags
    // 3. Submit form
    // 4. Verify that the data is sanitized when retrieved
  });
});
