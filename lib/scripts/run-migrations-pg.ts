/**
 * Execute SQL migrations using direct postgres connection
 * Uses pg library to connect to Supabase postgres database
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Extract project ref from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from Supabase URL');
  process.exit(1);
}

// Construct postgres connection string
// Supabase uses the service role key as the postgres password for the postgres user
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Connection string format for Supabase
// Try AWS connection format: postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function runMigrations() {
  console.log('🚀 Connecting to Supabase postgres database...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Migration 1: linkedin_contacts
    console.log('📄 Running migration: 016-linkedin-contacts.sql');
    const migration1 = readFileSync('lib/database/migrations/016-linkedin-contacts.sql', 'utf-8');

    await client.query(migration1);
    console.log('✅ Migration 016 completed\n');

    // Migration 2: investor_relationships
    console.log('📄 Running migration: 017-investor-relationships.sql');
    const migration2 = readFileSync('lib/database/migrations/017-investor-relationships.sql', 'utf-8');

    await client.query(migration2);
    console.log('✅ Migration 017 completed\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...\n');

    const verifyQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('linkedin_contacts', 'investor_relationships')
      ORDER BY table_name;
    `;

    const result = await client.query(verifyQuery);

    if (result.rows.length === 2) {
      console.log('✅ linkedin_contacts table exists');
      console.log('✅ investor_relationships table exists');
    } else {
      console.log('⚠️  Expected 2 tables, found:', result.rows.length);
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }

    // Verify pg_trgm extension
    const extQuery = `SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';`;
    const extResult = await client.query(extQuery);

    if (extResult.rows.length > 0) {
      console.log('✅ pg_trgm extension is enabled');
    } else {
      console.log('⚠️  pg_trgm extension not found');
    }

    // Verify indexes
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('linkedin_contacts', 'investor_relationships')
      ORDER BY indexname;
    `;

    const indexResult = await client.query(indexQuery);
    console.log(`\n✅ Created ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(row => console.log(`   - ${row.indexname}`));

    console.log('\n✨ All migrations completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
