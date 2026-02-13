-- Migration 021: Drive Links Table
-- Purpose: Store Google Drive file links associated with investor records
-- Created: 2026-02-13

-- Create drive_links table
CREATE TABLE IF NOT EXISTS drive_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  file_id text NOT NULL, -- Google Drive file ID
  file_name text NOT NULL,
  file_url text NOT NULL, -- Web view link
  mime_type text NULL,
  thumbnail_url text NULL,
  linked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate links
  CONSTRAINT drive_links_investor_file_unique UNIQUE (investor_id, file_id)
);

-- Create index for fast lookups by investor
CREATE INDEX IF NOT EXISTS drive_links_investor_id_idx ON drive_links(investor_id);

-- Enable RLS
ALTER TABLE drive_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for authenticated users (investor not soft-deleted)
CREATE POLICY drive_links_select_policy ON drive_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = drive_links.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: INSERT for authenticated users
CREATE POLICY drive_links_insert_policy ON drive_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = drive_links.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: DELETE for authenticated users (own links only)
CREATE POLICY drive_links_delete_policy ON drive_links
  FOR DELETE
  TO authenticated
  USING (linked_by = auth.uid());
