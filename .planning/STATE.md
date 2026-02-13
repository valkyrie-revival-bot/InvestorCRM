# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning.

**Current focus:** Phase 7 - Google Workspace Integration

## Current Position

Phase: 7 of 10 (Google Workspace Integration)
Plan: 1 of 4
Status: In progress
Last activity: 2026-02-13 — Completed 07-01-PLAN.md (Google Workspace foundation: OAuth tokens, Drive/Gmail/Calendar tables, client factory, retry wrapper)

Progress: [████████░░] 83%

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 17 min
- Total execution time: 6.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-environment | 3 | 29 min | 10 min |
| 02-authentication-security | 4 | 8 min | 2 min |
| 03-data-model-and-core-crud | 5 | 38 min | 8 min |
| 04-pipeline-views-and-search | 3 | 7 min | 2.3 min |
| 04.5-contact-intelligence | 3 | 68 min | 23 min |
| 05-stage-discipline-workflow | 3 | 146 min | 49 min |
| 06-activity-strategy-management | 2 | 13 min | 6.5 min |
| 07-google-workspace-integration | 1 | 101 min | 101 min |

**Recent Trend:**
- Last 5 plans: 05-03 (142min), 06-01 (2min), 06-02 (11min), 07-01 (101min)
- Trend: Phase 7 foundation with human checkpoint for SQL migrations - includes external service integration setup

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Focus investor view for v1, defer M&A targets — Core use case, existing data structure, Friday demo focus
- Use Supabase (not Google Sheets) as data store — Team familiarity with modern stack, meets scalability requirements
- BDR agent as chat interface (not voice) — Faster implementation, demonstrates AI capability effectively
- Demonstrate advanced features vs fully building — Meeting intelligence and relationship graph shown in demo, full polish post-Friday
- Aggressive parallel development with AI agents — Leverage AI's ability to work 24/7 with unlimited parallelization to meet 2-day timeline

**From 01-01:**
- Tailwind v4 CSS-first with @theme inline and OKLCH colors — Better color accuracy, modern CSS pattern
- shadcn/ui New York style with Zinc base — Professional appearance for business CRM
- tw-animate-css for Tailwind v4 — Replaces deprecated tailwindcss-animate

**From 01-02:**
- Use getUser() not getSession() in middleware — Forces session refresh, prevents stale auth state
- Dark theme as default (Valkyrie aesthetic) — Authoritative, professional appearance for investor CRM
- Async cookies() for Next.js 16 — Required for server client compatibility

**From 01-03:**
- Vercel deployment deferred as optional — Development server sufficient for now, can deploy when needed
- Visual verification approved — Dark theme, login page, dashboard all display correctly
- Checkpoint-driven verification workflow — User approval gate for UI quality before proceeding

**From 02-01:**
- Use Supabase Auth Hooks for RBAC — Stateless role checking via JWT custom claims, no DB query per request
- Three-tier audit logging — Auth logs (built-in), supa_audit (data changes), app_audit_log (business events)
- Default new users to 'member' role — Fail-safe least privilege, admins explicitly grant admin role
- RLS helper functions for consistency — is_admin() and is_authenticated() reused across all table policies

**From 02-02:**
- Redirect-based OAuth flow (not popup) — Security best practices, avoids popup blockers and cross-origin issues
- Open redirect protection in callback — Validate 'next' parameter starts with '/', default to /dashboard if invalid
- Suspense boundary for useSearchParams — Next.js 16 requirement for static prerendering with search params
- Public route pattern in middleware — Explicit public routes (login, callback, static), protect everything else by default

**From 02-03:**
- AuthProvider uses onAuthStateChange for reactive updates — Consistent auth state across all client components, syncs across tabs
- useRole decodes JWT on client side — Safe after middleware validation, no additional server round-trip
- SessionExpiryModal uses wasAuthenticated flag — Prevents flash on initial load, only shows on genuine expiry
- RoleGuard returns null during loading — Prevents UI flash of restricted content
- Server auth helpers use getSession() to decode JWT — getUser() already validated in middleware, getSession() sufficient for claims
- logAuditEvent auto-fills user context — Automatically gets current user and fills user_id/user_email

**From 02-04:**
- Auth hook requires security definer — Custom access token hook needs elevated privileges to query user_roles table
- RLS policies must use JWT claims, not table queries — Checking user_roles in RLS policy creates infinite recursion, use is_admin() helper instead
- Admin client for server-side user queries — User management page needs service role client to query auth.users table
- Audit log UI deferred — Database foundation complete (tables, triggers, RLS), viewer UI can be built when needed

**From 03-01:**
- Stage field as text (not enum) — Stages may evolve over time, text provides flexibility without schema migrations
- Permissive UPDATE RLS policies using (true) — Required for soft delete operations to work (avoid RLS blocking UPDATE to set deleted_at)
- ON DELETE RESTRICT for foreign keys — Enforces soft delete pattern at database level, prevents accidental hard deletes
- Activities are immutable audit trail — No updated_at, deleted_at, or UPDATE/DELETE policies on activities table
- Partial index for primary contacts — WHERE is_primary = true reduces index size and improves lookup performance

**From 03-02:**
- Single-field updates prevent race conditions — updateInvestorField updates only specified field, not entire record
- Admin client required for restore operations — RLS SELECT policy filters deleted records, service role bypasses
- No revalidatePath in updateInvestorField — Inline edits should not trigger full page reload
- Primary contact flag handling — createContact sets all other contacts to is_primary=false if new contact is primary
- Activity logging on investor for contact changes — Maintains investor-centric audit trail

**From 03-03:**
- Navigation links use plain <a> tags (not Link component) — Server component layout cannot use usePathname for active state, Phase 4 will add client wrapper
- Native <select> for stage dropdown — Faster implementation than shadcn/ui Select, easy to upgrade later
- Stage badge colors use opacity-based variants — Dark theme compatibility with /20 bg opacity, /300 text
- Quick create redirects to detail page immediately — Only required fields in modal, full form on detail page reduces friction

**From 03-04:**
- Each InlineEditField manages own state — Prevents one field's validation from blocking another, no shared form context
- Auto-save on blur for text/number/date/textarea — Notion/Linear pattern, immediate save for boolean/select
- Currency formatting for est_value — Display as "$1M", edit as number using Intl.NumberFormat
- All sections default to open — Friday demo needs to show all data at a glance
- Contact list inline form (not modal) — Simplicity for Phase 3, full editing deferred to Phase 6

**From 03-05:**
- Sonner toast library for professional notifications — Clean API, action button support, dark theme compatible
- 10-second undo window for delete — Industry standard duration (Gmail pattern), balances usability with UX
- Migration uses service role client — Admin operations need elevated privileges to bypass RLS
- Duplicate detection by firm_name — Makes migration idempotent, safe to run multiple times
- Contact creation from Primary Contact column — Preserves primary contact data from Excel during migration
- Best-effort validation with sensible defaults — Import existing data even if imperfect, better than losing data

**From 04-01:**
- Use useTransition for search (not debouncing) — Instant input updates, non-blocking filtering via React's built-in mechanism
- Filter persistence via shared state in PipelineViewSwitcher — Search and filters persist across tab switches
- Parent component handles filtering, child handles sorting — Clear separation of concerns between PipelineViewSwitcher and InvestorListTable
- Defer activity description search — Would require server-side endpoint or memory-intensive pre-loading, limited to investor table fields for Phase 4

**From 04-03:**
- Server-side activity fetching alongside investor data — Fast for <100 records, no need for pagination yet
- Client-side filtering for activity types — No backend queries for filter changes, activities array small enough (<50) for instant filtering
- Relative time formatting for better UX — formatRelativeTime helper shows "Just now", "5m ago", "Yesterday" instead of absolute timestamps
- Field change metadata display in monospace — Field update activities show "field: old value → new value" for clarity
- Timeline dots use ring-2 ring-border — Dark theme compatible, not hardcoded colors

**From 04-02:**
- Use @hello-pangea/dnd over react-beautiful-dnd — react-beautiful-dnd is deprecated, hello-pangea/dnd is actively maintained React 18 compatible fork
- Memoize KanbanCard with custom comparison — Prevent unnecessary re-renders during drag operations, better performance with large pipelines
- Optimistic update with error rollback — Immediate UI feedback for drag operations, revert on server error for graceful error handling
- Re-sync columns on investors prop change — Parent component filters investors, kanban must reflect changes so search/filters work across views
- router.refresh() after successful drag — Server state and client state must stay in sync, table view shows correct stage after drag-and-drop

**From 04.5-01:**
- Use pg_trgm for fuzzy matching (not Fuse.js on investors table yet) — Investors <100 records, no need for DB denormalization. pg_trgm for linkedin_contacts which will have 1000s
- Track team member ownership at contact level — Same LinkedIn connection may exist in multiple networks, unique constraint on (linkedin_url, team_member_name)
- Text CHECK constraint for relationship_type (not PostgreSQL enum) — Flexibility to add new types without schema migration, aligns with stage field pattern
- Path strength numeric(3,2) from 0.00 to 1.00 — Standardized scoring for ranking warm intro paths (works_at=1.0, knows_decision_maker=0.8, etc.)
- LinkedIn CSV date transformation in Zod — Transform "10 Feb 2026" to "2026-02-10" at validation layer for database consistency

**From 04.5-02:**
- Batch insert pattern: 500 rows per batch for large imports — Jackson has 19K contacts, avoids Next.js Server Action payload limits
- Upsert strategy via onConflict on (linkedin_url, team_member_name) — Handles duplicate imports gracefully, updates existing records
- Company normalization removes legal suffixes — "Sequoia Capital LLC" → "sequoia" matches "Sequoia Capital" in investors table
- CSV preamble handling via header line scanning — Scans for "First Name," instead of hardcoded line number, works with all LinkedIn export variations
- Import stats via manual grouping — Supabase doesn't expose native GROUP BY, fetch all and group in app layer (acceptable for <100K rows)

**From 04.5-03:**
- Fuse.js threshold 0.3 for company matching — Balances precision (avoiding false matches) with recall (catching variations like "Goldman Sachs" vs "Goldman Sachs Group")
- Base path strengths by relationship type — works_at=1.0, former_colleague=0.7, knows_decision_maker=0.6, industry_overlap=0.3, geographic_proximity=0.2
- Recency multiplier for path strength — Recent connections (<30 days) boosted 1.2x, old connections (>365 days) reduced to 0.8x
- Strength classification thresholds — Strong >= 0.7, medium >= 0.4, weak < 0.4
- Auto-trigger relationship detection on import — Runs after CSV import completes, silent failure doesn't block import

**From 05-01:**
- Exit criteria as checklist items (not database fields) — More flexible without schema migrations, clearer user intent, simpler validation UX
- Terminal stages allow re-engagement — Lost/Passed/Delayed deals can move back to active stages, reflects fundraising reality
- Stalled status computed (not persisted) — Function calculates on-the-fly from last_action_date, allows threshold changes without migration
- Stage entry date tracked via database trigger — PostgreSQL BEFORE UPDATE trigger guarantees atomic updates, can't be bypassed by bugs

**From 05-02:**
- Server action validates transitions and criteria — All validation logic in server action (security boundary), client components react to validation results
- Exit checklist UI with strikethrough feedback — Checked items show strikethrough + opacity, clear visual progress toward completion
- Override requires 10-char reason plus confirmation — Forces real reason (not "ok"), confirmation checkbox adds deliberate friction, reasonable barrier
- Activity logging automatic in server action — Guaranteed logging for every stage change, context-aware metadata (override/checklist/no-criteria)

**From 05-03:**
- Kanban validation with optimistic update — Apply visual update immediately on drag, show validation dialog after card lands (instant feedback, revertable)
- Revert optimistic on dialog cancel — Re-sync columns from investors prop when user cancels, simplest and most reliable approach
- Computed stalled on page load — Compute stalled status for all investors in page component, makes filter work without PipelineViewSwitcher changes
- Days in stage visual indicator — Show "Xd in stage" on every kanban card, orange if stalled, provides context for stalled determination

**From 06-01:**
- USER_ACTIVITY_TYPES separates user activities from system — User-creatable types (note, call, email, meeting) vs system types (stage_change, field_update), prevents manual creation of system activities
- Toggle button UI for enum selection — Faster interaction than dropdown, selected gets bg-primary, others get bg-muted
- Optional next action embedded in activity modal — Pre-fills with current values, reduces context switching between logging activity and setting next step
- set_next_action must be boolean (not optional) — react-hook-form zodResolver requires exact type match, form provides default in defaultValues instead of schema

**From 06-02:**
- BEFORE UPDATE trigger for auto-archiving — Trigger on investors table automatically moves old current_strategy to last_strategy fields when current_strategy_notes changes
- Two-tier archiving strategy — last_strategy fields for immediate reference (no query), strategy_history table for complete audit trail
- IS DISTINCT FROM for NULL handling — Standard != doesn't handle NULLs correctly, IS DISTINCT FROM treats NULL as distinct value
- Empty string check in trigger — Only archive if old value had content (prevents archiving blank notes)
- SECURITY DEFINER function — Ensures trigger has permission to write to history table through RLS
- Strategy Review dialog pattern — Focused read-only view for strategic thinking, separate from inline editing
- StrategyHistoryViewer lazy loading — Shows last strategy immediately from props, "Load full history" fetches on demand

**From 07-01:**
- Service-role-only access for google_oauth_tokens table — Refresh tokens never exposed to client, REVOKE ALL from public/anon/authenticated, GRANT ALL to service_role only
- RLS policies for link tables with investor soft-delete check — Drive/email/calendar links visible only if parent investor not soft-deleted
- drive.file scope (not drive.readonly.metadata) — Non-sensitive scope, user explicitly selects files via Picker
- Retry only 429/503 errors with exponential backoff — Rate limits benefit from backoff, other errors fail fast
- OAuth2Client token refresh listener — Automatically persist refreshed access tokens via event handler
- State parameter for redirect URL — Preserves user's intended destination after OAuth flow

### Pending Todos

None yet.

### Blockers/Concerns

**Timeline Risk:** 2-day deadline (demo Friday Feb 13, 2026 at 10am ET) requires ruthless prioritization. Phase 10 (Polish) must receive 20-25% of total timeline to meet investor-grade quality standard.

**Parallelization Opportunity:** Phases 7 (Google Workspace) and 8 (Real-time Collaboration) can be developed in parallel with Phases 5-6 if multiple AI agents are orchestrated.

**Security Controls:** OAuth token management (Phase 2) and AI prompt injection defense (Phase 9) must be built correctly from start — cannot be retrofitted after security incident.

**Manual Migration Required (04.5-01):** LinkedIn contact intelligence migrations (016-linkedin-contacts.sql, 017-investor-relationships.sql) must be executed manually in Supabase SQL Editor before CSV import can proceed. Programmatic execution not possible without postgres credentials. Follows established project pattern (migrations 001-011 all manual).

**Manual Migration Completed (05-03):** Stage entry date migration (018-stage-entry-date-trigger.sql) was executed by user in Supabase SQL Editor. Phase 5 complete - stage discipline workflow fully operational.

**Manual Migration Completed (06-02):** Strategy history migration (019-strategy-history.sql) executed by user in Supabase SQL Editor. Creates strategy_history table and BEFORE UPDATE trigger for automatic archiving. Trigger verified working - strategy auto-archives when current_strategy_notes updated.

**Manual Migration Completed (07-01):** Google Workspace migrations (020-023) executed by user in Supabase SQL Editor. Creates google_oauth_tokens (service-role-only), drive_links, email_logs, and calendar_events tables with RLS policies. Foundation ready for Drive/Gmail/Calendar integrations.

## Session Continuity

Last session: 2026-02-13 04:32 UTC
Stopped at: Completed 07-01-PLAN.md (Google Workspace foundation, 2 commits + user migrations, 101min)
Resume file: None
Next: Plan 07-02 (Drive Picker integration) - /gsd:plan-phase 7 or continue Phase 7 implementation
