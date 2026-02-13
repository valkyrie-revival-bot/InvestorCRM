-- Migration 022: Email Logs Table
-- Purpose: Store Gmail message logs associated with investor records
-- Created: 2026-02-13

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  message_id text NOT NULL, -- Gmail message ID
  thread_id text NULL, -- Gmail thread ID for conversation grouping
  from_address text NOT NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  sent_date timestamptz NOT NULL,
  snippet text NULL, -- Short preview of email content
  logged_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent duplicate logs
  CONSTRAINT email_logs_investor_message_unique UNIQUE (investor_id, message_id)
);

-- Create index for fast lookups by investor
CREATE INDEX IF NOT EXISTS email_logs_investor_id_idx ON email_logs(investor_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for authenticated users (investor not soft-deleted)
CREATE POLICY email_logs_select_policy ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = email_logs.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: INSERT for authenticated users
CREATE POLICY email_logs_insert_policy ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = email_logs.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: DELETE for authenticated users (own logs only)
CREATE POLICY email_logs_delete_policy ON email_logs
  FOR DELETE
  TO authenticated
  USING (logged_by = auth.uid());
