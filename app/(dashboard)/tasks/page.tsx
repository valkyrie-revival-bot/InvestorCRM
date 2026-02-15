/**
 * Tasks page - view and manage all tasks
 */

import { getTasks, getTaskStats, toggleTaskStatus, deleteTask } from '@/app/actions/tasks';
import { getInvestors } from '@/app/actions/investors';
import { TasksPageClient } from './tasks-page-client';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Tasks | Prytaneum CRM',
  description: 'Manage investor follow-up tasks and reminders',
};

export default async function TasksPage() {
  // Require authentication
  await requireAuth();

  // Fetch tasks, stats, and investors
  const [tasksResult, statsResult, investorsResult] = await Promise.all([
    getTasks(),
    getTaskStats(),
    getInvestors({ limit: 1000 }), // Get all investors for dropdown
  ]);

  if (tasksResult.error) {
    throw new Error(tasksResult.error);
  }

  if (statsResult.error) {
    throw new Error(statsResult.error);
  }

  // Extract minimal investor data for dropdown
  const investors = (investorsResult.data || []).map((inv) => ({
    id: inv.id,
    firm_name: inv.firm_name,
  }));

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <TasksPageClient
        initialTasks={tasksResult.data || []}
        initialStats={statsResult.data || { total: 0, pending: 0, completed: 0, overdue: 0, due_today: 0, due_this_week: 0 }}
        investors={investors}
      />
    </div>
  );
}
