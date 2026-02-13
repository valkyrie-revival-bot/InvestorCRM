-- Migration: Enable REPLICA IDENTITY FULL for real-time change tracking
-- Purpose: Provide complete old/new record data in Supabase Realtime UPDATE/DELETE events
-- Default: PostgreSQL REPLICA IDENTITY DEFAULT only sends primary key in payload.old
-- With FULL: Realtime sends entire old record in payload.old, entire new record in payload.new

-- Enable full replica identity for investors table
ALTER TABLE investors REPLICA IDENTITY FULL;

-- Enable full replica identity for activities table
ALTER TABLE activities REPLICA IDENTITY FULL;

-- Benefits:
-- - Real-time clients receive complete "before" and "after" record state
-- - Enables optimistic update conflict detection (compare client version vs payload.old.version)
-- - UI can show "Field X changed from A to B by User Y" notifications
-- - Reduces need for separate API calls to fetch old values

-- Known limitation:
-- Even with REPLICA IDENTITY FULL, Supabase Realtime DELETE events only return primary keys
-- in payload.old when Row Level Security (RLS) is enabled on the table.
-- This is a Supabase platform limitation, not a PostgreSQL limitation.
-- Workaround: Soft delete pattern (UPDATE deleted_at = now()) instead of hard DELETE
-- provides full record data since it's an UPDATE event, not DELETE.

-- Performance note:
-- REPLICA IDENTITY FULL increases WAL (Write-Ahead Log) size because complete old row
-- is written on UPDATE/DELETE. For tables with <1000 rows and <10 updates/second,
-- performance impact is negligible. Monitor if scaling to thousands of concurrent users.
