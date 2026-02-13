/**
 * Google Workspace API scopes
 * Centralized scope definitions for all Google API integrations
 */

/**
 * Google Workspace scopes required for CRM integration
 *
 * drive.file: Access to user-selected Drive files only (non-sensitive scope)
 * gmail.readonly: Read Gmail messages for email logging
 * calendar.events: Create and manage calendar events
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
] as const;

/**
 * Human-readable descriptions for each scope
 * Used in OAuth consent UI and settings pages
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'https://www.googleapis.com/auth/drive.file': 'Access files you select from Google Drive',
  'https://www.googleapis.com/auth/gmail.readonly': 'View your Gmail messages and settings',
  'https://www.googleapis.com/auth/calendar.events': 'View and edit events on all your calendars',
};
