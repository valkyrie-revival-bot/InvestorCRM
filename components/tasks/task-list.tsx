'use client';

/**
 * Task list component - displays tasks with filtering
 */

import { useState } from 'react';
import type { TaskWithInvestor, TaskFilters, TaskStatus, TaskPriority } from '@/types/tasks';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface TaskListProps {
  tasks: TaskWithInvestor[];
  onTaskToggle: (taskId: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onAddTask: () => void;
}

export function TaskList({ tasks, onTaskToggle, onTaskDelete, onAddTask }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // Group tasks
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const overdueTasks = filteredTasks.filter(t =>
    t.status === 'pending' && t.due_date && t.due_date < today
  );

  const dueTodayTasks = filteredTasks.filter(t =>
    t.status === 'pending' && t.due_date === today
  );

  const upcomingTasks = filteredTasks.filter(t =>
    t.status === 'pending' && (!t.due_date || t.due_date > today)
  );

  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Task groups */}
      {overdueTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
            Overdue ({overdueTasks.length})
          </h3>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </div>
      )}

      {dueTodayTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wide">
            Due Today ({dueTodayTasks.length})
          </h3>
          <div className="space-y-2">
            {dueTodayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </div>
      )}

      {upcomingTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming ({upcomingTasks.length})
          </h3>
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && statusFilter !== 'pending' && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks found</p>
          <Button onClick={onAddTask} variant="link" className="mt-2">
            Create your first task
          </Button>
        </div>
      )}
    </div>
  );
}
