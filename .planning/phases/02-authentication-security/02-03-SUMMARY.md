---
phase: 02-authentication-security
plan: 03
subsystem: auth
tags: [react-context, jwt-decode, hooks, rbac, session-management, modal, supabase]

# Dependency graph
requires:
  - phase: 02-authentication-security
    plan: 01
    provides: Database schema with user_roles table and Auth Hook for JWT custom claims
  - phase: 02-authentication-security
    plan: 02
    provides: OAuth login flow and authenticated dashboard layout
  - phase: 01-foundation-environment
    provides: Next.js app structure, Supabase client utilities, shadcn/ui components
provides:
  - artifact: components/auth/auth-provider.tsx
    capability: React context for auth state (user, session, loading, signOut) available to all client components
    used_by: All dashboard components needing auth state
  - artifact: lib/hooks/use-auth.ts
    capability: Hook for accessing auth context with error handling
    used_by: Any client component needing current user info
  - artifact: lib/hooks/use-role.ts
    capability: Hook for extracting user role from JWT with isAdmin property
    used_by: RoleGuard and any component needing role-based logic
  - artifact: components/auth/session-expiry-modal.tsx
    capability: Modal overlay on session expiration that preserves user context
    used_by: Dashboard layout (active globally)
  - artifact: components/auth/role-guard.tsx
    capability: Client-side component for role-based UI rendering
    used_by: Any component needing to hide/show UI based on role
  - artifact: lib/supabase/auth-helpers.ts
    capability: Server-side auth utilities (getCurrentUser, getCurrentRole, requireAuth, requireAdmin, logAuditEvent)
    used_by: Server Components, API routes, and Server Actions
affects:
  - phase: 03-database-schema
    how: Server auth helpers will be used for RLS policies and data access
  - phase: 04-investor-crud
    how: RoleGuard will control admin-only UI elements
  - phase: 05-audit-logging
    how: logAuditEvent will be called from all business logic operations

# Tech tracking
tech-stack:
  added:
    - library: jwt-decode
      purpose: Decode JWT access tokens to extract custom claims
      why: Lightweight JWT parsing without full verification (Supabase already validates)
  patterns:
    - name: React Context for Auth State
      description: AuthProvider wraps dashboard with onAuthStateChange listener, provides user/session to all children
      files: [components/auth/auth-provider.tsx, lib/hooks/use-auth.ts]
    - name: JWT Custom Claims for Role Access
      description: useRole hook decodes JWT to extract user_role claim, provides isAdmin flag
      files: [lib/hooks/use-role.ts]
    - name: Session Expiry Modal with Context Preservation
      description: Modal shows only on genuine SIGNED_OUT event (not TOKEN_REFRESHED), stores returnPath in sessionStorage
      files: [components/auth/session-expiry-modal.tsx]
    - name: RoleGuard Pattern for Conditional Rendering
      description: Component wrapper that shows/hides children based on user role
      files: [components/auth/role-guard.tsx]
    - name: Server-Side Auth Helper Functions
      description: Async functions for auth checks in Server Components (getCurrentUser, requireAuth, requireAdmin, logAuditEvent)
      files: [lib/supabase/auth-helpers.ts]

key-files:
  created:
    - path: components/auth/auth-provider.tsx
      purpose: Auth context provider managing state via onAuthStateChange
    - path: lib/hooks/use-auth.ts
      purpose: Hook for accessing auth context with error handling
    - path: lib/hooks/use-role.ts
      purpose: Hook for extracting user role from JWT with isAdmin property
    - path: components/auth/session-expiry-modal.tsx
      purpose: Modal overlay on session expiration
    - path: components/auth/role-guard.tsx
      purpose: Client-side role-based UI gating component
    - path: lib/supabase/auth-helpers.ts
      purpose: Server-side auth utilities (getCurrentUser, getCurrentRole, requireAuth, requireAdmin, logAuditEvent)
  modified:
    - path: app/(dashboard)/layout.tsx
      purpose: Wrapped with AuthProvider and added SessionExpiryModal

key-decisions:
  - "AuthProvider uses onAuthStateChange for reactive auth state updates across all client components"
  - "useRole decodes JWT on client side (Supabase already validated token, no security risk)"
  - "SessionExpiryModal uses wasAuthenticated flag to prevent flash on initial load"
  - "RoleGuard returns null during loading to avoid UI flash"
  - "Server auth helpers use getSession() to decode JWT (getUser() already validated in middleware)"
  - "logAuditEvent auto-fills user_id and user_email from current session"

patterns-established:
  - "Auth context pattern: AuthProvider wraps app, useAuth hook provides access"
  - "Role checking pattern: useRole hook for client, getCurrentRole() for server"
  - "Session expiry UX: Modal with returnPath preservation, no hard redirect"
  - "RoleGuard pattern: <RoleGuard allowedRoles={['admin']}>{adminContent}</RoleGuard>"
  - "Server auth pattern: requireAuth() for protected routes, requireAdmin() for admin routes"

# Metrics
duration: 2min
completed: 2026-02-11
---

# Phase 2 Plan 3: Auth Context and Role Infrastructure Summary

**React auth context with JWT role decoding, session expiry modal with context preservation, RoleGuard component, and server-side auth helpers for RBAC enforcement**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-02-11T21:44:17Z
- **Completed:** 2026-02-11T21:46:12Z
- **Tasks:** 2
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments
- AuthProvider context makes user/session/loading state available to all client components via useAuth hook
- useRole hook extracts user role from JWT access token with isAdmin convenience property
- SessionExpiryModal shows re-auth prompt only on genuine session expiry (not TOKEN_REFRESHED events)
- RoleGuard component enables declarative role-based UI rendering
- Server-side auth helpers provide getCurrentUser, getCurrentRole, requireAuth, requireAdmin, and logAuditEvent utilities
- Dashboard layout integrated with AuthProvider and SessionExpiryModal for global auth state management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AuthProvider, useAuth hook, useRole hook, and session expiry modal** - `c5f2269` (feat)
2. **Task 2: Create RoleGuard, server-side auth helpers, and integrate into dashboard** - `1b89bde` (feat)

**Plan metadata:** (will be committed separately)

## Files Created/Modified
- `components/auth/auth-provider.tsx` - React context provider managing auth state via onAuthStateChange listener, provides user/session/loading/signOut to all children
- `lib/hooks/use-auth.ts` - Hook for accessing auth context with error if used outside provider
- `lib/hooks/use-role.ts` - Hook for extracting user_role from JWT access token, provides role/loading/isAdmin
- `components/auth/session-expiry-modal.tsx` - Modal overlay on SIGNED_OUT event with wasAuthenticated guard, stores returnPath in sessionStorage
- `components/auth/role-guard.tsx` - Component wrapper that conditionally renders children based on user role
- `lib/supabase/auth-helpers.ts` - Server-side utilities: getCurrentUser, getCurrentRole, requireAuth, requireAdmin, logAuditEvent
- `app/(dashboard)/layout.tsx` - Wrapped with AuthProvider and added SessionExpiryModal

## Decisions Made

**1. AuthProvider uses onAuthStateChange for reactive updates**
- Subscribes to auth state changes on mount, updates context reactively
- Provides consistent auth state across all client components
- Syncs across browser tabs via Supabase BroadcastChannel

**2. useRole decodes JWT on client side**
- Supabase already validated the JWT token (middleware getUser call)
- Client-side decoding is safe for reading claims
- No additional server round-trip needed for role checking

**3. SessionExpiryModal uses wasAuthenticated flag**
- Prevents modal flash on initial page load (before INITIAL_SESSION event)
- Only shows on SIGNED_OUT when user was previously authenticated
- Avoids false positive on TOKEN_REFRESHED events

**4. RoleGuard returns null during loading**
- Prevents UI flash of restricted content before role loads
- Silently hides content if role not in allowedRoles (fallback prop optional)

**5. Server auth helpers use getSession() to decode JWT**
- getUser() already validated token in middleware
- getSession() sufficient for reading JWT claims server-side
- getCurrentRole defaults to 'member' if user_role claim missing

**6. logAuditEvent auto-fills user context**
- Automatically gets current user via getCurrentUser()
- Fills user_id and user_email from session
- IP address and user agent can be added in API routes via headers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all components built as specified, TypeScript compilation and Next.js build succeeded.

## User Setup Required

None - no external service configuration required. Auth infrastructure is purely internal.

## Next Phase Readiness

**Ready for Phase 3 (Database Schema & Investor CRUD):**
- Auth state available to all client components via useAuth hook
- Role checking available on client (useRole) and server (getCurrentRole)
- RoleGuard ready for conditional UI rendering in admin sections
- Server auth helpers ready for route protection (requireAuth, requireAdmin)
- Audit logging utility ready for business event tracking (logAuditEvent)

**Dependencies satisfied for next phases:**
- Phase 3: Server auth helpers will protect data access routes
- Phase 4: RoleGuard will hide admin-only UI elements (delete buttons, etc.)
- Phase 5: logAuditEvent will track all data mutations

**No blockers.** Client-side auth infrastructure complete, RBAC enforcement layer operational.

---
*Phase: 02-authentication-security*
*Completed: 2026-02-11*
