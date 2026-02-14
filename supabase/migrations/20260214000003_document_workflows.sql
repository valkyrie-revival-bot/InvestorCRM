-- Migration 20260214000003: Document Workflows
-- Purpose: Add signature requests and document emails tracking
-- Created: 2026-02-14

-- ============================================================================
-- SIGNATURE REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  drive_link_id uuid NOT NULL REFERENCES drive_links(id) ON DELETE CASCADE,
  signer_email text NOT NULL,
  signer_name text NULL,
  message text NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz NULL,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS signature_requests_investor_id_idx ON signature_requests(investor_id);
CREATE INDEX IF NOT EXISTS signature_requests_drive_link_id_idx ON signature_requests(drive_link_id);
CREATE INDEX IF NOT EXISTS signature_requests_status_idx ON signature_requests(status);

-- Enable RLS
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for authenticated users (investor not soft-deleted)
CREATE POLICY signature_requests_select_policy ON signature_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = signature_requests.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: INSERT for authenticated users
CREATE POLICY signature_requests_insert_policy ON signature_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = signature_requests.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: UPDATE for authenticated users
CREATE POLICY signature_requests_update_policy ON signature_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = signature_requests.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- ============================================================================
-- DOCUMENT EMAILS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  drive_link_id uuid NOT NULL REFERENCES drive_links(id) ON DELETE CASCADE,
  to_address text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  message_id text NULL, -- Gmail message ID after sending
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS document_emails_investor_id_idx ON document_emails(investor_id);
CREATE INDEX IF NOT EXISTS document_emails_drive_link_id_idx ON document_emails(drive_link_id);
CREATE INDEX IF NOT EXISTS document_emails_sent_at_idx ON document_emails(sent_at DESC);

-- Enable RLS
ALTER TABLE document_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT for authenticated users (investor not soft-deleted)
CREATE POLICY document_emails_select_policy ON document_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = document_emails.investor_id
      AND investors.deleted_at IS NULL
    )
  );

-- RLS Policy: INSERT for authenticated users
CREATE POLICY document_emails_insert_policy ON document_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = document_emails.investor_id
      AND investors.deleted_at IS NULL
    )
  );
