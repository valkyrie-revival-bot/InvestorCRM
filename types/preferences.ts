/**
 * User preferences and bulk operations type definitions
 */

// ============================================================================
// USER PREFERENCES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type DefaultView = 'list' | 'grid' | 'kanban';
export type ItemsPerPage = 10 | 25 | 50 | 100;
export type EmailFrequency = 'immediate' | 'daily' | 'weekly' | 'off';
export type TaskReminderSetting = '24h' | '1h' | 'off';

/**
 * User preferences entity
 */
export interface UserPreferences {
  id: string;
  user_id: string;

  // UI preferences
  theme: Theme;
  density: Density;
  default_view: DefaultView;
  items_per_page: ItemsPerPage;

  // Notification preferences
  email_notifications: boolean;
  email_frequency: EmailFrequency;
  task_reminders: TaskReminderSetting;
  overdue_alerts: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Type for updating user preferences
 */
export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

/**
 * Extended messaging preferences with email settings
 */
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

  // Email notifications
  email_notifications: boolean;
  email_frequency: EmailFrequency;

  // Notification types
  notify_task_reminders: boolean;
  notify_investor_updates: boolean;
  notify_pipeline_alerts: boolean;
  notify_ai_insights: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export type BulkOperationType =
  | 'update_status'
  | 'update_priority'
  | 'assign_due_date'
  | 'delete'
  | 'add_tag'
  | 'change_interaction_type'
  | 'export';

export type BulkEntityType = 'investors' | 'tasks' | 'interactions';

/**
 * Request payload for bulk operations
 */
export interface BulkOperationRequest {
  entity_type: BulkEntityType;
  operation: BulkOperationType;
  item_ids: string[];
  data?: Record<string, unknown>;
}

/**
 * Response from bulk operations
 */
export interface BulkOperationResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{
    item_id: string;
    error: string;
  }>;
  message: string;
}

/**
 * Bulk update task status
 */
export interface BulkUpdateTaskStatusData {
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * Bulk update task priority
 */
export interface BulkUpdateTaskPriorityData {
  priority: 'low' | 'medium' | 'high';
}

/**
 * Bulk assign due date
 */
export interface BulkAssignDueDateData {
  due_date: string; // YYYY-MM-DD
}

/**
 * Bulk add tags to investors
 */
export interface BulkAddTagData {
  tag: string;
}

/**
 * Bulk change interaction type
 */
export interface BulkChangeInteractionTypeData {
  interaction_type: string;
}
