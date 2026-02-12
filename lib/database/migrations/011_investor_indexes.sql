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
