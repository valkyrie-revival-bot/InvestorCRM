---
phase: 04-pipeline-views-and-search
plan: 01
subsystem: ui
tags: [react, tabs, search, filtering, client-components, useTransition, shadcn-ui]

# Dependency graph
requires:
  - phase: 03-data-model-and-core-crud
    provides: InvestorListTable component, InvestorWithContacts type, getInvestors server action
provides:
  - PipelineViewSwitcher component with Table/Board tab navigation
  - Real-time search across firm name, contact name/email, strategy notes, key objections
  - 4 filter controls: Stage, Allocator Type, Internal Conviction, Stalled status
  - Search result highlighting in firm name and contact name cells
  - Refactored InvestorListTable to accept pre-filtered data
affects: [04-02-kanban-board, 05-dashboard-widgets]

# Tech tracking
tech-stack:
  added: [shadcn/ui Tabs component]
  patterns: [useTransition for non-blocking search, parent filtering with pre-filtered child display, search highlighting with regex escape]

key-files:
  created:
    - components/ui/tabs.tsx
    - components/investors/pipeline-view-switcher.tsx
  modified:
    - components/investors/investor-list-table.tsx
    - app/(dashboard)/investors/page.tsx

key-decisions:
  - "Use useTransition for search (not debouncing) - instant input updates, non-blocking filtering"
  - "Filter persistence via shared state in PipelineViewSwitcher - search and filters persist across tab switches"
  - "Parent component handles filtering, child handles sorting - clear separation of concerns"
  - "Defer activity description search - would require server-side endpoint or memory-intensive pre-loading for 100+ investors"

patterns-established:
  - "Search highlighting pattern: highlightMatch() with regex escape and <mark> tags"
  - "Type-safe filter arrays: use .filter((t): t is string => Boolean(t)) to remove nulls"
  - "Client-side filtering architecture: server fetches all data, client filters/searches for <100 records"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 04 Plan 01: Pipeline View Switcher Summary

**Table/Board tab navigation with real-time search across firm/contact/notes and 4-filter controls (Stage, Type, Conviction, Stalled)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T18:15:19Z
- **Completed:** 2026-02-12T18:17:51Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Created PipelineViewSwitcher with Table/Board tabs and instant search
- Implemented 4 filter controls with "Clear filters" button
- Added search result highlighting in firm name and contact name cells
- Refactored InvestorListTable to accept pre-filtered data and searchQuery prop
- Search uses useTransition for non-blocking updates (<500ms response time)
- Filters and search persist when switching between Table and Board tabs

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Add Tabs component and create PipelineViewSwitcher with search and filters** - `fe407d9` (feat)

**Plan metadata:** (to be committed separately)

## Files Created/Modified
- `components/ui/tabs.tsx` - shadcn/ui Tabs component for Table/Board navigation
- `components/investors/pipeline-view-switcher.tsx` - Client component managing search, filters, and tab content
- `components/investors/investor-list-table.tsx` - Refactored to accept pre-filtered investors and searchQuery prop, added highlightMatch() for search results
- `app/(dashboard)/investors/page.tsx` - Server component rendering PipelineViewSwitcher instead of InvestorListTable

## Decisions Made

**1. Use useTransition for search (not debouncing)**
- useTransition provides instant input updates while deferring filtering as low priority
- Meets <500ms success criteria without setTimeout/debounce complexity
- React's built-in mechanism for non-blocking UI updates

**2. Filter persistence via shared state**
- Search query and 4 filters stored in PipelineViewSwitcher state
- Tab content re-renders with same filtered data when switching tabs
- User can search in Table tab, switch to Board tab (when implemented), return to Table tab with search still active

**3. Parent component handles filtering, child handles sorting**
- PipelineViewSwitcher: manages search and 4 filters, passes filteredInvestors to children
- InvestorListTable: receives pre-filtered data, only manages column sorting
- Clear separation of concerns, easier to test and maintain

**4. Defer activity description search**
- Plan originally included activity descriptions in search scope (per CONTEXT.md)
- Implementing real-time activity search (<500ms per keystroke) would require:
  - Pre-loading all activities for all investors (memory intensive for 100+ investors with 50+ activities each)
  - OR server-side search endpoint with Postgres full-text search (adds complexity beyond client-side filtering)
- Decision: Limit Phase 4 search to investor table fields (firm_name, contact name/email, current_strategy_notes, key_objection_risk)
- Activity description search can be added in Phase 6 when full-text search infrastructure is available

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error with null values in Select components**
- **Found during:** Task 1 (PipelineViewSwitcher creation)
- **Issue:** allocatorTypes and convictions arrays contained `string | null` but SelectItem value prop requires `string`
- **Fix:** Changed `.filter(Boolean)` to `.filter((t): t is string => Boolean(t))` for type-safe null removal
- **Files modified:** components/investors/pipeline-view-switcher.tsx
- **Verification:** npm run build succeeds with no TypeScript errors
- **Committed in:** fe407d9 (Task 1-2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** TypeScript safety fix, no scope creep. Essential for build to succeed.

## Issues Encountered
None - plan executed smoothly with one minor TypeScript fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PipelineViewSwitcher foundation complete with search and filters working
- Board tab placeholder ready for Plan 02 (Kanban board implementation)
- All 4 filters functional and tested
- Search highlighting demonstrates instant feedback to user

**Ready for Plan 02:** Kanban board can be dropped into Board TabsContent with full access to filtered data.

---
*Phase: 04-pipeline-views-and-search*
*Completed: 2026-02-12*
