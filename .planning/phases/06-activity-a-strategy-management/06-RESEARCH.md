# Phase 6: Activity & Strategy Management - Research

**Researched:** 2026-02-12
**Domain:** CRM activity logging, strategy history tracking, and operational workflow management
**Confidence:** HIGH

## Summary

Phase 6 implements two distinct but related features: (1) operational activity logging for recording day-to-day interactions (calls, emails, meetings, LP actions), and (2) strategic thinking documentation with automatic version history. The phase builds on existing infrastructure from Phase 4 (activity timeline with filtering) and Phase 3 (inline editing with auto-save).

The standard approach for investor relationship management systems in 2026 emphasizes **separation of operational updates from strategic thinking**. Modern CRM systems distinguish between "operational CRM" (day-to-day transactions and interactions) and "strategic/analytical CRM" (long-term relationship intelligence and planning). This separation enables teams to capture quick tactical updates without cluttering strategic analysis, while maintaining full history for compliance and relationship continuity.

For activity logging, best practices prioritize **automation over manual entry** with real-time logging, comprehensive documentation (date, type, outcome, next steps), and centralized storage. The technical implementation uses modal dialogs for quick-add workflows, immutable activity records (insert-only pattern), and timeline visualization with type filtering (already implemented in Phase 4).

For strategy history, the standard pattern is **automatic archiving on update** using PostgreSQL BEFORE UPDATE triggers. When a user updates "current_strategy_notes", the system automatically moves the old value to "last_strategy_notes" with a timestamp, creating a simple two-version system. For full version history, the pattern uses a separate strategy_history table with triggers capturing all changes as JSON snapshots.

**Primary recommendation:** Implement activity quick-add modal using shadcn/ui Dialog component with form fields for activity type, description, and timestamp. Add server action for activity creation following existing pattern in actions/investors.ts. For strategy archiving, create PostgreSQL BEFORE UPDATE trigger that automatically copies current_strategy_notes → last_strategy_notes when strategy field changes, storing previous strategy date. Extend inline editing pattern from Phase 3 to handle strategy fields with automatic archiving behavior.

## Standard Stack

The established libraries/tools for activity logging and strategy management:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Radix UI Dialog | latest | Modal dialog primitive | Foundation for shadcn/ui Dialog, accessible, composable, already in project |
| shadcn/ui Dialog | latest | Styled dialog component | Pre-built Dialog wrapper around Radix with project styling |
| React Hook Form | 7.71.1 | Form state management | Already in project (package.json), handles validation, submit, loading states |
| Zod | 4.3.6 | Schema validation | Already in project, type-safe validation for activity inputs |
| PostgreSQL Triggers | native | Automatic data archiving | Built-in database feature, zero application code for archiving logic |
| Server Actions | Next.js 16 | Backend API pattern | Already used in project (createInvestor, updateInvestorField) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.563.0 | Icon library | Activity type icons (Phone, Mail, Calendar) already used in timeline |
| sonner | 2.0.7 | Toast notifications | Success/error feedback after activity creation |
| date-fns | optional | Date formatting | If advanced date manipulation needed beyond native Date |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dialog modal | Inline form on page | Modal keeps user context, prevents navigation, familiar quick-add pattern |
| PostgreSQL triggers | Application-level archiving | Triggers guarantee consistency, can't be bypassed, less code to maintain |
| Two-field history (current/last) | Full history table | Two-field simpler for "what changed recently", history table for full audit trail |
| Immutable activities | Editable activities | Immutable = audit trail integrity, compliance requirement for investor relations |
| Server Actions | API routes (/api/*) | Server Actions colocated with components, better TypeScript, existing pattern |

**Installation:**
```bash
# All required dependencies already installed in project
# No new packages needed

# Verify existing packages
npm list react-hook-form zod @radix-ui lucide-react sonner
```

## Architecture Patterns

### Recommended File Structure

```
app/actions/
├── investors.ts              # Extend with createActivity, getStrategyHistory

components/investors/
├── quick-add-activity-modal.tsx      # NEW: Dialog modal for logging activities
├── strategy-history-viewer.tsx       # NEW: Collapsible history view
├── investor-form-sections.tsx        # EXTEND: Strategy section with history link
├── investor-activity-timeline.tsx    # EXISTS: Already supports activity types
└── inline-edit-field.tsx             # EXISTS: Already supports auto-save

lib/database/migrations/
├── 019-activity-quick-add-types.sql  # ADD: Validate new activity types (LP action)
└── 020-strategy-history-trigger.sql  # NEW: Auto-archive strategy on update

lib/validations/
└── activity-schema.ts                # NEW: Zod schema for activity creation
```

### Pattern 1: Quick-Add Activity Modal

**What:** Modal dialog triggered from investor detail page, allows rapid logging of activities without leaving context.

**When to use:** Recording day-to-day operational updates (calls, emails, meetings) that need timestamp and type classification.

**Example:**
```typescript
// components/investors/quick-add-activity-modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createActivity } from '@/app/actions/investors';
import { activityCreateSchema, type ActivityCreateInput } from '@/lib/validations/activity-schema';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface QuickAddActivityModalProps {
  investorId: string;
}

export function QuickAddActivityModal({ investorId }: QuickAddActivityModalProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<ActivityCreateInput>({
    resolver: zodResolver(activityCreateSchema),
    defaultValues: {
      investor_id: investorId,
      activity_type: 'note',
      description: '',
    },
  });

  const onSubmit = async (data: ActivityCreateInput) => {
    const result = await createActivity(data);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Activity logged');
    form.reset();
    setOpen(false); // Close modal after success
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Activity type select */}
          {/* Description textarea */}
          {/* Timestamp input (defaults to now) */}
          {/* Submit button */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: PostgreSQL Trigger for Strategy Archiving

**What:** BEFORE UPDATE trigger that automatically moves current strategy to last strategy when user saves new strategy notes.

**When to use:** Automatic versioning of text fields where you need simple "current vs. previous" comparison without full history table.

**Example:**
```sql
-- lib/database/migrations/020-strategy-history-trigger.sql
-- Creates automatic archiving for strategy notes

CREATE OR REPLACE FUNCTION archive_strategy_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only archive if current_strategy_notes changed and had a value
  IF OLD.current_strategy_notes IS DISTINCT FROM NEW.current_strategy_notes
     AND OLD.current_strategy_notes IS NOT NULL
     AND OLD.current_strategy_notes != '' THEN

    -- Move old current → last
    NEW.last_strategy_notes := OLD.current_strategy_notes;
    NEW.last_strategy_date := OLD.current_strategy_date;

    -- Update current strategy date to now
    NEW.current_strategy_date := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to investors table
CREATE TRIGGER strategy_archive_trigger
BEFORE UPDATE ON public.investors
FOR EACH ROW
EXECUTE FUNCTION archive_strategy_on_update();
```

**Key insight:** Trigger runs BEFORE UPDATE, allowing modification of NEW record before it's written. Uses `IS DISTINCT FROM` to handle NULL comparisons correctly. Only archives when there's actual content to preserve.

### Pattern 3: Strategy History Full Audit Trail (Optional Enhancement)

**What:** Separate table capturing all strategy changes with timestamp and user tracking, enabling unlimited version history.

**When to use:** Compliance requirements demand full audit trail, or users need to review evolution over multiple versions (not just current vs. last).

**Example:**
```sql
-- Full history table pattern
CREATE TABLE strategy_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  strategy_notes text NOT NULL,
  strategy_date date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_strategy_history_investor ON strategy_history(investor_id, created_at DESC);

-- Trigger function for full history
CREATE OR REPLACE FUNCTION log_strategy_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log every update to strategy (not just when it changes)
  IF NEW.current_strategy_notes IS NOT NULL THEN
    INSERT INTO strategy_history (investor_id, strategy_notes, strategy_date, created_by)
    VALUES (NEW.id, NEW.current_strategy_notes, NEW.current_strategy_date, NEW.created_by);
  END IF;

  RETURN NEW;
END;
$$;
```

### Pattern 4: Server Action for Activity Creation

**What:** Server-side function handling validation, auth check, database insert, and revalidation for new activities.

**When to use:** Any user-triggered activity creation from quick-add modal or other UI components.

**Example:**
```typescript
// app/actions/investors.ts (extend existing file)
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { activityCreateSchema, type ActivityCreateInput } from '@/lib/validations/activity-schema';

export async function createActivity(input: ActivityCreateInput): Promise<
  { data: Activity; error?: never } | { data?: never; error: string }
> {
  try {
    // Validate input
    const validated = activityCreateSchema.parse(input);

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Insert activity
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        investor_id: validated.investor_id,
        activity_type: validated.activity_type,
        description: validated.description,
        metadata: validated.metadata || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !activity) {
      return { error: insertError?.message || 'Failed to create activity' };
    }

    // Update last_action_date on investor (operational tracking)
    await supabase
      .from('investors')
      .update({ last_action_date: new Date().toISOString().split('T')[0] })
      .eq('id', validated.investor_id);

    revalidatePath(`/investors/${validated.investor_id}`);
    return { data: activity };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to create activity' };
  }
}
```

### Pattern 5: Collapsible Strategy History Viewer

**What:** UI component showing current strategy with expandable section revealing last strategy and optional full history.

**When to use:** Strategy section of investor detail page, allows users to see evolution without cluttering main form.

**Example:**
```typescript
// components/investors/strategy-history-viewer.tsx
'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, History } from 'lucide-react';

interface StrategyHistoryViewerProps {
  currentStrategy: string | null;
  currentStrategyDate: string | null;
  lastStrategy: string | null;
  lastStrategyDate: string | null;
}

export function StrategyHistoryViewer({
  currentStrategy,
  currentStrategyDate,
  lastStrategy,
  lastStrategyDate,
}: StrategyHistoryViewerProps) {
  const [open, setOpen] = useState(false);

  // Don't show history if no previous strategy exists
  if (!lastStrategy) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <History className="h-4 w-4" />
        View strategy history
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-2">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Previous Strategy</span>
            {lastStrategyDate && (
              <time className="text-xs text-muted-foreground">
                {new Date(lastStrategyDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{lastStrategy}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Anti-Patterns to Avoid

- **Manual strategy archiving:** Don't implement application-level code to copy current → last strategy. Database triggers guarantee consistency and can't be bypassed by bugs or forgotten logic.

- **Editable activity records:** Activities should be immutable (insert-only). If correction needed, add new activity explaining the correction. This maintains audit trail integrity for compliance.

- **Complex multi-field modals:** Keep quick-add focused. Don't try to capture every possible data point. Type + description + timestamp is sufficient. Additional details can be added via metadata JSON if needed.

- **Mixing operational and strategic updates:** Don't log strategy changes as activities. Strategy updates are intentional planning sessions, not day-to-day operational touchpoints. Keep them separate conceptually and in UI.

- **Custom date/time pickers:** Use native HTML5 `<input type="datetime-local">` for timestamps. Browser-native pickers are accessible, familiar, and require zero dependencies.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom overlay + focus trap | Radix UI Dialog (via shadcn/ui) | Accessibility (focus management, ARIA, ESC handling), portal rendering, animation states |
| Form validation | Manual error state management | React Hook Form + Zod | Type-safe validation, loading states, field-level errors, submit handling |
| Database history tracking | Application-level archiving code | PostgreSQL BEFORE UPDATE triggers | Atomic operations, can't be bypassed, no race conditions, less code |
| Toast notifications | Custom alert system | Sonner (already in project) | Queue management, stacking, auto-dismiss, accessible announcements |
| Activity type icons | Custom SVG mappings | lucide-react (already in project) | Consistent design, tree-shakeable, already mapped in timeline component |

**Key insight:** Activity logging and strategy archiving are solved problems in CRM/investor relations systems. The patterns are well-established: modal quick-add for operational updates, database triggers for automatic versioning. Focus implementation effort on domain-specific requirements (what activity types matter, what metadata to capture) rather than reinventing infrastructure.

## Common Pitfalls

### Pitfall 1: Strategy Auto-Save Triggers Unwanted Archiving

**What goes wrong:** User clicks into strategy field, browser auto-fills or user makes minor typo, blur triggers auto-save, old strategy gets archived even though change was unintentional.

**Why it happens:** Auto-save on blur (Phase 3 pattern) triggers UPDATE query on every field exit, even if value didn't meaningfully change.

**How to avoid:**
- Trigger function uses `OLD.current_strategy_notes IS DISTINCT FROM NEW.current_strategy_notes` to only archive when value actually changed
- Add NULL/empty check: `AND OLD.current_strategy_notes IS NOT NULL AND OLD.current_strategy_notes != ''`
- Consider adding minimum character difference threshold (e.g., only archive if old value was >20 characters different from new)

**Warning signs:**
- Last strategy updates too frequently (multiple times per day)
- Last strategy identical or nearly identical to current strategy
- Users complaining about "losing" their strategy notes

### Pitfall 2: Activity Timeline Performance with Large History

**What goes wrong:** Investor with 500+ activities causes slow page loads, timeline becomes unusable, database queries timeout.

**Why it happens:** Fetching all activities for timeline without pagination or limits. Phase 4 timeline renders entire activity list in single pass.

**How to avoid:**
- Add pagination to `getActivities` server action (default: 50 most recent)
- Implement "Load more" button at bottom of timeline
- Add database index on `(investor_id, created_at DESC)` for efficient recent-first queries
- Consider activity type filtering on server-side (only fetch requested types)

**Warning signs:**
- Investor detail page takes >2 seconds to load
- Timeline section shows loading spinner for extended time
- Browser becomes unresponsive when scrolling timeline
- Supabase slow query logs showing activities queries

### Pitfall 3: Lost Next Action Context

**What goes wrong:** User logs activity, updates next action field, but next action doesn't clearly connect to what was just logged. Weeks later, team can't reconstruct decision path.

**Why it happens:** Next action and activity logging are separate operations without explicit linking. Next action field is just text, no relationship to specific activity.

**How to avoid:**
- Add optional "Set next action" checkbox to activity quick-add modal
- Store activity_id reference in next_action metadata JSON: `{"source_activity_id": "uuid"}`
- Display "Set from: [activity description]" hint below next_action field
- Consider adding dedicated "Follow-up" activity type that auto-populates next_action

**Warning signs:**
- Team asking "Why did we decide to do X?" with no clear activity trail
- Next actions feel disconnected from recent interactions
- Pipeline reviews lack context for why specific next steps were chosen

### Pitfall 4: Strategy Date Ambiguity

**What goes wrong:** Strategy date shows "Jan 15" but unclear if that's when strategy was last reviewed, when it was created, or when it should be next reviewed.

**Why it happens:** Single date field serves multiple semantic purposes (last reviewed, created, next review due).

**How to avoid:**
- Label field clearly: "Last Reviewed" not just "Strategy Date"
- Trigger auto-sets date to CURRENT_DATE when strategy updates (makes it "last modified" date)
- Add separate "Next Strategy Review" date field for proactive planning
- Show relative time in UI: "Updated 2 weeks ago" alongside absolute date

**Warning signs:**
- Users manually updating strategy date without changing strategy content
- Confusion about when strategy is "stale" and needs review
- Strategy dates in future (user tried to set reminder date)

### Pitfall 5: Activity Type Explosion

**What goes wrong:** Too many activity types (call-inbound, call-outbound, email-intro, email-followup, meeting-video, meeting-phone, etc.) make quick-add dropdown overwhelming and inconsistent logging.

**Why it happens:** Attempting to capture every nuance of interaction type in primary taxonomy.

**How to avoid:**
- Keep primary types simple: call, email, meeting, note (4-6 max)
- Use metadata JSON for sub-classification: `{"call_type": "inbound", "duration_minutes": 30}`
- Phase 4 timeline already supports these types with icons
- Add new types only if they need distinct timeline visualization or filtering

**Warning signs:**
- Activity type dropdown has >8 options
- Users asking "Which type should I use for X?"
- Timeline filter buttons wrapping to multiple rows
- Data showing one activity type used 95% of time

## Code Examples

Verified patterns for this phase:

### Controlled Dialog with Async Form Submission

Pattern for closing modal only after successful server action completion.

```typescript
// Source: Radix UI Primitives docs + project patterns
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';

export function ControlledModal() {
  const [open, setOpen] = useState(false);
  const form = useForm();

  const handleSubmit = async (data) => {
    const result = await serverAction(data);

    if (result.error) {
      // Show error, keep modal open
      return;
    }

    // Success: reset and close
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button>Open</button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Activity Creation with Metadata

Server action pattern for activities with optional metadata JSON.

```typescript
// Source: Existing project pattern in app/actions/investors.ts
'use server';

export async function createActivity(input: ActivityCreateInput) {
  const validated = activityCreateSchema.parse(input);

  const { data, error } = await supabase
    .from('activities')
    .insert({
      investor_id: validated.investor_id,
      activity_type: validated.activity_type,
      description: validated.description,
      metadata: validated.metadata || null, // Optional JSON
      created_by: user.id,
    })
    .select()
    .single();

  return { data, error };
}
```

### Trigger with NULL-Safe Comparison

PostgreSQL trigger pattern handling NULL values correctly.

```sql
-- Source: PostgreSQL documentation + Supabase guides
CREATE OR REPLACE FUNCTION archive_strategy_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- IS DISTINCT FROM handles NULL correctly (NULL != NULL returns true)
  IF OLD.current_strategy_notes IS DISTINCT FROM NEW.current_strategy_notes
     AND OLD.current_strategy_notes IS NOT NULL
     AND OLD.current_strategy_notes != '' THEN

    NEW.last_strategy_notes := OLD.current_strategy_notes;
    NEW.last_strategy_date := OLD.current_strategy_date;
    NEW.current_strategy_date := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$;
```

### Activity Type Enum Validation

Zod schema with activity type enum matching database constraint.

```typescript
// Source: Existing project pattern in lib/validations/investor-schema.ts
import { z } from 'zod';

// Match database enum constraint
export const ACTIVITY_TYPES = [
  'note',
  'call',
  'email',
  'meeting',
  'stage_change',
  'field_update',
] as const;

export const activityCreateSchema = z.object({
  investor_id: z.string().uuid(),
  activity_type: z.enum(ACTIVITY_TYPES),
  description: z.string().min(1, 'Description required').max(1000),
  metadata: z.record(z.unknown()).optional(),
});

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual activity logging in separate notes app | Integrated CRM quick-add with automatic timeline | ~2020-2022 | Real-time team visibility, no context switching |
| Application-level history tracking (compare on read) | Database triggers with automatic archiving | ~2018-2021 | Guaranteed consistency, no race conditions |
| Full modal forms for every activity | Quick-add patterns with minimal required fields | ~2021-2023 | Lower friction, higher adoption, faster logging |
| Strategy in free-form notes | Structured strategy fields with automatic versioning | ~2022-2024 | Visible evolution, compliance-ready audit trail |
| Separate operational and strategic tools | Unified CRM with operational/strategic separation | ~2023-2025 | Single source of truth, reduced tool sprawl |

**Deprecated/outdated:**
- **Complex activity workflows:** Multi-step activity creation wizards. Modern pattern: quick-add modal with optional expansion for details.
- **Email/calendar sync after-the-fact:** Waiting for nightly sync to populate activities. Current: Real-time bidirectional sync or at least sub-15-minute polling.
- **Single strategy text field:** No history, no dates, just current thinking. Replaced by: Versioned strategy with automatic archiving and timestamps.
- **Activity editing:** Allowing modification of historical activity records. Now: Immutable activities, corrections via new activity explaining change.

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal strategy review cadence reminder**
   - What we know: Strategy should be reviewed periodically, stale strategy loses value
   - What's unclear: Best UX for prompting review (notification, dashboard flag, automated reminder?)
   - Recommendation: Phase 6 implements basic history, Phase 7+ can add proactive reminders based on time since last update

2. **Activity metadata standardization**
   - What we know: Metadata JSON allows flexible sub-classification (call duration, email type, meeting attendees)
   - What's unclear: Should we define metadata schemas per activity type or keep fully flexible?
   - Recommendation: Start flexible (any JSON), observe usage patterns, formalize schemas in Phase 7+ if needed

3. **Strategy history UI depth**
   - What we know: Two-field pattern (current/last) is simple, full history table enables unlimited versions
   - What's unclear: Do users need >2 versions visible in UI? Is timeline browsing valuable enough to build?
   - Recommendation: Implement two-field pattern for Phase 6, add full history viewer only if user feedback demands it

4. **Integration with next_action field**
   - What we know: Next action and activities should connect conceptually (activity drives next step)
   - What's unclear: Should activity creation auto-populate next_action? Should next_action link to source activity?
   - Recommendation: Phase 6 keeps them separate, observe usage patterns, consider linkage in Phase 7+ based on user workflow

## Sources

### Primary (HIGH confidence)

- [/radix-ui/primitives](https://www.radix-ui.com/primitives/docs/components/dialog) - Dialog component API, controlled dialog patterns, accessibility features
- [Supabase Postgres Triggers Documentation](https://supabase.com/docs/guides/database/postgres/triggers) - BEFORE UPDATE trigger patterns, OLD/NEW variables
- Existing codebase patterns:
  - `/app/actions/investors.ts` - Server action pattern with validation, auth, revalidation
  - `/components/investors/inline-edit-field.tsx` - Auto-save on blur pattern
  - `/components/investors/investor-activity-timeline.tsx` - Activity type filtering, timeline visualization
  - `/lib/database/migrations/009_create_activities.sql` - Immutable activities schema

### Secondary (MEDIUM confidence)

- [CRM data management guide: 10 best practices for 2026](https://monday.com/blog/crm-and-sales/crm-data-management/) - Immediate logging, automation over manual entry
- [CRM Activity Logging best practices](https://telecrm.in/blog/crm-best-practices/) - Real-time updates, comprehensive documentation
- [Dakota CRM: Past Activity Reports](https://www.dakota.com/resources/blog/from-tedious-to-transformative-how-past-activity-reports-turn-crm-logging-into-sales-success) - Activity logging driving sales success
- [CRM for Investor Relations 2026](https://dialllog.co/crm-for-investor-relations) - Capturing interaction history for long-term relationships
- [Strategic vs. Operational CRM](https://www.superoffice.com/blog/types-of-crm/) - Separating operational updates from strategic analysis
- [Strategic vs. Operational Management](https://www.boardeffect.com/blog/strategic-vs-operational-management/) - Strategic = how (long-term), Operational = what (day-to-day)
- [PostgreSQL History Tracking Pattern](https://www.thegnar.com/blog/history-tracking-with-postgres) - Trigger-based archiving with OLD/NEW records
- [PostgreSQL BEFORE UPDATE Trigger](https://neon.com/postgresql/postgresql-triggers/postgresql-before-update-trigger) - Pattern for capturing old values
- [Material UI Timeline Component](https://mui.com/material-ui/react-timeline/) - Timeline visualization patterns (reference, not used in project)
- [React Modal Best Practices 2026](https://blog.croct.com/post/best-react-modal-dialog-libraries) - Accessibility, ease of use, focus management

### Tertiary (LOW confidence)

- [Task Management Best Practices 2026](https://www.luacrm.com/en/blog-detail/task-management-best-practices-for-service-teams-2026) - Centralization, ownership, context documentation
- [CRM Task Management with Follow-Up Reminders](https://www.onepagecrm.com/features/take-action/) - Next action tracking patterns
- [React Best Practices 2026](https://technostacks.com/blog/react-best-practices/) - Functional components, hooks, performance optimization

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, Radix/shadcn Dialog well-documented, PostgreSQL triggers native feature
- Architecture: HIGH - Patterns derived from existing codebase (Phase 3 inline edit, Phase 4 timeline, server actions), verified with official docs
- Pitfalls: MEDIUM - Based on common CRM patterns and web search findings, not project-specific testing

**Research date:** 2026-02-12
**Valid until:** ~2026-03-12 (30 days) - Stable domain, React/Next.js patterns unlikely to change rapidly
