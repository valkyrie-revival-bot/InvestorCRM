'use client';

/**
 * Task card component - displays a single task
 */

import type { TaskWithInvestor } from '@/types/tasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TaskCardProps {
  task: TaskWithInvestor;
  onToggle: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && !isCompleted;

  // Priority colors
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  // Format due date
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return '1 day overdue';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dueDateDisplay = formatDueDate(task.due_date);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border bg-card transition-colors hover:bg-accent/50',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-1"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={cn(
              'font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h4>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {/* Investor link */}
              <Link
                href={`/investors/${task.investor_id}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Building2 className="h-3 w-3" />
                {task.investor.firm_name}
              </Link>

              {/* Due date */}
              {task.due_date && (
                <span className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-600 font-medium'
                )}>
                  <Calendar className="h-3 w-3" />
                  {dueDateDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Priority badge */}
          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
