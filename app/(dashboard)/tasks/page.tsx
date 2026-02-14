/**
 * Tasks page - view and manage all tasks
 */

import { getTasks, getTaskStats, toggleTaskStatus, deleteTask } from '@/app/actions/tasks';
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

  // Fetch tasks and stats
  const [tasksResult, statsResult] = await Promise.all([
    getTasks(),
    getTaskStats(),
  ]);

  if (tasksResult.error) {
    throw new Error(tasksResult.error);
  }

  if (statsResult.error) {
    throw new Error(statsResult.error);
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <TasksPageClient
        initialTasks={tasksResult.data}
        initialStats={statsResult.data}
      />
    </div>
  );
}
