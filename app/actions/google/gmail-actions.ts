'use server';

/**
 * Gmail server actions
 * Search emails, log emails to investors, retrieve email logs
 */

import { google } from 'googleapis';
import { revalidatePath } from 'next/cache';
import { createGoogleClient } from '@/lib/google/client';
import { withRetry } from '@/lib/google/retry';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import type { EmailLog, EmailLogInsert } from '@/types/google';

// ============================================================================
// EMAIL SEARCH
// ============================================================================

export interface GmailMessage {
  messageId: string;
  threadId: string | null;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
}

export interface SearchEmailsResult {
  data?: GmailMessage[];
  error?: string;
}

/**
 * Search Gmail messages using Gmail API
 * Uses metadata format (not full) to conserve quota
 *
 * @param params - Query string and max results
 * @returns Array of Gmail messages or error
 */
export async function searchEmails(params: {
  query: string;
  maxResults?: number;
}): Promise<SearchEmailsResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Create authenticated Google client
    const oauth2Client = await createGoogleClient(user.id);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for messages
    const listResponse = await withRetry(() =>
      gmail.users.messages.list({
        userId: 'me',
        q: params.query,
        maxResults: params.maxResults || 10,
      })
    );

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      return { data: [] };
    }

    // Fetch metadata for each message
    const messagePromises = messages.map((msg) =>
      withRetry(() =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata', // Quota-efficient
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        })
      )
    );

    const messageDetails = await Promise.all(messagePromises);

    // Parse message data
    const parsedMessages: GmailMessage[] = messageDetails.map((detail) => {
      const headers = detail.data.payload?.headers || [];

      const getHeader = (name: string): string => {
        const header = headers.find((h) => h.name === name);
        return header?.value || '';
      };

      return {
        messageId: detail.data.id || '',
        threadId: detail.data.threadId || null,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: detail.data.snippet || '',
      };
    });

    return { data: parsedMessages };
  } catch (error: any) {
    console.error('Gmail search error:', error);

    // Handle authentication errors
    if (
      error?.message?.includes('invalid_grant') ||
      error?.message?.includes('User has not authorized')
    ) {
      return { error: 'google_auth_required' };
    }

    return { error: error?.message || 'Failed to search emails' };
  }
}

// ============================================================================
// LOG EMAIL TO INVESTOR
// ============================================================================

export interface LogEmailParams {
  investorId: string;
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  sentDate: string;
  snippet?: string;
}

export interface LogEmailResult {
  success?: boolean;
  error?: string;
}

/**
 * Log a Gmail message to an investor record
 * Creates email_log entry and activity timeline entry
 *
 * @param params - Email metadata
 * @returns Success status or error
 */
export async function logEmailToInvestor(
  params: LogEmailParams
): Promise<LogEmailResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Insert email log
    const emailLogData: EmailLogInsert = {
      investor_id: params.investorId,
      message_id: params.messageId,
      thread_id: params.threadId || null,
      from_address: params.from,
      to_address: params.to,
      subject: params.subject,
      sent_date: params.sentDate,
      snippet: params.snippet || null,
      logged_by: user.id,
    };

    const { error: emailLogError } = await supabase
      .from('email_logs')
      .insert(emailLogData);

    if (emailLogError) {
      console.error('Failed to insert email log:', emailLogError);
      return { error: 'Failed to log email' };
    }

    // Log activity to investor timeline
    const { error: activityError } = await supabase.from('activities').insert({
      investor_id: params.investorId,
      activity_type: 'email',
      description: `Email: ${params.subject}`,
      metadata: {
        message_id: params.messageId,
        thread_id: params.threadId || null,
        from: params.from,
        to: params.to,
        date: params.sentDate,
      },
      created_by: user.id,
    });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the whole operation if activity logging fails
    }

    // Revalidate investor page
    revalidatePath(`/investors/${params.investorId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Log email error:', error);
    return { error: error?.message || 'Failed to log email' };
  }
}

// ============================================================================
// GET EMAIL LOGS
// ============================================================================

export interface GetEmailLogsResult {
  data?: EmailLog[];
  error?: string;
}

/**
 * Get all email logs for an investor
 *
 * @param investorId - Investor UUID
 * @returns Array of email logs or error
 */
export async function getEmailLogs(
  investorId: string
): Promise<GetEmailLogsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('investor_id', investorId)
      .order('sent_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch email logs:', error);
      return { error: 'Failed to fetch email logs' };
    }

    return { data: data as EmailLog[] };
  } catch (error: any) {
    console.error('Get email logs error:', error);
    return { error: error?.message || 'Failed to fetch email logs' };
  }
}
