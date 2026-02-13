-- Migration 019: Strategy History System
-- Creates strategy_history table and auto-archive trigger
-- Run in Supabase SQL Editor

-- 1. Create strategy_history table for full version tracking
CREATE TABLE IF NOT EXISTS public.strategy_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE RESTRICT,
  strategy_notes text NOT NULL,
  strategy_date date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for efficient history queries (most recent first per investor)
CREATE INDEX IF NOT EXISTS idx_strategy_history_investor_date
  ON public.strategy_history(investor_id, created_at DESC);

-- RLS policies for strategy_history (same as investors - authenticated users)
ALTER TABLE public.strategy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view strategy history"
  ON public.strategy_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert strategy history"
  ON public.strategy_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Create trigger function for automatic strategy archiving
CREATE OR REPLACE FUNCTION public.archive_strategy_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only archive if current_strategy_notes actually changed and had content
  IF OLD.current_strategy_notes IS DISTINCT FROM NEW.current_strategy_notes
     AND OLD.current_strategy_notes IS NOT NULL
     AND OLD.current_strategy_notes != '' THEN

    -- Move old current strategy -> last strategy fields (two-field pattern)
    NEW.last_strategy_notes := OLD.current_strategy_notes;
    NEW.last_strategy_date := OLD.current_strategy_date;

    -- Set current strategy date to today
    NEW.current_strategy_date := CURRENT_DATE;

    -- Also insert into full history table for complete audit trail
    INSERT INTO public.strategy_history (
      investor_id,
      strategy_notes,
      strategy_date,
      created_by
    ) VALUES (
      OLD.id,
      OLD.current_strategy_notes,
      OLD.current_strategy_date,
      NEW.created_by  -- May be NULL if updated by trigger/system
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to investors table (BEFORE UPDATE so we can modify NEW)
-- Drop first in case it already exists from a previous attempt
DROP TRIGGER IF EXISTS strategy_archive_trigger ON public.investors;

CREATE TRIGGER strategy_archive_trigger
  BEFORE UPDATE ON public.investors
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_strategy_on_update();
