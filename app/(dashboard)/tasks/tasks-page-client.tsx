'use client';

/**
 * Tasks page client component - handles interactive behavior
 */

import { useState } from 'react';
import type { TaskWithInvestor, TaskStats } from '@/types/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { AddTaskModal } from '@/components/tasks/add-task-modal';
import { createTask, toggleTaskStatus, deleteTask } from '@/app/actions/tasks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';

interface TasksPageClientProps {
  initialTasks: TaskWithInvestor[];
  initialStats: TaskStats;
  investors: Array<{ id: string; firm_name: string }>;
}

export function TasksPageClient({ initialTasks, initialStats, investors }: TasksPageClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [stats, setStats] = useState(initialStats);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleTaskToggle = async (taskId: string) => {
    const result = await toggleTaskStatus(taskId);

    if (result.error || !result.data) {
      toast.error(result.error || 'Failed to toggle task');
      return;
    }

    // Update local state optimistically
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: result.data.status, completed_at: result.data.completed_at }
          : t
      )
    );

    // Update stats
    if (result.data.status === 'completed') {
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        completed: prev.completed + 1,
      }));
      toast.success('Task completed!');
    } else {
      setStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        completed: prev.completed - 1,
      }));
      toast.success('Task reopened');
    }

    router.refresh();
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    const result = await deleteTask(taskId);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    // Remove from local state
    setTasks(prev => prev.filter(t => t.id !== taskId));

    toast.success('Task deleted');
    router.refresh();
  };

  const handleAddTask = async (data: any) => {
    const result = await createTask(data);

    if (result.error) {
      throw new Error(result.error);
    }

    toast.success('Task created!');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Manage investor follow-ups and reminders
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ListTodo className="h-5 w-5" />}
          label="Total Tasks"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending"
          value={stats.pending}
          color="yellow"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Overdue"
          value={stats.overdue}
          color="red"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={stats.completed}
          color="green"
        />
      </div>

      {/* Task list */}
      <TaskList
        tasks={tasks}
        onTaskToggle={handleTaskToggle}
        onTaskDelete={handleTaskDelete}
        onAddTask={() => setIsAddModalOpen(true)}
      />

      {/* Add task modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddTask}
        investors={investors}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'red' | 'green';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    green: 'text-green-600 bg-green-100',
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
