-- Migration: Create messaging tables for Google Chat and WhatsApp
-- Purpose: Enable system-to-users communication via Google Chat and WhatsApp
-- Use case: Internal team notifications, AI BDR queries, system alerts

-- ============================================================================
-- USER MESSAGING PREFERENCES
-- ============================================================================

-- Store user preferences for how they want to receive notifications
CREATE TABLE IF NOT EXISTS public.user_messaging_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Google Chat preferences
  google_chat_enabled BOOLEAN DEFAULT false,
  google_chat_space_id TEXT, -- Google Chat space/room ID for user

  -- WhatsApp preferences
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone_number TEXT, -- E.164 format: +1234567890
  whatsapp_verified BOOLEAN DEFAULT false,
  whatsapp_verification_code TEXT,
  whatsapp_verified_at TIMESTAMPTZ,

  -- Notification preferences
  notify_task_reminders BOOLEAN DEFAULT true,
  notify_investor_updates BOOLEAN DEFAULT true,
  notify_pipeline_alerts BOOLEAN DEFAULT true,
  notify_ai_insights BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One preferences record per user
  CONSTRAINT user_messaging_preferences_user_id_unique UNIQUE (user_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_messaging_preferences_user_id
  ON public.user_messaging_preferences(user_id);

-- ============================================================================
-- GOOGLE CHAT MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.google_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User involved
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Google Chat identifiers
  space_id TEXT NOT NULL, -- Chat space/room ID
  message_id TEXT, -- Google's message ID (for sent messages)
  thread_id TEXT, -- Thread ID for conversation grouping

  -- Message content
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'system', 'ai_bdr')),
  content TEXT NOT NULL,

  -- Metadata
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'card', 'notification')),
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  error_message TEXT,

  -- Related entities (optional)
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_google_chat_messages_user_id
  ON public.google_chat_messages(user_id, created_at DESC);
CREATE INDEX idx_google_chat_messages_space_id
  ON public.google_chat_messages(space_id, created_at DESC);
CREATE INDEX idx_google_chat_messages_thread_id
  ON public.google_chat_messages(thread_id, created_at DESC);

-- ============================================================================
-- WHATSAPP MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User involved
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- WhatsApp identifiers
  phone_number TEXT NOT NULL, -- User's phone number
  whatsapp_message_id TEXT, -- WhatsApp's message ID
  chat_id TEXT NOT NULL, -- WhatsApp chat/conversation ID

  -- Message content
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'system', 'ai_bdr')),
  content TEXT NOT NULL,

  -- Metadata
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'location')),
  media_url TEXT, -- For images/documents
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  error_message TEXT,

  -- Related entities (optional)
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_whatsapp_messages_user_id
  ON public.whatsapp_messages(user_id, created_at DESC);
CREATE INDEX idx_whatsapp_messages_phone_number
  ON public.whatsapp_messages(phone_number, created_at DESC);
CREATE INDEX idx_whatsapp_messages_chat_id
  ON public.whatsapp_messages(chat_id, created_at DESC);

-- ============================================================================
-- MESSAGE QUEUE FOR OUTBOUND MESSAGES
-- ============================================================================

-- Queue for messages that need to be sent (handles retries, rate limiting)
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('google_chat', 'whatsapp')),

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',

  -- Queue status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Related records
  related_investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queue processing
CREATE INDEX idx_message_queue_status_scheduled
  ON public.message_queue(status, scheduled_for)
  WHERE status IN ('pending', 'failed');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_user_messaging_preferences_updated_at
  BEFORE UPDATE ON public.user_messaging_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_messaging_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own messaging preferences
CREATE POLICY "Users can view own messaging preferences"
  ON public.user_messaging_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own messaging preferences"
  ON public.user_messaging_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own messaging preferences"
  ON public.user_messaging_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own messages
CREATE POLICY "Users can view own Google Chat messages"
  ON public.google_chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert messages (via service role)
CREATE POLICY "System can insert Google Chat messages"
  ON public.google_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert WhatsApp messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Message queue - system only (service role)
CREATE POLICY "System can manage message queue"
  ON public.message_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_messaging_preferences IS 'User preferences for Google Chat and WhatsApp notifications';
COMMENT ON TABLE public.google_chat_messages IS 'Message history for Google Chat (system-to-user communication)';
COMMENT ON TABLE public.whatsapp_messages IS 'Message history for WhatsApp (system-to-user communication)';
COMMENT ON TABLE public.message_queue IS 'Queue for outbound messages with retry logic';
