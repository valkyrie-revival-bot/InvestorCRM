-- Run in Supabase SQL Editor - Migration 6 of 6
-- Template for seeding initial team members with roles
-- IMPORTANT: This file contains placeholders only.
-- Users must first sign in via Google OAuth, then UUIDs can be retrieved
-- from auth.users table and inserted here.

-- Step 1: Have all 5 team members sign in via Google OAuth
-- Step 2: Get their user_id values:
-- select id, email from auth.users order by created_at desc;

-- Step 3: Uncomment and fill in the INSERT statements below:

-- Initial Admins (3 users)
-- insert into public.user_roles (user_id, role) values
--   ('00000000-0000-0000-0000-000000000001', 'admin'),  -- Replace with actual UUID from auth.users
--   ('00000000-0000-0000-0000-000000000002', 'admin'),  -- Replace with actual UUID from auth.users
--   ('00000000-0000-0000-0000-000000000003', 'admin');  -- Replace with actual UUID from auth.users

-- Initial Members (2 users)
-- insert into public.user_roles (user_id, role) values
--   ('00000000-0000-0000-0000-000000000004', 'member'), -- Replace with actual UUID from auth.users
--   ('00000000-0000-0000-0000-000000000005', 'member'); -- Replace with actual UUID from auth.users

-- Verification query (run after inserting):
-- select
--   u.email,
--   ur.role,
--   ur.created_at
-- from public.user_roles ur
-- join auth.users u on u.id = ur.user_id
-- order by ur.created_at;
