-- Run in Supabase SQL Editor - Migration 9 of 11
-- Creates activities table for immutable audit trail

-- Create activities table
create table public.activities (
  id uuid primary key default gen_random_uuid(),

  -- Foreign key to investors (ON DELETE RESTRICT - use soft delete instead)
  investor_id uuid not null references public.investors(id) on delete restrict,

  -- Activity fields
  activity_type text not null check (
    activity_type in ('note', 'call', 'email', 'meeting', 'stage_change', 'field_update')
  ),
  description text not null,
  metadata jsonb,

  -- Metadata fields (no updated_at or deleted_at - activities are immutable)
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
