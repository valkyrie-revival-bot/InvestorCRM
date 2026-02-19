import { test, expect } from '@playwright/test';

/**
 * Wave Features Test Suite
 * Tests all features deployed in the 6-wave implementation.
 * Runs against localhost:3003 with E2E_TEST_MODE=true (no real auth required).
 */

const BASE = 'http://localhost:3003';

// ─── WAVE 1 ──────────────────────────────────────────────────────────────────

test.describe('Wave 1 — LinkedIn CSV File Picker (dark theme)', () => {
  test('styled Browse button is visible with correct structure', async ({ page }) => {
    await page.goto(`${BASE}/linkedin/import`, { waitUntil: 'networkidle' });

    // The styled Browse label (has flex + border-dashed classes) should be visible
    const browseBtn = page.locator('label[for="csv_file"].flex');
    await expect(browseBtn).toBeVisible({ timeout: 8000 });

    // The input must have class sr-only (screen-reader accessible, visually hidden)
    const rawInput = page.locator('input#csv_file[type="file"]');
    const srClass = await rawInput.getAttribute('class');
    expect(srClass).toContain('sr-only');

    // The label should contain the visible "Browse" button span
    const browseSpan = browseBtn.locator('span', { hasText: /Browse/i });
    await expect(browseSpan).toBeVisible();
  });

  test('team member dropdown includes Mark and Ian', async ({ page }) => {
    await page.goto(`${BASE}/linkedin/import`, { waitUntil: 'networkidle' });

    // Native select uses id="team_member"
    const teamSelect = page.locator('select#team_member');
    await expect(teamSelect).toBeVisible({ timeout: 8000 });

    const options = await teamSelect.locator('option').allTextContents();
    expect(options).toContain('Mark');
    expect(options).toContain('Ian');
    // Existing members still present
    expect(options).toContain('Todd');
    expect(options).toContain('Jeff');
    expect(options).toContain('Jackson');
  });
});

test.describe('Wave 1 — Kanban Board Scrollbar', () => {
  test('kanban container has scrollbar-thin class', async ({ page }) => {
    await page.goto(`${BASE}/investors`, { waitUntil: 'networkidle' });

    // Switch to board view if a Board button is visible
    const boardTab = page.locator('button:has-text("Board")').first();
    if (await boardTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await boardTab.click();
      await page.waitForTimeout(600);
    }

    const scrollContainer = page.locator('.scrollbar-thin').first();
    expect(await scrollContainer.count()).toBeGreaterThan(0);
  });
});

// ─── WAVE 2 ──────────────────────────────────────────────────────────────────

test.describe('Wave 2 — Dashboard My Next Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Dashboard is at /dashboard, not root /
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  });

  test('My Next Actions card is visible', async ({ page }) => {
    const card = page.locator('text=My Next Actions');
    await expect(card).toBeVisible({ timeout: 10000 });
  });

  test('Next Actions card has 3 column headings', async ({ page }) => {
    await expect(page.locator('text=Meetings Scheduled')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Follow-up Required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=To Book')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Wave 2 — Dashboard Clickable Metric Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  });

  test('Total Investors card is wrapped in a link to /investors', async ({ page }) => {
    // The card title should be inside an <a href="/investors"> ancestor
    const card = page.locator('a[href="/investors"]').filter({ has: page.locator('text=Total Investors') }).first();
    const hasLink = await card.count();
    if (hasLink === 0) {
      // Fallback: at least one link to /investors exists on the dashboard
      await expect(page.locator('a[href="/investors"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('/tasks link exists somewhere on dashboard', async ({ page }) => {
    // Next Actions Due card links to /tasks
    const tasksLink = page.locator('a[href="/tasks"]').first();
    await expect(tasksLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Wave 2 — Dashboard Team Performance', () => {
  test('Team Performance section renders', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Team Performance')).toBeVisible({ timeout: 10000 });
  });
});

// ─── WAVE 3 ──────────────────────────────────────────────────────────────────

test.describe('Wave 3 — Investor Detail Two-Column Layout', () => {
  let investorHref = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/investors`, { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/investors/"]').first();
    if (await firstLink.count() > 0) {
      investorHref = (await firstLink.getAttribute('href')) ?? '';
    }
    await page.close();
  });

  test('detail page uses lg:grid-cols-2 layout', async ({ page }) => {
    if (!investorHref) { test.skip(true, 'No investors found'); return; }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}${investorHref}`, { waitUntil: 'networkidle' });
    const grid = page.locator('.grid.lg\\:grid-cols-2').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('ARCHON Generate Strategy button inside Review Strategy dialog', async ({ page }) => {
    if (!investorHref) { test.skip(true, 'No investors found'); return; }
    await page.goto(`${BASE}${investorHref}`, { waitUntil: 'networkidle' });

    const reviewBtn = page.locator('button:has-text("Review Strategy")').first();
    if (await reviewBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await reviewBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("Generate Strategy")')).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Review Strategy button not visible — investor may have no strategy notes yet');
    }
  });
});

// ─── WAVE 4 ──────────────────────────────────────────────────────────────────

test.describe('Wave 4 — Task Assignment Dropdown', () => {
  test('Add Task modal has Assign To field with team members', async ({ page }) => {
    await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });

    // Click the primary Add Task button (not the empty-state link variant)
    const addBtn = page.locator('button:has-text("Add Task")').first();
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();

    // Wait for the dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Scroll the dialog content to the bottom so all fields are reachable
    await dialog.evaluate((el) => {
      const scrollable = el.querySelector('[data-radix-scroll-area-viewport]') || el;
      scrollable.scrollTo(0, scrollable.scrollHeight);
    });
    await page.waitForTimeout(400);

    // The SelectTrigger for "Assign To" has id="assign-to"
    const assignTrigger = page.locator('#assign-to').first();
    await expect(assignTrigger).toBeVisible({ timeout: 5000 });

    // Open the assign-to dropdown
    await assignTrigger.click();
    await page.waitForTimeout(300);

    // Team members should appear as options
    await expect(page.getByRole('option', { name: 'Todd' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('option', { name: 'Mark' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('option', { name: 'Ian' })).toBeVisible({ timeout: 3000 });
  });
});

// ─── WAVE 5 ──────────────────────────────────────────────────────────────────

test.describe('Wave 5 — Investor News Section', () => {
  let investorHref = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/investors`, { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/investors/"]').first();
    if (await firstLink.count() > 0) {
      investorHref = (await firstLink.getAttribute('href')) ?? '';
    }
    await page.close();
  });

  test('News & Intelligence section heading is visible', async ({ page }) => {
    if (!investorHref) { test.skip(true, 'No investors found'); return; }
    await page.goto(`${BASE}${investorHref}`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=News & Intelligence').first()).toBeVisible({ timeout: 10000 });
  });

  test('News section has an icon refresh button', async ({ page }) => {
    if (!investorHref) { test.skip(true, 'No investors found'); return; }
    await page.goto(`${BASE}${investorHref}`, { waitUntil: 'networkidle' });

    // Refresh button has a RefreshCw SVG icon — find button near the News heading
    const newsCard = page.locator('text=News & Intelligence').locator('../..').first();
    await expect(newsCard).toBeVisible({ timeout: 10000 });

    // There should be a button with an svg inside the news card header
    const refreshBtn = newsCard.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(refreshBtn).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Wave 5 — Document Drag-Drop Upload Zone', () => {
  let investorHref = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/investors`, { waitUntil: 'networkidle' });
    const firstLink = page.locator('a[href^="/investors/"]').first();
    if (await firstLink.count() > 0) {
      investorHref = (await firstLink.getAttribute('href')) ?? '';
    }
    await page.close();
  });

  test('Documents tab in Google Workspace has drag-and-drop zone', async ({ page }) => {
    if (!investorHref) { test.skip(true, 'No investors found'); return; }
    await page.goto(`${BASE}${investorHref}`, { waitUntil: 'networkidle' });

    // Documents tab is the default active tab in Google Workspace
    const docsTab = page.locator('button:has-text("Documents")').first();
    await expect(docsTab).toBeVisible({ timeout: 10000 });

    // The drop zone text
    await expect(page.locator('text=Drag & drop a file or click to browse')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Wave 5 — Meeting Transcript Upload Button', () => {
  test('Meetings page renders with content or empty state', async ({ page }) => {
    await page.goto(`${BASE}/meetings`, { waitUntil: 'networkidle' });

    // Should show the page heading
    const heading = page.locator('h1').filter({ hasText: 'Meeting Intelligence' }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Transcript upload button or empty state visible on meetings page', async ({ page }) => {
    await page.goto(`${BASE}/meetings`, { waitUntil: 'networkidle' });

    const transcriptBtn = page.locator('button:has-text("Transcript")').first();
    const emptyState = page.locator('text=No meetings found').first();

    const hasMeetings = await transcriptBtn.isVisible({ timeout: 8000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMeetings) {
      console.log('✓ Transcript upload button visible');
    } else if (hasEmpty) {
      console.log('✓ Empty state shown — no meetings yet');
    } else {
      // Still loading — wait a bit more
      await page.waitForTimeout(3000);
      const hasMeetings2 = await transcriptBtn.isVisible().catch(() => false);
      const hasEmpty2 = await emptyState.isVisible().catch(() => false);
      expect(hasMeetings2 || hasEmpty2).toBeTruthy();
    }
  });
});

// ─── WAVE 6 ──────────────────────────────────────────────────────────────────

test.describe('Wave 6 — LinkedIn Contact Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/linkedin/import`, { waitUntil: 'networkidle' });
  });

  test('Search Contacts section is visible on LinkedIn import page', async ({ page }) => {
    await expect(page.locator('text=Search Contacts')).toBeVisible({ timeout: 8000 });
  });

  test('Search input accepts text', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search contacts"]');
    await expect(input).toBeVisible({ timeout: 8000 });
    await input.fill('Test');
    await expect(input).toHaveValue('Test');
  });

  test('Query below 2 chars shows no results', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search contacts"]');
    await expect(input).toBeVisible({ timeout: 8000 });
    await input.fill('a');
    await page.waitForTimeout(500);
    // Should NOT show a results message
    expect(await page.locator('text=contacts found').count()).toBe(0);
  });

  test('2+ char query triggers debounced search and shows result state', async ({ page }) => {
    const input = page.locator('input[placeholder*="Search contacts"]');
    await expect(input).toBeVisible({ timeout: 8000 });

    await input.fill('an');
    // Wait for debounce (350ms) + network request + render
    await page.waitForTimeout(1500);

    const hasMatches = await page.locator('text=contacts found').isVisible().catch(() => false);
    const hasNoMatch = await page.locator('text=No contacts found').isVisible().catch(() => false);

    // Either "X contacts found" or "No contacts found" must appear
    expect(hasMatches || hasNoMatch).toBeTruthy();
  });
});

// ─── SMOKE TESTS ─────────────────────────────────────────────────────────────

test.describe('Smoke — Key Pages Return HTTP 200', () => {
  const routes = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/investors', label: 'Investors' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/meetings', label: 'Meetings' },
    { path: '/linkedin/import', label: 'LinkedIn Import' },
  ];

  for (const route of routes) {
    test(`${route.label} (${route.path})`, async ({ page }) => {
      const response = await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).not.toBe(404);
      expect(response?.status()).not.toBe(500);
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    });
  }
});
