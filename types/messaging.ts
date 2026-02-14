/**
 * Messaging Types
 * Types for Google Chat and WhatsApp integrations
 */

// ============================================================================
// USER MESSAGING PREFERENCES
// ============================================================================

export interface UserMessagingPreferences {
  id: string;
  user_id: string;

  // Google Chat
  google_chat_enabled: boolean;
  google_chat_space_id: string | null;

  // WhatsApp
  whatsapp_enabled: boolean;
  whatsapp_phone_number: string | null;
  whatsapp_verified: boolean;
  whatsapp_verification_code: string | null;
  whatsapp_verified_at: string | null;

  // Notification preferences
  notify_task_reminders: boolean;
  notify_investor_updates: boolean;
  notify_pipeline_alerts: boolean;
  notify_ai_insights: boolean;

  created_at: string;
  updated_at: string;
}

export interface UserMessagingPreferencesUpdate {
  google_chat_enabled?: boolean;
  google_chat_space_id?: string | null;
  whatsapp_enabled?: boolean;
  whatsapp_phone_number?: string | null;
  notify_task_reminders?: boolean;
  notify_investor_updates?: boolean;
  notify_pipeline_alerts?: boolean;
  notify_ai_insights?: boolean;
}

// ============================================================================
// GOOGLE CHAT MESSAGES
// ============================================================================

export type GoogleChatMessageDirection = 'inbound' | 'outbound';
export type GoogleChatSenderType = 'user' | 'system' | 'ai_bdr';
export type GoogleChatMessageType = 'text' | 'card' | 'notification';

export interface GoogleChatMessage {
  id: string;
  user_id: string;

  // Google Chat identifiers
  space_id: string;
  message_id: string | null;
  thread_id: string | null;

  // Message content
  direction: GoogleChatMessageDirection;
  sender_type: GoogleChatSenderType;
  content: string;

  // Metadata
  message_type: GoogleChatMessageType;
  delivered: boolean;
  delivered_at: string | null;
  read: boolean;
  read_at: string | null;
  error_message: string | null;

  // Related entities
  related_investor_id: string | null;
  related_task_id: string | null;

  created_at: string;
}

export interface GoogleChatMessageCreate {
  user_id: string;
  space_id: string;
  thread_id?: string | null;
  direction: GoogleChatMessageDirection;
  sender_type: GoogleChatSenderType;
  content: string;
  message_type?: GoogleChatMessageType;
  related_investor_id?: string | null;
  related_task_id?: string | null;
}

// ============================================================================
// WHATSAPP MESSAGES
// ============================================================================

export type WhatsAppMessageDirection = 'inbound' | 'outbound';
export type WhatsAppSenderType = 'user' | 'system' | 'ai_bdr';
export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'location';

export interface WhatsAppMessage {
  id: string;
  user_id: string;

  // WhatsApp identifiers
  phone_number: string;
  whatsapp_message_id: string | null;
  chat_id: string;

  // Message content
  direction: WhatsAppMessageDirection;
  sender_type: WhatsAppSenderType;
  content: string;

  // Metadata
  message_type: WhatsAppMessageType;
  media_url: string | null;
  delivered: boolean;
  delivered_at: string | null;
  read: boolean;
  read_at: string | null;
  error_message: string | null;

  // Related entities
  related_investor_id: string | null;
  related_task_id: string | null;

  created_at: string;
}

export interface WhatsAppMessageCreate {
  user_id: string;
  phone_number: string;
  chat_id: string;
  direction: WhatsAppMessageDirection;
  sender_type: WhatsAppSenderType;
  content: string;
  message_type?: WhatsAppMessageType;
  media_url?: string | null;
  related_investor_id?: string | null;
  related_task_id?: string | null;
}

// ============================================================================
// MESSAGE QUEUE
// ============================================================================

export type MessageChannel = 'google_chat' | 'whatsapp';
export type MessageQueueStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface MessageQueue {
  id: string;
  user_id: string;
  channel: MessageChannel;

  // Message content
  content: string;
  message_type: string;

  // Queue status
  status: MessageQueueStatus;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  processed_at: string | null;
  error_message: string | null;

  // Related entities
  related_investor_id: string | null;
  related_task_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface MessageQueueCreate {
  user_id: string;
  channel: MessageChannel;
  content: string;
  message_type?: string;
  scheduled_for?: string;
  related_investor_id?: string | null;
  related_task_id?: string | null;
}

// ============================================================================
// MESSAGE SENDING
// ============================================================================

export interface SendMessageParams {
  user_id: string;
  content: string;
  channel?: MessageChannel | 'all'; // 'all' sends to all enabled channels
  message_type?: string;
  related_investor_id?: string | null;
  related_task_id?: string | null;
}

export interface SendMessageResult {
  success: boolean;
  message_id?: string;
  error?: string;
  channels_sent?: MessageChannel[];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface TaskReminderNotification {
  type: 'task_reminder';
  task_id: string;
  task_title: string;
  investor_name: string;
  due_date: string;
}

export interface InvestorUpdateNotification {
  type: 'investor_update';
  investor_id: string;
  investor_name: string;
  update_type: 'stage_change' | 'new_activity' | 'strategy_updated';
  details: string;
}

export interface PipelineAlertNotification {
  type: 'pipeline_alert';
  alert_type: 'stalled_investor' | 'overdue_task' | 'high_priority';
  count: number;
  details: string;
}

export interface AIInsightNotification {
  type: 'ai_insight';
  insight: string;
  related_investor_id?: string | null;
}

export type NotificationPayload =
  | TaskReminderNotification
  | InvestorUpdateNotification
  | PipelineAlertNotification
  | AIInsightNotification;
