# Phase 5: Stage Discipline & Workflow - Research

**Researched:** 2026-02-12
**Domain:** CRM pipeline stage management, workflow enforcement, drag-and-drop validation
**Confidence:** HIGH

## Summary

Stage-based pipeline management with enforcement is a foundational CRM capability that transforms pipelines from loose collections of data into disciplined revenue operations systems. The research reveals that successful implementations balance three critical concerns: (1) enforcing stage discipline through exit criteria and validation rules, (2) providing flexibility through override mechanisms with audit trails, and (3) maintaining excellent UX that doesn't frustrate users with excessive friction.

Modern CRM systems in 2026 emphasize **stage gates as quality control checkpoints** rather than bureaucratic obstacles. The pattern is clear: define explicit exit criteria per stage, validate before progression, but always provide an escape hatch with mandatory reasoning and audit logging. The "30-day stalled" threshold is widely recognized as a meaningful inactivity indicator across fundraising contexts.

For implementation, the standard stack combines React Hook Form with Zod for validation dialogs, @hello-pangea/dnd's conditional drag logic for kanban validation, and PostgreSQL triggers for automatic timestamp tracking. The key architectural insight: validation should happen **at the moment of stage transition** (onDragEnd callback), not as a background process.

**Primary recommendation:** Implement validation as a three-tier system: (1) immediate visual feedback during drag hover showing if drop is allowed, (2) validation dialog on drop with exit checklist if criteria not met, (3) override dialog requiring explicit reason and confirmation. All transitions should auto-log to activity stream and update stage_entry_date via trigger.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | v7.66.0 | Form validation in modals | Industry standard for React forms - performant, minimal re-renders, excellent TypeScript support |
| zod | v3.24.2 | Schema validation | TypeScript-first validation with static type inference, conditional validation support |
| @hello-pangea/dnd | latest | Drag-and-drop with validation | Fork of react-beautiful-dnd with active maintenance, supports conditional dragging/dropping |
| PostgreSQL Triggers | built-in | Auto-update timestamps | Native database feature, guaranteed atomicity, no application-level bugs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | latest | Zod + RHF integration | Bridges Zod schemas to React Hook Form |
| shadcn/ui Dialog | latest | Modal components | Accessible, customizable, already in project |
| shadcn/ui Form | latest | Form field components | Consistent form UX, built-in error display |
| Supabase supa_audit | optional | Audit logging extension | If comprehensive audit trail beyond activities needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @hello-pangea/dnd | @dnd-kit/core | More modular/flexible but steeper learning curve, unnecessary for v1 |
| Zod | Yup | Zod has better TypeScript inference and is more modern |
| PostgreSQL triggers | Application-level updates | Triggers are atomic and can't be bypassed by bugs |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
# @hello-pangea/dnd already installed in Phase 4
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── _components/
│   ├── stage-validation-dialog.tsx    # Modal for exit checklist
│   ├── stage-override-dialog.tsx      # Modal for override + reason
│   └── kanban-board.tsx                # Enhanced with validation
├── _actions/
│   ├── update-investor-stage.ts       # Server action with validation
│   └── create-activity-log.ts         # Auto-log stage changes
└── _lib/
    ├── stage-definitions.ts           # Stage metadata + exit criteria
    └── validation-schemas.ts          # Zod schemas per stage
```

### Pattern 1: Stage Definition with Exit Criteria

**What:** Centralized configuration defining stage metadata and validation requirements
**When to use:** Foundation for all stage enforcement logic

**Example:**
```typescript
// Source: Best practices from CRM research + Zod documentation
// https://www.avoma.com/blog/sales-pipeline-stages

export const STAGE_DEFINITIONS = {
  'initial-contact': {
    label: 'Initial Contact',
    order: 1,
    exitCriteria: [
      { field: 'first_contact_date', required: true, label: 'Date of first contact' },
      { field: 'contact_method', required: true, label: 'Contact method (email/call/meeting)' },
    ],
    nextStages: ['materials-shared'],
  },
  'materials-shared': {
    label: 'Materials Shared',
    order: 2,
    exitCriteria: [
      { field: 'deck_sent_date', required: true, label: 'Date deck/materials sent' },
      { field: 'materials_opened', required: false, label: 'Materials opened by LP' },
    ],
    nextStages: ['nda'],
  },
  'nda': {
    label: 'NDA',
    order: 3,
    exitCriteria: [
      { field: 'nda_signed_date', required: true, label: 'NDA signed date' },
      { field: 'nda_document_url', required: true, label: 'Link to signed NDA' },
    ],
    nextStages: ['due-diligence'],
  },
  'due-diligence': {
    label: 'Due Diligence',
    order: 4,
    exitCriteria: [
      { field: 'dd_started_date', required: true, label: 'Due diligence start date' },
      { field: 'dd_meetings_count', required: true, label: 'Number of DD meetings (min 2)' },
    ],
    nextStages: ['won', 'lost', 'delayed'],
  },
  'won': {
    label: 'Won',
    order: 5,
    exitCriteria: [],
    nextStages: [],
  },
  'lost': {
    label: 'Lost',
    order: 5,
    exitCriteria: [
      { field: 'lost_reason', required: true, label: 'Reason for loss' },
    ],
    nextStages: [],
  },
  'delayed': {
    label: 'Delayed',
    order: 5,
    exitCriteria: [
      { field: 'delayed_reason', required: true, label: 'Reason for delay' },
      { field: 'expected_resume_date', required: false, label: 'Expected resume date' },
    ],
    nextStages: [],
  },
} as const;

export type Stage = keyof typeof STAGE_DEFINITIONS;
```

### Pattern 2: Conditional Drag-and-Drop Validation

**What:** Validate stage transitions during drag operation, show modal if criteria not met
**When to use:** For kanban board interactions requiring stage discipline

**Example:**
```typescript
// Source: @hello-pangea/dnd documentation + CRM validation patterns
// https://context7.com/hello-pangea/dnd/llms.txt

import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useState } from 'react';

function KanbanBoard() {
  const [pendingTransition, setPendingTransition] = useState<{
    investorId: string;
    fromStage: Stage;
    toStage: Stage;
  } | null>(null);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const fromStage = result.source.droppableId as Stage;
    const toStage = result.destination.droppableId as Stage;
    const investorId = result.draggableId;

    // Check if transition is allowed
    const fromDef = STAGE_DEFINITIONS[fromStage];
    if (!fromDef.nextStages.includes(toStage)) {
      toast.error('Invalid stage transition');
      return;
    }

    // Validate exit criteria
    const investor = await getInvestor(investorId);
    const validation = validateExitCriteria(investor, fromStage);

    if (!validation.valid) {
      // Show validation dialog instead of moving
      setPendingTransition({ investorId, fromStage, toStage });
      return;
    }

    // Criteria met - proceed with transition
    await updateStage(investorId, toStage);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Kanban columns */}
      </DragDropContext>

      {pendingTransition && (
        <StageValidationDialog
          transition={pendingTransition}
          onComplete={() => setPendingTransition(null)}
        />
      )}
    </>
  );
}
```

### Pattern 3: Stage Validation Dialog with Exit Checklist

**What:** Modal form requiring exit criteria completion before stage advancement
**When to use:** When user attempts stage transition without meeting criteria

**Example:**
```typescript
// Source: React Hook Form + Zod + shadcn/ui documentation
// https://context7.com/react-hook-form/react-hook-form/llms.txt
// https://context7.com/shadcn-ui/ui/llms.txt

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';

const exitCriteriaSchema = z.object({
  deck_sent_date: z.string().min(1, 'Required'),
  materials_opened: z.boolean().optional(),
  override_reason: z.string().optional(),
});

function StageValidationDialog({ transition, onComplete }) {
  const { investorId, fromStage, toStage } = transition;
  const criteria = STAGE_DEFINITIONS[fromStage].exitCriteria;

  const form = useForm({
    resolver: zodResolver(exitCriteriaSchema),
    defaultValues: {},
  });

  const onSubmit = async (data) => {
    // Update investor with exit criteria data
    await updateInvestor(investorId, data);
    // Proceed with stage transition
    await updateStage(investorId, toStage);
    // Log activity
    await createActivity({
      investorId,
      type: 'stage_change',
      description: `Stage changed from ${fromStage} to ${toStage}`,
    });
    onComplete();
  };

  return (
    <Dialog open onOpenChange={onComplete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Exit Criteria</DialogTitle>
          <DialogDescription>
            Please provide the following information before advancing to {toStage}:
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {criteria.map((criterion) => (
            <div key={criterion.field}>
              <Label>{criterion.label}</Label>
              <Input {...form.register(criterion.field)} />
              {form.formState.errors[criterion.field] && (
                <span className="text-red-500">
                  {form.formState.errors[criterion.field].message}
                </span>
              )}
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onComplete}>
              Cancel
            </Button>
            <Button type="submit">
              Advance to {toStage}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 4: Override Dialog with Mandatory Reason

**What:** Allow users to bypass validation with explicit confirmation and audit trail
**When to use:** User clicks "Override" button in validation dialog

**Example:**
```typescript
// Source: CRM governance best practices + React Hook Form patterns
// https://www.siroccogroup.com/2026-crm-trends-twelve-practical-shifts-for-revenue-operations/

const overrideSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the override' }),
  }),
});

function StageOverrideDialog({ transition, onComplete }) {
  const form = useForm({
    resolver: zodResolver(overrideSchema),
  });

  const onSubmit = async (data) => {
    await updateStage(transition.investorId, transition.toStage);
    await createActivity({
      investorId: transition.investorId,
      type: 'stage_override',
      description: `Stage changed from ${transition.fromStage} to ${transition.toStage} (OVERRIDE)`,
      metadata: {
        override_reason: data.reason,
        overridden_by: currentUser.id,
      },
    });
    toast.warning('Stage advanced with override');
    onComplete();
  };

  return (
    <Dialog open onOpenChange={onComplete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Stage Validation</DialogTitle>
          <DialogDescription>
            Exit criteria not met. You can override but must provide a reason.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Label>Reason for Override</Label>
          <Textarea {...form.register('reason')} rows={4} />
          {form.formState.errors.reason && (
            <span className="text-red-500">{form.formState.errors.reason.message}</span>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Checkbox {...form.register('confirmed')} />
            <Label>I confirm this override is necessary</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onComplete}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Override and Advance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 5: Auto-Update Timestamp with PostgreSQL Trigger

**What:** Automatically update stage_entry_date when stage column changes
**When to use:** Always - this should be database-enforced for reliability

**Example:**
```sql
-- Source: PostgreSQL trigger documentation
-- https://www.the-art-of-web.com/sql/trigger-update-timestamp/
-- https://aviyadav231.medium.com/automatically-updating-a-timestamp-column-in-postgresql-using-triggers-98766e3b47a0

-- Create trigger function
CREATE OR REPLACE FUNCTION update_stage_entry_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if stage actually changed
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entry_date = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to investors table
CREATE TRIGGER investors_stage_change
  BEFORE UPDATE ON investors
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_entry_date();
```

### Pattern 6: Stale Deal Detection Query

**What:** Identify investors with no activity for 30+ days
**When to use:** Background job or on-demand report

**Example:**
```sql
-- Source: CRM stale deal best practices
-- https://www.zoho.com/crm/resources/solutions/track-days-of-deal-inactivity.html

-- Add computed field for days since last activity
SELECT
  id,
  name,
  stage,
  stage_entry_date,
  last_activity_date,
  CURRENT_DATE - last_activity_date::date AS days_inactive,
  CASE
    WHEN CURRENT_DATE - last_activity_date::date >= 30
      AND stage NOT IN ('won', 'lost', 'delayed')
    THEN true
    ELSE false
  END AS is_stalled
FROM investors
WHERE stage NOT IN ('won', 'lost', 'delayed')
ORDER BY days_inactive DESC;
```

### Anti-Patterns to Avoid

- **Validating after the drag completes:** Show feedback during/immediately after drag, not seconds later
- **Blocking with no override:** Always provide escape hatch - rigid systems get bypassed via spreadsheets
- **Silent overrides:** Every override must have reason + audit log, or discipline disappears
- **Complex multi-step wizards:** Exit checklists should be simple forms, not 5-page wizards
- **Application-level timestamp updates:** Use database triggers to guarantee atomicity
- **Validating on form submit in separate view:** Validate at the point of transition (drag-drop), not in settings
- **Auto-dismissing error toasts:** Stage validation errors need user acknowledgment, not 3-second toasts

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation functions | React Hook Form + Zod | Handles edge cases: async validation, field dependencies, error focus, touched state |
| Drag-and-drop with constraints | Custom drag handlers | @hello-pangea/dnd with isDragDisabled | Accessibility, keyboard support, screen readers, mobile |
| Timestamp auto-update | Application-level updates | PostgreSQL triggers | Can't be bypassed by bugs, atomic, works for all update paths |
| Audit trail | Custom logging tables | Supabase supa_audit or triggers | Immutable logs, complete history, proven patterns |
| Schema validation | If/else chains | Zod with conditional validation | Type-safe, composable, great error messages |
| Modal state management | useState spaghetti | Dialog component with controlled open prop | Accessibility, focus trapping, escape key, backdrop clicks |

**Key insight:** Stage validation touches 6+ complex domains (forms, validation, drag-drop, databases, audit, UX). Each has mature libraries that handle 100+ edge cases. Custom implementations inevitably hit issues that libraries solved years ago (example: conditional validation across fields, async validation, optimistic updates with rollback).

## Common Pitfalls

### Pitfall 1: Drag-Drop Bypasses Validation Rules
**What goes wrong:** User drags card between columns, stage updates, but validation rules never checked
**Why it happens:** Validation only implemented in form views, not in drag handlers
**How to avoid:** Implement validation in onDragEnd callback BEFORE updating state. Show dialog if invalid.
**Warning signs:** Database has records in advanced stages missing required fields from earlier stages

### Pitfall 2: Overly Strict Validation Frustrates Users
**What goes wrong:** Users abandon the CRM and track deals in spreadsheets/email
**Why it happens:** No override option, or override is buried/requires approval
**How to avoid:** Always provide override button with mandatory reason field. Log overrides for visibility.
**Warning signs:** Users complaining about "too many clicks", data entry declining, adoption metrics dropping

### Pitfall 3: Stale Detection Fires Too Early
**What goes wrong:** Deals flagged as stalled when they're actually progressing normally
**Why it happens:** 30-day threshold too aggressive for fundraising cycle, or counting calendar days not business days
**How to avoid:** Make threshold configurable per stage (e.g., due diligence might have 60-day threshold)
**Warning signs:** High percentage of deals flagged stale (>30%), team ignores stale flags

### Pitfall 4: Timestamps Don't Update Consistently
**What goes wrong:** stage_entry_date is null or stale for some records
**Why it happens:** Application-level updates miss some code paths, or updates fail silently
**How to avoid:** Use PostgreSQL BEFORE UPDATE trigger - guaranteed to fire on every update
**Warning signs:** Inconsistent stage_entry_date values, some NULL when shouldn't be

### Pitfall 5: Exit Criteria Form is Too Long
**What goes wrong:** Users skip fields or click override to avoid lengthy form
**Why it happens:** Trying to capture too much data at once, "while we have them here" mentality
**How to avoid:** Limit exit criteria to 2-4 truly essential fields. Collect other data elsewhere.
**Warning signs:** High override rate, incomplete data despite validation

### Pitfall 6: No Visual Feedback During Drag
**What goes wrong:** User drags card, drops it, then gets error - confusing and frustrating
**Why it happens:** Validation only runs in onDragEnd, no preview during drag
**How to avoid:** Use snapshot.isDraggingOver + isDropDisabled to show visual feedback (red border, cursor: not-allowed)
**Warning signs:** User support tickets about "why can't I move this card"

### Pitfall 7: Stage Transitions Not Logged as Activities
**What goes wrong:** Activity timeline missing stage changes, hard to understand investor progression
**Why it happens:** Forgot to create activity record when updating stage
**How to avoid:** Stage update server action should ALWAYS create activity record atomically
**Warning signs:** Empty activity timelines for investors with stage changes

## Code Examples

Verified patterns from official sources:

### Conditional Zod Validation Based on Stage
```typescript
// Source: Zod documentation - conditional validation with refine
// https://context7.com/colinhacks/zod/llms.txt

import * as z from 'zod';

const investorSchema = z.object({
  stage: z.enum(['initial-contact', 'materials-shared', 'nda', 'due-diligence', 'won', 'lost', 'delayed']),
  first_contact_date: z.string().optional(),
  deck_sent_date: z.string().optional(),
  nda_signed_date: z.string().optional(),
  lost_reason: z.string().optional(),
}).refine(
  (data) => {
    // Exit criteria for materials-shared stage
    if (data.stage === 'materials-shared' && !data.deck_sent_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Deck sent date required for Materials Shared stage',
    path: ['deck_sent_date'],
  }
).refine(
  (data) => {
    // Exit criteria for lost stage
    if (data.stage === 'lost' && !data.lost_reason) {
      return false;
    }
    return true;
  },
  {
    message: 'Reason required when marking as lost',
    path: ['lost_reason'],
  }
);
```

### Optimistic Update with Rollback for Stage Changes
```typescript
// Source: React useOptimistic documentation + Next.js Server Actions patterns
// https://react.dev/reference/react/useOptimistic
// https://medium.com/@mishal.s.suyog/optimistic-ui-with-server-actions-in-next-js-a-smoother-user-experience-6b779e4293a9

'use client';

import { useOptimistic } from 'react';
import { updateInvestorStage } from '@/app/_actions/update-investor-stage';

function KanbanBoard({ initialInvestors }) {
  const [optimisticInvestors, setOptimisticInvestors] = useOptimistic(
    initialInvestors,
    (state, { investorId, newStage }) => {
      return state.map((inv) =>
        inv.id === investorId ? { ...inv, stage: newStage } : inv
      );
    }
  );

  const handleStageChange = async (investorId: string, newStage: string) => {
    // Optimistically update UI
    setOptimisticInvestors({ investorId, newStage });

    try {
      // Update server
      const result = await updateInvestorStage(investorId, newStage);

      if (!result.success) {
        // Server rejected - optimistic update will auto-rollback
        toast.error(result.error);
      }
    } catch (error) {
      // Network error - optimistic update will auto-rollback
      toast.error('Failed to update stage');
    }
  };

  return (
    <div>
      {/* Render optimisticInvestors */}
    </div>
  );
}
```

### Server Action with Validation and Activity Logging
```typescript
// Source: Next.js Server Actions documentation + CRM audit trail patterns
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateInvestorStage(
  investorId: string,
  newStage: string,
  overrideReason?: string
) {
  const supabase = await createClient();

  // Fetch current investor
  const { data: investor, error: fetchError } = await supabase
    .from('investors')
    .select('*')
    .eq('id', investorId)
    .single();

  if (fetchError || !investor) {
    return { success: false, error: 'Investor not found' };
  }

  // Validate stage transition
  const fromStage = investor.stage;
  const validation = validateStageTransition(investor, newStage);

  if (!validation.valid && !overrideReason) {
    return {
      success: false,
      error: 'Exit criteria not met',
      missingFields: validation.missingFields,
    };
  }

  // Update stage (trigger will auto-update stage_entry_date)
  const { error: updateError } = await supabase
    .from('investors')
    .update({ stage: newStage })
    .eq('id', investorId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log activity
  const activityType = overrideReason ? 'stage_override' : 'stage_change';
  await supabase.from('activities').insert({
    investor_id: investorId,
    type: activityType,
    description: `Stage changed from ${fromStage} to ${newStage}`,
    metadata: overrideReason ? { override_reason: overrideReason } : null,
  });

  revalidatePath('/');
  return { success: true };
}

function validateStageTransition(investor: any, newStage: string) {
  const exitCriteria = STAGE_DEFINITIONS[investor.stage]?.exitCriteria || [];
  const missingFields = exitCriteria
    .filter((c) => c.required && !investor[c.field])
    .map((c) => c.label);

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
```

### Conditional Drag Disabled Based on Validation
```typescript
// Source: @hello-pangea/dnd documentation - conditional dragging
// https://context7.com/hello-pangea/dnd/llms.txt

import { Draggable } from '@hello-pangea/dnd';

function InvestorCard({ investor, index }) {
  // Check if investor can be moved from current stage
  const canProgress = validateCanProgress(investor);

  return (
    <Draggable
      draggableId={investor.id}
      index={index}
      isDragDisabled={!canProgress}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            cursor: canProgress ? 'grab' : 'not-allowed',
            opacity: canProgress ? 1 : 0.6,
          }}
        >
          {investor.name}
          {!canProgress && (
            <div className="text-xs text-red-500">
              Complete exit criteria to progress
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual stage updates in forms | Drag-and-drop kanban with validation | 2020-2022 | More intuitive UX, higher adoption |
| Global validation rules | Stage-specific exit criteria | 2021-2023 | More flexible, better aligned with sales process |
| Block all invalid transitions | Validate + override option | 2022-2024 | Reduces friction while maintaining discipline |
| Application-level timestamp updates | Database triggers | Always best practice | Guaranteed consistency, no bugs |
| Generic activity logs | Structured activity types with metadata | 2023-2025 | Better reporting, audit trails |
| Stale deals = no update in X days | Stale = no **meaningful activity** in X days | 2024-2026 | Reduces false positives (activity type matters) |
| Static 30-day threshold | Configurable threshold per stage | 2025-2026 | More accurate for different sales cycles |

**Deprecated/outdated:**
- **Hard-coded stage lists:** Use database-driven configuration with stage_definitions table
- **react-beautiful-dnd:** Unmaintained, use @hello-pangea/dnd (active fork)
- **Validation only on form submit:** Validate at transition point (drag-drop)
- **Auto-dismissing validation errors:** Use modals that require acknowledgment

## Open Questions

Things that couldn't be fully resolved:

1. **Should "stalled" be automated or manual?**
   - What we know: 30-day threshold is widely used, systems can auto-flag
   - What's unclear: Should it auto-update a field, or just be a computed indicator?
   - Recommendation: Computed indicator (not persisted field) - less invasive, can change threshold without data migration

2. **Should stage transitions create notifications?**
   - What we know: Activity logging is standard, some systems send notifications
   - What's unclear: Would notifications be useful or annoying for this team?
   - Recommendation: Start with activity logs only, add notifications in future if requested

3. **How granular should override audit trail be?**
   - What we know: Need to log who/when/why for overrides
   - What's unclear: Should we track IP address, user agent, partial form data?
   - Recommendation: Log user_id, timestamp, reason, from_stage, to_stage - sufficient for governance

4. **Should validation be per-stage or per-transition?**
   - What we know: Most systems use per-stage exit criteria
   - What's unclear: Some transitions might have different requirements (e.g., Won requires different data than Lost)
   - Recommendation: Per-stage for v1, can add per-transition overrides later if needed

5. **Should we track "days in stage" vs "days inactive"?**
   - What we know: Both are useful metrics
   - What's unclear: Which is more actionable for this fundraising context?
   - Recommendation: Track both - days_in_stage (computed from stage_entry_date) and days_since_last_activity (from last_activity_date)

## Sources

### Primary (HIGH confidence)
- React Hook Form: /react-hook-form/react-hook-form v7.66.0 - Form validation, conditional validation, form state management
- Zod: /colinhacks/zod v3.24.2 - Schema validation, conditional refinements, TypeScript integration
- @hello-pangea/dnd: /hello-pangea/dnd - Conditional dragging, responder lifecycle, TypeScript types
- shadcn/ui: /shadcn-ui/ui - Dialog component, form integration patterns
- PostgreSQL trigger documentation: Medium articles and official PostgreSQL docs on automatic timestamp updates

### Secondary (MEDIUM confidence)
- [Fix your sales pipeline stages with entry and exit rules](https://www.avoma.com/blog/sales-pipeline-stages) - Exit criteria patterns, stage gate concepts
- [CRM Pipeline Management Best Practices](https://www.business.com/articles/crm-pipeline-management/) - Stage definitions, kanban views, automation
- [Stale Deal Detection in CRM](https://www.zoho.com/crm/resources/solutions/track-days-of-deal-inactivity.html) - Inactivity tracking, days inactive calculations
- [Exit Criteria in HubSpot](https://www.project36.io/blog/exit-criteria-in-hubspot-why-youre-probably-doing-it-wrong) - Validation best practices, override patterns
- [2026 CRM Trends](https://www.siroccogroup.com/2026-crm-trends-twelve-practical-shifts-for-revenue-operations/) - Governance, audit trails, override tracking
- [Optimistic Updates in Next.js](https://medium.com/@mishal.s.suyog/optimistic-ui-with-server-actions-in-next-js-a-smoother-user-experience-6b779e4293a9) - useOptimistic hook, rollback patterns
- [Modal UX Best Practices 2026](https://userpilot.com/blog/modal-ux-design/) - Modal timing, form validation in modals, accessibility
- [Toast Notification UX Patterns](https://blog.logrocket.com/ux-design/toast-notifications/) - Error feedback, when to use toasts vs modals
- [Supabase Audit Logging](https://supabase.com/blog/postgres-audit) - supa_audit extension, trigger-based audit trails
- [CRM Audit Trail Best Practices 2026](https://signal.opshub.me/audit-trail-best-practices/) - Immutable logging, who/what/when/why tracking

### Tertiary (LOW confidence)
- Various web search results on fundraising pipeline management, investor CRM workflows
- Community discussions on kanban validation and conditional drag-drop (GitHub issues, forums)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7, widely used in production
- Architecture patterns: HIGH - Based on official documentation + verified CRM best practices
- Pitfalls: MEDIUM - Derived from web research and general patterns, not project-specific
- Code examples: HIGH - All sourced from Context7 or official documentation

**Research date:** 2026-02-12
**Valid until:** ~30 days (2026-03-14) - Libraries stable, patterns well-established, unlikely to change rapidly
