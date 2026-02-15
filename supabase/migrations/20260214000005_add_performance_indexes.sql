-- ============================================================================
-- Performance Optimization: Database Indexes
-- Created: 2026-02-14
-- Purpose: Add indexes for foreign keys, frequently queried fields, and search
-- ============================================================================

-- ===========================================================================
-- INVESTORS TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_investors_created_by
  ON public.investors (created_by);

-- Index for frequently filtered fields
CREATE INDEX IF NOT EXISTS idx_investors_stage
  ON public.investors (stage);

CREATE INDEX IF NOT EXISTS idx_investors_relationship_owner
  ON public.investors (relationship_owner);

CREATE INDEX IF NOT EXISTS idx_investors_allocator_type
  ON public.investors (allocator_type)
  WHERE allocator_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investors_stalled
  ON public.investors (stalled)
  WHERE stalled = true;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_investors_entry_date
  ON public.investors (entry_date)
  WHERE entry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investors_last_action_date
  ON public.investors (last_action_date)
  WHERE last_action_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investors_next_action_date
  ON public.investors (next_action_date)
  WHERE next_action_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investors_stage_entry_date
  ON public.investors (stage_entry_date)
  WHERE stage_entry_date IS NOT NULL;

-- Index for soft delete filtering (exclude deleted records)
CREATE INDEX IF NOT EXISTS idx_investors_deleted_at
  ON public.investors (deleted_at)
  WHERE deleted_at IS NULL;

-- Composite index for common list queries (active investors by stage and owner)
CREATE INDEX IF NOT EXISTS idx_investors_active_stage_owner
  ON public.investors (stage, relationship_owner, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Full-text search index on firm name
CREATE INDEX IF NOT EXISTS idx_investors_firm_name_trgm
  ON public.investors USING gin (firm_name gin_trgm_ops);

-- ===========================================================================
-- CONTACTS TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_contacts_investor_id
  ON public.contacts (investor_id);

-- Index for primary contact lookup
CREATE INDEX IF NOT EXISTS idx_contacts_primary
  ON public.contacts (investor_id, is_primary)
  WHERE is_primary = true AND deleted_at IS NULL;

-- Index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at
  ON public.contacts (deleted_at)
  WHERE deleted_at IS NULL;

-- Full-text search on contact name and email
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON public.contacts USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm
  ON public.contacts USING gin (email gin_trgm_ops)
  WHERE email IS NOT NULL;

-- ===========================================================================
-- ACTIVITIES TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_activities_investor_id
  ON public.activities (investor_id);

CREATE INDEX IF NOT EXISTS idx_activities_created_by
  ON public.activities (created_by);

-- Index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_activities_type
  ON public.activities (activity_type);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_activities_created_at
  ON public.activities (created_at DESC);

-- Composite index for investor activity timeline
CREATE INDEX IF NOT EXISTS idx_activities_investor_timeline
  ON public.activities (investor_id, created_at DESC);

-- Composite index for activity type and date
CREATE INDEX IF NOT EXISTS idx_activities_type_date
  ON public.activities (activity_type, created_at DESC);

-- ===========================================================================
-- TASKS TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_tasks_investor_id
  ON public.tasks (investor_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON public.tasks (created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_completed_by
  ON public.tasks (completed_by)
  WHERE completed_by IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON public.tasks (status);

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority
  ON public.tasks (priority);

-- Index for due date queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON public.tasks (due_date)
  WHERE due_date IS NOT NULL;

-- Composite index for overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_overdue
  ON public.tasks (status, due_date)
  WHERE status = 'pending' AND due_date IS NOT NULL;

-- Composite index for task list (pending tasks by due date and priority)
CREATE INDEX IF NOT EXISTS idx_tasks_pending_by_date_priority
  ON public.tasks (status, due_date NULLS LAST, priority DESC);

-- Composite index for investor tasks
CREATE INDEX IF NOT EXISTS idx_tasks_investor_status
  ON public.tasks (investor_id, status, due_date NULLS LAST);

-- ===========================================================================
-- MEETINGS TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_meetings_investor_id
  ON public.meetings (investor_id);

CREATE INDEX IF NOT EXISTS idx_meetings_created_by
  ON public.meetings (created_by);

-- Index for calendar event linkage
CREATE INDEX IF NOT EXISTS idx_meetings_calendar_event_id
  ON public.meetings (calendar_event_id)
  WHERE calendar_event_id IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_meetings_status
  ON public.meetings (status);

-- Index for meeting date queries
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date
  ON public.meetings (meeting_date DESC);

-- Composite index for investor meetings timeline
CREATE INDEX IF NOT EXISTS idx_meetings_investor_timeline
  ON public.meetings (investor_id, meeting_date DESC);

-- Composite index for processing queue (pending/processing meetings)
CREATE INDEX IF NOT EXISTS idx_meetings_processing_queue
  ON public.meetings (status, created_at)
  WHERE status IN ('pending', 'processing');

-- ===========================================================================
-- MEETING_TRANSCRIPTS TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_id
  ON public.meeting_transcripts (meeting_id);

-- Full-text search on transcript text
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_text_trgm
  ON public.meeting_transcripts USING gin (transcript_text gin_trgm_ops)
  WHERE transcript_text IS NOT NULL;

-- Index for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_sentiment
  ON public.meeting_transcripts (sentiment)
  WHERE sentiment IS NOT NULL;

-- ===========================================================================
-- STRATEGY_HISTORY TABLE INDEXES
-- ===========================================================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_strategy_history_investor_id
  ON public.strategy_history (investor_id);

-- Index for date ordering
CREATE INDEX IF NOT EXISTS idx_strategy_history_created_at
  ON public.strategy_history (created_at DESC);

-- Composite index for investor strategy timeline
CREATE INDEX IF NOT EXISTS idx_strategy_history_investor_timeline
  ON public.strategy_history (investor_id, created_at DESC);

-- ===========================================================================
-- LINKEDIN_CONNECTIONS TABLE INDEXES
-- ===========================================================================

-- Index for connection lookups by email
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_email
  ON public.linkedin_connections (email)
  WHERE email IS NOT NULL;

-- Index for connection lookups by name
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_name
  ON public.linkedin_connections (first_name, last_name);

-- Index for uploaded by
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_uploaded_by
  ON public.linkedin_connections (uploaded_by);

-- Full-text search on name and company
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_search
  ON public.linkedin_connections USING gin (
    (first_name || ' ' || last_name || ' ' || COALESCE(company, '')) gin_trgm_ops
  );

-- ===========================================================================
-- MESSAGING TABLES INDEXES
-- ===========================================================================

-- Message threads
CREATE INDEX IF NOT EXISTS idx_message_threads_investor_id
  ON public.message_threads (investor_id);

CREATE INDEX IF NOT EXISTS idx_message_threads_platform
  ON public.message_threads (platform);

CREATE INDEX IF NOT EXISTS idx_message_threads_status
  ON public.message_threads (status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_thread_id
  ON public.messages (thread_id);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp
  ON public.messages (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread_timeline
  ON public.messages (thread_id, sent_at DESC);

-- ===========================================================================
-- AUDIT LOG INDEXES (if exists)
-- ===========================================================================

-- Check if audit_log table exists and add indexes
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    -- Index for user activity queries
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
      ON public.audit_log (user_id);

    -- Index for timestamp queries
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
      ON public.audit_log (timestamp DESC);

    -- Index for operation type filtering
    CREATE INDEX IF NOT EXISTS idx_audit_log_operation
      ON public.audit_log (operation);

    -- Composite index for user activity timeline
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_timeline
      ON public.audit_log (user_id, timestamp DESC);
  END IF;
END $$;

-- ===========================================================================
-- ENABLE pg_trgm EXTENSION FOR FULL-TEXT SEARCH
-- ===========================================================================

-- Enable trigram extension for similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ===========================================================================

-- Update statistics for better query planning
ANALYZE public.investors;
ANALYZE public.contacts;
ANALYZE public.activities;
ANALYZE public.tasks;
ANALYZE public.meetings;
ANALYZE public.meeting_transcripts;
ANALYZE public.strategy_history;
ANALYZE public.linkedin_connections;
ANALYZE public.message_threads;
ANALYZE public.messages;

-- ===========================================================================
-- COMMENTS
-- ===========================================================================

COMMENT ON INDEX idx_investors_active_stage_owner IS 'Optimizes common investor list queries';
COMMENT ON INDEX idx_tasks_overdue IS 'Optimizes overdue task queries';
COMMENT ON INDEX idx_meetings_processing_queue IS 'Optimizes meeting processing queue';
COMMENT ON INDEX idx_activities_investor_timeline IS 'Optimizes investor activity timeline queries';
