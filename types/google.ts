/**
 * Google Workspace integration type definitions
 * Aligned with database schema in lib/database/migrations/020-023
 */

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * Google OAuth Token entity (google_oauth_tokens table)
 * Stores OAuth refresh tokens for Google Workspace API access
 * Security: Service-role-only access, no client exposure
 */
export interface GoogleOAuthToken {
  id: string;
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  token_expiry: string | null; // ISO datetime string
  scopes: string[] | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Drive Link entity (drive_links table)
 * Represents a Google Drive file linked to an investor record
 */
export interface DriveLink {
  id: string;
  investor_id: string;
  file_id: string; // Google Drive file ID
  file_name: string;
  file_url: string; // Web view link
  mime_type: string | null;
  thumbnail_url: string | null;
  linked_by: string | null; // User UUID
  created_at: string; // ISO datetime string
}

/**
 * Email Log entity (email_logs table)
 * Represents a Gmail message logged to an investor record
 */
export interface EmailLog {
  id: string;
  investor_id: string;
  message_id: string; // Gmail message ID
  thread_id: string | null; // Gmail thread ID
  from_address: string;
  to_address: string;
  subject: string;
  sent_date: string; // ISO datetime string
  snippet: string | null;
  logged_by: string | null; // User UUID
  created_at: string; // ISO datetime string
}

/**
 * Calendar Event entity (calendar_events table)
 * Represents a Google Calendar event linked to an investor record
 */
export interface CalendarEvent {
  id: string;
  investor_id: string;
  event_id: string; // Google Calendar event ID
  summary: string; // Event title
  description: string | null;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  event_url: string | null; // Web link to event
  attendees: string[] | null; // Email addresses
  created_by: string | null; // User UUID
  created_at: string; // ISO datetime string
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Type for inserting new drive link
 */
export type DriveLinkInsert = Omit<DriveLink, 'id' | 'created_at'> & {
  investor_id: string;
  file_id: string;
  file_name: string;
  file_url: string;
};

/**
 * Type for inserting new email log
 */
export type EmailLogInsert = Omit<EmailLog, 'id' | 'created_at'> & {
  investor_id: string;
  message_id: string;
  from_address: string;
  to_address: string;
  subject: string;
  sent_date: string;
};

/**
 * Type for inserting new calendar event
 */
export type CalendarEventInsert = Omit<CalendarEvent, 'id' | 'created_at'> & {
  investor_id: string;
  event_id: string;
  summary: string;
  start_time: string;
  end_time: string;
};

// ============================================================================
// STATUS TYPES
// ============================================================================

/**
 * Google Workspace connection status for a user
 */
export interface GoogleWorkspaceStatus {
  hasTokens: boolean;
  scopes: string[] | null;
  connectedAt: string | null; // ISO datetime string
}
