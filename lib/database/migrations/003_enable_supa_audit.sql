-- Run in Supabase SQL Editor - Migration 3 of 6
-- Enables supa_audit extension for database change tracking

-- Install supa_audit extension
create extension if not exists supa_audit cascade;

-- Enable tracking on user_roles table
select audit.enable_tracking('public.user_roles'::regclass);

-- Note: Additional tables (investors, etc.) will have tracking enabled
-- when they are created in later phases. For now, only user_roles is tracked.

-- To query audit history for user_roles:
-- select * from audit.record_version
-- where table_oid = 'public.user_roles'::regclass::oid
-- order by ts desc;
