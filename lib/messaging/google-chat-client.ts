/**
 * Google Chat Client
 * Handles sending and receiving messages via Google Chat API
 */

import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin-client';

const chat = google.chat('v1');

interface GoogleChatCredentials {
  access_token: string;
  refresh_token?: string;
}

/**
 * Get OAuth2 client with user's Google tokens
 */
async function getOAuth2Client(userId: string): Promise<any> {
  const supabase = await createAdminClient();

  // Fetch user's Google OAuth tokens
  const { data: tokens, error } = await supabase
    .from('google_oauth_tokens')
    .select('access_token, refresh_token')
    .eq('user_id', userId)
    .single();

  if (error || !tokens) {
    throw new Error('Google authentication required');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  return oauth2Client;
}

/**
 * Send a text message to a Google Chat space
 */
export async function sendGoogleChatMessage(params: {
  userId: string;
  spaceId: string;
  text: string;
  threadId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const auth = await getOAuth2Client(params.userId);

    const response = await chat.spaces.messages.create({
      auth,
      parent: `spaces/${params.spaceId}`,
      requestBody: {
        text: params.text,
        thread: params.threadId ? { name: params.threadId } : undefined,
      },
    });

    return {
      success: true,
      messageId: response.data.name || undefined,
    };
  } catch (error: any) {
    console.error('Failed to send Google Chat message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

/**
 * Send a card message to a Google Chat space
 */
export async function sendGoogleChatCard(params: {
  userId: string;
  spaceId: string;
  title: string;
  subtitle?: string;
  text: string;
  buttons?: Array<{ text: string; url: string }>;
  threadId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const auth = await getOAuth2Client(params.userId);

    const widgets: any[] = [
      {
        textParagraph: {
          text: params.text,
        },
      },
    ];

    // Add buttons if provided
    if (params.buttons && params.buttons.length > 0) {
      widgets.push({
        buttons: params.buttons.map((btn) => ({
          textButton: {
            text: btn.text,
            onClick: {
              openLink: {
                url: btn.url,
              },
            },
          },
        })),
      });
    }

    const response = await chat.spaces.messages.create({
      auth,
      parent: `spaces/${params.spaceId}`,
      requestBody: {
        cardsV2: [
          {
            cardId: 'crm-notification',
            card: {
              header: {
                title: params.title,
                subtitle: params.subtitle,
              },
              sections: [
                {
                  widgets,
                },
              ],
            },
          },
        ],
        thread: params.threadId ? { name: params.threadId } : undefined,
      },
    });

    return {
      success: true,
      messageId: response.data.name || undefined,
    };
  } catch (error: any) {
    console.error('Failed to send Google Chat card:', error);
    return {
      success: false,
      error: error.message || 'Failed to send card',
    };
  }
}

/**
 * List spaces (DMs and rooms) for a user
 */
export async function listGoogleChatSpaces(
  userId: string
): Promise<{ success: boolean; spaces?: any[]; error?: string }> {
  try {
    const auth = await getOAuth2Client(userId);

    const response = await chat.spaces.list({
      auth,
      pageSize: 100,
    });

    return {
      success: true,
      spaces: response.data.spaces || [],
    };
  } catch (error: any) {
    console.error('Failed to list Google Chat spaces:', error);
    return {
      success: false,
      error: error.message || 'Failed to list spaces',
    };
  }
}

/**
 * Find or create a DM space with a user
 */
export async function findOrCreateDM(
  userId: string,
  targetEmail: string
): Promise<{ success: boolean; spaceId?: string; error?: string }> {
  try {
    const auth = await getOAuth2Client(userId);

    // Try to find existing DM
    const response = await chat.spaces.findDirectMessage({
      auth,
      name: targetEmail,
    });

    if (response.data.name) {
      return {
        success: true,
        spaceId: response.data.name.replace('spaces/', ''),
      };
    }

    throw new Error('Could not find or create DM');
  } catch (error: any) {
    console.error('Failed to find/create DM:', error);
    return {
      success: false,
      error: error.message || 'Failed to find/create DM',
    };
  }
}

/**
 * Format notification as Google Chat card
 */
export function formatNotificationAsCard(
  type: string,
  data: any
): {
  title: string;
  subtitle?: string;
  text: string;
  buttons?: Array<{ text: string; url: string }>;
} {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  switch (type) {
    case 'task_reminder':
      return {
        title: '⏰ Task Reminder',
        subtitle: data.investor_name,
        text: `**${data.task_title}**\nDue: ${data.due_date}`,
        buttons: [
          {
            text: 'View Task',
            url: `${baseUrl}/tasks?task=${data.task_id}`,
          },
          {
            text: 'View Investor',
            url: `${baseUrl}/investors/${data.investor_id}`,
          },
        ],
      };

    case 'investor_update':
      return {
        title: '📊 Investor Update',
        subtitle: data.investor_name,
        text: `**${data.update_type}**\n${data.details}`,
        buttons: [
          {
            text: 'View Investor',
            url: `${baseUrl}/investors/${data.investor_id}`,
          },
        ],
      };

    case 'pipeline_alert':
      return {
        title: '🚨 Pipeline Alert',
        subtitle: `${data.count} ${data.alert_type}`,
        text: data.details,
        buttons: [
          {
            text: 'View Dashboard',
            url: baseUrl,
          },
        ],
      };

    case 'ai_insight':
      return {
        title: '💡 AI Insight',
        text: data.insight,
        buttons: data.related_investor_id
          ? [
              {
                text: 'View Investor',
                url: `${baseUrl}/investors/${data.related_investor_id}`,
              },
            ]
          : undefined,
      };

    default:
      return {
        title: 'Notification',
        text: JSON.stringify(data),
      };
  }
}
