import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/production',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 4,
  reporter: [['html', { outputFolder: 'playwright-report-prod' }], ['list']],
  use: {
    baseURL: 'https://valhros.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/.auth/prod-user.json',
      },
      dependencies: ['setup'],
    },
  ],
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
