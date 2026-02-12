---
phase: 03-data-model-and-core-crud
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, soft-delete, typescript, schema-design]

# Dependency graph
requires:
  - phase: 02-authentication-security
    provides: RLS policies pattern, auth.users table, authenticated role
provides:
  - Three-table normalized schema (investors, contacts, activities)
  - Soft delete support with RLS policies that permit UPDATE operations
  - Foreign key indexes for join performance
  - Comprehensive TypeScript types for all entities and operations
  - Updated_at trigger function for automatic timestamp management
affects: [04-investor-pipeline-views, 05-investor-crud-operations, 06-activity-logging, 09-ai-bdr-agent]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Soft delete with deleted_at timestamp and permissive UPDATE RLS policies"
    - "Foreign key indexes created explicitly for all relationships"
    - "Updated_at trigger function pattern for automatic timestamp maintenance"
    - "Immutable audit trail (activities table - no UPDATE/DELETE)"
    - "Composite types (InvestorWithContacts, InvestorFull) for query results"

key-files:
  created:
    - lib/database/migrations/007_create_investors.sql
    - lib/database/migrations/008_create_contacts.sql
    - lib/database/migrations/009_create_activities.sql
    - lib/database/migrations/010_investor_rls_policies.sql
    - lib/database/migrations/011_investor_indexes.sql
    - types/investors.ts
  modified: []

key-decisions:
  - "Use text type for stage field (not enum) - stages may evolve over time"
  - "Permissive UPDATE RLS policies with using(true) to support soft delete operations"
  - "ON DELETE RESTRICT for foreign keys - enforce soft delete pattern, never hard delete"
  - "Activities are immutable - no updated_at, deleted_at, or UPDATE/DELETE policies"
  - "Partial index for primary contact lookups (WHERE is_primary = true)"
  - "InvestorStage as union type (not enum) for flexibility in TypeScript"

patterns-established:
  - "Pattern 1: Soft delete with permissive UPDATE policies (avoid RLS policy blocking UPDATE operations)"
  - "Pattern 2: Foreign key indexes created immediately after table creation"
  - "Pattern 3: Immutable audit tables (activities) with no UPDATE/DELETE capabilities"
  - "Pattern 4: TypeScript types mirror database schema exactly with ISO date strings"
  - "Pattern 5: Form types (Insert/Update) with explicit required/optional field splits"

# Metrics
duration: 2min
completed: 2026-02-11
---

# Phase 3 Plan 1: Database Schema Summary

**Three-table PostgreSQL schema (investors, contacts, activities) with soft delete support, RLS policies, foreign key indexes, and comprehensive TypeScript types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-11T23:34:43Z
- **Completed:** 2026-02-11T23:36:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created normalized three-table schema for investor pipeline CRM with 20 data fields
- Implemented soft delete pattern with RLS policies that support UPDATE operations
- Added foreign key indexes for all relationships and common query patterns
- Defined comprehensive TypeScript types matching database schema exactly
- Established updated_at trigger pattern for automatic timestamp management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migrations for investors, contacts, and activities tables** - `b432459` (feat)
2. **Task 2: Create RLS policies, indexes, and TypeScript types** - `11888cb` (feat)

## Files Created/Modified

- `lib/database/migrations/007_create_investors.sql` - Investors table with 20 data fields, soft delete, created_by tracking
- `lib/database/migrations/008_create_contacts.sql` - Contacts table with foreign key to investors, is_primary flag
- `lib/database/migrations/009_create_activities.sql` - Activities table for immutable audit trail with activity_type constraint
- `lib/database/migrations/010_investor_rls_policies.sql` - RLS policies for all three tables with permissive UPDATE policies
- `lib/database/migrations/011_investor_indexes.sql` - Foreign key indexes and query optimization indexes
- `types/investors.ts` - TypeScript types for Investor, Contact, Activity entities and form operations

## Decisions Made

**Stage field as text (not enum):**
- Database uses `text` type for `stage` field rather than PostgreSQL enum
- TypeScript provides `InvestorStage` union type for type safety
- Rationale: Stages may evolve over time, text provides flexibility without schema migrations

**Permissive UPDATE RLS policies:**
- All UPDATE policies use `using (true)` not `using (deleted_at is null)`
- Critical for soft delete operations (UPDATE to set deleted_at)
- Follows RESEARCH.md Pitfall 1 guidance on RLS soft delete pattern

**ON DELETE RESTRICT for foreign keys:**
- All foreign keys use `ON DELETE RESTRICT` to prevent hard deletes
- Enforces soft delete pattern at database level
- Cascade behavior handled in application logic

**Activities are immutable:**
- No `updated_at` or `deleted_at` fields on activities table
- No UPDATE or DELETE RLS policies defined
- Activities serve as permanent audit trail of investor interactions

**Primary contact index optimization:**
- Partial index `WHERE is_primary = true` for efficient primary contact lookups
- Reduces index size and improves query performance for common pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**SQL migrations must be executed in Supabase SQL Editor:**

1. Navigate to Supabase Dashboard → SQL Editor
2. Execute migrations in order (007 → 011):
   - `lib/database/migrations/007_create_investors.sql`
   - `lib/database/migrations/008_create_contacts.sql`
   - `lib/database/migrations/009_create_activities.sql`
   - `lib/database/migrations/010_investor_rls_policies.sql`
   - `lib/database/migrations/011_investor_indexes.sql`

3. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('investors', 'contacts', 'activities');
   ```

4. Verify RLS enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('investors', 'contacts', 'activities');
   ```

5. Verify indexes created:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE schemaname = 'public'
   AND tablename IN ('investors', 'contacts', 'activities');
   ```

## Next Phase Readiness

**Ready for Phase 3 Plan 2:** CRUD operations can now be implemented against this schema.

**Foundation complete:**
- Database schema defined and ready for data
- TypeScript types available for import in server actions and components
- RLS policies protect all three tables while supporting soft delete
- Indexes in place for efficient queries

**No blockers or concerns.**

---
*Phase: 03-data-model-and-core-crud*
*Completed: 2026-02-11*
