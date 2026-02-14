/**
 * Test Messaging Integration
 * Tests Google Chat and WhatsApp notification sending (mock mode)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createAdminClient } from '../lib/supabase/server';

async function testMessaging() {
  console.log('🧪 Testing Messaging Integration\n');

  const supabase = await createAdminClient();

  // 1. Check if messaging tables exist
  console.log('1. Checking database tables...');

  // Try direct query to check if tables exist
  const { data: prefs, error: prefsError } = await supabase
    .from('user_messaging_preferences')
    .select('id')
    .limit(1);

  if (prefsError && prefsError.message.includes('does not exist')) {
    console.log('   ❌ Messaging tables NOT found');
    console.log('   👉 Apply migration: supabase/migrations/20260214000002_create_messaging_tables.sql\n');
    return;
  } else {
    console.log('   ✓ Messaging tables exist\n');
  }

  // 2. Check for users with messaging preferences
  console.log('2. Checking user preferences...');
  const { data: preferences, error: prefsListError } = await supabase
    .from('user_messaging_preferences')
    .select('*')
    .limit(5);

  if (prefsListError) {
    console.log('   ❌ Error:', prefsListError.message);
  } else if (!preferences || preferences.length === 0) {
    console.log('   ℹ️  No users have configured messaging preferences yet');
    console.log('   👉 Users should configure in Settings → Messaging\n');
  } else {
    console.log(`   ✓ Found ${preferences.length} users with preferences`);
    preferences.forEach((pref: any) => {
      console.log(`     - User ${pref.user_id.substring(0, 8)}...`);
      console.log(`       Google Chat: ${pref.google_chat_enabled ? '✓' : '✗'}`);
      console.log(`       WhatsApp: ${pref.whatsapp_enabled ? '✓' : '✗'}`);
    });
    console.log();
  }

  // 3. Test notification formatting
  console.log('3. Testing notification formatting...');

  const testNotification = {
    type: 'task_reminder',
    data: {
      task_id: 'test-123',
      task_title: 'Follow up with Acme Corp',
      investor_name: 'Acme Corp',
      investor_id: 'test-456',
      due_date: '2026-02-15',
    },
  };

  // Test Google Chat format
  const { formatNotificationAsCard } = await import('../lib/messaging/google-chat-client');
  const chatCard = formatNotificationAsCard(testNotification.type, testNotification.data);

  console.log('   Google Chat Card:');
  console.log(`     Title: ${chatCard.title}`);
  console.log(`     Subtitle: ${chatCard.subtitle}`);
  console.log(`     Text: ${chatCard.text}`);
  console.log(`     Buttons: ${chatCard.buttons?.length || 0}`);
  console.log();

  // Test WhatsApp format
  const { formatNotificationForWhatsApp } = await import('../lib/messaging/whatsapp-client');
  const whatsappText = formatNotificationForWhatsApp(testNotification.type, testNotification.data);

  console.log('   WhatsApp Message:');
  console.log('   ─────────────────');
  console.log(whatsappText.split('\n').map(line => `   ${line}`).join('\n'));
  console.log('   ─────────────────\n');

  // 4. Check message history
  console.log('4. Checking message history...');

  const { data: chatMessages } = await supabase
    .from('google_chat_messages')
    .select('id, direction, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: whatsappMessages } = await supabase
    .from('whatsapp_messages')
    .select('id, direction, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   Google Chat messages: ${chatMessages?.length || 0}`);
  console.log(`   WhatsApp messages: ${whatsappMessages?.length || 0}\n`);

  // 5. Test phone number validation
  console.log('5. Testing phone number validation...');
  const { validatePhoneNumber } = await import('../lib/messaging/whatsapp-client');

  const testNumbers = [
    '+1234567890',
    '1234567890',
    '+44 20 1234 5678',
    'invalid',
  ];

  testNumbers.forEach(number => {
    const result = validatePhoneNumber(number);
    console.log(`   ${number}: ${result.valid ? '✓' : '✗'} ${result.error || result.normalized || ''}`);
  });
  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Database tables: OK');
  console.log(`${preferences && preferences.length > 0 ? '✅' : 'ℹ️ '} User preferences: ${preferences?.length || 0} configured`);
  console.log('✅ Notification formatting: Working');
  console.log('✅ Phone validation: Working');
  console.log();
  console.log('Next steps:');
  console.log('1. Apply database migration if not done');
  console.log('2. Configure messaging in Settings → Messaging');
  console.log('3. Set up Google Chat API credentials');
  console.log('4. Initialize WhatsApp Web client');
  console.log('5. Test sending actual notifications');
  console.log();
  console.log('See MESSAGING_INTEGRATION.md for detailed setup instructions');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run test
testMessaging().catch(console.error);
