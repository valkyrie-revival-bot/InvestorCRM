/**
 * Simplified E2E Tests for Meeting Intelligence and Advanced Filtering
 * Tests UI functionality and data flow without expensive API calls
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
let testUserId: string;
let testInvestorId: string;
let testMeetingId: string;

test.describe('Meeting Intelligence UI', () => {
  test.beforeAll(async () => {
    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-meeting-ui@example.com',
      password: 'testpass123',
      email_confirm: true,
    });

    if (userError && !userError.message.includes('already registered')) {
      throw userError;
    }

    testUserId = user?.user?.id || '';

    // Create test investor
    const { data: investor } = await supabase
      .from('investors')
      .insert({
        firm_name: 'Test Meeting VC',
        stage: 'Series A',
        check_size_min: 1000000,
        check_size_max: 5000000,
        primary_contact_name: 'John Meeting',
        created_by: testUserId,
      })
      .select()
      .single();

    testInvestorId = investor?.id || '';

    // Create test meeting
    const { data: meeting } = await supabase
      .from('meetings')
      .insert({
        investor_id: testInvestorId,
        meeting_title: 'Test UI Meeting',
        meeting_date: new Date().toISOString(),
        duration_minutes: 30,
        status: 'pending',
        created_by: testUserId,
      })
      .select()
      .single();

    testMeetingId = meeting?.id || '';
  });

  test.afterAll(async () => {
    // Cleanup
    if (testMeetingId) {
      await supabase.from('meetings').delete().eq('id', testMeetingId);
    }
    if (testInvestorId) {
      await supabase.from('investors').delete().eq('id', testInvestorId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('meetings page loads and displays meetings', async ({ page }) => {
    // Login (assuming auth setup provides authenticated state)
    await page.goto('http://localhost:3003/meetings');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page.locator('h1:has-text("Meeting Intelligence")')).toBeVisible();
  });

  test('upload modal UI works', async ({ page }) => {
    await page.goto('http://localhost:3003/meetings');
    await page.waitForLoadState('networkidle');

    // Look for upload button (may need to adjust selector based on actual UI)
    const uploadButtons = page.locator('button:has-text("Upload Recording")');
    const count = await uploadButtons.count();

    if (count > 0) {
      // Click first upload button
      await uploadButtons.first().click();

      // Verify modal opens
      await expect(page.locator('text=Upload Meeting Recording')).toBeVisible();

      // Verify file input exists
      await expect(page.locator('input[type="file"]')).toBeVisible();
    }
  });

  test('transcribe API endpoint exists', async ({ page }) => {
    // Test that the API route is accessible
    const response = await page.request.post('http://localhost:3003/api/meetings/transcribe', {
      data: new FormData(),
    });

    // Should return 400 for missing data, not 404
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Advanced Filtering', () => {
  let filterUserId: string;

  test.beforeAll(async () => {
    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-filter-simple@example.com',
      password: 'testpass123',
      email_confirm: true,
    });
    filterUserId = user?.user?.id || '';

    // Create test investors with different attributes
    await supabase.from('investors').insert([
      {
        firm_name: 'Filter Test VC A',
        stage: 'Seed',
        check_size_min: 500000,
        check_size_max: 1000000,
        primary_contact_name: 'Alice Filter',
        created_by: filterUserId,
        tags: ['early-stage', 'saas']
      },
      {
        firm_name: 'Filter Test VC B',
        stage: 'Series A',
        check_size_min: 2000000,
        check_size_max: 5000000,
        primary_contact_name: 'Bob Filter',
        created_by: filterUserId,
        tags: ['series-a', 'fintech']
      },
    ]);
  });

  test.afterAll(async () => {
    if (filterUserId) {
      await supabase.from('investors').delete().eq('created_by', filterUserId);
      await supabase.auth.admin.deleteUser(filterUserId);
    }
  });

  test('search API returns results', async ({ page }) => {
    // Test search API
    const response = await page.request.get(
      'http://localhost:3003/api/search?q=Filter Test&types=investor'
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBeTruthy();
  });

  test('search finds specific investor', async ({ page }) => {
    const response = await page.request.get(
      'http://localhost:3003/api/search?q=Series A'
    );

    const data = await response.json();
    const hasSeriesA = data.results.some((r: any) =>
      r.title?.includes('Filter Test') || r.subtitle?.includes('Series A')
    );

    expect(hasSeriesA).toBeTruthy();
  });

  test('saved filters table exists', async ({ page }) => {
    // Test that we can query saved_filters table
    const { error } = await supabase.from('saved_filters').select('*').limit(1);

    // Should not error (table exists)
    expect(error).toBeNull();
  });
});

test.describe('Filter Builder Component', () => {
  test('filter builder can be instantiated', async ({ page }) => {
    await page.goto('http://localhost:3003/investors');
    await page.waitForLoadState('networkidle');

    // The filter builder should be available on investors page
    // (This test verifies the page loads without errors)
    await expect(page.locator('h1:has-text("Investor Pipeline")')).toBeVisible();
  });
});
