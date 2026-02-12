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
