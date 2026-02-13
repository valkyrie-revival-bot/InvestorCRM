/**
 * Direct SQL execution via Supabase admin client
 * Attempts to run SQL migrations by executing them as raw queries
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Construct direct postgres connection URL
// Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const projectRef = 'yafhsopwagozbymqyhhs';

async function executeSQLDirect(sqlPath: string) {
  console.log(`\n📄 Executing: ${sqlPath}`);

  const sql = readFileSync(sqlPath, 'utf-8');

  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements`);

  // Try using fetch with Supabase REST API
  // Supabase exposes a query endpoint for direct SQL
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`   Executing statement ${i + 1}/${statements.length}...`);

    try {
      // Use direct SQL execution if available
      // This is a workaround - not all Supabase instances have this enabled
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: statement + ';' })
      });

      if (response.ok) {
        console.log(`   ✅ Statement ${i + 1} executed`);
      } else {
        const error = await response.text();
        console.log(`   ⚠️  Statement ${i + 1} failed: ${error}`);
      }
    } catch (err: any) {
      console.log(`   ⚠️  Statement ${i + 1} error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Attempting direct SQL execution...\n');
  console.log('⚠️  NOTE: This method may not work on all Supabase projects.');
  console.log('   If execution fails, please run migrations manually in SQL Editor.\n');

  try {
    await executeSQLDirect('lib/database/migrations/016-linkedin-contacts.sql');
    await executeSQLDirect('lib/database/migrations/017-investor-relationships.sql');

    console.log('\n✅ Migration execution attempted');
    console.log('\n🔍 Running verification...\n');

    // Import and run verification
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test if tables exist
    const { error: contactsError } = await supabase
      .from('linkedin_contacts')
      .select('count')
      .limit(0);

    const { error: relationshipsError } = await supabase
      .from('investor_relationships')
      .select('count')
      .limit(0);

    if (!contactsError && !relationshipsError) {
      console.log('✅ Tables verified! Migrations successful.\n');
    } else {
      console.log('❌ Tables not found. Please run migrations manually:\n');
      console.log('   1. Open: https://supabase.com/dashboard/project/yafhsopwagozbymqyhhs/sql/new');
      console.log('   2. Copy and execute: lib/database/migrations/016-linkedin-contacts.sql');
      console.log('   3. Copy and execute: lib/database/migrations/017-investor-relationships.sql\n');
    }

  } catch (err: any) {
    console.error(`\n❌ Execution failed: ${err.message}`);
    console.log('\nPlease run migrations manually in Supabase SQL Editor.');
  }
}

main();
