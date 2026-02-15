-- Migration: Create user preferences table
-- Purpose: Store user UI and notification preferences
-- Use case: Personalize user experience, apply theme/density settings

-- USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UI preferences
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  density TEXT NOT NULL DEFAULT 'comfortable' CHECK (density IN ('comfortable', 'compact')),
  default_view TEXT NOT NULL DEFAULT 'list' CHECK (default_view IN ('list', 'grid', 'kanban')),
  items_per_page INTEGER NOT NULL DEFAULT 25 CHECK (items_per_page IN (10, 25, 50, 100)),

  -- Notification preferences
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  email_frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'off')),
  task_reminders TEXT NOT NULL DEFAULT '24h' CHECK (task_reminders IN ('24h', '1h', 'off')),
  overdue_alerts BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One preference record per user
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences(user_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Create RLS policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add email notification columns to user_messaging_preferences
ALTER TABLE public.user_messaging_preferences
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_frequency TEXT NOT NULL DEFAULT 'immediate'
    CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'off'));

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'User UI and notification preferences for personalized experience';
COMMENT ON COLUMN public.user_preferences.theme IS 'Color theme: light, dark, or system';
COMMENT ON COLUMN public.user_preferences.density IS 'UI density: comfortable or compact';
COMMENT ON COLUMN public.user_preferences.default_view IS 'Default list view: list, grid, or kanban';
COMMENT ON COLUMN public.user_preferences.items_per_page IS 'Number of items to show per page in lists';
COMMENT ON COLUMN public.user_preferences.email_notifications IS 'Master toggle for all email notifications';
COMMENT ON COLUMN public.user_preferences.email_frequency IS 'How often to batch email notifications';
COMMENT ON COLUMN public.user_preferences.task_reminders IS 'When to send task reminder notifications';
COMMENT ON COLUMN public.user_preferences.overdue_alerts IS 'Whether to send overdue task alerts';
