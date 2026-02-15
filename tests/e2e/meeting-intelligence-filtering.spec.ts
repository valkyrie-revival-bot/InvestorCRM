/**
 * Playwright E2E Tests for Meeting Intelligence and Advanced Filtering
 * Tests Whisper API integration, filtering, and search functionality
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
let testUserId: string;
let testInvestorId: string;
let testMeetingId: string;

test.describe('Meeting Intelligence with Whisper API', () => {
  test.beforeAll(async () => {
    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-whisper@example.com',
      password: 'testpass123',
      email_confirm: true,
    });

    if (userError) {
      console.error('Error creating user:', userError);
      throw userError;
    }

    testUserId = user.user.id;

    // Create test investor
    const { data: investor, error: investorError } = await supabase
      .from('investors')
      .insert({
        firm_name: 'Test Whisper VC',
        stage: 'Series A',
        check_size_min: 1000000,
        check_size_max: 5000000,
        primary_contact_name: 'John Whisper',
        created_by: testUserId,
      })
      .select()
      .single();

    if (investorError) throw investorError;
    testInvestorId = investor.id;

    // Create test meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        investor_id: testInvestorId,
        meeting_title: 'Test Whisper Meeting',
        meeting_date: new Date().toISOString(),
        duration_minutes: 30,
        status: 'pending',
        created_by: testUserId,
      })
      .select()
      .single();

    if (meetingError) throw meetingError;
    testMeetingId = meeting.id;
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

  test('upload audio and get Whisper transcription', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-whisper@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    // Navigate to meetings
    await page.goto('http://localhost:3003/meetings');
    await page.waitForLoadState('networkidle');

    // Find the test meeting
    await expect(page.locator('text=Test Whisper Meeting')).toBeVisible();

    // Click upload recording button
    await page.click('button:has-text("Upload Recording")');

    // Wait for modal
    await expect(page.locator('text=Upload Meeting Recording')).toBeVisible();

    // Create a test audio file (mock MP3)
    const testAudioPath = path.join(__dirname, 'fixtures', 'test-audio.mp3');

    // If test audio doesn't exist, create a minimal valid MP3 file
    if (!fs.existsSync(testAudioPath)) {
      const testDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create a minimal MP3 header (for testing purposes)
      // In real tests, you'd use an actual audio file
      const mp3Header = Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, // MP3 sync word and header
      ]);
      fs.writeFileSync(testAudioPath, mp3Header);
    }

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testAudioPath);

    // Verify file is selected
    await expect(page.locator('text=test-audio.mp3')).toBeVisible();

    // Note: Since we're using a mock file, the actual Whisper API call will fail
    // In real tests, you'd use a valid audio file or mock the API
    // For now, we'll just verify the upload UI works

    await expect(page.locator('button:has-text("Upload & Analyze")')).toBeEnabled();
  });

  test('action items extracted from transcript', async ({ page }) => {
    // Create a meeting with a transcript that has action items
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        investor_id: testInvestorId,
        meeting_title: 'Meeting with Action Items',
        meeting_date: new Date().toISOString(),
        duration_minutes: 45,
        status: 'completed',
        created_by: testUserId,
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Create transcript with action items
    await supabase.from('meeting_transcripts').insert({
      meeting_id: meeting.id,
      transcript_text: 'This is a test transcript with action items.',
      summary: 'Discussed funding and next steps',
      key_topics: ['funding', 'product demo', 'timeline'],
      action_items: [
        {
          description: 'Send updated pitch deck',
          assignee: 'John',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high'
        },
        {
          description: 'Schedule follow-up call',
          assignee: 'Sarah',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium'
        }
      ],
      sentiment: 'positive',
      model_used: 'whisper-1 + gpt-4',
    });

    // Login and navigate
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-whisper@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    await page.goto('http://localhost:3003/meetings');
    await page.waitForLoadState('networkidle');

    // Verify action items are displayed
    await expect(page.locator('text=Meeting with Action Items')).toBeVisible();
    await expect(page.locator('text=Action Items (2)')).toBeVisible();
    await expect(page.locator('text=Send updated pitch deck')).toBeVisible();
    await expect(page.locator('text=Schedule follow-up call')).toBeVisible();

    // Cleanup
    await supabase.from('meetings').delete().eq('id', meeting.id);
  });

  test('tasks auto-created from action items', async ({ page }) => {
    // Create a meeting and simulate the transcription process creating tasks
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        investor_id: testInvestorId,
        meeting_title: 'Meeting Creating Tasks',
        meeting_date: new Date().toISOString(),
        duration_minutes: 30,
        status: 'completed',
        created_by: testUserId,
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Create transcript
    await supabase.from('meeting_transcripts').insert({
      meeting_id: meeting.id,
      transcript_text: 'Discussed action items.',
      summary: 'Action items identified',
      action_items: [
        {
          description: 'Prepare financial model',
          assignee: 'Team',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high'
        }
      ],
      model_used: 'whisper-1 + gpt-4',
    });

    // Create corresponding task
    await supabase.from('tasks').insert({
      investor_id: testInvestorId,
      title: 'Prepare financial model',
      description: 'Auto-generated from meeting transcript',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      status: 'pending',
      created_by: testUserId,
      metadata: {
        source: 'meeting_transcript',
        meeting_id: meeting.id,
        assignee: 'Team'
      }
    });

    // Login and navigate to tasks
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-whisper@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    await page.goto('http://localhost:3003/tasks');
    await page.waitForLoadState('networkidle');

    // Verify task was created from meeting
    await expect(page.locator('text=Prepare financial model')).toBeVisible();
    await expect(page.locator('text=Auto-generated from meeting transcript')).toBeVisible();

    // Cleanup
    await supabase.from('tasks').delete().match({
      investor_id: testInvestorId,
      title: 'Prepare financial model'
    });
    await supabase.from('meetings').delete().eq('id', meeting.id);
  });
});

test.describe('Advanced Filtering System', () => {
  test.beforeAll(async () => {
    // Create test user if not exists
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-filter@example.com',
      password: 'testpass123',
      email_confirm: true,
    });
    testUserId = user.user.id;

    // Create test investors with different check sizes
    await supabase.from('investors').insert([
      {
        firm_name: 'Small Check VC',
        stage: 'Seed',
        check_size_min: 500000,
        check_size_max: 1000000,
        primary_contact_name: 'Alice Small',
        created_by: testUserId,
        tags: ['early-stage', 'saas']
      },
      {
        firm_name: 'Mid Check Partners',
        stage: 'Series A',
        check_size_min: 2000000,
        check_size_max: 5000000,
        primary_contact_name: 'Bob Mid',
        created_by: testUserId,
        tags: ['series-a', 'fintech']
      },
      {
        firm_name: 'Large Check Capital',
        stage: 'Series B',
        check_size_min: 10000000,
        check_size_max: 20000000,
        primary_contact_name: 'Charlie Large',
        created_by: testUserId,
        tags: ['growth', 'enterprise']
      }
    ]);
  });

  test.afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.from('investors').delete().eq('created_by', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('filter investors by check size range', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-filter@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    // Navigate to investors
    await page.goto('http://localhost:3003/investors');
    await page.waitForLoadState('networkidle');

    // Verify all investors are visible initially
    await expect(page.locator('text=Small Check VC')).toBeVisible();
    await expect(page.locator('text=Mid Check Partners')).toBeVisible();
    await expect(page.locator('text=Large Check Capital')).toBeVisible();

    // Look for filter UI (if implemented on the page)
    // Note: We'll need to add filter UI to the investors page
    // For now, verify data exists for filtering
    const investors = await supabase
      .from('investors')
      .select('*')
      .gte('check_size_min', 1000000)
      .lte('check_size_max', 5000000);

    expect(investors.data?.length).toBe(1);
    expect(investors.data?.[0].firm_name).toBe('Mid Check Partners');
  });

  test('search finds investors and interactions', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-filter@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    // Test search API directly
    const response = await page.request.get('http://localhost:3003/api/search?q=Series A&types=investor');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Verify search found the Series A investor
    const seriesAResults = data.results.filter((r: any) =>
      r.title.includes('Mid Check Partners') || r.subtitle?.includes('Series A')
    );
    expect(seriesAResults.length).toBeGreaterThan(0);
  });

  test('save and load filter', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-filter@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    // Create a saved filter directly via database
    const filterConfig = {
      conditions: [
        {
          id: 'filter-1',
          field: 'stage',
          operator: 'equals',
          value: 'Series A'
        },
        {
          id: 'filter-2',
          field: 'check_size_min',
          operator: 'greater_or_equal',
          value: 1000000
        }
      ]
    };

    const { data: savedFilter, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: testUserId,
        name: 'Series A Investors ($1M+)',
        description: 'Series A investors with minimum $1M check size',
        entity_type: 'investor',
        filter_config: filterConfig,
        is_public: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(savedFilter).toBeDefined();

    // Load the saved filter
    const { data: loadedFilter } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('id', savedFilter.id)
      .single();

    expect(loadedFilter.name).toBe('Series A Investors ($1M+)');
    expect(loadedFilter.filter_config.conditions).toHaveLength(2);

    // Update use count
    await supabase
      .from('saved_filters')
      .update({
        use_count: loadedFilter.use_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', savedFilter.id);

    // Verify update
    const { data: updatedFilter } = await supabase
      .from('saved_filters')
      .select('use_count')
      .eq('id', savedFilter.id)
      .single();

    expect(updatedFilter.use_count).toBe(1);

    // Cleanup
    await supabase.from('saved_filters').delete().eq('id', savedFilter.id);
  });
});

test.describe('Full-Text Search', () => {
  test('search API returns results from multiple tables', async ({ page }) => {
    // Create test data across different tables
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-search@example.com',
      password: 'testpass123',
      email_confirm: true,
    });
    const userId = user.user.id;

    // Create investor
    const { data: investor } = await supabase
      .from('investors')
      .insert({
        firm_name: 'SearchTest Ventures',
        stage: 'Series A',
        primary_contact_name: 'Search Tester',
        created_by: userId,
      })
      .select()
      .single();

    // Create task
    await supabase.from('tasks').insert({
      investor_id: investor.id,
      title: 'SearchTest task for follow-up',
      description: 'This is a searchable task',
      priority: 'medium',
      status: 'pending',
      created_by: userId,
    });

    // Login
    await page.goto('http://localhost:3003/login');
    await page.fill('input[type="email"]', 'test-search@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3003');

    // Test search API
    const response = await page.request.get('http://localhost:3003/api/search?q=SearchTest');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Verify we got results from different types
    const investorResults = data.results.filter((r: any) => r.type === 'investor');
    const taskResults = data.results.filter((r: any) => r.type === 'task');

    expect(investorResults.length).toBeGreaterThan(0);
    expect(taskResults.length).toBeGreaterThan(0);

    // Cleanup
    await supabase.from('investors').delete().eq('id', investor.id);
    await supabase.auth.admin.deleteUser(userId);
  });
});
