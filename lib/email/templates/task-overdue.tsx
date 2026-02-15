/**
 * Task Overdue Email Template
 * Sent when a task is overdue
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

interface TaskOverdueEmailProps {
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  dueDateFormatted: string;
  overdueDuration: string;
  priority: 'low' | 'medium' | 'high';
  investorName?: string;
  taskUrl: string;
}

export const TaskOverdueEmail = ({
  taskTitle,
  taskDescription,
  dueDateFormatted,
  overdueDuration,
  priority,
  investorName,
  taskUrl,
}: TaskOverdueEmailProps) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const priorityLabels = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <Html>
      <Head />
      <Preview>Task overdue: {taskTitle} was due {overdueDuration} ago</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Task Overdue</Heading>

          <Section style={alertBox}>
            <Text style={alertText}>
              This task is overdue by {overdueDuration}
            </Text>
          </Section>

          <Section style={taskSection}>
            <Text style={taskTitle as React.CSSProperties}>
              <strong>{taskTitle}</strong>
            </Text>

            {taskDescription && (
              <Text style={taskDescription as React.CSSProperties}>
                {taskDescription}
              </Text>
            )}

            <Hr style={hr} />

            <Text style={detailRow}>
              <strong>Was Due:</strong> {dueDateFormatted}
            </Text>

            <Text style={detailRow}>
              <strong>Overdue By:</strong>{' '}
              <span style={overdueText}>{overdueDuration}</span>
            </Text>

            <Text style={detailRow}>
              <strong>Priority:</strong>{' '}
              <span
                style={{
                  ...priorityBadge,
                  backgroundColor: priorityColors[priority],
                }}
              >
                {priorityLabels[priority]}
              </span>
            </Text>

            {investorName && (
              <Text style={detailRow}>
                <strong>Related to:</strong> {investorName}
              </Text>
            )}
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={taskUrl}>
              Complete Task Now
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this email because you have task alerts enabled.
            You can change your notification preferences in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

TaskOverdueEmail.PreviewProps = {
  taskTitle: 'Follow up with Sequoia Capital',
  taskDescription: 'Send updated pitch deck and financials',
  dueDate: '2026-02-13T10:00:00Z',
  dueDateFormatted: 'February 13, 2026 at 10:00 AM',
  overdueDuration: '2 days',
  priority: 'high' as const,
  investorName: 'Sequoia Capital',
  taskUrl: 'http://localhost:3003/tasks',
} as TaskOverdueEmailProps;

export default TaskOverdueEmail;

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

const alertBox = {
  backgroundColor: '#fee2e2',
  borderLeft: '4px solid #ef4444',
  padding: '16px 24px',
  margin: '0 40px 24px',
};

const alertText = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const taskSection = {
  padding: '0 40px',
};

const taskTitle = {
  color: '#1f2937',
  fontSize: '20px',
  lineHeight: '28px',
  marginBottom: '12px',
};

const taskDescription = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '20px',
};

const detailRow = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const overdueText = {
  color: '#ef4444',
  fontWeight: '600',
};

const priorityBadge = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
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
  backgroundColor: '#ef4444',
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
