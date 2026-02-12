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
