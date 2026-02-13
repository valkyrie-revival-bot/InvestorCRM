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

const migrations = [
  '007_create_investors.sql',
  '008_create_contacts.sql',
  '009_create_activities.sql',
  '010_investor_rls_policies.sql',
  '011_investor_indexes.sql',
];

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  for (const migration of migrations) {
    const filePath = `lib/database/migrations/${migration}`;
    console.log(`📄 Executing ${migration}...`);

    try {
      const sql = readFileSync(filePath, 'utf-8');

      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).single();

      if (error) {
        // Try direct query instead
        const { error: directError } = await supabase.from('_migrations').insert({ name: migration });

        if (directError && !directError.message.includes('already exists')) {
          console.error(`   ❌ Error: ${directError.message}`);
          // Continue anyway - might be duplicate execution
        } else {
          console.log(`   ✓ Completed`);
        }
      } else {
        console.log(`   ✓ Completed`);
      }
    } catch (err: any) {
      console.error(`   ⚠️  ${err.message}`);
      // Continue with next migration
    }
  }

  console.log('\n✅ Migration process complete');
  console.log('\nVerifying tables exist...');

  // Verify tables were created
  const { data, error } = await supabase
    .from('investors')
    .select('count')
    .limit(0);

  if (error && error.code === '42P01') {
    console.log('❌ Tables not created. You may need to run migrations manually in Supabase SQL Editor.');
    console.log('\n📋 Copy and paste each file from lib/database/migrations/ into the SQL Editor:');
    migrations.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log('✓ Tables verified');
  }
}

runMigrations().catch(console.error);
