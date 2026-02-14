/**
 * Meeting intelligence type definitions
 * Aligned with database schema in supabase/migrations/20260214000004_meeting_intelligence.sql
 */

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * Meeting status enum
 */
export type MeetingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Meeting sentiment enum
 */
export type MeetingSentiment = 'positive' | 'neutral' | 'negative';

/**
 * Meeting entity (meetings table)
 */
export interface Meeting {
  id: string;
  investor_id: string;
  calendar_event_id: string | null;

  // Meeting metadata
  meeting_title: string;
  meeting_date: string; // ISO datetime string
  duration_minutes: number | null;

  // Recording info
  recording_url: string | null;
  recording_filename: string | null;
  recording_size_bytes: number | null;
  recording_mime_type: string | null;

  // Processing status
  status: MeetingStatus;
  processing_error: string | null;

  // Timestamps
  created_by: string;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

/**
 * Action item extracted from meeting
 */
export interface ActionItem {
  description: string;
  assignee?: string | null;
  due_date?: string | null; // ISO date string
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Objection raised during meeting
 */
export interface Objection {
  objection: string;
  response?: string | null;
  resolved: boolean;
}

/**
 * Meeting transcript entity (meeting_transcripts table)
 */
export interface MeetingTranscript {
  id: string;
  meeting_id: string;

  // Full transcript
  transcript_text: string | null;

  // AI-extracted insights
  summary: string | null;
  key_topics: string[] | null;
  action_items: ActionItem[] | null;
  objections: Objection[] | null;
  next_steps: string[] | null;
  sentiment: MeetingSentiment | null;

  // Additional metadata
  metadata: Record<string, any> | null;

  // Processing info
  model_used: string | null;
  processing_duration_ms: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Meeting with transcript and investor details
 */
export interface MeetingWithDetails extends Meeting {
  transcript?: MeetingTranscript;
  investor?: {
    firm_name: string;
    stage: string;
  };
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Type for creating a new meeting
 */
export interface MeetingCreateInput {
  investor_id: string;
  calendar_event_id?: string | null;
  meeting_title: string;
  meeting_date: string;
  duration_minutes?: number | null;
  recording_filename?: string | null;
  recording_mime_type?: string | null;
}

/**
 * Type for uploading meeting recording
 */
export interface MeetingUploadInput {
  meeting_id: string;
  file: File;
}

/**
 * Type for updating meeting status
 */
export interface MeetingUpdateStatusInput {
  meeting_id: string;
  status: MeetingStatus;
  processing_error?: string | null;
}

/**
 * Type for creating transcript with insights
 */
export interface TranscriptCreateInput {
  meeting_id: string;
  transcript_text: string;
  summary: string;
  key_topics: string[];
  action_items: ActionItem[];
  objections: Objection[];
  next_steps: string[];
  sentiment: MeetingSentiment;
  metadata?: Record<string, any>;
  model_used: string;
  processing_duration_ms: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from Claude API for meeting analysis
 */
export interface MeetingAnalysisResult {
  transcript: string;
  summary: string;
  key_topics: string[];
  action_items: ActionItem[];
  objections: Objection[];
  next_steps: string[];
  sentiment: MeetingSentiment;
  metadata?: Record<string, any>;
}

/**
 * Meeting processing result
 */
export interface MeetingProcessingResult {
  success: boolean;
  meeting_id: string;
  transcript_id?: string;
  error?: string;
}

/**
 * Meeting statistics
 */
export interface MeetingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  this_month: number;
  avg_duration_minutes: number | null;
}
