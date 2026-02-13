---
phase: 05-stage-discipline-workflow
plan: 03
subsystem: stage-workflow
tags: [kanban-integration, drag-and-drop, stalled-detection, stage-validation, workflow-enforcement]

# Dependency graph
requires: [05-01, 05-02, 04-02]
provides: [kanban-validation-integration, stalled-indicators, complete-stage-discipline-workflow]
affects: [06, 07, 08]

# Tech tracking
tech-stack.added: []
tech-stack.patterns: [optimistic-ui-with-validation, computed-stalled-status, dynamic-days-in-stage]

# File tracking
key-files.created: []
key-files.modified:
  - components/investors/investor-kanban-board.tsx
  - components/investors/kanban-card.tsx
  - app/(dashboard)/investors/page.tsx

# Decisions
decisions:
  - kanban-validation-with-optimistic-update
  - revert-optimistic-on-dialog-cancel
  - computed-stalled-on-page-load
  - days-in-stage-visual-indicator

# Metrics
duration: 142m
completed: 2026-02-13
---

# Phase 05 Plan 03: Kanban Integration with Stage Discipline Summary

**One-liner:** Kanban drag-and-drop integrated with stage validation dialogs, stalled detection computed dynamically with visual indicators (days-in-stage, orange badges), completing full end-to-end stage discipline workflow.

## What Was Built

### 1. Enhanced Kanban Board with Stage Validation (`components/investors/investor-kanban-board.tsx`)

Integrated stage validation into the existing kanban board drag-and-drop flow:

**New State Management:**
- `pendingTransition: PendingTransition | null` — Tracks a drag operation that needs validation (stores investorId, investorName, fromStage, toStage, exitCriteria)
- `showValidationDialog: boolean` — Controls validation dialog visibility
- `showOverrideDialog: boolean` — Controls override dialog visibility

**Modified `handleDragEnd` Logic:**

1. **Same column reordering** — Return immediately, no server call (no stage change)
2. **Invalid transition blocking** — Call `isValidTransition(from, to)`, show error toast and return (no optimistic update) if invalid
3. **Optimistic UI update** — Move card between columns visually (instant feedback)
4. **Exit criteria check** — Call `getExitCriteria(fromStage)`
   - If criteria exist: Set `pendingTransition`, open `StageValidationDialog`, wait for user action
   - If no criteria (terminal stages): Call `updateInvestorStage` directly, show success toast
5. **Error handling** — Revert optimistic update on server error

**Dialog Integration:**

- Renders `<StageValidationDialog>` when `showValidationDialog` is true
- Renders `<StageOverrideDialog>` when `showOverrideDialog` is true
- Both dialogs receive `pendingTransition` data (investorId, name, fromStage, toStage, exitCriteria)
- Validation dialog's `onOverride` closes validation and opens override
- Both dialogs' `onSuccess` triggers `router.refresh()` to sync server state
- Both dialogs' `onOpenChange(false)` / cancel reverts the optimistic update (re-syncs columns from investors prop)

**STAGE_ORDER Import:**

- Replaced hardcoded `STAGES` array with `STAGE_ORDER` from `@/lib/stage-definitions`
- Ensures kanban columns match centralized stage configuration
- Type-safe with InvestorStage type

**Result:**

- Drag-and-drop triggers validation for stages with exit criteria
- Invalid transitions blocked before optimistic update
- Terminal stages (Won/Lost/Passed/Delayed) move directly without dialog
- Override flow works end-to-end from kanban drag
- All transitions logged automatically via server action

### 2. Stalled Detection and Visual Indicators (`components/investors/kanban-card.tsx`)

Enhanced kanban cards with computed stalled status and days-in-stage display:

**Computed Stalled Status:**

- Import `computeIsStalled` from `@/lib/stage-definitions`
- Calculate on render: `computeIsStalled(investor.last_action_date, investor.stage)`
- Replaces hardcoded `investor.stalled` badge (now computed dynamically)
- Logic: 30+ days inactive + non-terminal stage = stalled

**Days in Stage Display:**

- Calculate from `stage_entry_date`: `Math.floor((now - entryDate) / (1000 * 60 * 60 * 24))`
- Display as "{N}d in stage" below primary contact name
- Color: Orange (`text-orange-400`) if stalled, muted (`text-muted-foreground`) if not
- Only shown if `stage_entry_date` exists (new investors won't have this until first stage change)

**Stalled Badge:**

- Conditionally render based on `isStalled` (computed)
- Orange theme: `border-orange-500/50 bg-orange-500/10 text-orange-300`
- Dark theme compatible

**Memo Optimization:**

- Updated `areEqual` comparison function to include:
  - `stage` — Needed for stalled computation
  - `stage_entry_date` — Needed for days-in-stage calculation
  - `last_action_date` — Needed for stalled computation
- Prevents unnecessary re-renders during drag operations

**Result:**

- Stalled status computed on every render (not persisted in database)
- Visual feedback for investors stuck in stages too long
- Days-in-stage provides context for stalled determination
- All styling dark-theme compatible

### 3. Page-Level Stalled Computation (`app/(dashboard)/investors/page.tsx`)

Compute stalled status for all investors before passing to UI components:

**Implementation:**

- Import `computeIsStalled` from `@/lib/stage-definitions`
- After fetching investors, map over array and overlay computed `stalled` field:
  ```typescript
  const investorsWithStalled = result.data.map(inv => ({
    ...inv,
    stalled: computeIsStalled(inv.last_action_date, inv.stage as any),
  }));
  ```
- Pass `investorsWithStalled` to `<PipelineViewSwitcher>`

**Why This Works:**

- `PipelineViewSwitcher` already has stalled filter logic (filters on `investor.stalled`)
- By computing stalled status and overlaying it on the data, filter "just works"
- No changes needed to `PipelineViewSwitcher` component
- Database `stalled` column still exists (backward compatibility) but computed value takes precedence

**Result:**

- Stalled filter in pipeline view uses computed status (not stale database field)
- Threshold can be adjusted in `computeIsStalled` without data migration
- Always accurate (no background job needed)

## Task Breakdown

| Task | Duration | Commit | Files |
|------|----------|--------|-------|
| 1. Enhance kanban board with stage validation on drag-and-drop | ~70m | `df5ef91` | components/investors/investor-kanban-board.tsx |
| 2. Add stalled detection and visual indicators | ~70m | `d0bad4b` | components/investors/kanban-card.tsx, app/(dashboard)/investors/page.tsx |
| 3. Human verification checkpoint | ~2m | N/A | User approved full workflow |

**Total execution time:** 142 minutes (2h 22m)

**Note:** Duration includes human verification checkpoint. User executed migration 018 in Supabase and verified all workflow components working correctly.

## Decisions Made

### 1. Kanban Validation with Optimistic Update

**Decision:** Apply optimistic UI update immediately on drag, then show validation dialog (not block drag until validation completes).

**Context:** Could block drag visually until server action returns, or show loading state.

**Rationale:**
- **Instant feedback** — Card moves immediately, feels responsive
- **Validation happens at natural pause** — Dialog appears after card lands in new column
- **Revertable** — Can undo optimistic update if validation fails or user cancels

**Outcome:** Drag moves card optimistically, then validation dialog appears. If user cancels or server error, card moves back to original column.

**Affects:** User experience feels snappy, validation doesn't block UI

### 2. Revert Optimistic on Dialog Cancel

**Decision:** Re-sync columns from `investors` prop when user cancels validation/override dialog.

**Context:** Could keep optimistic update visible until next page load, or use separate revert function.

**Rationale:**
- **Truth from server** — Investors prop contains server state, safest source of truth
- **Simplicity** — Re-running the grouping logic is simple and reliable
- **Handles edge cases** — Works even if investors prop changed during dialog interaction

**Outcome:** Dialog cancel handler calls:
```typescript
const grouped = {};
STAGE_ORDER.forEach(stage => {
  grouped[stage] = investors.filter(inv => inv.stage === stage);
});
setColumns(grouped);
```

**Affects:** Revert is guaranteed correct even with concurrent changes

### 3. Computed Stalled on Page Load

**Decision:** Compute stalled status in page component for ALL investors, not in individual card components.

**Context:** Could compute in KanbanCard only, or use database query, or background job.

**Rationale:**
- **Filter compatibility** — PipelineViewSwitcher expects `investor.stalled` field, computing at page level makes filter work without changes
- **Single computation** — Compute once per investor per page load, not on every card render
- **Centralized logic** — Page component is natural place for data transformation before passing to UI

**Outcome:** `computeIsStalled` called once per investor in page.tsx, result overlayed on `stalled` field.

**Trade-off:** Computed field can't be used in SQL WHERE clause (would need database computed column for efficient filtering). Acceptable at <100 investors.

**Affects:** Stalled filter works immediately, no component changes needed

### 4. Days in Stage Visual Indicator

**Decision:** Show "Xd in stage" text on every kanban card, orange if stalled.

**Context:** Could show only when stalled, or in tooltip, or not at all.

**Rationale:**
- **Context for stalled badge** — User sees 45d in stage, orange badge makes sense
- **Awareness even when not stalled** — 15d in stage reminds user to take action before it stalls
- **Low visual cost** — Small muted text, doesn't clutter card

**Outcome:** Days calculated from `stage_entry_date`, displayed below contact name, orange if stalled.

**Affects:** Users have visibility into how long investor has been in current stage

## Deviations from Plan

**None** — plan executed exactly as written.

## Verification Results

✅ All verification criteria passed:

1. ✅ `npx tsc --noEmit` passes without errors
2. ✅ Kanban drag-and-drop triggers validation dialog for stages with exit criteria
3. ✅ Invalid transitions are blocked with error feedback
4. ✅ Override requires 10+ character reason and confirmation
5. ✅ Stage changes appear in activity timeline
6. ✅ Stalled status computed dynamically (30+ days inactive)
7. ✅ Days-in-stage displayed on kanban cards
8. ✅ All visual elements are dark-theme compatible

**User Verification Report:**

User executed migration 018 (stage_entry_date trigger) and tested complete workflow:
- ✅ Valid transition with exit criteria works (dialog appears, checklist required)
- ✅ Override flow works (reason + confirmation required, warning toast shown)
- ✅ Invalid transitions blocked (error toast, card snaps back)
- ✅ Terminal stages move directly (no dialog)
- ✅ Stalled indicators appear (orange badge for 30+ days inactive)
- ✅ Days-in-stage displays correctly

## Success Criteria Met

- ✅ **PIPE-05:** Drag-and-drop between stages works with validation
- ✅ **STAGE-01:** Stage definitions enforced from Initial Contact through Won/Lost/Delayed
- ✅ **STAGE-02:** Exit checklist required before advancing
- ✅ **STAGE-03:** Premature advancement blocked
- ✅ **STAGE-04:** Override available with explicit confirmation and reason
- ✅ **STAGE-05:** Stage entry date auto-updated by trigger
- ✅ **STAGE-06:** Stalled flagging for 30+ days inactive (computed, not persisted)

## Phase 5 Complete

**End-to-End Stage Discipline Workflow:**

1. **Stage Definitions** (Plan 05-01) — Centralized configuration with exit criteria, allowed transitions, stalled computation
2. **Validation Dialogs** (Plan 05-02) — Server-side validation, exit checklist UI, override with audit trail
3. **Kanban Integration** (Plan 05-03) — Drag-and-drop triggers validation, invalid transitions blocked, stalled indicators

**Key Features Delivered:**

- Enforce fundraising stage discipline via exit criteria checklists
- Block invalid stage transitions (e.g., Not Yet Approached → NDA)
- Override mechanism with mandatory reason (10+ chars) and confirmation
- Automatic activity logging for all stage changes (normal and override)
- Stage entry date auto-tracked via PostgreSQL trigger
- Stalled detection (30+ days inactive) with visual indicators
- Days-in-stage display on kanban cards

**Technical Implementation:**

- Type-safe with centralized stage definitions
- Server-side validation (can't bypass via client)
- Optimistic UI updates with error rollback
- Database triggers for guaranteed timestamp consistency
- Computed stalled status (no background jobs needed)
- Dark theme compatible throughout

## Next Phase Readiness

**Phase 6 (Deal Team Collaboration)** is **READY**.

**Blockers:** None

**Dependencies Delivered:**

- ✅ Stage discipline workflow complete — Deal team members can advance investors through pipeline with confidence
- ✅ Stalled detection operational — Team can identify and prioritize stuck deals
- ✅ Activity logging comprehensive — Full audit trail for all stage changes
- ✅ Override audit trail — Management can review premature advancements

**Manual Steps Completed:**

- ✅ Migration 018 executed in Supabase (stage_entry_date column, trigger)
- ✅ Visual verification passed (all workflow components tested by user)

## Key Insights

1. **Optimistic UI + validation dialogs = best UX** — Instant feedback on drag, validation at natural pause point. Better than blocking drag.

2. **Computed stalled status trades DB query efficiency for flexibility** — Can't filter stalled investors efficiently in SQL, but threshold can change without migration. Right trade-off at <100 investors.

3. **Overlaying computed fields at page level = filter compatibility** — By computing `stalled` in page component and overlaying on data, existing filter logic "just works" without changes.

4. **Days-in-stage provides context for stalled badge** — "45d in stage" + orange badge makes stalled state clear. User understands WHY it's stalled.

5. **Dialog cancel must revert optimistic update** — Can't leave card in wrong column after cancel. Re-syncing from investors prop is simplest, most reliable approach.

6. **Invalid transitions should block before optimistic update** — Don't show card moving then snapping back. Check validity, show error, keep card in place.

## Tech Debt / Future Work

None identified for Phase 5. Stage discipline workflow is complete and production-ready.

**Possible future enhancements (not blocking):**

- Add database computed column for `stalled` if filtering performance becomes issue (>1000 investors)
- Animate days-in-stage text on stage change (fade from old value to new)
- Show stage history in validation dialog ("You advanced this investor 3x in 2 weeks")
- Analytics dashboard: average days-in-stage by stage, override frequency by user

---

**Plan Status:** ✅ COMPLETE
**Execution Time:** 142 minutes (2h 22m)
**Commits:** 2 (df5ef91, d0bad4b)
**Files Created:** 0
**Files Modified:** 3
**Type Errors:** 0
**User Verification:** ✅ APPROVED
