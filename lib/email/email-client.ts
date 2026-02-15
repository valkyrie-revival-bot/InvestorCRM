/**
 * Email Client using Nodemailer
 * Handles sending transactional emails via SMTP
 */

import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { env } from '@/lib/env';
import type { ReactElement } from 'react';

// Create transporter with environment configuration
function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Email sending will fail.');
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // In test mode, log and skip actual sending
    if (env.EMAIL_TEST_MODE) {
      console.log('📧 Email test mode - would send:', {
        to: options.to,
        subject: options.subject,
        from: `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`,
      });

      // If test recipient is specified, send there instead
      if (env.EMAIL_TEST_RECIPIENT) {
        options.to = env.EMAIL_TEST_RECIPIENT;
      } else {
        return {
          success: true,
          messageId: `test-${Date.now()}`,
        };
      }
    }

    const transporter = createTransporter();

    // Render React component to HTML if provided
    let html = options.html;
    let text = options.text;

    if (options.react) {
      html = await render(options.react);
      // Generate plain text version if not provided
      if (!text) {
        text = await render(options.react, { plainText: true });
      }
    }

    if (!html && !text) {
      return {
        success: false,
        error: 'Either html, text, or react component must be provided',
      };
    }

    // Send email
    const info = await transporter.sendMail({
      from: `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: html,
      text: text,
      replyTo: options.replyTo,
    });

    console.log('✅ Email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return { success: true };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(to: string): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Test Email from Sales Tracking CRM',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Email Configuration Successful</h1>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, your SMTP settings are configured properly.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Sent from Sales Tracking CRM
        </p>
      </div>
    `,
    text: 'Email Configuration Successful\n\nThis is a test email to verify your email configuration is working correctly.\n\nIf you received this email, your SMTP settings are configured properly.',
  });
}
