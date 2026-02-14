-- Create tasks table for investor follow-ups and reminders
-- Extends the "Next Action" concept into a full task management system

-- Task status enum
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'cancelled');

-- Task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status NOT NULL DEFAULT 'pending',
    priority task_priority NOT NULL DEFAULT 'medium',
    created_by UUID NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT tasks_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_investor_id ON public.tasks(investor_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

-- Create composite index for common filter combinations
CREATE INDEX idx_tasks_status_due_date ON public.tasks(status, due_date);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks

-- SELECT: Users can view all tasks (team-wide visibility)
CREATE POLICY "Users can view all tasks"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Users can create tasks
CREATE POLICY "Users can create tasks"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- UPDATE: Users can update any task (team can help each other)
CREATE POLICY "Users can update any task"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: Users can delete any task (team flexibility)
CREATE POLICY "Users can delete any task"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.tasks IS 'Tasks and reminders for investor follow-ups';
