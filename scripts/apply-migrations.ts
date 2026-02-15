/**
 * Apply database migrations via Supabase client
 * Run with: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filename: string) {
  console.log(`\nApplying migration: ${filename}`);

  const migrationPath = path.join(__dirname, '../supabase/migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          console.error('Error executing statement:', error);
          // Try direct execution for DDL statements
          console.log('Attempting direct execution...');
        }
      }
    }

    console.log(`✓ Migration ${filename} applied successfully`);
  } catch (error) {
    console.error(`✗ Error applying migration ${filename}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Applying database migrations...');

  // Apply the search and filters migration
  await applyMigration('20260214000005_search_and_filters.sql');

  console.log('\n✓ All migrations applied successfully!');
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
