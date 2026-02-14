-- Migration: Create messaging tables for Google Chat and WhatsApp
-- Purpose: Enable system-to-users communication via Google Chat and WhatsApp
-- Use case: Internal team notifications, AI BDR queries, system alerts

-- USER MESSAGING PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_messaging_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_chat_enabled BOOLEAN DEFAULT false,
  google_chat_space_id TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  whatsapp_verification_code TEXT,
  whatsapp_verified_at TIMESTAMPTZ,
  notify_task_reminders BOOLEAN DEFAULT true,
  notify_investor_updates BOOLEAN DEFAULT true,
  notify_pipeline_alerts BOOLEAN DEFAULT true,
  notify_ai_insights BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_messaging_preferences_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_messaging_preferences_user_id
  ON public.user_messaging_preferences(user_id);

-- GOOGLE CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.google_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id TEXT NOT NULL,
  message_id TEXT,
  thread_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'system', 'ai_bdr')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'card', 'notification')),
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_chat_messages_user_id
  ON public.google_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_chat_messages_space_id
  ON public.google_chat_messages(space_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_chat_messages_thread_id
  ON public.google_chat_messages(thread_id, created_at DESC);

-- WHATSAPP MESSAGES
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  whatsapp_message_id TEXT,
  chat_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'system', 'ai_bdr')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'location')),
  media_url TEXT,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id
  ON public.whatsapp_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number
  ON public.whatsapp_messages(phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id
  ON public.whatsapp_messages(chat_id, created_at DESC);

-- MESSAGE QUEUE
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('google_chat', 'whatsapp')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_queue_status_scheduled
  ON public.message_queue(status, scheduled_for)
  WHERE status IN ('pending', 'failed');

-- TRIGGERS
DROP TRIGGER IF EXISTS update_user_messaging_preferences_updated_at ON public.user_messaging_preferences;
CREATE TRIGGER update_user_messaging_preferences_updated_at
  BEFORE UPDATE ON public.user_messaging_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_queue_updated_at ON public.message_queue;
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.user_messaging_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messaging preferences" ON public.user_messaging_preferences;
DROP POLICY IF EXISTS "Users can update own messaging preferences" ON public.user_messaging_preferences;
DROP POLICY IF EXISTS "Users can insert own messaging preferences" ON public.user_messaging_preferences;
DROP POLICY IF EXISTS "Users can view own Google Chat messages" ON public.google_chat_messages;
DROP POLICY IF EXISTS "Users can view own WhatsApp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "System can insert Google Chat messages" ON public.google_chat_messages;
DROP POLICY IF EXISTS "System can insert WhatsApp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "System can manage message queue" ON public.message_queue;

-- Create policies
CREATE POLICY "Users can view own messaging preferences"
  ON public.user_messaging_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own messaging preferences"
  ON public.user_messaging_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own messaging preferences"
  ON public.user_messaging_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own Google Chat messages"
  ON public.google_chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert Google Chat messages"
  ON public.google_chat_messages FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert WhatsApp messages"
  ON public.whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can manage message queue"
  ON public.message_queue FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
