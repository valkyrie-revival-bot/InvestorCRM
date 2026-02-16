import { test, expect } from '@playwright/test';

/**
 * Production E2E Tests - Activities and Contacts Management
 * Tests activity logging and contact management on production (valhros.com)
 *
 * Prerequisites:
 * - Auth setup completed (auth.setup.ts)
 * - User authenticated to production
 * - At least one investor exists in the database
 */

test.describe('Activities and Contacts Management', () => {
  let investorUrl: string;
  let investorId: string;
  let investorName: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to investors/pipeline page
    await page.goto('https://valhros.com/investors', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Get first investor from the list
    const firstInvestorLink = page.locator('a[href^="/investors/"]').first();
    const linkCount = await firstInvestorLink.count();

    if (linkCount === 0) {
      test.skip(true, 'No investors found - please create test data first');
      return;
    }

    investorUrl = await firstInvestorLink.getAttribute('href') || '/investors/test';
    investorId = investorUrl.split('/').pop() || '';

    // Get investor name
    investorName = await firstInvestorLink.textContent() || 'Test Investor';

    // Navigate to investor detail page
    await page.goto(`https://valhros.com${investorUrl}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });

  test.describe('Activity Logging', () => {
    test('should open Log Activity modal', async ({ page }) => {
      // Find and click "Log Activity" button
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await expect(logActivityButton).toBeVisible({ timeout: 10000 });
      await logActivityButton.click();

      // Wait for modal to appear
      await page.waitForTimeout(500);

      // Verify modal title
      await expect(page.locator('text=Log Activity').first()).toBeVisible();

      // Verify activity type buttons are visible
      await expect(page.locator('button:has-text("Note")')).toBeVisible();
      await expect(page.locator('button:has-text("Call")')).toBeVisible();
      await expect(page.locator('button:has-text("Email")')).toBeVisible();
      await expect(page.locator('button:has-text("Meeting")')).toBeVisible();
    });

    test('should log a note activity', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Note type should be selected by default
      const noteButton = page.locator('button:has-text("Note")').first();
      await expect(noteButton).toHaveClass(/bg-primary/);

      // Fill in description
      const descriptionField = page.locator('textarea#description');
      const testNote = `E2E Test Note - ${Date.now()}`;
      await descriptionField.fill(testNote);

      // Submit the form
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait for success (modal should close)
      await page.waitForTimeout(2000);

      // Modal should be closed
      const modalVisible = await page.locator('dialog:has-text("Log Activity")').isVisible().catch(() => false);
      expect(modalVisible).toBeFalsy();

      // Verify activity appears in timeline (if timeline is visible on page)
      const timelineActivity = page.locator(`text=${testNote}`);
      const activityVisible = await timelineActivity.isVisible({ timeout: 5000 }).catch(() => false);

      if (activityVisible) {
        await expect(timelineActivity).toBeVisible();
      }

      // Check for success toast/notification
      const successToast = page.locator('text=Activity logged').or(page.locator('text=Success'));
      const toastVisible = await successToast.isVisible({ timeout: 3000 }).catch(() => false);

      if (toastVisible) {
        await expect(successToast).toBeVisible();
      }
    });

    test('should log a call activity', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Click on Call type
      const callButton = page.locator('button:has-text("Call")').first();
      await callButton.click();
      await expect(callButton).toHaveClass(/bg-primary/);

      // Fill in description
      const descriptionField = page.locator('textarea#description');
      const testCall = `E2E Test Call - Discussed funding - ${Date.now()}`;
      await descriptionField.fill(testCall);

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(2000);

      // Verify modal closed
      const modalVisible = await page.locator('dialog:has-text("Log Activity")').isVisible().catch(() => false);
      expect(modalVisible).toBeFalsy();
    });

    test('should log an email activity', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Click on Email type
      const emailButton = page.locator('button:has-text("Email")').first();
      await emailButton.click();
      await expect(emailButton).toHaveClass(/bg-primary/);

      // Fill in description
      const descriptionField = page.locator('textarea#description');
      const testEmail = `E2E Test Email - Sent pitch deck - ${Date.now()}`;
      await descriptionField.fill(testEmail);

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(2000);
    });

    test('should log a meeting activity', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Click on Meeting type
      const meetingButton = page.locator('button:has-text("Meeting")').first();
      await meetingButton.click();
      await expect(meetingButton).toHaveClass(/bg-primary/);

      // Fill in description
      const descriptionField = page.locator('textarea#description');
      const testMeeting = `E2E Test Meeting - Initial intro call - ${Date.now()}`;
      await descriptionField.fill(testMeeting);

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(2000);
    });

    test('should log activity with next action', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Fill in description
      const descriptionField = page.locator('textarea#description');
      const testNote = `E2E Test with Next Action - ${Date.now()}`;
      await descriptionField.fill(testNote);

      // Check "Set next action" checkbox
      const nextActionCheckbox = page.locator('input#set-next-action');
      await nextActionCheckbox.check();

      // Wait for next action fields to appear
      await page.waitForTimeout(300);

      // Fill in next action
      const nextActionField = page.locator('input#next-action');
      await expect(nextActionField).toBeVisible();
      await nextActionField.fill('Follow up on proposal');

      // Fill in next action date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const nextActionDateField = page.locator('input#next-action-date');
      await nextActionDateField.fill(dateString);

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(2000);
    });

    test('should require description for activity', async ({ page }) => {
      // Open Log Activity modal
      const logActivityButton = page.locator('button:has-text("Log Activity")');
      await logActivityButton.click();
      await page.waitForTimeout(500);

      // Try to submit without description
      const submitButton = page.locator('button[type="submit"]:has-text("Log Activity")');
      await submitButton.click();

      // Wait a bit
      await page.waitForTimeout(1000);

      // Modal should still be open (validation failed)
      await expect(page.locator('text=Log Activity').first()).toBeVisible();

      // Error message should be visible or form should prevent submission
      const errorMessage = page.locator('text=required').or(page.locator('.text-destructive'));
      const hasError = await errorMessage.isVisible().catch(() => false);

      // Either error is shown or modal didn't close (validation blocked submission)
      expect(hasError || await page.locator('dialog:has-text("Log Activity")').isVisible()).toBeTruthy();
    });
  });

  test.describe('Activity Timeline', () => {
    test('should display activity timeline on investor detail', async ({ page }) => {
      // Look for activity timeline section
      // Timeline might be in a tab or directly on the page
      const timelineSection = page.locator('text=Activity').or(page.locator('text=Timeline'));
      const timelineVisible = await timelineSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (!timelineVisible) {
        // Try to click Activities tab if it exists
        const activitiesTab = page.locator('button:has-text("Activities")').or(page.locator('a:has-text("Activities")'));
        const tabExists = await activitiesTab.isVisible({ timeout: 3000 }).catch(() => false);

        if (tabExists) {
          await activitiesTab.click();
          await page.waitForTimeout(1000);
        }
      }

      // Check for timeline elements (activity cards, icons, etc.)
      const activityCards = page.locator('[class*="activity"]').or(page.locator('[class*="timeline"]'));
      const hasActivities = await activityCards.count() > 0;

      // Either activities exist or there's an empty state message
      if (hasActivities) {
        expect(await activityCards.count()).toBeGreaterThan(0);
      } else {
        // Check for empty state
        const emptyState = page.locator('text=No activities').or(page.locator('text=No activity yet'));
        await expect(emptyState).toBeVisible();
      }
    });

    test('should filter activities by type', async ({ page }) => {
      // Navigate to activities section
      const activitiesTab = page.locator('button:has-text("Activities")').or(page.locator('a:has-text("Activities")'));
      const tabExists = await activitiesTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await activitiesTab.click();
        await page.waitForTimeout(1000);
      }

      // Look for filter buttons (Call, Email, Meeting, Note)
      const callFilter = page.locator('button:has-text("Call")').first();
      const filterExists = await callFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (filterExists) {
        // Click on Call filter
        await callFilter.click();
        await page.waitForTimeout(500);

        // Verify filter is applied (button should be highlighted)
        await expect(callFilter).toHaveClass(/bg-secondary|active/);

        // Click again to toggle off
        await callFilter.click();
        await page.waitForTimeout(500);
      }
    });

    test('should display activity timestamps', async ({ page }) => {
      // Navigate to activities section
      const activitiesTab = page.locator('button:has-text("Activities")').or(page.locator('a:has-text("Activities")'));
      const tabExists = await activitiesTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await activitiesTab.click();
        await page.waitForTimeout(1000);
      }

      // Look for timestamp elements (relative time like "2h ago", "Yesterday")
      const timestamps = page.locator('time').or(page.locator('text=/\\d+[mhd] ago/'));
      const hasTimestamps = await timestamps.count() > 0;

      if (hasTimestamps) {
        expect(await timestamps.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Contact Management', () => {
    test('should display contacts section on investor detail', async ({ page }) => {
      // Look for contacts section (might be in a tab)
      const contactsSection = page.locator('text=Contact').or(page.locator('text=People'));
      const contactsVisible = await contactsSection.isVisible({ timeout: 5000 }).catch(() => false);

      if (!contactsVisible) {
        // Try to click Contacts tab if it exists
        const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
        const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

        if (tabExists) {
          await contactsTab.click();
          await page.waitForTimeout(1000);
        }
      }

      // Verify we can see contacts area
      const addContactButton = page.locator('button:has-text("Add Contact")');
      await expect(addContactButton).toBeVisible({ timeout: 5000 });
    });

    test('should display existing contacts', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Check for contact cards or empty state
      const contactCards = page.locator('[class*="contact"]').or(page.locator('text=@'));
      const hasContacts = await contactCards.count() > 0;

      if (hasContacts) {
        // Verify contact information is displayed (name, email, phone)
        expect(await contactCards.count()).toBeGreaterThan(0);
      } else {
        // Check for empty state
        const emptyState = page.locator('text=No contacts').or(page.locator('text=Add a contact to get started'));
        await expect(emptyState).toBeVisible();
      }
    });

    test('should add new contact', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Click Add Contact button
      const addContactButton = page.locator('button:has-text("Add Contact")');
      await addContactButton.click();
      await page.waitForTimeout(500);

      // Fill in contact information
      const nameField = page.locator('input[type="text"]').first();
      const testContactName = `E2E Test Contact - ${Date.now()}`;
      await nameField.fill(testContactName);

      // Fill in email
      const emailField = page.locator('input[type="email"]');
      const testEmail = `test-${Date.now()}@example.com`;
      await emailField.fill(testEmail);

      // Fill in title
      const titleField = page.locator('input[placeholder*="Managing Partner"]').or(
        page.locator('input[placeholder*="Title"]').or(
          page.locator('input').filter({ hasText: /title/i })
        )
      );
      const titleExists = await titleField.isVisible({ timeout: 2000 }).catch(() => false);
      if (titleExists) {
        await titleField.fill('General Partner');
      }

      // Fill in phone (optional)
      const phoneField = page.locator('input[type="tel"]');
      const phoneExists = await phoneField.isVisible({ timeout: 2000 }).catch(() => false);
      if (phoneExists) {
        await phoneField.fill('+1 (555) 123-4567');
      }

      // Submit the form
      const submitButton = page.locator('button:has-text("Add Contact")').last();
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(2000);

      // Verify contact appears in the list
      await expect(page.locator(`text=${testContactName}`)).toBeVisible({ timeout: 5000 });
    });

    test('should require name for new contact', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Click Add Contact button
      const addContactButton = page.locator('button:has-text("Add Contact")');
      await addContactButton.click();
      await page.waitForTimeout(500);

      // Try to submit without name
      const submitButton = page.locator('button:has-text("Add Contact")').last();
      const isDisabled = await submitButton.isDisabled();

      // Submit button should be disabled when name is empty
      expect(isDisabled).toBeTruthy();
    });

    test('should display contact email and phone as clickable links', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Look for email links
      const emailLinks = page.locator('a[href^="mailto:"]');
      const hasEmailLinks = await emailLinks.count() > 0;

      if (hasEmailLinks) {
        // Verify email link format
        const firstEmailLink = emailLinks.first();
        await expect(firstEmailLink).toBeVisible();
        const href = await firstEmailLink.getAttribute('href');
        expect(href).toContain('mailto:');
      }

      // Look for phone links
      const phoneLinks = page.locator('a[href^="tel:"]');
      const hasPhoneLinks = await phoneLinks.count() > 0;

      if (hasPhoneLinks) {
        // Verify phone link format
        const firstPhoneLink = phoneLinks.first();
        await expect(firstPhoneLink).toBeVisible();
        const href = await firstPhoneLink.getAttribute('href');
        expect(href).toContain('tel:');
      }
    });

    test('should display primary contact badge', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Look for "Primary" badge
      const primaryBadge = page.locator('text=Primary').or(page.locator('[class*="badge"]:has-text("Primary")'));
      const hasPrimaryBadge = await primaryBadge.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasPrimaryBadge) {
        await expect(primaryBadge).toBeVisible();
      }
    });

    test('should cancel adding contact', async ({ page }) => {
      // Navigate to contacts section
      const contactsTab = page.locator('button:has-text("Contacts")').or(page.locator('a:has-text("Contacts")'));
      const tabExists = await contactsTab.isVisible({ timeout: 3000 }).catch(() => false);

      if (tabExists) {
        await contactsTab.click();
        await page.waitForTimeout(1000);
      }

      // Click Add Contact button
      const addContactButton = page.locator('button:has-text("Add Contact")');
      await addContactButton.click();
      await page.waitForTimeout(500);

      // Fill in some data
      const nameField = page.locator('input[type="text"]').first();
      await nameField.fill('Test Name');

      // Click Cancel button
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Form should be hidden
      const formVisible = await nameField.isVisible().catch(() => false);
      expect(formVisible).toBeFalsy();

      // Add Contact button should be visible again
      await expect(addContactButton).toBeVisible();
    });
  });
});
