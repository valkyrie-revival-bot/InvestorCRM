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
