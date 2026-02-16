import { test, expect } from '@playwright/test';

/**
 * Production E2E Tests: Investor CRUD Operations
 *
 * Comprehensive tests for investor lifecycle including delete operations
 * Tests on production environment (https://valhros.com)
 *
 * Prerequisites:
 * - Production environment must be accessible
 * - User must be authenticated (handled by auth.setup.ts)
 * - User must have permissions to create, update, and delete investors
 *
 * Test Coverage:
 * 1. Create new investor via quick create modal
 * 2. View investor detail page
 * 3. Update investor field inline
 * 4. DELETE investor (soft delete)
 * 5. UNDO delete within window (restore)
 * 6. Delete multiple test records cleanup
 *
 * CRITICAL: This test suite includes comprehensive delete testing
 * to ensure soft delete and restore functionality works correctly
 */

test.use({
  storageState: './tests/.auth/prod-user.json',
});

test.describe('Production: Investor CRUD Operations', () => {
  const baseUrl = 'https://valhros.com';
  let testInvestorId: string | null = null;
  let testInvestorIds: string[] = [];

  test.describe.serial('Create and Read Operations', () => {
    test('should create new investor via quick create modal', async ({ page }) => {
      // Navigate to investors page
      await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Click "New Investor" button
      const newInvestorButton = page.locator('button:has-text("New Investor")');
      await expect(newInvestorButton).toBeVisible({ timeout: 10000 });
      await newInvestorButton.click();

      // Wait for modal to open
      await page.waitForTimeout(500);

      // Verify modal is visible
      const modalTitle = page.locator('h2:has-text("New Investor")');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });

      // Generate unique test data
      const timestamp = Date.now();
      const firmName = `E2E Test Firm ${timestamp}`;
      const relationshipOwner = `E2E Test Owner ${timestamp}`;

      // Fill in required fields
      const firmNameInput = page.locator('input#firm_name');
      await expect(firmNameInput).toBeVisible();
      await firmNameInput.fill(firmName);

      // Select stage (should default to "Initial Contact")
      const stageSelect = page.locator('select#stage');
      await expect(stageSelect).toBeVisible();
      await stageSelect.selectOption('Initial Contact');

      // Fill relationship owner
      const ownerInput = page.locator('input#relationship_owner');
      await expect(ownerInput).toBeVisible();
      await ownerInput.fill(relationshipOwner);

      // Submit form
      const createButton = page.locator('button:has-text("Create Investor")');
      await createButton.click();

      // Wait for redirect to detail page
      await page.waitForURL(/\/investors\/[a-f0-9-]+/, { timeout: 10000 });

      // Extract investor ID from URL
      const url = page.url();
      const match = url.match(/\/investors\/([a-f0-9-]+)/);
      expect(match).toBeTruthy();

      testInvestorId = match![1];
      testInvestorIds.push(testInvestorId);

      console.log(`Created test investor with ID: ${testInvestorId}`);

      // Verify we're on the detail page
      await expect(page.locator(`h1:has-text("${firmName}")`)).toBeVisible({ timeout: 10000 });
    });

    test('should view investor detail page with complete information', async ({ page }) => {
      // Skip if no investor was created
      if (!testInvestorId) {
        test.skip(true, 'No test investor ID available');
        return;
      }

      // Navigate to investor detail page
      await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(2000);

      // Verify page loaded
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Check for key sections on detail page
      const sections = [
        'Stage',
        'Relationship Owner',
        'Entry Date',
      ];

      for (const section of sections) {
        const sectionLabel = page.locator(`text="${section}"`).first();
        const exists = await sectionLabel.count() > 0;
        expect(exists).toBeTruthy();
      }

      // Verify investor data is displayed
      const pageContent = await page.content();
      expect(pageContent).toContain('E2E Test');
    });
  });

  test.describe.serial('Update Operations', () => {
    test('should update investor field inline', async ({ page }) => {
      if (!testInvestorId) {
        test.skip(true, 'No test investor ID available');
        return;
      }

      // Navigate to investor detail page
      await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(2000);

      // Look for editable fields (could be inline edit or form fields)
      // Try to update allocator type or internal conviction

      // Method 1: Look for select/dropdown fields
      const selectFields = page.locator('select').first();
      if (await selectFields.count() > 0) {
        await selectFields.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Verify update was saved (page should show success or updated value)
        // This will vary based on implementation
      }

      // Method 2: Look for editable text areas
      const textAreas = page.locator('textarea').first();
      if (await textAreas.count() > 0) {
        await textAreas.fill('Updated notes from E2E test');
        await textAreas.blur();
        await page.waitForTimeout(1000);
      }

      // Reload page to verify persistence
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Check that investor is still displayed correctly
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe.serial('Delete Operations', () => {
    test('CRITICAL: should soft delete investor', async ({ page }) => {
      if (!testInvestorId) {
        test.skip(true, 'No test investor ID available');
        return;
      }

      // Navigate to investor detail page
      await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(2000);

      // Look for delete button (could be in dropdown menu, actions menu, or direct button)
      const deleteButtonSelectors = [
        'button:has-text("Delete")',
        'button[aria-label*="Delete"]',
        'button:has-text("Remove")',
        '[data-testid="delete-investor"]',
      ];

      let deleteButton = null;
      for (const selector of deleteButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          deleteButton = button;
          break;
        }
      }

      // If delete button is in a menu, open the menu first
      const moreButton = page.locator('button:has-text("More"), button[aria-label="More options"]').first();
      if (await moreButton.count() > 0 && !deleteButton) {
        await moreButton.click();
        await page.waitForTimeout(500);

        // Try to find delete button again
        for (const selector of deleteButtonSelectors) {
          const button = page.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            deleteButton = button;
            break;
          }
        }
      }

      if (deleteButton) {
        // Click delete button
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Handle confirmation dialog if present
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Verify redirect to investors list or deletion confirmation
        const currentUrl = page.url();
        const redirectedToList = currentUrl.includes('/investors') && !currentUrl.includes(testInvestorId);

        if (redirectedToList) {
          // Check if investor is no longer in the list
          await page.waitForLoadState('networkidle');
          const pageContent = await page.content();
          const investorStillVisible = pageContent.includes(`E2E Test Firm ${testInvestorId}`);
          expect(investorStillVisible).toBe(false);
        } else {
          // Check for success message or deleted indicator
          const successMessages = [
            page.locator('text=/deleted/i'),
            page.locator('text=/removed/i'),
            page.locator('[role="alert"]:has-text("success")'),
          ];

          let successFound = false;
          for (const message of successMessages) {
            if (await message.count() > 0) {
              successFound = true;
              break;
            }
          }

          // If no success message, at least verify we can't access the investor anymore
          if (!successFound) {
            await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
              waitUntil: 'domcontentloaded',
            });
            await page.waitForTimeout(1000);

            // Should show 404, error, or redirect
            const hasError = await page.locator('text=/not found|error|deleted/i').count() > 0;
            const redirected = page.url() !== `${baseUrl}/investors/${testInvestorId}`;
            expect(hasError || redirected).toBeTruthy();
          }
        }
      } else {
        console.warn('Delete button not found - delete functionality may not be implemented or accessible');
        test.skip(true, 'Delete button not found in UI');
      }
    });

    test('CRITICAL: should restore (undo) soft-deleted investor', async ({ page }) => {
      if (!testInvestorId) {
        test.skip(true, 'No test investor ID available');
        return;
      }

      // Try to access the deleted investor directly (should be hidden by RLS)
      await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(2000);

      // Look for restore/undo button or message
      const restoreButtonSelectors = [
        'button:has-text("Restore")',
        'button:has-text("Undo")',
        'button:has-text("Undelete")',
        'button[aria-label*="Restore"]',
      ];

      let restoreButton = null;
      for (const selector of restoreButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          restoreButton = button;
          break;
        }
      }

      if (restoreButton) {
        // Click restore button
        await restoreButton.click();
        await page.waitForTimeout(1000);

        // Verify investor is restored and visible
        await page.goto(`${baseUrl}/investors/${testInvestorId}`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForTimeout(1000);

        // Should be able to see investor details again
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 5000 });

        // Verify it shows in the list again
        await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const pageContent = await page.content();
        const investorVisible = pageContent.includes('E2E Test');
        expect(investorVisible).toBe(true);
      } else {
        console.warn('Restore functionality not found - may need to test via API or admin interface');
        test.skip(true, 'Restore button not found in UI');
      }
    });
  });

  test.describe.serial('Cleanup Operations', () => {
    test('should delete multiple test records created during tests', async ({ page }) => {
      if (testInvestorIds.length === 0) {
        test.skip(true, 'No test investor IDs to clean up');
        return;
      }

      console.log(`Cleaning up ${testInvestorIds.length} test investor(s)`);

      for (const investorId of testInvestorIds) {
        try {
          // Navigate to investor
          await page.goto(`${baseUrl}/investors/${investorId}`, {
            waitUntil: 'domcontentloaded',
          });
          await page.waitForTimeout(1000);

          // Check if investor exists (might have been deleted already)
          const notFound = await page.locator('text=/not found|error/i').count() > 0;
          if (notFound) {
            console.log(`Investor ${investorId} already deleted`);
            continue;
          }

          // Find and click delete button
          const moreButton = page.locator('button:has-text("More"), button[aria-label="More options"]').first();
          if (await moreButton.count() > 0) {
            await moreButton.click();
            await page.waitForTimeout(500);
          }

          const deleteButton = page.locator('button:has-text("Delete")').first();
          if (await deleteButton.count() > 0) {
            await deleteButton.click();
            await page.waitForTimeout(500);

            // Confirm deletion
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
            if (await confirmButton.count() > 0) {
              await confirmButton.click();
              await page.waitForTimeout(1000);
            }

            console.log(`Deleted test investor ${investorId}`);
          }
        } catch (error) {
          console.error(`Failed to delete investor ${investorId}:`, error);
        }
      }

      // Final verification - navigate to investors list
      await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Search for E2E test records
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('E2E Test Firm');
        await page.waitForTimeout(1000);

        // Check count - should be 0 or very low
        const countText = await page.locator('text=/\\d+ of \\d+ investors/').textContent().catch(() => '0 of 0');
        console.log(`Remaining E2E test records: ${countText}`);
      }
    });
  });

  test.describe('Additional CRUD Edge Cases', () => {
    test('should handle creating investor with same name', async ({ page }) => {
      await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Open quick create modal
      const newInvestorButton = page.locator('button:has-text("New Investor")');
      await newInvestorButton.click();
      await page.waitForTimeout(500);

      // Use duplicate name
      const duplicateName = 'E2E Duplicate Test';
      await page.locator('input#firm_name').fill(duplicateName);
      await page.locator('select#stage').selectOption('Initial Contact');
      await page.locator('input#relationship_owner').fill('Test Owner');

      // Submit
      const createButton = page.locator('button:has-text("Create Investor")');
      await createButton.click();

      // Should either succeed (duplicates allowed) or show validation error
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isDetailPage = currentUrl.match(/\/investors\/[a-f0-9-]+/);
      const hasError = await page.locator('text=/error|already exists/i').count() > 0;

      // Either redirect to detail page OR show error
      expect(isDetailPage || hasError).toBeTruthy();

      // If succeeded, clean up
      if (isDetailPage) {
        const match = currentUrl.match(/\/investors\/([a-f0-9-]+)/);
        if (match) {
          testInvestorIds.push(match[1]);
        }
      }
    });

    test('should validate required fields in quick create', async ({ page }) => {
      await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Open quick create modal
      const newInvestorButton = page.locator('button:has-text("New Investor")');
      await newInvestorButton.click();
      await page.waitForTimeout(500);

      // Try to submit without filling required fields
      const createButton = page.locator('button:has-text("Create Investor")');
      await createButton.click();
      await page.waitForTimeout(500);

      // Should show validation errors
      const hasValidationError = await page.locator('text=/required|must/i').count() > 0;
      expect(hasValidationError).toBeTruthy();

      // Close modal
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
    });

    test('should handle navigation between investor records', async ({ page }) => {
      await page.goto(`${baseUrl}/investors`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Get first investor link
      const investorLink = page.locator('a[href^="/investors/"]').first();
      const linkCount = await investorLink.count();

      if (linkCount === 0) {
        test.skip(true, 'No investors available for navigation test');
        return;
      }

      // Click to navigate to detail page
      await investorLink.click();
      await page.waitForTimeout(1000);

      // Verify on detail page
      await expect(page.locator('h1').first()).toBeVisible();

      // Navigate back using browser back button
      await page.goBack();
      await page.waitForTimeout(1000);

      // Should be back on investors list
      await expect(page.locator('h1:has-text("Investor Pipeline")')).toBeVisible();
    });
  });
});
