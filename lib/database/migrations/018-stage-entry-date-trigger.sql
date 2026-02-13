-- Migration 018: Add stage_entry_date column and auto-update trigger
-- Run in Supabase SQL Editor
-- Purpose: Automatically track when an investor entered their current stage

-- Add stage_entry_date column (defaults to entry_date for existing records)
ALTER TABLE public.investors
ADD COLUMN IF NOT EXISTS stage_entry_date date DEFAULT CURRENT_DATE;

-- Backfill existing records: set stage_entry_date to entry_date if available
-- Otherwise use created_at date as best approximation
UPDATE public.investors
SET stage_entry_date = COALESCE(entry_date, created_at::date)
WHERE stage_entry_date IS NULL OR stage_entry_date = CURRENT_DATE;

-- Create trigger function to auto-update stage_entry_date on stage change
-- This ensures stage_entry_date always reflects when the investor entered their current stage
CREATE OR REPLACE FUNCTION public.update_stage_entry_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if stage actually changed (IS DISTINCT FROM handles NULL safely)
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entry_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (drop first if exists to make idempotent)
DROP TRIGGER IF EXISTS investors_stage_entry_date ON public.investors;
CREATE TRIGGER investors_stage_entry_date
  BEFORE UPDATE ON public.investors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stage_entry_date();
