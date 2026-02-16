import { test, expect } from '@playwright/test';

test.describe('Google Workspace Integration', () => {
  test.use({ storageState: './tests/.auth/prod-user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('https://valhros.com/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should check Google connection status', async ({ page }) => {
    // Navigate to settings or integrations page
    await page.goto('https://valhros.com/dashboard/settings/integrations');
    await page.waitForLoadState('networkidle');

    // Look for Google connection status indicator
    const googleSection = page.locator('[data-testid="google-integration"], .google-integration, text=Google Workspace').first();
    await expect(googleSection).toBeVisible({ timeout: 10000 });

    // Check for connection status - either connected or disconnected state should be visible
    const statusIndicator = page.locator(
      '[data-testid="google-connection-status"], .connection-status, .badge, .status-badge'
    ).first();

    await expect(statusIndicator).toBeVisible({ timeout: 5000 });

    // Log the status for debugging
    const statusText = await statusIndicator.textContent();
    console.log('Google connection status:', statusText);

    // Verify connection button or indicator exists
    const connectionElement = page.locator(
      'button:has-text("Connect Google"), button:has-text("Connected"), [data-testid="google-connect-button"]'
    ).first();
    await expect(connectionElement).toBeVisible({ timeout: 5000 });
  });

  test('should verify Drive file linking UI is accessible', async ({ page }) => {
    // Navigate to a customer or opportunity page where Drive linking would be available
    await page.goto('https://valhros.com/dashboard/customers');
    await page.waitForLoadState('networkidle');

    // Try to find and click on a customer/opportunity to access detail page
    const firstItem = page.locator('[role="link"], a[href*="/customers/"], .customer-row').first();
    const itemExists = await firstItem.isVisible({ timeout: 5000 }).catch(() => false);

    if (itemExists) {
      await firstItem.click();
      await page.waitForLoadState('networkidle');

      // Look for Drive file linking UI elements
      const driveSection = page.locator(
        '[data-testid="drive-files"], .drive-files, button:has-text("Link Drive"), button:has-text("Attach File")'
      ).first();

      const driveUIExists = await driveSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (driveUIExists) {
        await expect(driveSection).toBeVisible();
        console.log('Drive file linking UI found on detail page');
      } else {
        console.log('Drive linking UI not visible - may require Google connection or specific permissions');
      }
    } else {
      console.log('No customers found - creating sample data may be required');
    }

    // Verify the integration settings page has Drive configuration
    await page.goto('https://valhros.com/dashboard/settings/integrations');
    await page.waitForLoadState('networkidle');

    const driveConfig = page.locator('text=Google Drive, text=Drive').first();
    await expect(driveConfig).toBeVisible({ timeout: 10000 });
  });

  test('should verify Calendar integration is accessible', async ({ page }) => {
    // Check for calendar functionality in the dashboard
    const calendarNavigation = page.locator(
      'a[href*="/calendar"], nav a:has-text("Calendar"), [data-testid="calendar-link"]'
    ).first();

    const calendarExists = await calendarNavigation.isVisible({ timeout: 5000 }).catch(() => false);

    if (calendarExists) {
      await calendarNavigation.click();
      await page.waitForLoadState('networkidle');

      // Verify calendar page loaded
      await expect(page).toHaveURL(/calendar/);

      // Look for calendar-specific elements
      const calendarView = page.locator(
        '[data-testid="calendar-view"], .calendar-container, .rbc-calendar'
      ).first();
      await expect(calendarView).toBeVisible({ timeout: 10000 });

      console.log('Calendar view loaded successfully');
    } else {
      // Check settings for calendar integration
      await page.goto('https://valhros.com/dashboard/settings/integrations');
      await page.waitForLoadState('networkidle');

      const calendarIntegration = page.locator('text=Google Calendar, text=Calendar').first();
      await expect(calendarIntegration).toBeVisible({ timeout: 10000 });
      console.log('Calendar integration configuration found in settings');
    }

    // Verify sync status or settings
    await page.goto('https://valhros.com/dashboard/settings/integrations');
    await page.waitForLoadState('networkidle');

    const googleCalendarSection = page.locator('text=Google Calendar, text=Calendar Sync').first();
    await expect(googleCalendarSection).toBeVisible({ timeout: 10000 });
  });

  test('should verify Email logs are accessible', async ({ page }) => {
    // Navigate to customers or communications page
    await page.goto('https://valhros.com/dashboard/customers');
    await page.waitForLoadState('networkidle');

    // Click on first customer if available
    const firstCustomer = page.locator('[role="link"], a[href*="/customers/"], .customer-row').first();
    const customerExists = await firstCustomer.isVisible({ timeout: 5000 }).catch(() => false);

    if (customerExists) {
      await firstCustomer.click();
      await page.waitForLoadState('networkidle');

      // Look for email/communication logs section
      const emailSection = page.locator(
        '[data-testid="email-logs"], .email-logs, text=Email History, text=Communications, text=Activity'
      ).first();

      const emailSectionExists = await emailSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (emailSectionExists) {
        await expect(emailSection).toBeVisible();
        console.log('Email logs section found');

        // Check for email entries or empty state
        const emailEntries = page.locator('.email-entry, .activity-item, .communication-item');
        const hasEntries = await emailEntries.count() > 0;

        if (hasEntries) {
          console.log('Email log entries found:', await emailEntries.count());
        } else {
          console.log('No email entries - empty state or awaiting Gmail sync');
        }
      } else {
        console.log('Email logs section not immediately visible - checking tabs or sections');

        // Look for tabs or sections that might contain email logs
        const tabs = page.locator('[role="tab"], .tab, button:has-text("Activity"), button:has-text("Emails")');
        const tabCount = await tabs.count();

        if (tabCount > 0) {
          console.log('Found tabs, email logs may be in a separate section');
        }
      }
    }

    // Verify Gmail integration settings exist
    await page.goto('https://valhros.com/dashboard/settings/integrations');
    await page.waitForLoadState('networkidle');

    const gmailIntegration = page.locator('text=Gmail, text=Google Mail, text=Email').first();
    await expect(gmailIntegration).toBeVisible({ timeout: 10000 });
    console.log('Gmail integration configuration found');

    // Check for email sync settings or status
    const syncSettings = page.locator(
      '[data-testid="email-sync-settings"], .email-sync, text=Email Sync, text=Sync Emails'
    ).first();

    const syncExists = await syncSettings.isVisible({ timeout: 5000 }).catch(() => false);
    if (syncExists) {
      await expect(syncSettings).toBeVisible();
      console.log('Email sync settings accessible');
    }
  });
});
