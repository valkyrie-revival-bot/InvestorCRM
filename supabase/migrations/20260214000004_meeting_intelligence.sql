-- Migration: Meeting Intelligence Tables
-- Purpose: Store meeting recordings, transcripts, and AI-extracted insights
-- Created: 2026-02-14

-- ============================================================================
-- MEETINGS TABLE
-- ============================================================================

-- Create meetings table to track meeting metadata
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    calendar_event_id UUID NULL REFERENCES public.calendar_events(id) ON DELETE SET NULL,

    -- Meeting metadata
    meeting_title TEXT NOT NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NULL,

    -- Recording info
    recording_url TEXT NULL, -- Storage URL for the recording file
    recording_filename TEXT NULL,
    recording_size_bytes BIGINT NULL,
    recording_mime_type TEXT NULL,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed')
    ),
    processing_error TEXT NULL,

    -- Timestamps
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL,

    CONSTRAINT meetings_title_not_empty CHECK (length(trim(meeting_title)) > 0)
);

-- Create indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_investor_id ON public.meetings(investor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_calendar_event_id ON public.meetings(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);

-- ============================================================================
-- MEETING TRANSCRIPTS TABLE
-- ============================================================================

-- Create meeting_transcripts table for AI-extracted intelligence
CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,

    -- Full transcript
    transcript_text TEXT NULL,

    -- AI-extracted insights
    summary TEXT NULL,
    key_topics TEXT[] NULL,
    action_items JSONB NULL, -- Array of {description, assignee, due_date}
    objections JSONB NULL, -- Array of {objection, response, resolved}
    next_steps TEXT[] NULL,
    sentiment TEXT NULL, -- 'positive', 'neutral', 'negative'

    -- Additional metadata
    metadata JSONB NULL, -- Store any additional AI insights

    -- Processing info
    model_used TEXT NULL, -- e.g., 'claude-sonnet-4-5'
    processing_duration_ms INTEGER NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT meeting_transcripts_meeting_unique UNIQUE (meeting_id)
);

-- Create indexes for transcripts
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON public.meeting_transcripts(meeting_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can view all transcripts" ON public.meeting_transcripts;
DROP POLICY IF EXISTS "System can manage transcripts" ON public.meeting_transcripts;

-- Meetings policies
CREATE POLICY "Users can view all meetings"
    ON public.meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create meetings"
    ON public.meetings FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update meetings"
    ON public.meetings FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete meetings"
    ON public.meetings FOR DELETE TO authenticated USING (true);

-- Transcripts policies (read-only for users, system manages writes)
CREATE POLICY "Users can view all transcripts"
    ON public.meeting_transcripts FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage transcripts"
    ON public.meeting_transcripts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for updated_at on meetings
DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on meeting_transcripts
DROP TRIGGER IF EXISTS update_transcripts_updated_at ON public.meeting_transcripts;
CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON public.meeting_transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.meetings IS 'Meeting recordings and metadata for investor interactions';
COMMENT ON TABLE public.meeting_transcripts IS 'AI-extracted transcripts and intelligence from meeting recordings';
COMMENT ON COLUMN public.meetings.status IS 'Processing status: pending, processing, completed, failed';
COMMENT ON COLUMN public.meeting_transcripts.action_items IS 'Extracted action items with assignee and due date';
COMMENT ON COLUMN public.meeting_transcripts.objections IS 'Customer objections raised during the meeting';
