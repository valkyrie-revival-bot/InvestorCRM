#!/usr/bin/env node

/**
 * Run database migrations
 * Usage: node scripts/run-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrationsDir = path.join(__dirname, '..', 'lib', 'database', 'migrations');

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  // Get all migration files in order
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`📝 Running: ${file}`);

    try {
      // Execute SQL using Supabase's rpc or direct query
      // Note: Supabase JS client doesn't have direct SQL execution
      // We'll use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        // Fallback: Try using the SQL endpoint
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.pgrst.object+json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: sql
        });

        if (!sqlResponse.ok) {
          throw new Error(`HTTP ${sqlResponse.status}: ${await sqlResponse.text()}`);
        }
      }

      console.log(`   ✅ Success\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      console.error('⚠️  Note: Migrations must be run in Supabase SQL Editor');
      console.error('   Go to: https://supabase.com/dashboard/project/yafhsopwagozbymqyhhs/sql\n');
      process.exit(1);
    }
  }

  console.log('✨ All migrations completed!\n');
  console.log('Next step: Assign yourself as admin');
  console.log('Run: node scripts/assign-admin.js\n');
}

runMigrations().catch(console.error);
