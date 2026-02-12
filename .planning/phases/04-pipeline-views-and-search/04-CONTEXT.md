# Phase 4: Pipeline Views & Search - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-view pipeline navigation interface. Delivers kanban board visualization organized by stage and activity timeline for each investor record. Table view with sorting/filtering/search already exists from Phase 3 — this phase adds alternative views and enhances search.

</domain>

<decisions>
## Implementation Decisions

### Kanban Board

**Card content:**
- Claude's discretion on information density and layout
- Balance between minimal (firm + contact + value) and detailed (+ dates + strategy)

**Stage transitions:**
- Claude's discretion on drag-and-drop behavior
- Note: Stage validation rules come in Phase 5, this phase allows free movement

**Column design:**
- Claude's discretion on layout approach (horizontal scroll, fit-to-screen, collapsible)
- Consider typical stage count (12 stages defined) and screen space

**Empty columns:**
- Show "No investors in this stage" text (simple empty state)

### Activity Timeline

**Display format:**
- Claude's discretion (vertical timeline, feed-style cards, or compact list)
- Should fit detail page layout

**Time grouping:**
- Claude's discretion (by day, by week/month for old items, or no grouping)

**Activity details:**
- Claude's discretion on detail level
- Phase 4 scope: type icon, description, user, timestamp, field changes for updates
- Phase 7 adds linked context (emails, docs) via Google integration

**Filtering:**
- **Yes**: Filter by activity type (calls, emails, meetings, stage changes, field updates)
- Dropdown or button group to toggle activity types

### View Switching

**Navigation:**
- Claude's discretion (tabs, toggle button, or separate routes)
- Choose most intuitive for pipeline context

**Default view:**
- **Table view** remains the default landing page at /investors
- Kanban is alternative view, not replacement

**State persistence:**
- Claude's discretion on whether filters/search carry over when switching views
- Consider: filters likely useful across views, search UX may differ

**URL routing:**
- Claude's discretion (query param, path-based routes, or client-side only)
- Consider shareability and back button behavior

### Search Enhancements

**Search scope:**
- **Firm names** (already implemented)
- **Contact names and emails**
- **Strategy notes and key objections** (current_strategy_notes, key_objection_risk)
- **Activity descriptions**
- Do NOT search all fields — keep focused on these high-value fields

**Search timing:**
- **Real-time (instant results)** — search on every keystroke
- No debounce delay requested

**Result highlighting:**
- Claude's discretion on highlighting approach
- Options: highlight matches in table, show match location, or just filter

**Power features:**
- **Keep simple for Phase 4** — no keyboard shortcuts, no saved searches
- Focus on core search functionality first

</decisions>

<specifics>
## Specific Ideas

- Phase 3 already delivered table with sorting, filtering, and basic search — build on that foundation
- Kanban should work with 12 stages (Not Yet Approached → Won/Committed/Lost/Passed/Delayed)
- Real-time search should maintain <500ms response time per success criteria

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-pipeline-views-and-search*
*Context gathered: 2026-02-12*
