---
phase: 05-stage-discipline-workflow
plan: 01
subsystem: stage-workflow
tags: [stage-definitions, database-triggers, workflow-enforcement, typescript]

# Dependency graph
requires: [03-01, 04-01]
provides: [stage-definitions-module, stage-entry-date-tracking]
affects: [05-02, 05-03]

# Tech tracking
tech-stack.added: []
tech-stack.patterns: [database-triggers, centralized-config, stalled-detection]

# File tracking
key-files.created:
  - lib/stage-definitions.ts
  - lib/database/migrations/018-stage-entry-date-trigger.sql
key-files.modified:
  - types/investors.ts

# Decisions
decisions:
  - stage-exit-criteria-as-checklists
  - terminal-stages-allow-reengagement
  - stalled-computed-not-persisted
  - stage-entry-date-via-trigger

# Metrics
duration: 2m
completed: 2026-02-13
---

# Phase 05 Plan 01: Stage Definitions & Database Triggers Summary

**One-liner:** Centralized stage workflow configuration with 12 stages, exit criteria checklists, and automatic stage_entry_date tracking via PostgreSQL trigger.

## What Was Built

### 1. Centralized Stage Definitions Module (`lib/stage-definitions.ts`)

Created a single source of truth for all stage workflow logic:

**Stage Definitions:**
- All 12 stages from PROJECT.md: Not Yet Approached → Initial Contact → First Conversation Held → Materials Shared → NDA / Data Room → Active Due Diligence → LPA / Legal → Won / Committed / Lost / Passed / Delayed
- Each stage has: label, order (1-5), exit criteria (checklist items), allowed transitions
- Terminal stages (Won/Committed/Lost/Passed/Delayed) have no exit criteria but allow re-engagement to any active stage

**Exit Criteria as Checklists:**
- Exit criteria are **checklist items** the user must confirm, NOT database fields
- Example (Materials Shared): "Pitch deck or fund materials sent", "LP confirmed receipt"
- Example (Active Due Diligence): "DD process formally initiated", "At least 2 DD meetings held"
- Terminal stages have empty exit criteria (they are endpoints)

**Helper Functions:**
- `getExitCriteria(stage)` — Returns checklist items for a stage
- `getAllowedTransitions(fromStage)` — Returns stages this stage can transition TO
- `isTerminalStage(stage)` — Returns true for Won/Committed/Lost/Passed/Delayed
- `isValidTransition(from, to)` — Checks if transition is allowed
- `computeIsStalled(lastActionDate, stage, thresholdDays)` — Computes stalled status (30+ days inactive, not in terminal stage)

**Type Safety:**
- Imports `InvestorStage` from `@/types/investors`
- Uses `as const satisfies Record<InvestorStage, StageDefinition>` for type safety
- Exports interfaces: `ExitCriterion`, `StageDefinition`

### 2. Database Migration (`018-stage-entry-date-trigger.sql`)

Created PostgreSQL infrastructure for automatic timestamp tracking:

**Column Addition:**
- Added `stage_entry_date date` column to `public.investors` table
- Defaults to `CURRENT_DATE` on creation

**Backfill Query:**
- Updates existing records: sets `stage_entry_date` to `entry_date` if available, otherwise `created_at::date`
- Ensures all existing investors have valid stage_entry_date

**Trigger Function:**
- `update_stage_entry_date()` — BEFORE UPDATE trigger function
- Detects stage changes using `IS DISTINCT FROM` (handles NULL safely)
- Sets `NEW.stage_entry_date = CURRENT_DATE` when stage changes
- Only updates on stage change (not on every update)

**Trigger Attachment:**
- `investors_stage_entry_date` trigger on `public.investors` table
- Fires BEFORE UPDATE FOR EACH ROW
- Idempotent: `DROP TRIGGER IF EXISTS` pattern

**Rationale:** Database-enforced timestamps guarantee consistency. Can't be bypassed by application bugs. Works for all update paths (UI, API, SQL, etc.).

### 3. TypeScript Type Updates (`types/investors.ts`)

**Added Field:**
- `stage_entry_date: string | null;` in `Investor` interface
- Placed after `entry_date` field for logical grouping
- Comment: "ISO date string — auto-updated by DB trigger on stage change"

**No Other Changes:**
- Did not modify other types or interfaces
- Maintains backward compatibility

## Task Breakdown

| Task | Duration | Commit | Files |
|------|----------|--------|-------|
| 1. Create centralized stage definitions module | ~1m | `1c9b7d8` | lib/stage-definitions.ts |
| 2. Create database migration and update TypeScript types | ~1m | `d525689` | lib/database/migrations/018-stage-entry-date-trigger.sql, types/investors.ts |

**Total execution time:** 2 minutes

## Decisions Made

### 1. Exit Criteria as Checklist Items (Not Database Fields)

**Decision:** Exit criteria are checklist items users must confirm, not database fields to validate.

**Context:** Plan specified "These are CHECKLIST ITEMS the user must confirm (not database fields)."

**Rationale:**
- More flexible: Can add/modify criteria without schema migrations
- Better UX: Modal with checklist is simpler than validating arbitrary database fields
- Clear intent: User explicitly confirms criteria met, not inferring from data

**Outcome:** Each criterion has `id`, `label`, `description`. Validation UI (Plan 05-02) will present as checklist.

**Affects:** 05-02 (stage transition validation dialog)

### 2. Terminal Stages Allow Re-engagement

**Decision:** Terminal stages (Won/Committed/Lost/Passed/Delayed) can transition back to any active stage.

**Context:** Fundraising deals can re-open (LP who passed may re-engage months later).

**Rationale:**
- Lost deals aren't forever: LP says "no" but circumstances change
- Delayed deals resume: LP pauses then re-engages
- Won/Committed deals may need correction: Misclassified or deal falls through

**Outcome:** `allowedTransitions` for terminal stages includes all 7 active stages.

**Affects:** 05-02 (stage transition validation must allow "backward" moves), 05-03 (kanban board drag-drop)

### 3. Stalled Status Computed (Not Persisted)

**Decision:** `computeIsStalled()` function calculates stalled status on-the-fly, not a persisted database field.

**Context:** Existing `stalled` boolean field in database (from Phase 3). Research recommended computed indicator.

**Rationale:**
- Threshold may change: Team can adjust 30-day threshold without data migration
- Always accurate: No risk of stale boolean if background job fails
- Simpler logic: One function, not maintaining database state

**Outcome:** `computeIsStalled(lastActionDate, stage, thresholdDays = 30)` exported from stage-definitions.ts.

**Trade-off:** Can't query stalled investors efficiently in SQL. If filtering becomes slow, add computed column later.

**Affects:** 05-03 (stalled detection in kanban view), future performance optimization

### 4. Stage Entry Date Tracked via Database Trigger

**Decision:** Use PostgreSQL BEFORE UPDATE trigger to auto-update `stage_entry_date` when `stage` changes.

**Context:** Research emphasized triggers guarantee consistency. Application-level updates miss edge cases.

**Rationale:**
- Atomic: Trigger fires as part of transaction, can't fail independently
- Comprehensive: Works for all update paths (UI, API, direct SQL, migrations)
- Reliable: Can't be bypassed by application bugs or forgotten code paths

**Outcome:** `update_stage_entry_date()` trigger function in migration 018.

**Affects:** All stage updates will automatically update `stage_entry_date`. Application code doesn't need to manage this field.

## Deviations from Plan

**None** — plan executed exactly as written.

## Verification Results

✅ All verification criteria passed:

1. ✅ `npx tsc --noEmit` passes without errors
2. ✅ `lib/stage-definitions.ts` exports STAGE_DEFINITIONS with all 12 stages
3. ✅ `lib/stage-definitions.ts` exports all helper functions: `getExitCriteria`, `getAllowedTransitions`, `isTerminalStage`, `isValidTransition`, `computeIsStalled`
4. ✅ `lib/database/migrations/018-stage-entry-date-trigger.sql` exists with valid SQL (ALTER TABLE, CREATE FUNCTION, CREATE TRIGGER)
5. ✅ `types/investors.ts` contains `stage_entry_date` field in Investor interface

## Next Phase Readiness

**Phase 05 Plan 02** (Stage transition server action, validation dialog) is **READY**.

**Blockers:** None

**Manual Steps Required:**
- Execute migration `018-stage-entry-date-trigger.sql` in Supabase SQL Editor before Plan 05-02 testing (follows established project pattern)

**Dependencies Delivered:**
- ✅ `lib/stage-definitions.ts` — Plan 05-02 will import this for validation logic
- ✅ `stage_entry_date` field in database (after migration) — Plan 05-02 will rely on trigger to update this
- ✅ TypeScript types updated — Plan 05-02 can reference `stage_entry_date` safely

## Success Criteria Met

- ✅ Stage definitions are centralized in a single module used by all Phase 5 plans
- ✅ Database migration is ready for manual execution (follows project pattern)
- ✅ TypeScript types are updated to include stage_entry_date
- ✅ No type errors introduced

## Key Insights

1. **Exit criteria as checklists is more flexible than field validation** — Can evolve requirements without schema changes. Clearer user intent.

2. **Database triggers eliminate entire class of bugs** — Application code can't forget to update `stage_entry_date`. Guaranteed consistency.

3. **Computed stalled status trades query performance for simplicity** — Right trade-off at <100 investors. Can optimize later if needed.

4. **Re-engagement is real in fundraising** — Terminal stages aren't truly terminal. LP relationships evolve over years.

5. **TypeScript const satisfies pattern enforces completeness** — Using `as const satisfies Record<InvestorStage, StageDefinition>` ensures we defined all 12 stages, catches typos.

## Tech Debt / Future Work

None identified. Plan delivered exactly what's needed for Phase 5 Plans 02-03.

---

**Plan Status:** ✅ COMPLETE
**Execution Time:** 2 minutes
**Commits:** 2 (1c9b7d8, d525689)
**Files Created:** 2
**Files Modified:** 1
**Type Errors:** 0
