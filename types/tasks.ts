/**
 * Task types for investor follow-ups and reminders
 */

export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  investor_id: string;
  title: string;
  description: string | null;
  due_date: string | null; // YYYY-MM-DD format
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithInvestor extends Task {
  investor: {
    firm_name: string;
    stage: string;
  };
}

export interface TaskCreateInput {
  investor_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

// Task filter options
export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  investor_id?: string;
  overdue?: boolean;
  due_soon?: boolean; // Due within next 7 days
}

// Task statistics
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
}
