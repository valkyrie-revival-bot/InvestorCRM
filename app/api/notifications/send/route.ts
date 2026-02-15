/**
 * Email Notification Send API
 * Endpoint to send email notifications for tasks
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Lazy load dependencies to prevent build-time execution
const getDependencies = async () => {
  const { createAdminClient } = await import('@/lib/supabase/server');
  const {
    sendTaskReminderEmail,
    sendTaskOverdueEmail,
    getTimeUntilDue,
    getOverdueDuration,
    shouldSendNotification,
  } = await import('@/lib/email/notification-service');

  return {
    createAdminClient,
    sendTaskReminderEmail,
    sendTaskOverdueEmail,
    getTimeUntilDue,
    getOverdueDuration,
    shouldSendNotification,
  };
};

interface SendNotificationRequest {
  type: 'reminder' | 'overdue';
  taskId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json();
    const { type, taskId, userId } = body;

    if (!type || !taskId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, taskId, userId' },
        { status: 400 }
      );
    }

    // Lazy load dependencies
    const {
      createAdminClient,
      sendTaskReminderEmail,
      sendTaskOverdueEmail,
      getTimeUntilDue,
      getOverdueDuration,
      shouldSendNotification,
    } = await getDependencies();

    const supabase = getSupabaseAdminClient();

    // Get task with investor details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(
        `
        *,
        investor:investors (
          firm_name
        )
      `
      )
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get user email and preferences
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = authUser.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Get user messaging preferences
    const { data: prefs } = await supabase
      .from('user_messaging_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const preferences = {
      email_enabled: prefs?.email_enabled ?? true,
      email_frequency: prefs?.email_frequency ?? 'daily',
      notify_task_reminders: prefs?.notify_task_reminders ?? true,
    };

    // Check if we should send notification
    if (!shouldSendNotification(preferences, type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'User has disabled this notification type',
        },
        { status: 200 }
      );
    }

    // Send email based on type
    let result;
    if (type === 'reminder') {
      const timeUntilDue = getTimeUntilDue(task.due_date);
      result = await sendTaskReminderEmail(userEmail, task, timeUntilDue);
    } else if (type === 'overdue') {
      const overdueDuration = getOverdueDuration(task.due_date);
      result = await sendTaskOverdueEmail(userEmail, task, overdueDuration);
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    if (result.success) {
      // Log the notification
      await supabase.from('message_queue').insert({
        user_id: userId,
        channel: 'email',
        content: `${type} notification for task: ${task.title}`,
        message_type: 'notification',
        status: 'sent',
        processed_at: new Date().toISOString(),
        related_task_id: taskId,
      });

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}
