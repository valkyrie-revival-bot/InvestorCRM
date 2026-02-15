/**
 * Daily Digest Email Template
 * Sent daily with summary of upcoming tasks
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface TaskSummary {
  id: string;
  title: string;
  dueDate: string;
  dueDateFormatted: string;
  priority: 'low' | 'medium' | 'high';
  investorName?: string;
}

interface DailyDigestEmailProps {
  userName?: string;
  date: string;
  dateFormatted: string;
  overdueTasks: TaskSummary[];
  dueTodayTasks: TaskSummary[];
  upcomingTasks: TaskSummary[];
  tasksUrl: string;
}

export const DailyDigestEmail = ({
  userName,
  dateFormatted,
  overdueTasks = [],
  dueTodayTasks = [],
  upcomingTasks = [],
  tasksUrl,
}: DailyDigestEmailProps) => {
  const totalTasks = overdueTasks.length + dueTodayTasks.length + upcomingTasks.length;

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const TaskList = ({ tasks, title }: { tasks: TaskSummary[]; title: string }) => {
    if (tasks.length === 0) return null;

    return (
      <Section style={taskListSection}>
        <Text style={taskListTitle}>{title}</Text>
        {tasks.map((task) => (
          <Section key={task.id} style={taskItem}>
            <Text style={taskItemTitle}>
              <span
                style={{
                  ...priorityDot,
                  backgroundColor: priorityColors[task.priority],
                }}
              >
                •
              </span>{' '}
              {task.title}
            </Text>
            <Text style={taskItemDetails}>
              {task.investorName && (
                <span>
                  <strong>Investor:</strong> {task.investorName} •{' '}
                </span>
              )}
              <strong>Due:</strong> {task.dueDateFormatted}
            </Text>
          </Section>
        ))}
      </Section>
    );
  };

  return (
    <Html>
      <Head />
      <Preview>
        Your daily digest: {totalTasks} task{totalTasks !== 1 ? 's' : ''} need attention
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Daily Task Digest</Heading>

          <Section style={greetingSection}>
            <Text style={greeting}>
              Good morning{userName ? `, ${userName}` : ''}!
            </Text>
            <Text style={date}>{dateFormatted}</Text>
          </Section>

          {totalTasks === 0 ? (
            <Section style={emptyState}>
              <Text style={emptyStateText}>
                No tasks need your attention today. Great job staying on top of everything!
              </Text>
            </Section>
          ) : (
            <>
              <Section style={summaryBox}>
                <Text style={summaryText}>
                  You have <strong>{totalTasks}</strong> task{totalTasks !== 1 ? 's' : ''}{' '}
                  that need attention
                </Text>
                {overdueTasks.length > 0 && (
                  <Text style={{ ...summaryDetail, color: '#ef4444' }}>
                    {overdueTasks.length} overdue
                  </Text>
                )}
                {dueTodayTasks.length > 0 && (
                  <Text style={{ ...summaryDetail, color: '#f59e0b' }}>
                    {dueTodayTasks.length} due today
                  </Text>
                )}
                {upcomingTasks.length > 0 && (
                  <Text style={{ ...summaryDetail, color: '#2563eb' }}>
                    {upcomingTasks.length} upcoming this week
                  </Text>
                )}
              </Section>

              <TaskList tasks={overdueTasks} title="Overdue Tasks" />
              <TaskList tasks={dueTodayTasks} title="Due Today" />
              <TaskList tasks={upcomingTasks} title="Upcoming This Week" />
            </>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={tasksUrl}>
              View All Tasks
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this daily digest because you have email notifications enabled.
            You can change your notification preferences in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

DailyDigestEmail.PreviewProps = {
  userName: 'John Doe',
  date: '2026-02-14',
  dateFormatted: 'Friday, February 14, 2026',
  overdueTasks: [
    {
      id: '1',
      title: 'Follow up with Sequoia Capital',
      dueDate: '2026-02-12',
      dueDateFormatted: 'Feb 12',
      priority: 'high' as const,
      investorName: 'Sequoia Capital',
    },
  ],
  dueTodayTasks: [
    {
      id: '2',
      title: 'Send pitch deck to Andreessen Horowitz',
      dueDate: '2026-02-14',
      dueDateFormatted: 'Today',
      priority: 'high' as const,
      investorName: 'Andreessen Horowitz',
    },
  ],
  upcomingTasks: [
    {
      id: '3',
      title: 'Prepare for meeting with Accel',
      dueDate: '2026-02-16',
      dueDateFormatted: 'Feb 16',
      priority: 'medium' as const,
      investorName: 'Accel',
    },
  ],
  tasksUrl: 'http://localhost:3003/tasks',
} as DailyDigestEmailProps;

export default DailyDigestEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: '700',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const greetingSection = {
  padding: '0 40px',
  marginBottom: '24px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const date = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const summaryBox = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #2563eb',
  padding: '16px 24px',
  margin: '0 40px 24px',
};

const summaryText = {
  color: '#1e3a8a',
  fontSize: '16px',
  margin: '0 0 12px 0',
};

const summaryDetail = {
  fontSize: '14px',
  margin: '4px 0',
};

const emptyState = {
  padding: '40px',
  textAlign: 'center' as const,
};

const emptyStateText = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
};

const taskListSection = {
  padding: '0 40px',
  marginBottom: '24px',
};

const taskListTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '700',
  marginBottom: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const taskItem = {
  borderLeft: '2px solid #e5e7eb',
  paddingLeft: '16px',
  marginBottom: '16px',
};

const taskItemTitle = {
  color: '#1f2937',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  lineHeight: '20px',
};

const taskItemDetails = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
  lineHeight: '18px',
};

const priorityDot = {
  fontSize: '20px',
  lineHeight: '1',
  marginRight: '4px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const buttonSection = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  padding: '0 40px',
  marginTop: '24px',
};
