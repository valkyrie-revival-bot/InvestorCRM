-- Migration 027: Add assigned_to field to tasks table
-- Allows tasks to be assigned to specific team members

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Index for filtering tasks by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
