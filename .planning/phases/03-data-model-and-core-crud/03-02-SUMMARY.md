---
phase: 03-data-model-and-core-crud
plan: 02
subsystem: api-layer
tags: [server-actions, zod, validation, crud, activity-logging, race-condition-prevention]

# Dependency graph
requires:
  - phase: 03-data-model-and-core-crud
    plan: 01
    provides: Database schema (investors, contacts, activities), TypeScript types
provides:
  - Zod validation schemas for investor and contact data
  - Server actions for full CRUD lifecycle (create, read, update, soft delete, restore)
  - Single-field update pattern to prevent race conditions
  - Activity logging integrated into all create/update/delete operations
  - Admin client usage for restore operations (bypasses RLS)
affects: [04-investor-pipeline-views, 05-investor-crud-operations, 06-activity-logging]

# Tech tracking
tech-stack:
  added: [react-hook-form@7.71.1, zod@4.3.6, @hookform/resolvers@5.2.2]
  patterns:
    - "Zod validation with runtime type checking and TypeScript inference"
    - "Single-field update pattern to prevent race conditions on concurrent edits"
    - "Admin client for restore operations to bypass RLS SELECT filter"
    - "Activity logging on all state changes (create, update, delete, restore)"
    - "Discriminated union return types for consistent error handling"

key-files:
  created:
    - lib/validations/investor-schema.ts
    - lib/validations/contact-schema.ts
    - app/actions/investors.ts
    - app/actions/contacts.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Single-field updates prevent race conditions - updateInvestorField updates only specified field, not entire record"
  - "Admin client required for restore operations - RLS SELECT policy filters deleted records"
  - "No revalidatePath in updateInvestorField - inline edits should not trigger full page reload"
  - "Primary contact flag handling - createContact sets all other contacts to is_primary=false if new contact is primary"
  - "Activity logging on investor for contact changes - maintains investor-centric audit trail"

patterns-established:
  - "Pattern 1: Zod schema split (create vs update) - create requires minimum fields, update allows partial updates"
  - "Pattern 2: Single-field validation helper - validateInvestorField validates individual fields for inline editing"
  - "Pattern 3: Discriminated union return types - { data, error } pattern for consistent error handling"
  - "Pattern 4: Admin client for bypass operations - service role client used when RLS blocks legitimate operations"
  - "Pattern 5: Activity metadata JSON - field_update activities store old_value and new_value in metadata field"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 3 Plan 2: Validation & Server Actions Summary

**Zod schemas and Next.js Server Actions for investor and contact CRUD operations with race condition prevention and activity logging**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T04:46:34Z
- **Completed:** 2026-02-12T04:49:06Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created Zod validation schemas for investor create, update, and field-level validation
- Created contact validation schema with email validation and optional fields
- Implemented 6 investor server actions (create, getInvestor, getInvestors, updateField, softDelete, restore)
- Implemented 3 contact server actions (create, update, delete)
- Integrated activity logging on all state changes
- Implemented single-field update pattern to prevent race conditions
- Used admin client for restore operations to bypass RLS SELECT filter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zod validation schemas** - `ca099fc` (feat)
2. **Task 2: Create server actions for investor and contact CRUD** - `8e3076e` (feat)

## Files Created/Modified

- `lib/validations/investor-schema.ts` - investorCreateSchema (3 required fields), investorUpdateSchema (20 optional fields), validateInvestorField helper
- `lib/validations/contact-schema.ts` - contactSchema for contact create/update with email validation
- `app/actions/investors.ts` - 6 server actions: createInvestor, getInvestor, getInvestors, updateInvestorField, softDeleteInvestor, restoreInvestor
- `app/actions/contacts.ts` - 3 server actions: createContact, updateContact, deleteContact
- `package.json` - Added react-hook-form, zod, @hookform/resolvers dependencies

## Decisions Made

**Single-field updates prevent race conditions:**
- `updateInvestorField` updates only the specified field, not the entire record
- Prevents race condition where rapid edits to different fields overwrite each other
- Follows RESEARCH.md Pitfall 5 guidance on auto-save race conditions
- Rationale: User editing Field A then Field B shouldn't have A overwritten by stale data

**Admin client required for restore operations:**
- `restoreInvestor` uses `createAdminClient()` instead of regular client
- RLS SELECT policy filters out deleted records (deleted_at IS NULL)
- Regular client cannot "see" deleted record to UPDATE it
- Service role client bypasses RLS to perform restoration
- Follows 03-01 decision on permissive UPDATE policies

**No revalidatePath in updateInvestorField:**
- Inline field edits should not trigger full page reload
- Server action returns updated data for optimistic UI updates
- `revalidatePath` only called for create/delete operations
- Rationale: Notion/Linear-style inline editing should feel instant, not reload page

**Primary contact flag handling:**
- `createContact` with `is_primary: true` sets all other contacts to `is_primary: false`
- Ensures only one primary contact per investor
- Database supports multiple primary contacts (no unique constraint), application enforces single primary
- Rationale: Simplifies UI logic, prevents "which contact is primary?" ambiguity

**Activity logging on investor for contact changes:**
- Contact create/update/delete operations log activity on parent investor record
- Maintains investor-centric audit trail
- All relationship history visible from investor detail page
- Rationale: Users think in terms of "investor activity", not isolated contact changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript error on ZodError.errors:**
- Initial implementation used `error.errors[0]?.message` (incorrect property name)
- Fixed to use `error.issues[0]?.message` (correct ZodError API)
- Classification: Rule 1 (Bug) - type error preventing compilation
- Resolution: Changed property access to match Zod API

## Next Phase Readiness

**Ready for Phase 3 Plan 3:** UI components can now call these server actions for CRUD operations.

**Foundation complete:**
- Validation schemas ready for form integration with React Hook Form
- Server actions provide full CRUD API layer
- Activity logging captures all state changes
- Race condition prevention ensures data integrity

**No blockers or concerns.**

## Testing Notes

All server actions follow consistent patterns:
1. Auth check via `getUser()` - returns `{ error: 'Unauthorized' }` if not authenticated
2. Zod validation (create operations) - returns `{ error: validation.message }` on failure
3. Database operation - returns `{ error: dbError.message }` on failure
4. Activity logging - fire-and-forget (errors don't block operation)
5. Return type - discriminated union `{ data } | { error }` for type-safe error handling

Verification checklist for future UI integration:
- [ ] Forms use appropriate schema (investorCreateSchema for create, validateInvestorField for inline edit)
- [ ] Error handling checks `error` property before accessing `data`
- [ ] Optimistic updates use returned `data` value, not form state
- [ ] Restore operation requires admin/elevated permission check in UI
- [ ] Contact is_primary toggle calls createContact or updateContact appropriately

---
*Phase: 03-data-model-and-core-crud*
*Completed: 2026-02-12*
