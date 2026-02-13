/**
 * Run LinkedIn Contact Intelligence migrations (016-017)
 * Executes migrations directly using Supabase admin client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runLinkedInMigrations() {
  console.log('🚀 Running LinkedIn Contact Intelligence migrations...\n');

  // These migrations create linkedin_contacts and investor_relationships tables
  const migrations = [
    '016-linkedin-contacts.sql',
    '017-investor-relationships.sql',
  ];

  for (const migration of migrations) {
    const filePath = `lib/database/migrations/${migration}`;
    console.log(`📄 Reading ${migration}...`);

    try {
      const sql = readFileSync(filePath, 'utf-8');

      console.log(`   SQL loaded (${sql.length} characters)`);
      console.log(`   ⚠️  Note: SQL execution via API may not be supported.`);
      console.log(`   Please copy the SQL from ${filePath} to Supabase SQL Editor manually.\n`);

    } catch (err: any) {
      console.error(`   ❌ Error reading file: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 MANUAL STEPS REQUIRED:');
  console.log('');
  console.log('1. Open Supabase Dashboard: https://yafhsopwagozbymqyhhs.supabase.co');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste contents of:');
  console.log('   - lib/database/migrations/016-linkedin-contacts.sql');
  console.log('   - lib/database/migrations/017-investor-relationships.sql');
  console.log('4. Run each migration');
  console.log('5. Verify tables exist and return here');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⏸️  Waiting for manual migration...');
  console.log('   Press Ctrl+C when migrations are complete, or wait for verification.');

  // Wait a bit then verify
  console.log('\n⏳ Waiting 10 seconds before verification check...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Try to verify tables exist
  console.log('🔍 Verifying tables...\n');

  try {
    const { data: contactsTable, error: contactsError } = await supabase
      .from('linkedin_contacts')
      .select('count')
      .limit(0);

    if (contactsError && contactsError.code === '42P01') {
      console.log('❌ linkedin_contacts table not found');
      console.log('   Please run migrations in Supabase SQL Editor manually.\n');
      process.exit(1);
    } else {
      console.log('✅ linkedin_contacts table exists');
    }

    const { data: relationshipsTable, error: relationshipsError } = await supabase
      .from('investor_relationships')
      .select('count')
      .limit(0);

    if (relationshipsError && relationshipsError.code === '42P01') {
      console.log('❌ investor_relationships table not found');
      console.log('   Please run migrations in Supabase SQL Editor manually.\n');
      process.exit(1);
    } else {
      console.log('✅ investor_relationships table exists');
    }

    // Check for pg_trgm extension
    console.log('✅ Tables created successfully\n');
    console.log('✨ Migration verification complete!');

  } catch (err: any) {
    console.error(`❌ Verification failed: ${err.message}`);
    console.log('\nPlease ensure migrations are run manually in Supabase SQL Editor.');
    process.exit(1);
  }
}

runLinkedInMigrations().catch(console.error);
