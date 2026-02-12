-- Run in Supabase SQL Editor - Migration 17
-- Creates investor_relationships table to link investors with LinkedIn contacts
-- Part of Phase 04.5 (Contact Intelligence) - Warm introduction path tracking

-- Create investor_relationships table
create table public.investor_relationships (
  id uuid primary key default gen_random_uuid(),

  -- Foreign keys
  investor_id uuid not null references public.investors(id) on delete cascade,
  linkedin_contact_id uuid not null references public.linkedin_contacts(id) on delete cascade,

  -- Relationship type and strength
  relationship_type text not null check (
    relationship_type in (
      'works_at',                -- LinkedIn contact currently works at the investor firm
      'former_colleague',        -- Contact used to work at the firm
      'knows_decision_maker',    -- Contact knows a decision maker at the firm
      'industry_overlap',        -- Contact works in same industry/sector
      'geographic_proximity'     -- Contact is in same geography
    )
  ),

  -- Path strength: 0.00 to 1.00 (higher = stronger connection)
  -- works_at = 1.00, knows_decision_maker = 0.80, former_colleague = 0.60, etc.
  path_strength numeric(3,2) not null default 0.00 check (path_strength >= 0 and path_strength <= 1),

  -- Human-readable explanation of the intro path
  path_description text,

  -- How this relationship was detected
  detected_via text not null default 'company_match' check (
    detected_via in (
      'company_match',  -- Fuzzy matched via company name
      'manual',         -- Manually added by user
      'email_match',    -- Matched via email domain
      'name_match'      -- Matched via contact name
    )
  ),

  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: prevent duplicate relationship entries
-- Same investor + contact + relationship type should only exist once
create unique index investor_relationships_unique_idx
  on public.investor_relationships (investor_id, linkedin_contact_id, relationship_type);

-- Composite index for fast lookups sorted by strength
-- Query pattern: Get all relationships for investor X, sorted by strongest path first
create index investor_relationships_investor_strength_idx
  on public.investor_relationships (investor_id, path_strength desc);

-- Index for reverse lookups: which investors does this LinkedIn contact connect to?
create index investor_relationships_contact_idx
  on public.investor_relationships (linkedin_contact_id);

-- Create updated_at trigger for investor_relationships
create trigger update_investor_relationships_updated_at
  before update on public.investor_relationships
  for each row
  execute function public.update_updated_at_column();

-- Enable RLS
alter table public.investor_relationships enable row level security;

-- RLS policies: Allow authenticated users full access
create policy "Authenticated users can view investor_relationships"
  on public.investor_relationships for select
  to authenticated
  using (true);

create policy "Authenticated users can insert investor_relationships"
  on public.investor_relationships for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update investor_relationships"
  on public.investor_relationships for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete investor_relationships"
  on public.investor_relationships for delete
  to authenticated
  using (true);
