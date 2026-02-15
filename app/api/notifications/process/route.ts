/**
 * Email Notification Processing API
 * Background job endpoint to check and send task notifications
 * Should be called by a cron job or similar scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  sendTaskReminderEmail,
  sendTaskOverdueEmail,
  sendDailyDigestEmail,
  getTimeUntilDue,
  getOverdueDuration,
  shouldSendNotification,
} from '@/lib/email/notification-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

interface ProcessResult {
  reminders: number;
  overdue: number;
  digests: number;
  errors: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized (add your auth mechanism here)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const results: ProcessResult = {
      reminders: 0,
      overdue: 0,
      digests: 0,
      errors: [],
    };

    // 1. Check for tasks due in 24 hours
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: tasks24h } = await supabase
      .from('tasks')
      .select(
        `
        *,
        investor:investors (firm_name),
        created_by
      `
      )
      .eq('status', 'pending')
      .gte('due_date', now.toISOString())
      .lte('due_date', tomorrow.toISOString());

    // 2. Check for tasks due in 1 hour
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const { data: tasks1h } = await supabase
      .from('tasks')
      .select(
        `
        *,
        investor:investors (firm_name),
        created_by
      `
      )
      .eq('status', 'pending')
      .gte('due_date', now.toISOString())
      .lte('due_date', oneHourLater.toISOString());

    // 3. Check for overdue tasks
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select(
        `
        *,
        investor:investors (firm_name),
        created_by
      `
      )
      .eq('status', 'pending')
      .lt('due_date', now.toISOString());

    // Process reminders (24h)
    if (tasks24h) {
      for (const task of tasks24h) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(task.created_by);
          if (!authUser.user?.email) continue;

          const { data: prefs } = await supabase
            .from('user_messaging_preferences')
            .select('*')
            .eq('user_id', task.created_by)
            .single();

          const preferences = {
            email_enabled: prefs?.email_enabled ?? true,
            email_frequency: prefs?.email_frequency ?? 'daily',
            notify_task_reminders: prefs?.notify_task_reminders ?? true,
          };

          if (shouldSendNotification(preferences, 'reminder')) {
            const result = await sendTaskReminderEmail(
              authUser.user.email,
              task,
              'in 24 hours'
            );
            if (result.success) {
              results.reminders++;
            } else {
              results.errors.push(`Failed to send 24h reminder for task ${task.id}`);
            }
          }
        } catch (error) {
          results.errors.push(
            `Error processing 24h reminder for task ${task.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }

    // Process reminders (1h)
    if (tasks1h) {
      for (const task of tasks1h) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(task.created_by);
          if (!authUser.user?.email) continue;

          const { data: prefs } = await supabase
            .from('user_messaging_preferences')
            .select('*')
            .eq('user_id', task.created_by)
            .single();

          const preferences = {
            email_enabled: prefs?.email_enabled ?? true,
            email_frequency: prefs?.email_frequency ?? 'immediate',
            notify_task_reminders: prefs?.notify_task_reminders ?? true,
          };

          if (shouldSendNotification(preferences, 'reminder')) {
            const result = await sendTaskReminderEmail(authUser.user.email, task, 'in 1 hour');
            if (result.success) {
              results.reminders++;
            } else {
              results.errors.push(`Failed to send 1h reminder for task ${task.id}`);
            }
          }
        } catch (error) {
          results.errors.push(
            `Error processing 1h reminder for task ${task.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }

    // Process overdue alerts
    if (overdueTasks) {
      for (const task of overdueTasks) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(task.created_by);
          if (!authUser.user?.email) continue;

          const { data: prefs } = await supabase
            .from('user_messaging_preferences')
            .select('*')
            .eq('user_id', task.created_by)
            .single();

          const preferences = {
            email_enabled: prefs?.email_enabled ?? true,
            email_frequency: prefs?.email_frequency ?? 'daily',
            notify_task_reminders: prefs?.notify_task_reminders ?? true,
          };

          if (shouldSendNotification(preferences, 'overdue')) {
            const overdueDuration = getOverdueDuration(task.due_date);
            const result = await sendTaskOverdueEmail(
              authUser.user.email,
              task,
              overdueDuration
            );
            if (result.success) {
              results.overdue++;
            } else {
              results.errors.push(`Failed to send overdue alert for task ${task.id}`);
            }
          }
        } catch (error) {
          results.errors.push(
            `Error processing overdue alert for task ${task.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }

    // Process daily digests (check if it's time)
    const { data: users } = await supabase.from('user_messaging_preferences').select('*');

    if (users) {
      for (const userPref of users) {
        try {
          // Only send digest once per day
          const lastDigest = userPref.last_digest_sent_at
            ? new Date(userPref.last_digest_sent_at)
            : null;

          if (lastDigest) {
            const hoursSinceLastDigest =
              (now.getTime() - lastDigest.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastDigest < 23) {
              continue; // Skip, already sent today
            }
          }

          // Check if user wants daily digest
          if (userPref.digest_frequency !== 'daily') {
            continue;
          }

          const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id);
          if (!authUser.user?.email) continue;

          // Get user's tasks
          const { data: userTasks } = await supabase
            .from('tasks')
            .select(
              `
              *,
              investor:investors (firm_name)
            `
            )
            .eq('created_by', userPref.user_id)
            .eq('status', 'pending');

          if (!userTasks || userTasks.length === 0) continue;

          const todayStr = now.toISOString().split('T')[0];
          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const weekLaterStr = weekLater.toISOString().split('T')[0];

          const overdue = userTasks.filter((t) => t.due_date && t.due_date < todayStr);
          const dueToday = userTasks.filter((t) => t.due_date && t.due_date === todayStr);
          const upcoming = userTasks.filter(
            (t) => t.due_date && t.due_date > todayStr && t.due_date <= weekLaterStr
          );

          if (overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0) {
            continue;
          }

          const result = await sendDailyDigestEmail(
            authUser.user.email,
            authUser.user.user_metadata?.full_name,
            { overdue, dueToday, upcoming }
          );

          if (result.success) {
            results.digests++;
            // Update last digest sent time
            await supabase
              .from('user_messaging_preferences')
              .update({ last_digest_sent_at: now.toISOString() })
              .eq('user_id', userPref.user_id);
          } else {
            results.errors.push(`Failed to send digest for user ${userPref.user_id}`);
          }
        } catch (error) {
          results.errors.push(
            `Error processing digest for user ${userPref.user_id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process notifications',
      },
      { status: 500 }
    );
  }
}

// Also support GET for cron jobs that don't support POST
export async function GET(request: NextRequest) {
  return POST(request);
}
