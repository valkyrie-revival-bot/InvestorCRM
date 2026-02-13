-- Run in Supabase SQL Editor - Migration 7 of 11
-- Creates investors table with 20 data fields, timestamps, soft delete, and updated_at trigger

-- Create updated_at trigger function if not exists
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create investors table
create table public.investors (
  id uuid primary key default gen_random_uuid(),

  -- Required fields
  firm_name text not null,
  relationship_owner text not null,
  stage text not null,

  -- Optional business fields
  partner_source text,
  est_value numeric(12, 2),
  entry_date date,
  last_action_date date,
  stalled boolean default false,
  allocator_type text,
  internal_conviction text,
  internal_priority text,
  investment_committee_timing text,
  next_action text,
  next_action_date date,
  current_strategy_notes text,
  current_strategy_date date,
  last_strategy_notes text,
  last_strategy_date date,
  key_objection_risk text,

  -- Metadata fields
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  created_by uuid references auth.users(id)
);

-- Create updated_at trigger for investors
create trigger update_investors_updated_at
  before update on public.investors
  for each row
  execute function public.update_updated_at_column();
-- Run in Supabase SQL Editor - Migration 8 of 11
-- Creates contacts table with foreign key to investors

-- Create contacts table
create table public.contacts (
  id uuid primary key default gen_random_uuid(),

  -- Foreign key to investors (ON DELETE RESTRICT - use soft delete instead)
  investor_id uuid not null references public.investors(id) on delete restrict,

  -- Contact fields
  name text not null,
  email text,
  phone text,
  title text,
  notes text,
  is_primary boolean default false,

  -- Metadata fields
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Create updated_at trigger for contacts
create trigger update_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.update_updated_at_column();
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
-- Run in Supabase SQL Editor - Migration 10 of 11
-- Creates RLS policies for investors, contacts, and activities tables

-- Enable RLS on all three tables
alter table public.investors enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;

-- ============================================================================
-- INVESTORS POLICIES
-- ============================================================================

-- SELECT: Only show non-deleted investors
create policy "Authenticated users can view non-deleted investors"
  on public.investors for select
  to authenticated
  using (deleted_at is null);

-- INSERT: Any authenticated user can create investors
create policy "Authenticated users can insert investors"
  on public.investors for insert
  to authenticated
  with check (true);

-- UPDATE: CRITICAL - Use permissive policy to allow soft delete operations
-- Must use `using (true)` not `using (deleted_at is null)` so the UPDATE
-- operation can find and modify records being soft-deleted
create policy "Authenticated users can update investors"
  on public.investors for update
  to authenticated
  using (true)
  with check (true);

-- DELETE: Allow hard delete as fallback (soft delete is app-level)
create policy "Authenticated users can delete investors"
  on public.investors for delete
  to authenticated
  using (true);

-- ============================================================================
-- CONTACTS POLICIES
-- ============================================================================

-- SELECT: Only show non-deleted contacts
create policy "Authenticated users can view non-deleted contacts"
  on public.contacts for select
  to authenticated
  using (deleted_at is null);

-- INSERT: Any authenticated user can create contacts
create policy "Authenticated users can insert contacts"
  on public.contacts for insert
  to authenticated
  with check (true);

-- UPDATE: Permissive policy for soft delete support
create policy "Authenticated users can update contacts"
  on public.contacts for update
  to authenticated
  using (true)
  with check (true);

-- DELETE: Allow hard delete as fallback
create policy "Authenticated users can delete contacts"
  on public.contacts for delete
  to authenticated
  using (true);

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================

-- SELECT: All activities always visible (no soft delete)
create policy "Authenticated users can view all activities"
  on public.activities for select
  to authenticated
  using (true);

-- INSERT: Any authenticated user can create activities
create policy "Authenticated users can create activities"
  on public.activities for insert
  to authenticated
  with check (true);

-- No UPDATE or DELETE policies - activities are immutable audit records
-- Run in Supabase SQL Editor - Migration 11 of 11
-- Creates performance indexes for investors, contacts, and activities

-- Foreign key indexes for join performance
create index idx_contacts_investor_id on public.contacts(investor_id);
create index idx_activities_investor_id on public.activities(investor_id);

-- Activity sorting index
create index idx_activities_created_at on public.activities(created_at desc);

-- Investor query indexes
create index idx_investors_stage on public.investors(stage);
create index idx_investors_deleted_at on public.investors(deleted_at);
create index idx_investors_firm_name on public.investors(firm_name);

-- Primary contact lookup index (partial index for efficiency)
create index idx_contacts_is_primary
  on public.contacts(investor_id, is_primary)
  where is_primary = true;
