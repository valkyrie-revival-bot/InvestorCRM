-- Migration: Add email field to investors table
alter table public.investors
  add column if not exists email text;
