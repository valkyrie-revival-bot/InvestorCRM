import pg from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.yafhsopwagozbymqyhhs:${process.env.DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const sql = readFileSync('./supabase/migrations/20260214000000_create_tasks_table.sql', 'utf-8');

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  console.log('Connected to database');
  
  await client.query(sql);
  console.log('✅ Migration applied successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nYou need to apply the migration manually via Supabase dashboard SQL editor.');
  console.log('SQL file: supabase/migrations/20260214000000_create_tasks_table.sql');
} finally {
  await client.end();
}
