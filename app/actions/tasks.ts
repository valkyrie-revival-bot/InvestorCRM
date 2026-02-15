'use server';

/**
 * Server actions for task CRUD operations
 * Handles validation, auth, database operations for investor tasks/reminders
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import {
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from '@/lib/validations/task-schema';
import type { Task, TaskWithInvestor, TaskStats, TaskFilters } from '@/types/tasks';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new task
 */
export async function createTask(input: TaskCreateInput): Promise<
  { data: Task; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = taskCreateSchema.parse(input);

    // Get authenticated user (supports E2E test mode)
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Insert task
    const { data: task, error: insertError } = await dbClient
      .from('tasks')
      .insert({
        investor_id: validated.investor_id,
        title: validated.title,
        description: validated.description || null,
        due_date: validated.due_date || null,
        priority: validated.priority,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !task) {
      return { error: insertError?.message || 'Failed to create task' };
    }

    revalidatePath('/tasks');
    revalidatePath(`/investors/${validated.investor_id}`);
    return { data: task };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create task' };
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all tasks with optional filtering and pagination
 */
export async function getTasks(filters?: TaskFilters & {
  limit?: number;
  offset?: number;
}): Promise<
  { data: TaskWithInvestor[]; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Build query - select only needed fields
    let query = dbClient
      .from('tasks')
      .select(`
        id,
        investor_id,
        title,
        description,
        due_date,
        status,
        priority,
        created_by,
        completed_at,
        completed_by,
        created_at,
        updated_at,
        investor:investors!inner (
          firm_name,
          stage
        )
      `);

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.investor_id) {
      query = query.eq('investor_id', filters.investor_id);
    }

    // Handle date-based filters
    const today = new Date().toISOString().split('T')[0];

    if (filters?.overdue) {
      query = query
        .lt('due_date', today)
        .eq('status', 'pending');
    }

    if (filters?.due_soon) {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      query = query
        .gte('due_date', today)
        .lte('due_date', weekFromNow.toISOString().split('T')[0])
        .eq('status', 'pending');
    }

    // Order by due date (nulls last), then priority
    query = query
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false });

    // Apply pagination
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error } = await query;

    if (error) {
      return { error: error.message };
    }

    // Transform the data to match TaskWithInvestor type
    const transformedTasks: TaskWithInvestor[] = (tasks || []).map((task: any) => ({
      ...task,
      investor: Array.isArray(task.investor) ? task.investor[0] : task.investor,
    }));

    return { data: transformedTasks };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch tasks' };
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<
  { data: TaskWithInvestor; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    const { data: task, error } = await dbClient
      .from('tasks')
      .select(`
        *,
        investor:investors (
          firm_name,
          stage
        )
      `)
      .eq('id', id)
      .single();

    if (error || !task) {
      return { error: error?.message || 'Task not found' };
    }

    return { data: task };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch task' };
  }
}

/**
 * Get task statistics (cached for 5 minutes)
 */
export async function getTaskStats(): Promise<
  { data: TaskStats; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Use cached version if available (TTL: 5 minutes)
    const { cached, CacheKeys } = await import('@/lib/cache');

    const stats = await cached(
      CacheKeys.taskStats(),
      async () => {
        // Get all tasks (select only needed fields)
        const { data: tasks, error } = await dbClient
          .from('tasks')
          .select('status, due_date');

        if (error) {
          throw new Error(error.message);
        }

        const today = new Date().toISOString().split('T')[0];
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekFromNowStr = weekFromNow.toISOString().split('T')[0];

        // Calculate stats
        return {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          overdue: tasks.filter(t =>
            t.status === 'pending' && t.due_date && t.due_date < today
          ).length,
          due_today: tasks.filter(t =>
            t.status === 'pending' && t.due_date === today
          ).length,
          due_this_week: tasks.filter(t =>
            t.status === 'pending' &&
            t.due_date &&
            t.due_date >= today &&
            t.due_date <= weekFromNowStr
          ).length,
        };
      },
      300 // 5 minutes
    );

    return { data: stats };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to fetch task stats' };
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  input: TaskUpdateInput
): Promise<
  { data: Task; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = taskUpdateSchema.parse(input);

    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Build update object
    const updateData: any = {
      ...validated,
      updated_at: new Date().toISOString(),
    };

    // If marking as completed, set completed_at and completed_by
    if (validated.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    }

    // If changing from completed back to pending, clear completed fields
    if (validated.status === 'pending') {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    const { data: task, error: updateError } = await dbClient
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !task) {
      return { error: updateError?.message || 'Failed to update task' };
    }

    revalidatePath('/tasks');
    revalidatePath(`/investors/${task.investor_id}`);
    return { data: task };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to update task' };
  }
}

/**
 * Toggle task status between pending and completed
 */
export async function toggleTaskStatus(id: string): Promise<
  { data: Task; error?: never } | { data?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Get current status
    const { data: currentTask, error: fetchError } = await dbClient
      .from('tasks')
      .select('status, investor_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentTask) {
      return { error: 'Task not found' };
    }

    // Toggle status
    const newStatus = currentTask.status === 'completed' ? 'pending' : 'completed';

    // Update with appropriate fields
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    const { data: task, error: updateError } = await dbClient
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !task) {
      return { error: updateError?.message || 'Failed to toggle task status' };
    }

    revalidatePath('/tasks');
    revalidatePath(`/investors/${currentTask.investor_id}`);
    return { data: task };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to toggle task status' };
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a task (hard delete)
 */
export async function deleteTask(id: string): Promise<
  { success: true; error?: never } | { success?: never; error: string }
> {
  try {
    const supabase = await createClient();

    // Check auth (supports E2E test mode)
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // In E2E test mode, use admin client to bypass RLS
    const isE2EMode = process.env.E2E_TEST_MODE === 'true';
    const dbClient = isE2EMode ? await createAdminClient() : supabase;

    // Get investor_id before deleting (for revalidation)
    const { data: task } = await dbClient
      .from('tasks')
      .select('investor_id')
      .eq('id', id)
      .single();

    const { error: deleteError } = await dbClient
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    revalidatePath('/tasks');
    if (task) {
      revalidatePath(`/investors/${task.investor_id}`);
    }
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to delete task' };
  }
}
