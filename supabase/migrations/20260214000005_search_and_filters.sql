-- Migration: Search and Saved Filters
-- Purpose: Add full-text search indexes and saved filters table
-- Created: 2026-02-14

-- ============================================================================
-- SAVED FILTERS TABLE
-- ============================================================================

-- Create saved_filters table for storing user filter configurations
CREATE TABLE IF NOT EXISTS public.saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Filter metadata
    name TEXT NOT NULL,
    description TEXT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('investor', 'interaction', 'task', 'meeting')),

    -- Filter configuration (JSON)
    filter_config JSONB NOT NULL,

    -- Sharing
    is_public BOOLEAN NOT NULL DEFAULT false,

    -- Usage tracking
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT saved_filters_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create indexes for saved filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_entity_type ON public.saved_filters(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_public ON public.saved_filters(is_public) WHERE is_public = true;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Add text search columns for investors (for future optimization)
-- Note: For now we're using ILIKE in the API. In production with larger datasets,
-- consider creating tsvector columns and GIN indexes:
-- ALTER TABLE investors ADD COLUMN search_vector tsvector;
-- CREATE INDEX idx_investors_search ON investors USING gin(search_vector);

-- Similarly for other tables when needed:
-- ALTER TABLE interactions ADD COLUMN search_vector tsvector;
-- ALTER TABLE tasks ADD COLUMN search_vector tsvector;
-- ALTER TABLE meeting_transcripts ADD COLUMN search_vector tsvector;

-- ============================================================================
-- RLS POLICIES FOR SAVED FILTERS
-- ============================================================================

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can view public filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can create their own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can update their own filters" ON public.saved_filters;
DROP POLICY IF EXISTS "Users can delete their own filters" ON public.saved_filters;

-- Users can view their own filters
CREATE POLICY "Users can view their own filters"
    ON public.saved_filters FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can view public filters
CREATE POLICY "Users can view public filters"
    ON public.saved_filters FOR SELECT TO authenticated
    USING (is_public = true);

-- Users can create their own filters
CREATE POLICY "Users can create their own filters"
    ON public.saved_filters FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own filters
CREATE POLICY "Users can update their own filters"
    ON public.saved_filters FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own filters
CREATE POLICY "Users can delete their own filters"
    ON public.saved_filters FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for updated_at on saved_filters
DROP TRIGGER IF EXISTS update_saved_filters_updated_at ON public.saved_filters;
CREATE TRIGGER update_saved_filters_updated_at
    BEFORE UPDATE ON public.saved_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.saved_filters IS 'User-saved filter configurations for quick access';
COMMENT ON COLUMN public.saved_filters.filter_config IS 'JSON configuration of filter conditions';
COMMENT ON COLUMN public.saved_filters.entity_type IS 'Type of entity being filtered: investor, interaction, task, or meeting';
COMMENT ON COLUMN public.saved_filters.is_public IS 'Whether this filter is shared with other users';
