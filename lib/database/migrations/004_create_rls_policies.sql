-- Run in Supabase SQL Editor - Migration 4 of 6
-- Creates helper functions for RLS policies
-- These will be used by all tables requiring role-based access control

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return (auth.jwt() ->> 'user_role')::text = 'admin';
end;
$$;

-- Helper function to check if user is authenticated
create or replace function public.is_authenticated()
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return auth.uid() is not null;
end;
$$;

-- Note: Actual table RLS policies will be created on individual tables
-- as they are created in later phases (investors table in Phase 3, etc.)
-- These helper functions provide consistent role-checking logic across all policies.
