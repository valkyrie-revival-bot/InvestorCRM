import { defineConfig, devices } from '@playwright/test';

/**
 * Local-only Playwright config — runs against localhost:3003 with E2E_TEST_MODE.
 * Excludes the production/ subdirectory to prevent Google OAuth auth conflicts.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /^(?!.*production\/).*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /tests\/e2e\/auth\.setup\.ts$/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  // Dev server must already be running (started with E2E_TEST_MODE=true)
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
