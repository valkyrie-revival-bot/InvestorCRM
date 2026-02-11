---
phase: 02-authentication-security
plan: 01
subsystem: authentication-database
tags: [supabase, auth, rbac, audit, postgresql, sql]
requires:
  - phase: 01-foundation-environment
    what: Next.js project with Supabase client configured
    why: SQL migrations depend on Supabase project existing
provides:
  - artifact: lib/database/migrations/001-006_*.sql
    capability: Database schema for auth and RBAC
    used_by: Phase 2 plans (OAuth, session management, audit UI)
  - artifact: types/auth.ts
    capability: TypeScript types for auth system
    used_by: All auth-related components and hooks
affects:
  - phase: 02-authentication-security
    plan: 02-04
    how: OAuth flow and audit UI depend on these database tables
  - phase: 03-database-schema
    plan: all
    how: RLS helper functions (is_admin) used by all data tables
tech-stack:
  added:
    - library: supa_audit
      purpose: PostgreSQL extension for database change tracking
      why: Official Supabase extension for comprehensive audit logging
  patterns:
    - name: Auth Hooks with Custom JWT Claims
      description: Supabase Auth Hooks add user_role to JWT tokens, enabling stateless RBAC
      files: [lib/database/migrations/002_create_auth_hook.sql]
    - name: RLS Policies for Role-Based Access
      description: Database-level authorization using JWT claims in RLS policies
      files: [lib/database/migrations/001_create_user_roles.sql, lib/database/migrations/004_create_rls_policies.sql]
    - name: Three-Tier Audit Logging
      description: Combination of auth logs (built-in), supa_audit (data changes), app_audit_log (business events)
      files: [lib/database/migrations/003_enable_supa_audit.sql, lib/database/migrations/005_create_audit_triggers.sql]
key-files:
  created:
    - path: lib/database/migrations/001_create_user_roles.sql
      purpose: app_role enum and user_roles table with RLS
    - path: lib/database/migrations/002_create_auth_hook.sql
      purpose: Auth Hook function for JWT custom claims
    - path: lib/database/migrations/003_enable_supa_audit.sql
      purpose: Enable supa_audit extension and tracking
    - path: lib/database/migrations/004_create_rls_policies.sql
      purpose: RLS helper functions (is_admin, is_authenticated)
    - path: lib/database/migrations/005_create_audit_triggers.sql
      purpose: app_audit_log table and role change triggers
    - path: lib/database/migrations/006_seed_initial_users.sql
      purpose: Seed template for 5 initial team members
    - path: types/auth.ts
      purpose: TypeScript types for AppRole, UserProfile, AuditLogEntry, JWTPayload
  modified: []
decisions:
  - decision: Use Supabase Auth Hooks for RBAC instead of application-layer role checks
    rationale: Auth Hooks add roles to JWT (stateless, no DB query per request), integrate with RLS for database-level authorization
    alternatives: [Application-layer role table queries, Custom JWT implementation]
    impact: All role checks happen via JWT claims, no additional database queries needed
  - decision: Three-tier audit logging (auth logs + supa_audit + app_audit_log)
    rationale: Comprehensive coverage - auth events (built-in), data changes (supa_audit), business logic (custom triggers)
    alternatives: [Single custom audit table, Application-level logging only]
    impact: Complete audit trail with minimal custom code, leverages Supabase built-in features
  - decision: Create RLS helper functions (is_admin, is_authenticated) for reuse
    rationale: Consistent role-checking logic across all tables, avoids duplicating JWT extraction code in every policy
    alternatives: [Inline JWT checks in each policy, Application-layer authorization only]
    impact: Cleaner RLS policies, easier to maintain, consistent authorization logic
  - decision: Default to 'member' role if no role assigned in Auth Hook
    rationale: Fail-safe approach - new users get least privilege, admins must explicitly grant admin role
    alternatives: [Block authentication if no role, Require role before first login]
    impact: New users can access system immediately but with limited permissions, reduces friction
duration: 2 min
completed: 2026-02-11
---

# Phase 2 Plan 1: Authentication Database Schema Summary

JWT auth with role-based access control using Supabase Auth Hooks, supa_audit extension for change tracking, and app-level audit logging.

## What Was Built

Created the database foundation for authentication and authorization:

1. **Role-Based Access Control (RBAC)**
   - `app_role` enum with 'admin' and 'member' values
   - `user_roles` table linking users to roles
   - RLS policies: admins manage roles, all users view roles
   - Auth Hook function to inject `user_role` claim into JWT tokens

2. **Audit Logging Infrastructure**
   - Enabled `supa_audit` extension for automatic database change tracking
   - Created `app_audit_log` table for application-level events
   - Implemented trigger function to log all role changes (assign, change, remove)
   - RLS policy allowing all authenticated users to view audit logs (member read-only requirement)

3. **RLS Helper Functions**
   - `is_admin()` - checks if current user has admin role from JWT
   - `is_authenticated()` - checks if user is authenticated
   - Both use `security definer` for consistent permission checking

4. **TypeScript Type Definitions**
   - `AppRole` type matching database enum
   - `UserProfile`, `AuditLogEntry`, `AuthEvent`, `JWTPayload` interfaces
   - Aligned exactly with database schema

5. **User Seeding Template**
   - Template for adding 5 initial team members (3 admins, 2 members)
   - Includes instructions for retrieving UUIDs after Google OAuth sign-in

## Technical Implementation

**Database Schema Pattern:**
- Auth Hooks inject custom claims into JWT at token generation time
- RLS policies read claims from JWT (stateless authorization)
- No additional database queries needed for role checking after authentication

**Audit Logging Approach:**
- **Auth events:** Captured automatically by Supabase (auth.audit_log_entries)
- **Data changes:** Tracked by supa_audit extension (audit.record_version)
- **Business events:** Custom triggers log to app_audit_log table

**Security Model:**
- Database-level authorization via RLS (can't be bypassed)
- JWT custom claims provide stateless role checking
- Auth Hook function restricted to supabase_auth_admin role only

## Files Created

```
lib/database/migrations/
  ├── 001_create_user_roles.sql       (1 KB)
  ├── 002_create_auth_hook.sql        (1.3 KB)
  ├── 003_enable_supa_audit.sql       (605 B)
  ├── 004_create_rls_policies.sql     (841 B)
  ├── 005_create_audit_triggers.sql   (2.7 KB)
  └── 006_seed_initial_users.sql      (1.3 KB)

types/
  └── auth.ts                         (1.2 KB)
```

**Total:** 7 files, 9.2 KB

## Deviations from Plan

None - plan executed exactly as written. All researched patterns from 02-RESEARCH.md followed precisely.

## Integration Points

**Upstream Dependencies:**
- Phase 1: Supabase project and Next.js client configuration

**Downstream Consumers:**
- Phase 2 Plans 2-4: OAuth flow reads user_roles, audit UI queries app_audit_log
- Phase 3+: All data tables use `is_admin()` in RLS policies
- All phases: TypeScript types used throughout auth components

**Cross-Phase Links:**
- Migration 004 helper functions used by all future table RLS policies
- Migration 005 app_audit_log table receives events from all future features
- types/auth.ts imported by all auth-related components

## Next Phase Readiness

**Blockers:** None

**Prerequisites for Next Plan (02-02: Google OAuth):**
- ✓ user_roles table exists for Auth Hook to query
- ✓ Auth Hook function created (needs Dashboard configuration)
- ✓ TypeScript types available for JWT payload decoding

**Manual Steps Required:**
1. Run SQL migrations in Supabase SQL Editor (001-006 in sequence)
2. Configure Auth Hook in Supabase Dashboard: Authentication > Hooks > Custom Access Token Hook
3. After team members sign in via OAuth (Plan 02-02), run migration 006 with actual UUIDs

**Known Limitations:**
- Auth Hook function exists but not yet configured in Dashboard (requires UI action in Plan 02-02)
- User seeding template has placeholder UUIDs (actual values filled after first OAuth sign-in)
- supa_audit currently tracking only user_roles table (investors table tracking added in Phase 3)

## Decisions Made

1. **Default new users to 'member' role** - Fail-safe approach, admins must explicitly grant admin role
2. **Use security definer for RLS helpers** - Consistent permission checking, functions run with elevated privileges
3. **Allow all authenticated users to view audit logs** - Meets requirement for member read-only access
4. **Sequential migration numbering (001-006)** - Clear execution order for manual running in SQL Editor

## Metrics

- **Tasks completed:** 2/2
- **Commits:** 2
  - `e813556`: SQL migrations for auth database schema
  - `8f84bd3`: TypeScript auth types
- **Duration:** 2 minutes
- **Files changed:** 7 created, 0 modified
- **Lines added:** 296

---

**Plan Status:** ✓ Complete
**Verification:** All files exist, TypeScript compiles without errors, SQL follows researched patterns
**Next:** Plan 02-02 - Google OAuth flow implementation
