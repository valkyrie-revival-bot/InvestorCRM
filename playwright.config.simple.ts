import { defineConfig, devices } from '@playwright/test';

/**
 * Simplified production config without auth requirements
 * Tests landing page, public routes, and authenticated features (if manually logged in)
 */
export default defineConfig({
  testDir: './tests/e2e/production',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  workers: 2,
  reporter: [['html', { outputFolder: 'playwright-report-simple' }], ['list']],
  use: {
    baseURL: 'https://valhros.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // No storage state - tests will handle auth individually
      },
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  // No auth setup - skip directly to tests
  testIgnore: ['**/auth.setup.ts', '**/manual-auth.setup.ts'],
});
