import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Creating Supabase admin client...');
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements to execute in order
const statements = [
  "CREATE TYPE IF NOT EXISTS task_status AS ENUM ('pending', 'completed', 'cancelled')",
  "CREATE TYPE IF NOT EXISTS task_priority AS ENUM ('low', 'medium', 'high')",
  `CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status NOT NULL DEFAULT 'pending',
    priority task_priority NOT NULL DEFAULT 'medium',
    created_by UUID NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tasks_title_not_empty CHECK (length(trim(title)) > 0)
  )`,
  "CREATE INDEX IF NOT EXISTS idx_tasks_investor_id ON public.tasks(investor_id)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON public.tasks(status, due_date)",
  "ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY",
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view all tasks'
  ) THEN
    CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
  END IF;
END $$`,
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can create tasks'
  ) THEN
    CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
  END IF;
END $$`,
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update any task'
  ) THEN
    CREATE POLICY "Users can update any task" ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$`,
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete any task'
  ) THEN
    CREATE POLICY "Users can delete any task" ON public.tasks FOR DELETE TO authenticated USING (true);
  END IF;
END $$`,
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$`,
  "COMMENT ON TABLE public.tasks IS 'Tasks and reminders for investor follow-ups'"
];

async function executeSql(sql) {
  // Use the REST API to execute SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response;
}

async function applyMigration() {
  console.log(`🚀 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const shortStmt = stmt.substring(0, 60).replace(/\s+/g, ' ') + '...';

    try {
      console.log(`[${i+1}/${statements.length}] ${shortStmt}`);
      await executeSql(stmt);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;

      // If table creation fails, it might already exist - continue
      if (stmt.includes('CREATE TABLE IF NOT EXISTS')) {
        console.log('   ℹ️  Table might already exist, continuing...');
      }
    }
  }

  console.log(`\n✅ Migration completed: ${successCount} success, ${failCount} failed`);

  if (failCount > 0) {
    console.log('\n⚠️  Some statements failed. This might be normal if objects already exist.');
    console.log('To apply manually, use Supabase Dashboard SQL Editor with:');
    console.log('  supabase/migrations/20260214000000_create_tasks_table.sql');
  }
}

applyMigration().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  console.log('\nFalling back to manual application required.');
  console.log('Please copy the contents of this file to Supabase SQL Editor:');
  console.log('  supabase/migrations/20260214000000_create_tasks_table.sql');
  process.exit(1);
});
