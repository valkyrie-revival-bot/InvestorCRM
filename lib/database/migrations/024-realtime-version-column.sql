-- Migration: Add version column for optimistic locking
-- Purpose: Enable conflict detection for real-time collaboration
-- Pattern: Optimistic locking - each update increments version, conflicts detected when version mismatch
-- Usage: Client sends current version with update; server rejects if version changed (another user edited)

-- Add version column to investors table
ALTER TABLE investors
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Safety net: Initialize any existing rows (should all get DEFAULT 1, but explicit for clarity)
UPDATE investors SET version = 1 WHERE version IS NULL;

-- Create composite index for efficient version lookups
-- Used by optimistic update logic: WHERE id = $1 AND version = $2
CREATE INDEX idx_investors_version ON investors(id, version);

-- Note: Application layer increments version on each UPDATE
-- Example query: UPDATE investors SET firm_name = $1, version = version + 1 WHERE id = $2 AND version = $3
-- If affected rows = 0, conflict detected (another user updated the record)
