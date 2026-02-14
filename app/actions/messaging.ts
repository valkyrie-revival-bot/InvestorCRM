/**
 * Messaging Server Actions
 * Handles Google Chat and WhatsApp messaging operations
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import {
  sendGoogleChatMessage,
  sendGoogleChatCard,
  formatNotificationAsCard,
} from '@/lib/messaging/google-chat-client';
import {
  sendWhatsAppMessage,
  formatNotificationForWhatsApp,
  validatePhoneNumber,
} from '@/lib/messaging/whatsapp-client';
import type {
  UserMessagingPreferences,
  UserMessagingPreferencesUpdate,
  SendMessageParams,
  SendMessageResult,
  MessageChannel,
} from '@/types/messaging';

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Get user's messaging preferences
 */
export async function getUserMessagingPreferences(): Promise<{
  data?: UserMessagingPreferences;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('user_messaging_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: '',
            user_id: user.id,
            google_chat_enabled: false,
            google_chat_space_id: null,
            whatsapp_enabled: false,
            whatsapp_phone_number: null,
            whatsapp_verified: false,
            whatsapp_verification_code: null,
            whatsapp_verified_at: null,
            notify_task_reminders: true,
            notify_investor_updates: true,
            notify_pipeline_alerts: true,
            notify_ai_insights: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to get messaging preferences' };
  }
}

/**
 * Update user's messaging preferences
 */
export async function updateMessagingPreferences(
  updates: UserMessagingPreferencesUpdate
): Promise<{
  data?: UserMessagingPreferences;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Validate phone number if provided
    if (updates.whatsapp_phone_number) {
      const validation = validatePhoneNumber(updates.whatsapp_phone_number);
      if (!validation.valid) {
        return { error: validation.error };
      }
      updates.whatsapp_phone_number = validation.normalized;
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_messaging_preferences')
      .upsert(
        {
          user_id: user.id,
          ...updates,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to update messaging preferences' };
  }
}

// ============================================================================
// SEND MESSAGES
// ============================================================================

/**
 * Send a message to a user via their preferred channels
 */
export async function sendMessageToUser(
  params: SendMessageParams
): Promise<SendMessageResult> {
  try {
    const supabase = await createAdminClient();

    // Get user's messaging preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_messaging_preferences')
      .select('*')
      .eq('user_id', params.user_id)
      .single();

    if (prefsError || !prefs) {
      return {
        success: false,
        error: 'User has no messaging preferences configured',
      };
    }

    const channelsSent: MessageChannel[] = [];
    let lastError: string | undefined;

    // Determine which channels to use
    const shouldSendGoogleChat =
      (params.channel === 'google_chat' || params.channel === 'all') &&
      prefs.google_chat_enabled &&
      prefs.google_chat_space_id;

    const shouldSendWhatsApp =
      (params.channel === 'whatsapp' || params.channel === 'all') &&
      prefs.whatsapp_enabled &&
      prefs.whatsapp_verified &&
      prefs.whatsapp_phone_number;

    // Send via Google Chat
    if (shouldSendGoogleChat) {
      const result = await sendGoogleChatMessage({
        userId: params.user_id,
        spaceId: prefs.google_chat_space_id!,
        text: params.content,
      });

      if (result.success) {
        channelsSent.push('google_chat');

        // Log to database
        await supabase.from('google_chat_messages').insert({
          user_id: params.user_id,
          space_id: prefs.google_chat_space_id!,
          message_id: result.messageId,
          direction: 'outbound',
          sender_type: 'system',
          content: params.content,
          message_type: params.message_type || 'text',
          delivered: true,
          delivered_at: new Date().toISOString(),
          related_investor_id: params.related_investor_id,
          related_task_id: params.related_task_id,
        });
      } else {
        lastError = result.error;
      }
    }

    // Send via WhatsApp
    if (shouldSendWhatsApp) {
      const result = await sendWhatsAppMessage({
        phoneNumber: prefs.whatsapp_phone_number!,
        text: params.content,
        userId: params.user_id,
      });

      if (result.success) {
        channelsSent.push('whatsapp');

        // Log to database
        await supabase.from('whatsapp_messages').insert({
          user_id: params.user_id,
          phone_number: prefs.whatsapp_phone_number!,
          whatsapp_message_id: result.messageId,
          chat_id: prefs.whatsapp_phone_number!.replace(/\+/g, '') + '@c.us',
          direction: 'outbound',
          sender_type: 'system',
          content: params.content,
          message_type: params.message_type || 'text',
          delivered: true,
          delivered_at: new Date().toISOString(),
          related_investor_id: params.related_investor_id,
          related_task_id: params.related_task_id,
        });
      } else {
        lastError = result.error;
      }
    }

    if (channelsSent.length === 0) {
      return {
        success: false,
        error: lastError || 'No channels available or enabled',
      };
    }

    return {
      success: true,
      channels_sent: channelsSent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

/**
 * Send a notification to a user (formatted for the channel)
 */
export async function sendNotification(params: {
  user_id: string;
  notification_type: string;
  data: any;
  channel?: MessageChannel | 'all';
}): Promise<SendMessageResult> {
  try {
    const supabase = await createAdminClient();

    // Get user's messaging preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_messaging_preferences')
      .select('*')
      .eq('user_id', params.user_id)
      .single();

    if (prefsError || !prefs) {
      return {
        success: false,
        error: 'User has no messaging preferences configured',
      };
    }

    // Check if user wants this type of notification
    const notificationEnabled = (() => {
      switch (params.notification_type) {
        case 'task_reminder':
          return prefs.notify_task_reminders;
        case 'investor_update':
          return prefs.notify_investor_updates;
        case 'pipeline_alert':
          return prefs.notify_pipeline_alerts;
        case 'ai_insight':
          return prefs.notify_ai_insights;
        default:
          return true;
      }
    })();

    if (!notificationEnabled) {
      return {
        success: false,
        error: 'User has disabled this notification type',
      };
    }

    const channelsSent: MessageChannel[] = [];
    let lastError: string | undefined;

    // Send via Google Chat (as card)
    if (
      (params.channel === 'google_chat' || params.channel === 'all') &&
      prefs.google_chat_enabled &&
      prefs.google_chat_space_id
    ) {
      const cardData = formatNotificationAsCard(params.notification_type, params.data);

      const result = await sendGoogleChatCard({
        userId: params.user_id,
        spaceId: prefs.google_chat_space_id,
        title: cardData.title,
        subtitle: cardData.subtitle,
        text: cardData.text,
        buttons: cardData.buttons,
      });

      if (result.success) {
        channelsSent.push('google_chat');

        await supabase.from('google_chat_messages').insert({
          user_id: params.user_id,
          space_id: prefs.google_chat_space_id,
          message_id: result.messageId,
          direction: 'outbound',
          sender_type: 'system',
          content: cardData.text,
          message_type: 'card',
          delivered: true,
          delivered_at: new Date().toISOString(),
          related_investor_id: params.data.investor_id || params.data.related_investor_id,
          related_task_id: params.data.task_id,
        });
      } else {
        lastError = result.error;
      }
    }

    // Send via WhatsApp (as formatted text)
    if (
      (params.channel === 'whatsapp' || params.channel === 'all') &&
      prefs.whatsapp_enabled &&
      prefs.whatsapp_verified &&
      prefs.whatsapp_phone_number
    ) {
      const formattedText = formatNotificationForWhatsApp(
        params.notification_type,
        params.data
      );

      const result = await sendWhatsAppMessage({
        phoneNumber: prefs.whatsapp_phone_number,
        text: formattedText,
        userId: params.user_id,
      });

      if (result.success) {
        channelsSent.push('whatsapp');

        await supabase.from('whatsapp_messages').insert({
          user_id: params.user_id,
          phone_number: prefs.whatsapp_phone_number,
          whatsapp_message_id: result.messageId,
          chat_id: prefs.whatsapp_phone_number.replace(/\+/g, '') + '@c.us',
          direction: 'outbound',
          sender_type: 'system',
          content: formattedText,
          message_type: 'text',
          delivered: true,
          delivered_at: new Date().toISOString(),
          related_investor_id: params.data.investor_id || params.data.related_investor_id,
          related_task_id: params.data.task_id,
        });
      } else {
        lastError = result.error;
      }
    }

    if (channelsSent.length === 0) {
      return {
        success: false,
        error: lastError || 'No channels available or enabled',
      };
    }

    return {
      success: true,
      channels_sent: channelsSent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

// ============================================================================
// MESSAGE HISTORY
// ============================================================================

/**
 * Get user's Google Chat message history
 */
export async function getGoogleChatHistory(limit = 50): Promise<{
  data?: any[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('google_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to get message history' };
  }
}

/**
 * Get user's WhatsApp message history
 */
export async function getWhatsAppHistory(limit = 50): Promise<{
  data?: any[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    return { error: error.message || 'Failed to get message history' };
  }
}
