-- Migration: Add email notification preferences to user_messaging_preferences
-- Purpose: Enable email notifications for task reminders and daily digests

-- Add email notification columns to user_messaging_preferences
ALTER TABLE public.user_messaging_preferences
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'off')),
ADD COLUMN IF NOT EXISTS email_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'off'));

-- Create index for email notification queries
CREATE INDEX IF NOT EXISTS idx_user_messaging_preferences_email_enabled
  ON public.user_messaging_preferences(email_enabled, email_frequency)
  WHERE email_enabled = true;

-- Add comment
COMMENT ON COLUMN public.user_messaging_preferences.email_enabled IS 'Master toggle for all email notifications';
COMMENT ON COLUMN public.user_messaging_preferences.email_frequency IS 'How often to send email notifications: immediate (real-time), daily (batched), weekly (digest), off (disabled)';
COMMENT ON COLUMN public.user_messaging_preferences.email_address IS 'Email address for notifications (defaults to user auth email)';
COMMENT ON COLUMN public.user_messaging_preferences.digest_frequency IS 'How often to send digest emails';
