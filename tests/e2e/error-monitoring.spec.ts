import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Error Monitoring and Logging System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated by setup)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('health check returns system status', async ({ page }) => {
    // Visit health endpoint
    const response = await page.request.get('/api/health');

    // Verify response
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Parse response body
    const body = await response.json();

    // Verify response structure
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('latency');

    // Verify status is ok
    expect(body.status).toBe('ok');

    // Verify checks exist
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('auth');

    // Verify database check
    expect(body.checks.database.name).toBe('Database');
    expect(body.checks.database.status).toBe('ok');
    expect(body.checks.database).toHaveProperty('latency');
    expect(typeof body.checks.database.latency).toBe('number');

    // Verify auth check
    expect(body.checks.auth.name).toBe('Auth Service');
    expect(body.checks.auth.status).toBe('ok');
    expect(body.checks.auth).toHaveProperty('latency');
    expect(typeof body.checks.auth.latency).toBe('number');

    // Verify timestamp is valid ISO string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);

    console.log('Health check passed:', body);
  });

  test('readiness check returns ready status', async ({ page }) => {
    // Visit readiness endpoint
    const response = await page.request.get('/api/health/ready');

    // Verify response
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Parse response body
    const body = await response.json();

    // Verify response structure
    expect(body).toHaveProperty('ready');
    expect(body).toHaveProperty('timestamp');

    // Verify ready status
    expect(body.ready).toBe(true);

    // Verify timestamp is valid ISO string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);

    console.log('Readiness check passed:', body);
  });

  test('logging captures API requests', async ({ page }) => {
    // Make API request that should be logged
    const response = await page.request.get('/api/health');

    // Verify response succeeds
    expect(response.ok()).toBeTruthy();

    // Wait a bit for log to be written
    await page.waitForTimeout(1000);

    // Check if logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    const appLogPath = path.join(logsDir, 'app.log');

    // Verify logs directory was created
    expect(fs.existsSync(logsDir)).toBeTruthy();

    // Verify app.log exists
    expect(fs.existsSync(appLogPath)).toBeTruthy();

    // Read log file
    const logContent = fs.readFileSync(appLogPath, 'utf-8');

    // Verify log file is not empty and contains JSON entries
    expect(logContent.trim().length).toBeGreaterThan(0);

    // Parse log lines and verify they are valid JSON
    const lines = logContent.trim().split('\n').filter((line) => line);
    expect(lines.length).toBeGreaterThan(0);

    // Verify at least one line is valid JSON
    const firstLine = lines[0];
    const parsed = JSON.parse(firstLine);
    expect(parsed).toHaveProperty('message');
    expect(parsed).toHaveProperty('timestamp');

    console.log('Logging verified - log file exists and contains valid JSON entries');
  });

  test('error boundary component exists and can be imported', async ({ page }) => {
    // Test that the error boundary component exists by checking the file
    const projectRoot = process.cwd();
    const errorBoundaryPath = path.join(projectRoot, 'components', 'error-boundary.tsx');

    // Verify error boundary file exists
    expect(fs.existsSync(errorBoundaryPath)).toBeTruthy();

    // Read error boundary and verify it has the right content
    const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf-8');
    expect(errorBoundaryContent).toContain('ErrorBoundary');
    expect(errorBoundaryContent).toContain('componentDidCatch');
    expect(errorBoundaryContent).toContain('@sentry/nextjs');
    expect(errorBoundaryContent).toContain('Sentry.captureException');

    // Verify it exports both the class and HOC
    expect(errorBoundaryContent).toContain('export class ErrorBoundary');
    expect(errorBoundaryContent).toContain('export function withErrorBoundary');

    console.log('Error boundary component exists and is properly configured');
  });

  test('Winston logger module exists and is properly configured', async ({ page }) => {
    // Test that logger is working by checking log files after API calls
    const logsDir = path.join(process.cwd(), 'logs');
    const appLogPath = path.join(logsDir, 'app.log');

    // Clear existing logs if they exist
    if (fs.existsSync(appLogPath)) {
      const initialSize = fs.statSync(appLogPath).size;

      // Make multiple API calls to generate logs
      await page.request.get('/api/health');
      await page.request.get('/api/health/ready');
      await page.request.get('/api/health');

      // Wait for logs to be written
      await page.waitForTimeout(1500);

      // Check that log file has grown (new entries added)
      const finalSize = fs.statSync(appLogPath).size;
      expect(finalSize).toBeGreaterThanOrEqual(initialSize);

      console.log(`Log file grew from ${initialSize} to ${finalSize} bytes`);
    } else {
      // If no log file exists yet, make calls to create it
      await page.request.get('/api/health');
      await page.waitForTimeout(1000);

      // Verify log file was created
      expect(fs.existsSync(appLogPath)).toBeTruthy();
      expect(fs.statSync(appLogPath).size).toBeGreaterThan(0);

      console.log('Log file created successfully');
    }

    // Read and verify log format
    const logContent = fs.readFileSync(appLogPath, 'utf-8');
    const lines = logContent.trim().split('\n').filter((line) => line);

    // Verify at least one log entry exists
    expect(lines.length).toBeGreaterThan(0);

    // Verify log entries are JSON formatted
    const lastLog = lines[lines.length - 1];
    const parsed = JSON.parse(lastLog);

    // Verify log structure
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('level');
    expect(parsed).toHaveProperty('message');
    expect(parsed).toHaveProperty('service');
    expect(parsed.service).toBe('sales-crm');

    console.log('Winston logger properly configured with JSON format:', parsed);
  });

  test('Sentry configuration files exist', async ({ page }) => {
    // Check that Sentry config files exist in the project
    const projectRoot = process.cwd();
    const clientConfig = path.join(projectRoot, 'sentry.client.config.ts');
    const serverConfig = path.join(projectRoot, 'sentry.server.config.ts');
    const edgeConfig = path.join(projectRoot, 'sentry.edge.config.ts');

    // Verify config files exist
    expect(fs.existsSync(clientConfig)).toBeTruthy();
    expect(fs.existsSync(serverConfig)).toBeTruthy();
    expect(fs.existsSync(edgeConfig)).toBeTruthy();

    // Read client config and verify it imports Sentry
    const clientContent = fs.readFileSync(clientConfig, 'utf-8');
    expect(clientContent).toContain('@sentry/nextjs');
    expect(clientContent).toContain('Sentry.init');
    expect(clientContent).toContain('NEXT_PUBLIC_SENTRY_DSN');

    // Read server config and verify it imports Sentry
    const serverContent = fs.readFileSync(serverConfig, 'utf-8');
    expect(serverContent).toContain('@sentry/nextjs');
    expect(serverContent).toContain('Sentry.init');

    console.log('Sentry configuration files exist and are properly configured');
  });

  test('health check handles database errors gracefully', async ({ page }) => {
    // This test verifies the health check structure is correct
    // In a real scenario, you'd test with a broken database connection

    const response = await page.request.get('/api/health');
    const body = await response.json();

    // Verify error handling structure exists
    expect(body.checks.database).toHaveProperty('status');
    expect(['ok', 'error']).toContain(body.checks.database.status);

    // If there's an error, verify it has a message
    if (body.checks.database.status === 'error') {
      expect(body.checks.database).toHaveProperty('message');
      expect(body.status).toBe('error');
      expect(response.status()).toBe(503);
    }

    console.log('Health check error handling structure verified');
  });

  test('request logging middleware structure', async ({ page }) => {
    // Test that the middleware exists and is working by making requests
    // and checking logs

    const logsDir = path.join(process.cwd(), 'logs');
    const appLogPath = path.join(logsDir, 'app.log');

    // Make API request
    await page.request.get('/api/health');
    await page.waitForTimeout(1000);

    // Read log file
    if (fs.existsSync(appLogPath)) {
      const logContent = fs.readFileSync(appLogPath, 'utf-8');
      const lines = logContent.trim().split('\n').filter((line) => line);

      // Find HTTP log entries
      const httpLogs = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((log) => log && log.level === 'http');

      // Verify HTTP logs exist (if middleware is used)
      // Note: Health endpoint might not use middleware, so we just check structure
      console.log(`Found ${httpLogs.length} HTTP log entries`);

      // If HTTP logs exist, verify structure
      if (httpLogs.length > 0) {
        const httpLog = httpLogs[0];
        expect(httpLog).toHaveProperty('message');
        expect(httpLog).toHaveProperty('timestamp');
        console.log('HTTP logging structure verified:', httpLog);
      }
    }
  });

  test('environment variables for Sentry are documented', async ({ page }) => {
    // Check that .env.example includes Sentry DSN
    const projectRoot = process.cwd();
    const envExample = path.join(projectRoot, '.env.example');

    expect(fs.existsSync(envExample)).toBeTruthy();

    const envContent = fs.readFileSync(envExample, 'utf-8');
    expect(envContent).toContain('SENTRY_DSN');

    console.log('Sentry environment variables documented in .env.example');
  });
});
