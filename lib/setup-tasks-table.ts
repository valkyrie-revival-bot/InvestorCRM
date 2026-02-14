/**
 * Setup tasks table if it doesn't exist
 * This is called during E2E test setup to ensure the table exists
 */

import { createAdminClient } from './supabase/server';

export async function setupTasksTable() {
  const supabase = await createAdminClient();

  // Check if tasks table exists
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'tasks')
    .single();

  if (tables) {
    console.log('✅ Tasks table already exists');
    return { success: true };
  }

  console.log('📦 Creating tasks table...');

  // Execute migration SQL
  // Note: This requires the SQL to be executed through a different method
  // For now, we'll return instructions for manual setup

  return {
    success: false,
    message: 'Please apply the migration manually: supabase/migrations/20260214000000_create_tasks_table.sql'
  };
}
