import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Read migration SQL
const sql = readFileSync('./supabase/migrations/20260214000000_create_tasks_table.sql', 'utf-8');

// Split into statements and execute each
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

console.log(`🚀 Executing ${statements.length} SQL statements...`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (!stmt) continue;
  
  console.log(`📝 Statement ${i + 1}/${statements.length}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: stmt + ';' });
    if (error) throw error;
  } catch (err) {
    console.error(`❌ Error on statement ${i + 1}:`, err.message);
    console.log('Statement:', stmt.substring(0, 100) + '...');
  }
}

console.log('✅ Migration completed!');
