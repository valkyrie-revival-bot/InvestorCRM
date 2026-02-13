import { test, expect } from '@playwright/test';

/**
 * Simple authentication test
 */

test('can access protected route', async ({ page }) => {
  await page.goto('http://localhost:3003/investors');
  await page.waitForLoadState('networkidle');

  const url = page.url();
  console.log('Current URL:', url);

  // Check we're not redirected to login
  expect(url).not.toContain('/login');
  expect(url).toContain('/investors');

  // Take a screenshot for debugging
  await page.screenshot({ path: 'tests/.auth/auth-test.png' });

  console.log('✅ Auth test passed - can access protected route');
});
