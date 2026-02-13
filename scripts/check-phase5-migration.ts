import { createClient } from '@/lib/supabase/server';

async function checkMigration() {
  const supabase = await createClient();

  // Check if stage_entry_date column exists
  const { data: investors, error } = await supabase
    .from('investors')
    .select('id, stage, stage_entry_date')
    .limit(1);

  if (error) {
    console.log('❌ Migration NOT run - Error:', error.message);
    console.log('\nPlease run migration 018 in Supabase SQL Editor:');
    console.log('File: lib/database/migrations/018-stage-entry-date-trigger.sql\n');
    return;
  }

  console.log('✅ Migration 018 has been run successfully');
  console.log('   - stage_entry_date column exists');
  console.log('   - Ready for testing\n');
}

checkMigration();
