---
phase: 08-real-time-collaboration
plan: 02
subsystem: client-hooks
tags: [react, supabase-realtime, websockets, optimistic-locking, presence]

# Dependency graph
requires:
  - phase: 08-01-database-foundation
    provides: Version column, REPLICA IDENTITY FULL, TypeScript real-time types
  - phase: 02-authentication-security
    provides: useAuth hook for user context in presence tracking
provides:
  - useRealtimeInvestors hook for live database subscriptions
  - usePresence hook for collaborative user tracking
  - useOptimisticUpdate hook for version-checked conflict detection
affects: [08-03-ui-wiring, real-time UI components, collaborative editing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React useEffect with WebSocket subscription cleanup pattern"
    - "Supabase Realtime postgres_changes for database CDC"
    - "Supabase Presence API with shared channel for user tracking"
    - "Version-checked updates via .eq('version', currentVersion) pattern"
    - "Soft delete detection in UPDATE events (deleted_at field check)"

key-files:
  created:
    - lib/hooks/use-realtime-investors.ts
    - lib/hooks/use-presence.ts
    - lib/hooks/use-optimistic-update.ts
  modified: []

key-decisions:
  - "useRealtimeInvestors syncs with initialInvestors prop when parent re-fetches (filter changes)"
  - "Preserve contacts/primary_contact from local state on UPDATE events (subscription doesn't include joins)"
  - "Handle soft deletes in UPDATE handler (deleted_at set removes from list)"
  - "Single shared 'crm-presence' channel for all users (vs per-record channels)"
  - "Filter presence to recordId in hook (not at channel level) for flexibility"
  - "useOptimisticUpdate uses Supabase browser client directly (RLS-protected, atomic version check)"
  - "Type guard for Supabase presence state (includes presence_ref in addition to PresenceState fields)"
  - "Connection status tracking for UI indicators (connecting/connected/error/closed)"

patterns-established:
  - "Real-time hook pattern: useState(initialData) → useEffect(subscribe) → cleanup(removeChannel)"
  - "Presence tracking pattern: channel.track() on SUBSCRIBED, updatePresence() for state changes"
  - "Optimistic update pattern: version increment + .eq('version', current) → conflict if no rows affected"
  - "Console logging for real-time event debugging ([hookName] prefix for clarity)"

# Metrics
duration: 2min
completed: 2026-02-13
---

# Phase 08-02: Real-Time Hooks Summary

**Three reusable React hooks encapsulate all real-time collaboration logic: live database subscriptions, user presence tracking, and version-checked conflict detection**

## Performance

- **Duration:** 2 min 15 sec
- **Started:** 2026-02-13T06:07:22Z
- **Completed:** 2026-02-13T06:09:37Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Created useRealtimeInvestors hook for live database change subscriptions (INSERT/UPDATE/DELETE)
- Implemented soft delete detection (UPDATE with deleted_at removes from list)
- Created usePresence hook with shared 'crm-presence' channel for collaborative user tracking
- Implemented useOptimisticUpdate hook with atomic version-checked updates for conflict detection
- All hooks follow existing project patterns (use-auth.ts, use-role.ts) with proper cleanup
- Connection status tracking for UI indicators across all real-time features

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useRealtimeInvestors hook** - `0148980` (feat)
2. **Task 2: Create usePresence and useOptimisticUpdate hooks** - `b62d6e5` (feat)

## Files Created/Modified

**Created:**
- `lib/hooks/use-realtime-investors.ts` - Real-time investor list subscription with INSERT/UPDATE/DELETE handling
- `lib/hooks/use-presence.ts` - User presence tracking per record (viewing/editing state)
- `lib/hooks/use-optimistic-update.ts` - Version-checked investor field updates with conflict detection

## Decisions Made

**useRealtimeInvestors design:**
- Accept initialInvestors from Server Component (server-side fetch for SEO + fast initial render)
- Sync with initialInvestors prop changes via useEffect (parent re-fetches after filters)
- Handle soft deletes in UPDATE handler (deleted_at field check removes from list)
- Preserve contacts/primary_contact from local state on UPDATE (subscription doesn't include joins)
- Track connection status for UI indicators (connecting/connected/error/closed)

**usePresence design:**
- Single shared 'crm-presence' channel for all users (vs per-record channels)
  - Rationale: Avoids Supabase 100 channels per connection limit, more efficient
- Filter presence to recordId in hook (not at channel level)
  - Rationale: More flexible, allows presence to span multiple records without re-subscribing
- Extract username from user.email (split on '@')
- updatePresence() function for state changes (e.g., user starts editing a field)
- Type guard to handle Supabase presence_ref field in addition to our PresenceState fields

**useOptimisticUpdate design:**
- Use Supabase browser client directly (not server action)
  - Rationale: RLS already protects update, version check is atomic at database level
  - Tradeoff: No activity logging for field_update (real-time events partially replace)
- Return OptimisticUpdateResult<Investor> with success/conflict/data/error
- Zero rows updated = conflict detected (another user edited, version mismatch)
- Version increment via SET version = currentVersion + 1

**Type handling:**
- Supabase presenceState() returns objects with presence_ref field
- Use .map() to extract PresenceState fields, then .filter() with type guard
- Avoid unsafe 'as PresenceState' cast without validation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase presence state type mismatch**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Supabase presenceState() returns `{ [key: string]: Array<State & { presence_ref: string }> }`, but plan assumed direct PresenceState[] cast would work
- **Fix:** Added .map() to extract PresenceState fields, then .filter() with type guard to ensure proper structure
- **Files modified:** lib/hooks/use-presence.ts
- **Commit:** b62d6e5 (included in Task 2)

## Issues Encountered

None - all hooks implemented successfully, TypeScript compilation passed with zero errors.

## Next Phase Readiness

**Hooks ready for UI integration in Plan 03.**

All three hooks are:
- Self-contained with proper TypeScript types
- Follow existing project patterns (use-auth.ts, use-role.ts)
- Include cleanup functions to prevent memory leaks
- Ready for import and use in UI components

**Plan 03 (UI Wiring) can now:**
- Wire useRealtimeInvestors into investor list and kanban views
- Add usePresence indicators to investor detail pages
- Replace existing inline edit with useOptimisticUpdate for conflict detection
- Add connection status indicators to UI

**Blocker:** Migrations 024 and 025 from Plan 01 must be executed in Supabase SQL Editor before these hooks will work in production. (Database foundation requirement for version column and REPLICA IDENTITY FULL.)

---
*Phase: 08-real-time-collaboration*
*Completed: 2026-02-13*
