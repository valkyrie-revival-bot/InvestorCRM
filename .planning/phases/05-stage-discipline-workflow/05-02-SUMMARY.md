---
phase: 05-stage-discipline-workflow
plan: 02
subsystem: stage-workflow
tags: [stage-validation, server-actions, dialog-ui, exit-criteria, workflow-enforcement]

# Dependency graph
requires: [05-01]
provides: [stage-transition-action, validation-dialog, override-dialog]
affects: [05-03]

# Tech tracking
tech-stack.added: []
tech-stack.patterns: [server-action-validation, checklist-ui, confirmation-dialogs]

# File tracking
key-files.created:
  - app/actions/stage-transitions.ts
  - components/investors/stage-validation-dialog.tsx
  - components/investors/stage-override-dialog.tsx
  - components/ui/checkbox.tsx
key-files.modified: []

# Decisions
decisions:
  - server-action-validates-transitions-and-criteria
  - exit-checklist-ui-with-strikethrough-feedback
  - override-requires-10char-reason-plus-confirmation
  - activity-logging-automatic-in-server-action

# Metrics
duration: 2m
completed: 2026-02-13
---

# Phase 05 Plan 02: Stage Transition Validation Summary

**One-liner:** Server action enforces stage discipline with exit criteria validation, checklist dialog for normal advancement, and override dialog requiring 10+ char reason and explicit confirmation.

## What Was Built

### 1. Stage Transition Server Action (`app/actions/stage-transitions.ts`)

Created the core server action that handles ALL stage transitions (kanban drag-and-drop, UI-driven changes, future integrations):

**Function: `updateInvestorStage`**

Signature validates transitions and enforces exit criteria:
```typescript
export async function updateInvestorStage(
  investorId: string,
  newStage: string,
  options?: {
    checklistConfirmed?: boolean;
    overrideReason?: string;
  }
): Promise<
  | { success: true; data: Investor }
  | { success: false; error: string; validationRequired?: true; exitCriteria?: ExitCriterion[]; fromStage?: string; toStage?: string }
>
```

**Logic Flow:**

1. **Auth check** — Verify user via `createClient()` and `getUser()`
2. **Fetch investor** — Get current stage (fromStage)
3. **No-op optimization** — Return immediately if stage unchanged
4. **Transition validation** — Call `isValidTransition(fromStage, newStage)` from stage-definitions
   - Returns error if transition not in allowedTransitions array
5. **Exit criteria check** — Call `getExitCriteria(fromStage)`
   - If criteria exist AND user hasn't confirmed AND hasn't provided override reason:
     - Return `validationRequired: true` with exit criteria array
     - Signals UI to show StageValidationDialog
6. **Perform update** — Update investor stage and last_action_date
   - DB trigger automatically updates stage_entry_date (no application code needed)
7. **Log activity** — Insert into activities table
   - Normal: `stage_change` with `checklist_confirmed: true` metadata
   - Override: `stage_change` with `OVERRIDE` in description, `override_reason` and `overridden_by` in metadata
   - No criteria: `stage_change` with minimal metadata (terminal → active transitions)
8. **Revalidate paths** — `/investors` and `/investors/[id]` for UI consistency
9. **Return success** — Updated investor record

**Key Features:**

- **Single source for all stage changes** — Kanban, inline edit, batch operations all use this
- **Fail-safe validation** — Invalid transitions blocked at server level, can't bypass
- **Flexible bypass** — Override mechanism for edge cases, fully audited
- **DB trigger integration** — Application doesn't manage stage_entry_date, guaranteed consistency
- **Type-safe** — Uses InvestorStage type, ExitCriterion interface from stage-definitions

### 2. Stage Validation Dialog (`components/investors/stage-validation-dialog.tsx`)

Client component that presents exit criteria as an interactive checklist:

**Props:**
```typescript
interface StageValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  fromStage: string;
  toStage: string;
  exitCriteria: ExitCriterion[];
  onSuccess: () => void;
  onOverride: () => void;  // Opens override dialog instead
}
```

**User Flow:**

1. **Dialog opens** when server action returns `validationRequired: true`
2. **Shows checklist** with all exit criteria for the fromStage
3. **User checks items** — Each criterion is a Checkbox + Label pair
4. **Visual feedback** — Checked items show strikethrough + opacity reduction
5. **Advance button** — Disabled until ALL criteria checked
6. **Override escape hatch** — "Override" button (ghost variant) always visible
7. **On Advance** — Calls `updateInvestorStage(investorId, toStage, { checklistConfirmed: true })`
8. **On Override** — Closes validation dialog, calls `onOverride()` to open override dialog

**Styling:**

- Dark theme compatible
- Strikethrough + opacity for checked items (clear visual progress)
- shadcn/ui Dialog, Checkbox, Label, Button primitives
- Responsive footer layout (stacked mobile, row desktop)

**State Management:**

- `Set<string>` tracks checked criterion IDs (efficient lookup, no duplicates)
- `useTransition` for non-blocking advance action
- Toast notifications for success/error

### 3. Stage Override Dialog (`components/investors/stage-override-dialog.tsx`)

Client component for bypassing exit criteria with mandatory audit trail:

**Props:**
```typescript
interface StageOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  fromStage: string;
  toStage: string;
  onSuccess: () => void;
}
```

**User Flow:**

1. **Dialog opens** when user clicks "Override" in validation dialog
2. **Warning context** — Red title, description explains criteria not met
3. **Reason textarea** — Minimum 10 characters required
4. **Character counter** — Shows progress toward 10-char minimum
5. **Confirmation checkbox** — "I confirm this override is necessary and accept responsibility"
6. **Override button** — Disabled until reason >= 10 chars AND checkbox checked
7. **On Override** — Calls `updateInvestorStage(investorId, toStage, { overrideReason })`
8. **Warning toast** — Uses `toast.warning()` (not success) to convey seriousness

**Styling:**

- Destructive theme (red title, red confirmation box)
- Destructive button variant for "Override and Advance"
- Warning visual cues (border-destructive, bg-destructive/5)
- Dark theme compatible with destructive variants

**Validation:**

- Real-time character count display
- Button disabled until both conditions met (10+ chars, checkbox)
- Trims whitespace before sending (prevents padding bypass)

### 4. shadcn/ui Checkbox Component (`components/ui/checkbox.tsx`)

Installed via `npx shadcn@latest add checkbox`:

- Radix UI Checkbox primitive
- CheckIcon from lucide-react
- Dark theme compatible styling
- Focus ring, disabled state, checked state styling

## Task Breakdown

| Task | Duration | Commit | Files |
|------|----------|--------|-------|
| 1. Create stage transition server action | ~1m | `6f22d1c` | app/actions/stage-transitions.ts |
| 2. Create stage validation dialog with exit checklist | ~1m | `0190401` | components/investors/stage-validation-dialog.tsx, components/ui/checkbox.tsx |
| 3. Create stage override dialog with mandatory reason | ~1m | `ec330fa` | components/investors/stage-override-dialog.tsx |

**Total execution time:** 2 minutes

## Decisions Made

### 1. Server Action Validates Transitions and Criteria

**Decision:** All validation logic lives in the server action, not client components.

**Context:** Could have put validation in client components before calling server action.

**Rationale:**
- **Security** — Client validation can be bypassed, server validation cannot
- **Single source of truth** — One place to enforce rules for all entry points
- **Future-proof** — Works for kanban drag, API endpoints, batch operations, CLI tools

**Outcome:** `updateInvestorStage` calls `isValidTransition()` and `getExitCriteria()` from stage-definitions. Client components react to validation results.

**Affects:** All stage transition UIs (Plan 05-03 kanban integration)

### 2. Exit Checklist UI with Strikethrough Feedback

**Decision:** Use strikethrough + opacity for checked items (not just checkmark).

**Context:** Could use checkmark alone, or remove checked items from list.

**Rationale:**
- **Progress visibility** — User sees all criteria and which ones are done
- **No surprises** — List doesn't shrink as you check items
- **Visual satisfaction** — Strikethrough pattern from Notion, Linear, todo apps

**Outcome:** Checked items show `line-through` + `opacity-70` styling. Clear visual progress toward completion.

**Affects:** User experience, checklist feels responsive and clear

### 3. Override Requires 10-Char Reason Plus Confirmation

**Decision:** Minimum 10 characters for override reason, separate confirmation checkbox.

**Context:** Could allow shorter reasons, or skip checkbox, or require longer reasons.

**Rationale:**
- **10 chars is barrier to spam** — Forces user to type real reason, not just "ok" or "skip"
- **Confirmation checkbox adds friction** — Override is serious, should require two deliberate actions
- **Not too onerous** — 10 chars is ~2 words, reasonable for explaining edge case

**Outcome:** Override dialog validates `reason.trim().length >= 10` AND `confirmChecked === true`. Character counter shows progress.

**Affects:** Override audit quality, ensures useful metadata in activities table

### 4. Activity Logging Automatic in Server Action

**Decision:** Server action logs all stage changes automatically, not separate function.

**Context:** Could require caller to log activity, or use database trigger for logging.

**Rationale:**
- **Guaranteed logging** — Can't forget to log, activity happens atomically with update
- **Context-aware metadata** — Server action knows if it's override, checklist, or no-criteria
- **Single transaction** — Stage update and activity insert happen together

**Outcome:** Every stage change gets activity record with appropriate metadata:
- Normal: `{ from_stage, to_stage, checklist_confirmed: true }`
- Override: `{ from_stage, to_stage, override_reason, overridden_by }`

**Affects:** Activity timeline (Plan 04-03) will show all stage changes with full context

## Deviations from Plan

**None** — plan executed exactly as written.

## Verification Results

✅ All verification criteria passed:

1. ✅ `npx tsc --noEmit` passes without errors
2. ✅ `app/actions/stage-transitions.ts` exports `updateInvestorStage` function
3. ✅ `components/investors/stage-validation-dialog.tsx` exports `StageValidationDialog` component
4. ✅ `components/investors/stage-override-dialog.tsx` exports `StageOverrideDialog` component
5. ✅ Server action validates transitions, checks exit criteria, supports override, logs activities
6. ✅ Dialog components use shadcn/ui primitives and are dark-theme compatible

## Next Phase Readiness

**Phase 05 Plan 03** (Kanban board integration) is **READY**.

**Blockers:** None

**Dependencies Delivered:**

- ✅ `updateInvestorStage` server action — Plan 05-03 will call this on kanban drag-and-drop
- ✅ `StageValidationDialog` component — Plan 05-03 will open this when validation required
- ✅ `StageOverrideDialog` component — Plan 05-03 will open this when user clicks Override
- ✅ `Checkbox` UI component installed — Available for other UI needs

**Integration Pattern for Plan 05-03:**

```typescript
// In kanban drag handler:
const result = await updateInvestorStage(investorId, newStage);

if (!result.success && result.validationRequired) {
  // Open StageValidationDialog with result.exitCriteria
  setValidationDialogState({
    open: true,
    fromStage: result.fromStage,
    toStage: result.toStage,
    exitCriteria: result.exitCriteria,
  });
} else if (!result.success) {
  // Show error toast
  toast.error(result.error);
} else {
  // Success - kanban already updated optimistically
  toast.success('Stage updated');
}
```

## Success Criteria Met

- ✅ Stage transition server action enforces allowed transitions and exit criteria
- ✅ Validation dialog shows checklist and blocks advancement until all items confirmed
- ✅ Override dialog requires reason (10+ chars) and confirmation before bypass
- ✅ All transitions logged as activities with appropriate type and metadata
- ✅ Components are ready for kanban integration in Plan 03

## Key Insights

1. **Server-side validation is non-negotiable** — Client validation can be bypassed by modifying network requests. Server action is the security boundary.

2. **Return structured errors for smart UI** — Returning `validationRequired: true` with exit criteria lets UI choose how to present (dialog, inline, etc). Better than throwing error.

3. **Strikethrough > disappearing items** — Keeping checked items visible with strikethrough is better UX than removing them. User sees full list and progress.

4. **Override friction is feature, not bug** — 10-char reason + confirmation checkbox makes override deliberate. Prevents accidental clicks.

5. **Automatic activity logging prevents audit gaps** — Logging in server action (not caller responsibility) means every stage change is audited, no exceptions.

6. **DB trigger for timestamps, app for business logic** — stage_entry_date via trigger (can't forget), but override_reason in activity metadata (business logic). Right separation of concerns.

## Tech Debt / Future Work

None identified. Plan delivered exactly what's needed for Plan 05-03 kanban integration.

**Possible future enhancements (not blocking):**

- Checkbox animation when checked (fade-in checkmark)
- Override dialog could show which criteria weren't met
- Analytics on override frequency by user/stage (is validation too strict?)

---

**Plan Status:** ✅ COMPLETE
**Execution Time:** 2 minutes
**Commits:** 3 (6f22d1c, 0190401, ec330fa)
**Files Created:** 4
**Files Modified:** 0
**Type Errors:** 0
