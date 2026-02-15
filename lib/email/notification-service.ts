/**
 * Email Notification Service
 * Handles sending task-related email notifications
 */

import { sendEmail } from './email-client';
import TaskReminderEmail from './templates/task-reminder';
import TaskOverdueEmail from './templates/task-overdue';
import DailyDigestEmail from './templates/daily-digest';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface TaskData {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  investor?: {
    firm_name: string;
  };
}

interface UserEmailPreferences {
  email_enabled: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'off';
  notify_task_reminders: boolean;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

/**
 * Send task reminder email (24h or 1h before due)
 */
export async function sendTaskReminderEmail(
  userEmail: string,
  task: TaskData,
  timeUntilDue: string
) {
  const dueDate = parseISO(task.due_date);

  return sendEmail({
    to: userEmail,
    subject: `Reminder: ${task.title} is due ${timeUntilDue}`,
    react: TaskReminderEmail({
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.due_date,
      dueDateFormatted: format(dueDate, 'MMMM d, yyyy \'at\' h:mm a'),
      timeUntilDue,
      priority: task.priority,
      investorName: task.investor?.firm_name,
      taskUrl: `${APP_URL}/tasks`,
    }),
  });
}

/**
 * Send task overdue email
 */
export async function sendTaskOverdueEmail(
  userEmail: string,
  task: TaskData,
  overdueDuration: string
) {
  const dueDate = parseISO(task.due_date);

  return sendEmail({
    to: userEmail,
    subject: `Overdue: ${task.title}`,
    react: TaskOverdueEmail({
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.due_date,
      dueDateFormatted: format(dueDate, 'MMMM d, yyyy \'at\' h:mm a'),
      overdueDuration,
      priority: task.priority,
      investorName: task.investor?.firm_name,
      taskUrl: `${APP_URL}/tasks`,
    }),
  });
}

/**
 * Send daily digest email
 */
export async function sendDailyDigestEmail(
  userEmail: string,
  userName: string | undefined,
  tasks: {
    overdue: TaskData[];
    dueToday: TaskData[];
    upcoming: TaskData[];
  }
) {
  const now = new Date();

  const formatTaskForDigest = (task: TaskData) => ({
    id: task.id,
    title: task.title,
    dueDate: task.due_date,
    dueDateFormatted: format(parseISO(task.due_date), 'MMM d'),
    priority: task.priority,
    investorName: task.investor?.firm_name,
  });

  return sendEmail({
    to: userEmail,
    subject: `Daily Digest: ${
      tasks.overdue.length + tasks.dueToday.length + tasks.upcoming.length
    } tasks need attention`,
    react: DailyDigestEmail({
      userName,
      date: now.toISOString(),
      dateFormatted: format(now, 'EEEE, MMMM d, yyyy'),
      overdueTasks: tasks.overdue.map(formatTaskForDigest),
      dueTodayTasks: tasks.dueToday.map(formatTaskForDigest),
      upcomingTasks: tasks.upcoming.map(formatTaskForDigest),
      tasksUrl: `${APP_URL}/tasks`,
    }),
  });
}

/**
 * Calculate time until due for human-readable display
 */
export function getTimeUntilDue(dueDate: string): string {
  const due = parseISO(dueDate);
  const now = new Date();
  const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil <= 1) {
    return 'in 1 hour';
  } else if (hoursUntil <= 24) {
    return `in ${Math.round(hoursUntil)} hours`;
  } else if (hoursUntil <= 48) {
    return 'in 24 hours';
  } else {
    return formatDistanceToNow(due, { addSuffix: true });
  }
}

/**
 * Calculate overdue duration for human-readable display
 */
export function getOverdueDuration(dueDate: string): string {
  const due = parseISO(dueDate);
  const now = new Date();
  const hoursOverdue = (now.getTime() - due.getTime()) / (1000 * 60 * 60);

  if (hoursOverdue < 1) {
    return 'less than 1 hour';
  } else if (hoursOverdue < 24) {
    return `${Math.round(hoursOverdue)} hours`;
  } else {
    const daysOverdue = Math.floor(hoursOverdue / 24);
    return `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`;
  }
}

/**
 * Check if user should receive notification based on preferences
 */
export function shouldSendNotification(
  preferences: UserEmailPreferences,
  notificationType: 'reminder' | 'overdue' | 'digest'
): boolean {
  // Email completely disabled
  if (!preferences.email_enabled || preferences.email_frequency === 'off') {
    return false;
  }

  // Task reminders disabled
  if (
    (notificationType === 'reminder' || notificationType === 'overdue') &&
    !preferences.notify_task_reminders
  ) {
    return false;
  }

  // Check frequency settings
  if (notificationType === 'digest') {
    return preferences.email_frequency === 'daily' || preferences.email_frequency === 'weekly';
  }

  // Immediate notifications (reminders/overdue)
  return preferences.email_frequency === 'immediate' || preferences.email_frequency === 'daily';
}
