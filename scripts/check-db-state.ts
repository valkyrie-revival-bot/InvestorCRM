/**
 * Check Database State
 * Checks what tables and types exist before applying migrations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { createAdminClient } from '../lib/supabase/server';

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  const supabase = await createAdminClient();

  // Check for task_status enum
  const { data: taskStatusType } = await supabase.rpc('check_type_exists', {
    type_name: 'task_status'
  }).catch(() => ({ data: null }));

  // Check for task_priority enum
  const { data: taskPriorityType } = await supabase.rpc('check_type_exists', {
    type_name: 'task_priority'
  }).catch(() => ({ data: null }));

  // Check for tasks table
  const { data: tasksTable, error: tasksError } = await supabase
    .from('tasks')
    .select('id')
    .limit(1);

  // Check for messaging tables
  const { data: prefsTable, error: prefsError } = await supabase
    .from('user_messaging_preferences')
    .select('id')
    .limit(1);

  console.log('📊 Current State:\n');
  console.log(`task_status enum: ${tasksError?.message?.includes('does not exist') ? '❌ Missing' : '✅ Exists'}`);
  console.log(`task_priority enum: ${tasksError?.message?.includes('does not exist') ? '❌ Missing' : '✅ Exists'}`);
  console.log(`tasks table: ${tasksError?.message?.includes('does not exist') ? '❌ Missing' : '✅ Exists'}`);
  console.log(`user_messaging_preferences table: ${prefsError?.message?.includes('does not exist') ? '❌ Missing' : '✅ Exists'}`);
  console.log();

  // List all custom types
  console.log('📋 Checking custom types...');
  const { data: types } = await supabase
    .from('pg_type')
    .select('typname')
    .in('typname', ['task_status', 'task_priority'])
    .limit(10)
    .catch(() => ({ data: [] }));

  if (types && types.length > 0) {
    console.log('Found types:', types.map(t => t.typname).join(', '));
  }
}

checkDatabaseState().catch(console.error);
