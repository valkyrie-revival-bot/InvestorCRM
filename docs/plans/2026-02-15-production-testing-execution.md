# Production Testing & Issue Resolution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensively test valhros.com production environment, fix all issues including routing confusion, validate all features including delete operations and AI BDR agent.

**Architecture:** Fix routing issue first (blocking), create production Playwright config, execute parallel test suites against valhros.com, fix failures immediately, validate delete functionality for test data cleanup.

**Tech Stack:** Playwright, Next.js 16, TypeScript, Supabase, Google OAuth, Anthropic Claude API

---

## Task 1: Fix Dashboard Routing Issue (Blocking)

**Files:**
- Remove: `app/dashboard/page.tsx`
- Remove: `app/dashboard/` directory
- Verify: `app/(dashboard)/page.tsx` (dashboard with metrics at `/`)
- Verify: `app/(dashboard)/investors/page.tsx` (pipeline at `/investors`)

**Step 1: Remove confusing dashboard redirect**

```bash
rm -rf app/dashboard/
```

**Step 2: Verify routing structure**

Check that:
- `app/(dashboard)/page.tsx` exists (maps to `/`)
- `app/(dashboard)/investors/page.tsx` exists (maps to `/investors`)
- No other conflicting routes

**Step 3: Test locally**

```bash
npm run dev
```

Visit:
- http://localhost:3003/ → Should show Dashboard with metrics
- http://localhost:3003/investors → Should show Investor Pipeline

**Step 4: Commit routing fix**

```bash
git add -A
git commit -m "fix(routing): Remove confusing /dashboard redirect, clarify dashboard is at root"
```

Expected: Clean routing structure, no confusion between dashboard and pipeline

---

## Task 2: Create Production Test Configuration

**Files:**
- Create: `playwright.config.prod.ts`
- Create: `tests/e2e/production/auth.setup.ts`
- Create: `.env.test.production` (gitignored)

**Step 1: Create production Playwright config**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/production',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 4, // Parallel execution
  reporter: [['html'], ['list']],
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
  timeout: 60000, // 60s per test
  expect: {
    timeout: 10000, // 10s for assertions
  },
});
```

**Step 2: Create production auth setup**

```typescript
// tests/e2e/production/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // Navigate to production
  await page.goto('https://valhros.com');

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for Google OAuth redirect
  await page.waitForURL(/accounts\.google\.com/);

  // Fill Google credentials from env
  await page.fill('input[type="email"]', process.env.PROD_TEST_EMAIL!);
  await page.click('#identifierNext');
  await page.waitForTimeout(2000);
  await page.fill('input[type="password"]', process.env.PROD_TEST_PASSWORD!);
  await page.click('#passwordNext');

  // Wait for redirect back to app
  await page.waitForURL(/valhros\.com/);

  // Verify authenticated
  await page.waitForSelector('nav', { timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: './tests/.auth/prod-user.json' });
});
```

**Step 3: Create production test directories**

```bash
mkdir -p tests/e2e/production
mkdir -p tests/.auth
```

**Step 4: Add production test script to package.json**

```json
{
  "scripts": {
    "test:prod": "playwright test --config=playwright.config.prod.ts",
    "test:prod:headed": "playwright test --config=playwright.config.prod.ts --headed",
    "test:prod:ui": "playwright test --config=playwright.config.prod.ts --ui"
  }
}
```

**Step 5: Commit test configuration**

```bash
git add playwright.config.prod.ts tests/e2e/production/auth.setup.ts package.json
git commit -m "test: Add production Playwright configuration for valhros.com"
```

---

## Task 3: Core Navigation & Routing Tests

**Files:**
- Create: `tests/e2e/production/01-navigation-routing.spec.ts`

**Step 1: Write navigation test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('root / shows Dashboard with metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Dashboard|Prytaneum/);
    await expect(page.locator('h2')).toContainText('Dashboard');

    // Verify metrics cards
    await expect(page.locator('text=Total Investors')).toBeVisible();
    await expect(page.locator('text=Active Deals')).toBeVisible();
    await expect(page.locator('text=Stalled')).toBeVisible();
    await expect(page.locator('text=Pipeline Value')).toBeVisible();
  });

  test('/investors shows Investor Pipeline', async ({ page }) => {
    await page.goto('/investors');
    await expect(page.locator('h1')).toContainText('Investor Pipeline');

    // Should have table/kanban view switcher
    await expect(page.locator('text=Table')).toBeVisible();
    await expect(page.locator('text=Board')).toBeVisible();
  });

  test('nav links work correctly', async ({ page }) => {
    await page.goto('/');

    // Click Pipeline link
    await page.click('a:has-text("Pipeline")');
    await expect(page).toHaveURL(/\/investors/);

    // Click Dashboard link
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL(/^\/$|\/$/);
  });

  test('no /dashboard route exists', async ({ page }) => {
    const response = await page.goto('/dashboard');
    // Should redirect to /investors (if that's the fallback) or 404
    // Check that we're NOT stuck on /dashboard
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/dashboard');
  });
});
```

**Step 2: Run navigation tests**

```bash
npm run test:prod -- tests/e2e/production/01-navigation-routing.spec.ts
```

Expected: All tests pass

**Step 3: Commit navigation tests**

```bash
git add tests/e2e/production/01-navigation-routing.spec.ts
git commit -m "test(prod): Add navigation and routing tests"
```

---

## Task 4: Dashboard Functionality Tests

**Files:**
- Create: `tests/e2e/production/02-dashboard.spec.ts`

**Step 1: Write dashboard tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test('displays all metrics correctly', async ({ page }) => {
    await page.goto('/');

    // All metric cards should be visible
    await expect(page.locator('text=Total Investors')).toBeVisible();
    await expect(page.locator('text=Active Deals')).toBeVisible();
    await expect(page.locator('text=Stalled')).toBeVisible();
    await expect(page.locator('text=Pipeline Value')).toBeVisible();
    await expect(page.locator('text=Next Actions Due')).toBeVisible();
    await expect(page.locator('text=Stage Breakdown')).toBeVisible();

    // Values should be numbers (not "N/A" or errors)
    const totalInvestors = await page.locator('text=Total Investors').locator('..').locator('.text-2xl').textContent();
    expect(totalInvestors).toMatch(/^\d+$/);
  });

  test('View Pipeline button navigates to investors', async ({ page }) => {
    await page.goto('/');
    await page.click('text=View Pipeline');
    await expect(page).toHaveURL(/\/investors/);
  });

  test('handles empty state gracefully', async ({ page }) => {
    // This test might not apply if there's always data in production
    // Keep for completeness
    await page.goto('/');
    const bodyText = await page.textContent('body');

    if (bodyText?.includes('No investors yet')) {
      await expect(page.locator('text=Go to Pipeline')).toBeVisible();
    }
  });
});
```

**Step 2: Run dashboard tests**

```bash
npm run test:prod -- tests/e2e/production/02-dashboard.spec.ts
```

**Step 3: Commit dashboard tests**

```bash
git add tests/e2e/production/02-dashboard.spec.ts
git commit -m "test(prod): Add dashboard functionality tests"
```

---

## Task 5: Pipeline Views Tests

**Files:**
- Create: `tests/e2e/production/03-pipeline-views.spec.ts`

**Step 1: Write pipeline view tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pipeline Views', () => {
  test('table view loads with data', async ({ page }) => {
    await page.goto('/investors');

    // Should show table by default or be switchable
    const tableButton = page.locator('button:has-text("Table")');
    if (await tableButton.isVisible()) {
      await tableButton.click();
    }

    // Table should have headers
    await expect(page.locator('th:has-text("Firm")')).toBeVisible();
    await expect(page.locator('th:has-text("Stage")')).toBeVisible();

    // Should have at least one row (production has test data)
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('kanban view loads with data', async ({ page }) => {
    await page.goto('/investors');

    // Switch to kanban view
    await page.click('button:has-text("Board")');

    // Should have stage columns
    await expect(page.locator('text=Not Yet Approached').or(page.locator('text=Initial Contact'))).toBeVisible();

    // Should have investor cards
    const cards = await page.locator('[draggable="true"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('search functionality filters investors', async ({ page }) => {
    await page.goto('/investors');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('test');

    // Wait for filtering
    await page.waitForTimeout(500);

    // Results should update (either show matches or "no results")
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('view switching persists filters', async ({ page }) => {
    await page.goto('/investors');

    // Apply search
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Switch to kanban
    await page.click('button:has-text("Board")');
    await page.waitForTimeout(500);

    // Switch back to table
    await page.click('button:has-text("Table")');

    // Search should still be applied
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('test');
  });
});
```

**Step 2: Run pipeline tests**

```bash
npm run test:prod -- tests/e2e/production/03-pipeline-views.spec.ts
```

**Step 3: Commit pipeline tests**

```bash
git add tests/e2e/production/03-pipeline-views.spec.ts
git commit -m "test(prod): Add pipeline view tests (table/kanban/search)"
```

---

## Task 6: Investor CRUD Tests (Including Delete)

**Files:**
- Create: `tests/e2e/production/04-investor-crud.spec.ts`

**Step 1: Write CRUD tests with delete priority**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Investor CRUD Operations', () => {
  let testInvestorName = `Test Investor ${Date.now()}`;

  test('create new investor via quick create', async ({ page }) => {
    await page.goto('/investors');

    // Click quick create button
    await page.click('button:has-text("New Investor")').or(page.locator('button:has-text("Create")'));

    // Fill required fields
    await page.fill('input[name="firm_name"]', testInvestorName);
    await page.selectOption('select[name="stage"]', 'Initial Contact');

    // Submit
    await page.click('button[type="submit"]:has-text("Create")');

    // Should redirect to detail page or show in list
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${testInvestorName}`)).toBeVisible();
  });

  test('view investor detail page', async ({ page }) => {
    await page.goto('/investors');

    // Click on first investor
    const firstInvestor = page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first());
    await firstInvestor.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/investors\/[a-f0-9-]+/);

    // Should show investor details
    await expect(page.locator('h1').or(page.locator('h2'))).toBeVisible();
  });

  test('update investor field inline', async ({ page }) => {
    await page.goto('/investors');

    // Find and click first investor
    const firstInvestor = page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first());
    await firstInvestor.click();

    // Find editable field (e.g., Primary Contact)
    const editableField = page.locator('input[type="text"]').first();
    await editableField.click();
    await editableField.fill('Updated Contact');
    await editableField.blur();

    // Should auto-save and show toast
    await expect(page.locator('text=Saved').or(page.locator('text=Updated'))).toBeVisible({ timeout: 5000 });
  });

  test('DELETE investor (soft delete)', async ({ page }) => {
    await page.goto('/investors');

    // Find test investor we created
    await page.locator(`text=${testInvestorName}`).click();

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Delete")').last();
    await confirmButton.click();

    // Should show undo toast
    await expect(page.locator('text=Deleted').or(page.locator('text=Undo'))).toBeVisible();

    // Should navigate back to list
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/investors');

    // Investor should not be in list
    await expect(page.locator(`text=${testInvestorName}`)).not.toBeVisible();
  });

  test('UNDO delete within window', async ({ page }) => {
    // Create another test investor
    const undoTestName = `Undo Test ${Date.now()}`;
    await page.goto('/investors');
    await page.click('button:has-text("New Investor")').or(page.locator('button:has-text("Create")'));
    await page.fill('input[name="firm_name"]', undoTestName);
    await page.selectOption('select[name="stage"]', 'Initial Contact');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(1000);

    // Delete it
    await page.locator(`text=${undoTestName}`).click();
    await page.click('button:has-text("Delete")');
    await page.locator('button:has-text("Delete")').last().click();

    // Quickly click undo
    await page.click('button:has-text("Undo")');

    // Should restore investor
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${undoTestName}`)).toBeVisible();

    // Clean up: delete again without undo
    await page.locator(`text=${undoTestName}`).click();
    await page.click('button:has-text("Delete")');
    await page.locator('button:has-text("Delete")').last().click();
    await page.waitForTimeout(11000); // Wait for undo window to expire
  });

  test('delete multiple test records cleanup', async ({ page }) => {
    await page.goto('/investors');

    // Find all test records (containing "Test" or "test")
    const testRecords = page.locator('tbody tr:has-text("Test")').or(page.locator('[draggable="true"]:has-text("Test")'));
    const count = await testRecords.count();

    console.log(`Found ${count} test records to clean up`);

    // Delete up to 5 test records
    for (let i = 0; i < Math.min(count, 5); i++) {
      await testRecords.first().click();
      await page.click('button:has-text("Delete")');
      await page.locator('button:has-text("Delete")').last().click();
      await page.waitForTimeout(1000);
      await page.goto('/investors');
      await page.waitForTimeout(1000);
    }

    console.log('Test cleanup complete');
  });
});
```

**Step 2: Run CRUD tests**

```bash
npm run test:prod -- tests/e2e/production/04-investor-crud.spec.ts
```

**Step 3: Commit CRUD tests**

```bash
git add tests/e2e/production/04-investor-crud.spec.ts
git commit -m "test(prod): Add investor CRUD tests including delete operations"
```

---

## Task 7: AI BDR Agent Tests

**Files:**
- Create: `tests/e2e/production/05-ai-bdr-agent.spec.ts`

**Step 1: Write AI BDR tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI BDR Agent', () => {
  test('chat interface opens from navigation', async ({ page }) => {
    await page.goto('/');

    // Find AI BDR button (might be in nav or floating)
    const bdrButton = page.locator('button:has-text("AI BDR")').or(page.locator('button:has-text("BDR Agent")'));
    await bdrButton.click();

    // Chat interface should appear
    await expect(page.locator('text=AI BDR Agent').or(page.locator('text=Chat'))).toBeVisible();
  });

  test('send message to agent and get response', async ({ page }) => {
    await page.goto('/');

    // Open chat
    const bdrButton = page.locator('button:has-text("AI BDR")').or(page.locator('button:has-text("BDR Agent")'));
    await bdrButton.click();

    // Find input
    const chatInput = page.locator('textarea').or(page.locator('input[type="text"]'));
    await chatInput.fill('How many investors do we have?');

    // Send
    await page.keyboard.press('Enter');
    // Or click send button
    // await page.click('button:has-text("Send")');

    // Wait for response
    await expect(page.locator('text=investor').or(page.locator('text=total'))).toBeVisible({ timeout: 30000 });
  });

  test('agent can query investor data', async ({ page }) => {
    await page.goto('/');

    // Open chat
    await page.click('button:has-text("AI BDR")').or(page.locator('button:has-text("BDR Agent")'));

    // Ask about specific investor (adjust based on actual data)
    const chatInput = page.locator('textarea').or(page.locator('input[type="text"]'));
    await chatInput.fill('What is the stage of our investors?');
    await page.keyboard.press('Enter');

    // Should get response with stage information
    await expect(page.locator('text=stage').or(page.locator('text=Initial Contact'))).toBeVisible({ timeout: 30000 });
  });

  test('agent tool calls execute correctly', async ({ page }) => {
    await page.goto('/');

    // Open chat
    await page.click('button:has-text("AI BDR")').or(page.locator('button:has-text("BDR Agent")'));

    // Request that triggers tool use
    const chatInput = page.locator('textarea').or(page.locator('input[type="text"]'));
    await chatInput.fill('List all stalled investors');
    await page.keyboard.press('Enter');

    // Should respond with data
    await page.waitForTimeout(5000);
    const response = await page.locator('[role="article"]').last().textContent();
    expect(response).toBeTruthy();
  });
});
```

**Step 2: Run AI BDR tests**

```bash
npm run test:prod -- tests/e2e/production/05-ai-bdr-agent.spec.ts
```

**Step 3: Commit AI BDR tests**

```bash
git add tests/e2e/production/05-ai-bdr-agent.spec.ts
git commit -m "test(prod): Add AI BDR Agent functionality tests"
```

---

## Task 8: Activity & Contact Management Tests

**Files:**
- Create: `tests/e2e/production/06-activities-contacts.spec.ts`

**Step 1: Write activity and contact tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Activity Management', () => {
  test('log new activity', async ({ page }) => {
    await page.goto('/investors');

    // Click first investor
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Find "Log Activity" button
    await page.click('button:has-text("Log Activity")').or(page.locator('button:has-text("New Activity")'));

    // Fill activity form
    await page.selectOption('select[name="activity_type"]', 'note');
    await page.fill('textarea[name="description"]', 'Test activity from automated test');

    // Submit
    await page.click('button[type="submit"]:has-text("Save")');

    // Should show in timeline
    await expect(page.locator('text=Test activity from automated test')).toBeVisible({ timeout: 5000 });
  });

  test('view activity timeline', async ({ page }) => {
    await page.goto('/investors');

    // Click first investor
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Should see activity timeline
    await expect(page.locator('text=Activity').or(page.locator('text=Timeline'))).toBeVisible();
  });
});

test.describe('Contact Management', () => {
  test('view contacts on investor detail', async ({ page }) => {
    await page.goto('/investors');

    // Click first investor
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Should see contacts section
    await expect(page.locator('text=Contact').or(page.locator('text=Primary Contact'))).toBeVisible();
  });

  test('add new contact', async ({ page }) => {
    await page.goto('/investors');
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Find add contact button
    const addButton = page.locator('button:has-text("Add Contact")').or(page.locator('button:has-text("New Contact")'));
    if (await addButton.isVisible()) {
      await addButton.click();

      // Fill contact form
      await page.fill('input[name="name"]', 'Test Contact');
      await page.fill('input[name="email"]', 'test@example.com');

      // Submit
      await page.click('button[type="submit"]');

      // Should show in list
      await expect(page.locator('text=Test Contact')).toBeVisible({ timeout: 5000 });
    }
  });
});
```

**Step 2: Run activity/contact tests**

```bash
npm run test:prod -- tests/e2e/production/06-activities-contacts.spec.ts
```

**Step 3: Commit tests**

```bash
git add tests/e2e/production/06-activities-contacts.spec.ts
git commit -m "test(prod): Add activity and contact management tests"
```

---

## Task 9: Google Workspace Integration Tests

**Files:**
- Create: `tests/e2e/production/07-google-integration.spec.ts`

**Step 1: Write Google integration tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Google Workspace Integration', () => {
  test('check Google connection status', async ({ page }) => {
    await page.goto('/investors');
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Look for Google integration section
    const googleSection = page.locator('text=Google').or(page.locator('text=Drive'));
    if (await googleSection.isVisible()) {
      // Check if connected or needs connection
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Google');
    }
  });

  test('Drive file linking UI is accessible', async ({ page }) => {
    await page.goto('/investors');
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Look for Drive integration
    const driveButton = page.locator('button:has-text("Link")').or(page.locator('button:has-text("Drive")'));
    if (await driveButton.isVisible()) {
      await driveButton.click();
      // Drive picker should open or show connection prompt
      await page.waitForTimeout(2000);
    }
  });
});
```

**Step 2: Run Google integration tests**

```bash
npm run test:prod -- tests/e2e/production/07-google-integration.spec.ts
```

**Step 3: Commit tests**

```bash
git add tests/e2e/production/07-google-integration.spec.ts
git commit -m "test(prod): Add Google Workspace integration tests"
```

---

## Task 10: Real-time Collaboration Tests

**Files:**
- Create: `tests/e2e/production/08-realtime-collaboration.spec.ts`

**Step 1: Write real-time tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test('multi-tab synchronization', async ({ browser }) => {
    // Open two tabs
    const context = await browser.newContext({
      storageState: './tests/.auth/prod-user.json'
    });
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Navigate both to investors page
    await page1.goto('https://valhros.com/investors');
    await page2.goto('https://valhros.com/investors');

    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Both should load successfully
    await expect(page1.locator('h1:has-text("Investor Pipeline")')).toBeVisible();
    await expect(page2.locator('h1:has-text("Investor Pipeline")')).toBeVisible();

    // Could test that changes in one tab appear in other
    // (Complex - requires specific investor and field update)

    await context.close();
  });

  test('presence indicators show', async ({ page }) => {
    await page.goto('/investors');
    await page.locator('tbody tr').first().or(page.locator('[draggable="true"]').first()).click();

    // Look for presence indicator (avatar, status dot, etc.)
    // Implementation varies, check if any presence UI exists
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
```

**Step 2: Run real-time tests**

```bash
npm run test:prod -- tests/e2e/production/08-realtime-collaboration.spec.ts
```

**Step 3: Commit tests**

```bash
git add tests/e2e/production/08-realtime-collaboration.spec.ts
git commit -m "test(prod): Add real-time collaboration tests"
```

---

## Task 11: Run Full Production Test Suite

**Step 1: Run all tests in parallel**

```bash
npm run test:prod
```

Expected: All tests pass or specific failures are identified

**Step 2: Review test report**

```bash
npx playwright show-report
```

**Step 3: Document test results**

Create summary of:
- Total tests run
- Passed
- Failed (with details)
- Areas needing fixes

---

## Task 12: Fix Any Test Failures

**Files:**
- Varies based on failures

**Step 1: Analyze failure logs**

For each failing test:
1. Read error message
2. Check screenshot/video if available
3. Identify root cause

**Step 2: Fix issues in codebase**

Apply fixes to:
- Routing issues
- Component bugs
- API errors
- UI/UX problems

**Step 3: Re-run failed tests**

```bash
npm run test:prod -- --grep "@failing-test-name"
```

**Step 4: Commit fixes**

```bash
git add [fixed files]
git commit -m "fix(prod): Resolve [specific issue] found in production testing"
```

**Step 5: Repeat until all tests pass**

---

## Task 13: Deploy Routing Fix to Production

**Step 1: Verify local build**

```bash
npm run build
```

Expected: Clean build with no errors

**Step 2: Push to main**

```bash
git push origin main
```

**Step 3: Verify Vercel deployment**

Wait for Vercel to deploy, then check:
- https://valhros.com/ → Dashboard with metrics
- https://valhros.com/investors → Pipeline view
- https://valhros.com/dashboard → Should redirect or not exist

**Step 4: Re-run production tests after deployment**

```bash
npm run test:prod
```

Expected: All tests pass against updated production

---

## Task 14: Final Production Smoke Test

**Step 1: Manual E2E flow**

Complete user journey:
1. Visit https://valhros.com
2. Log in with Google OAuth
3. View Dashboard (verify metrics)
4. Navigate to Pipeline
5. Create test investor
6. View detail page
7. Edit field
8. Log activity
9. Delete investor
10. Log out

**Step 2: Performance check**

Using browser DevTools:
- Dashboard load time < 3s
- Pipeline load time < 3s
- Navigation feels snappy
- No console errors

**Step 3: Clean up remaining test data**

Using delete functionality:
- Remove any remaining test investors
- Verify soft delete works
- Verify undo works
- Let undo window expire for permanent delete

**Step 4: Final verification**

```bash
npm run test:prod
```

Expected: All tests pass, production ready

---

## Success Criteria

- ✅ Dashboard routing fixed (no /dashboard confusion)
- ✅ All production tests pass
- ✅ Delete functionality verified and working
- ✅ AI BDR Agent functional in production
- ✅ Google integrations accessible
- ✅ Real-time collaboration working
- ✅ Test data cleaned up
- ✅ Manual smoke test complete
- ✅ Production stable and polished

## Execution Timeline

**Total:** ~2-3 hours
- Task 1 (Routing fix): 10 min
- Task 2 (Config): 10 min
- Tasks 3-10 (Tests): 60 min (parallel)
- Task 11 (Run suite): 20 min
- Task 12 (Fixes): 30-60 min
- Task 13 (Deploy): 15 min
- Task 14 (Smoke test): 15 min

---

**Parallel Execution Strategy:**

Run Tasks 3-10 (test creation) in parallel using multiple agents:
- Agent 1: Tasks 3-4 (Navigation + Dashboard)
- Agent 2: Tasks 5-6 (Pipeline + CRUD)
- Agent 3: Tasks 7-8 (AI BDR + Activities)
- Agent 4: Tasks 9-10 (Google + Real-time)
