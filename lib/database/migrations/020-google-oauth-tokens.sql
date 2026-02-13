-- Migration 020: Google OAuth Tokens Table
-- Purpose: Secure storage for Google Workspace OAuth refresh tokens
-- Security: Service-role-only access, no RLS policies (never exposed to client)
-- Created: 2026-02-13

-- Create google_oauth_tokens table
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  access_token text NULL, -- Cached access token (optional)
  token_expiry timestamptz NULL, -- Access token expiry time
  scopes text[] NULL, -- Granted scopes for this token
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure one token record per user
  CONSTRAINT google_oauth_tokens_user_id_unique UNIQUE (user_id)
);

-- Add table comment
COMMENT ON TABLE google_oauth_tokens IS 'OAuth tokens accessible via service role only - never exposed to client';

-- Revoke all public access
REVOKE ALL ON google_oauth_tokens FROM public;
REVOKE ALL ON google_oauth_tokens FROM anon;
REVOKE ALL ON google_oauth_tokens FROM authenticated;

-- Grant full access to service_role only
GRANT ALL ON google_oauth_tokens TO service_role;

-- Enable RLS (but no policies - service role bypasses RLS)
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_oauth_tokens_updated_at();
