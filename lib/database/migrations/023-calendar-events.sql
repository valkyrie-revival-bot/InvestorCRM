-- Migration 023: Calendar Events Table
-- Purpose: Store Google Calendar events associated with investor records
-- Created: 2026-02-13

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  event_id text NOT NULL, -- Google Calendar event ID
  summary text NOT NULL, -- Event title
  description text NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  event_url text NULL, -- Web link to event
  attendees text[] NULL, -- Email addresses of attendees
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate events
  CONSTRAINT calendar_events_investor_event_unique UNIQUE (investor_id, event_id)
);

-- Create index for fast lookups by investor
CREATE INDEX IF NOT EXISTS calendar_events_investor_id_idx ON calendar_events(investor_id);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for authenticated users (investor not soft-deleted)
CREATE POLICY calendar_events_select_policy ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = calendar_events.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: INSERT for authenticated users
CREATE POLICY calendar_events_insert_policy ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = calendar_events.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: DELETE for authenticated users (own events only)
CREATE POLICY calendar_events_delete_policy ON calendar_events
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
