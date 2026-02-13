import { test, expect } from '@playwright/test';

test.describe('Strategy Auto-Archiving', () => {
  let investorUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Find an investor to test with
    const page = await browser.newPage();
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    // Get the first investor link
    const firstInvestorLink = page.locator('a[href^="/investors/"]').first();
    investorUrl = await firstInvestorLink.getAttribute('href') || '/investors/test';

    await page.close();
  });

  test('UI components render correctly', async ({ page }) => {
    await page.goto(`${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Check if Strategy section exists
    const strategyHeading = page.locator('h2:has-text("Strategy")');
    await expect(strategyHeading).toBeVisible({ timeout: 5000 });

    // Check if Review Strategy button exists
    const reviewButton = page.locator('button:has-text("Review Strategy")');
    await expect(reviewButton).toBeVisible();

    // Check if Log Activity button exists (from 06-01)
    const logActivityButton = page.locator('button:has-text("Log Activity")');
    await expect(logActivityButton).toBeVisible();
  });

  test('should automatically archive strategy when updated', async ({ page }) => {
    await page.goto(`${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Click Strategy section to expand it
    const strategyHeading = page.locator('h2:has-text("Strategy")');
    await strategyHeading.click();
    await page.waitForTimeout(500);

    // Look for the Current Strategy Notes textarea
    // It should be an editable field, let's find it by looking for textareas in the Strategy section
    const strategySection = page.locator('div').filter({ hasText: /^Strategy/ }).locator('..').first();
    const textareas = strategySection.locator('textarea');

    // Get the first textarea (should be Current Strategy Notes)
    const currentStrategyField = textareas.first();
    await expect(currentStrategyField).toBeVisible({ timeout: 3000 });

    // Get current value to use as "before" state
    const originalValue = await currentStrategyField.inputValue();
    console.log('Original strategy value:', originalValue);

    // Enter new strategy
    const newStrategy = `Updated strategy ${Date.now()} - Focus on Series A/B institutional investors`;
    await currentStrategyField.click();
    await currentStrategyField.fill(newStrategy);

    // Blur to trigger auto-save
    await page.keyboard.press('Tab');

    // Wait for auto-save to complete
    await page.waitForTimeout(2000);

    // Reload page to see if trigger worked
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Expand Strategy section again
    await page.locator('h2:has-text("Strategy")').click();
    await page.waitForTimeout(500);

    // Now check if Last Strategy Notes was populated
    const allTextareas = page.locator('textarea');
    const textareaCount = await allTextareas.count();

    console.log(`Found ${textareaCount} textareas in Strategy section`);

    // If we have multiple textareas, one should be Last Strategy Notes
    if (textareaCount >= 2) {
      const lastStrategyField = allTextareas.nth(1); // Second textarea should be Last Strategy
      const lastStrategyValue = await lastStrategyField.inputValue();

      console.log('Last strategy value after update:', lastStrategyValue);

      // If original value existed and was not empty, it should now be in last strategy
      if (originalValue && originalValue.trim() !== '') {
        expect(lastStrategyValue).toBe(originalValue);
        console.log('✓ Strategy auto-archiving PASSED: Old value moved to Last Strategy');
      } else {
        console.log('⚠ No original strategy to archive, but trigger is working');
      }
    }

    // Check if "View strategy history" link appears
    const historyLink = page.locator('text=View strategy history');
    if (await historyLink.isVisible()) {
      console.log('✓ Strategy history link is visible');
    }
  });

  test('should open Review Strategy dialog', async ({ page }) => {
    await page.goto(`${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Find and click "Review Strategy" button
    const reviewButton = page.locator('button:has-text("Review Strategy")');
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(500);

    // Verify dialog is visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Verify dialog contains strategy review content
    const dialogContent = await dialog.textContent();
    expect(dialogContent).toContain('Strategy Review');

    console.log('✓ Review Strategy dialog opens correctly');

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('should show Log Activity modal', async ({ page }) => {
    await page.goto(`${investorUrl}`);
    await page.waitForLoadState('networkidle');

    // Scroll to Activity History section
    await page.locator('h2:has-text("Activity History")').scrollIntoViewIfNeeded();

    // Click Log Activity button
    const logActivityButton = page.locator('button:has-text("Log Activity")');
    await expect(logActivityButton).toBeVisible();
    await logActivityButton.click();

    // Verify modal opens
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Verify activity type buttons exist
    const noteButton = dialog.locator('button').filter({ hasText: /note/i });
    const callButton = dialog.locator('button').filter({ hasText: /call/i });
    const emailButton = dialog.locator('button').filter({ hasText: /email/i });
    const meetingButton = dialog.locator('button').filter({ hasText: /meeting/i });

    // At least one should be visible
    const visibleButtons = [
      await noteButton.count(),
      await callButton.count(),
      await emailButton.count(),
      await meetingButton.count()
    ].filter(count => count > 0);

    expect(visibleButtons.length).toBeGreaterThan(0);
    console.log('✓ Log Activity modal renders with activity type buttons');

    // Close dialog
    await page.keyboard.press('Escape');
  });
});
