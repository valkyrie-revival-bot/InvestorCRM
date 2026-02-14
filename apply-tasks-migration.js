const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20260214000000_create_tasks_table.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

// Function to execute SQL via Supabase REST API
async function executeSql(query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

// Apply migration
async function applyMigration() {
  try {
    console.log('🚀 Applying tasks table migration...');
    await executeSql(sql);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual application required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Paste the contents of: supabase/migrations/20260214000000_create_tasks_table.sql');
    console.log('4. Run the SQL');
    process.exit(1);
  }
}

applyMigration();
