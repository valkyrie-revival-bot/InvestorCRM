-- Migration 026: Convert unique index to unique constraint for upsert compatibility
-- Fix for: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- The issue: Migration 016 created a UNIQUE INDEX, but Supabase upsert's onConflict
-- requires a UNIQUE CONSTRAINT (not just an index) when using column name syntax.
--
-- This migration:
-- 1. Drops the existing partial unique index
-- 2. Creates a proper UNIQUE CONSTRAINT on (linkedin_url, team_member_name)
--
-- Note: We're removing the "WHERE linkedin_url IS NOT NULL" clause because:
-- - LinkedIn CSV exports always include linkedin_url (required field)
-- - A full constraint (not partial) is needed for onConflict syntax
-- - If linkedin_url is NULL, it will be filtered before insert anyway

-- Drop the existing partial unique index
DROP INDEX IF EXISTS linkedin_contacts_url_team_member_idx;

-- Create a proper unique constraint
-- This allows upsert with onConflict: 'linkedin_url,team_member_name'
ALTER TABLE linkedin_contacts
ADD CONSTRAINT linkedin_contacts_url_team_member_key
UNIQUE (linkedin_url, team_member_name);

-- Verification query (run after this migration):
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'linkedin_contacts' AND constraint_type = 'UNIQUE';
--
-- Expected result: linkedin_contacts_url_team_member_key | UNIQUE
