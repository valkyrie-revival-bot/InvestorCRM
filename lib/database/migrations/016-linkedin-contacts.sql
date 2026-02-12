-- Run in Supabase SQL Editor - Migration 16
-- Creates linkedin_contacts table with pg_trgm extension for fuzzy company matching
-- Part of Phase 04.5 (Contact Intelligence) - LinkedIn network import foundation

-- Enable pg_trgm extension for trigram similarity search
create extension if not exists pg_trgm;

-- Create linkedin_contacts table
create table public.linkedin_contacts (
  id uuid primary key default gen_random_uuid(),

  -- Name fields
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,

  -- LinkedIn profile and contact info
  linkedin_url text,
  email text, -- Nullable - most LinkedIn contacts don't share email

  -- Company and position
  company text,
  position text,
  normalized_company text, -- Lowercased with legal suffixes removed for fuzzy matching

  -- Connection tracking
  connected_on date, -- When the connection was established
  team_member_name text not null, -- Which team member owns this connection (Todd, Jeff, Jackson, Morino)

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: prevent duplicate imports per team member
-- Same LinkedIn profile can be imported by multiple team members (different network views)
create unique index linkedin_contacts_url_team_member_idx
  on public.linkedin_contacts (linkedin_url, team_member_name)
  where linkedin_url is not null;

-- GIN trigram index for fuzzy company name matching
-- Enables fast similarity searches: SELECT * FROM linkedin_contacts WHERE normalized_company % 'sequoia'
create index linkedin_contacts_normalized_company_trgm_idx
  on public.linkedin_contacts
  using gin (normalized_company gin_trgm_ops);

-- Btree index for filtering by team member
create index linkedin_contacts_team_member_idx
  on public.linkedin_contacts (team_member_name);

-- Btree index for email lookups (deduplication, matching)
create index linkedin_contacts_email_idx
  on public.linkedin_contacts (email)
  where email is not null;

-- Create updated_at trigger for linkedin_contacts
create trigger update_linkedin_contacts_updated_at
  before update on public.linkedin_contacts
  for each row
  execute function public.update_updated_at_column();

-- Enable RLS
alter table public.linkedin_contacts enable row level security;

-- RLS policies: Allow authenticated users full access
create policy "Authenticated users can view linkedin_contacts"
  on public.linkedin_contacts for select
  to authenticated
  using (true);

create policy "Authenticated users can insert linkedin_contacts"
  on public.linkedin_contacts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update linkedin_contacts"
  on public.linkedin_contacts for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete linkedin_contacts"
  on public.linkedin_contacts for delete
  to authenticated
  using (true);
