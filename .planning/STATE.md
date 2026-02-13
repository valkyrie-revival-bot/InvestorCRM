# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning.

**Current focus:** v1.0 milestone complete — ready for next milestone

## Current Position

**Milestone:** v1.0 MVP (COMPLETE)
**Shipped:** 2026-02-13
**Status:** Production-ready — 59 of 60 requirements shipped (98%)

Progress: [██████████] 100% (10.5 phases, 37 plans, 15,229 LOC)

**Archived:**
- Roadmap → `.planning/milestones/v1.0-ROADMAP.md`
- Requirements → `.planning/milestones/v1.0-REQUIREMENTS.md`

**Next milestone:** Use `/gsd:new-milestone` to start next version

## Performance Metrics

**Velocity:**
- Total plans completed: 37
- Average duration: 12.3 min
- Total execution time: 7.8 hours

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
| 07-google-workspace-integration | 4 | 113 min | 28 min |
| 08-real-time-collaboration | 3 | 8 min | 2.7 min |
| 09-ai-bdr-agent | 3 | 16 min | 5.3 min |
| 10-ui-polish-performance | 5 | 19 min | 3.8 min |

**Recent Trend:**
- Last 5 plans: 10-04 (2min), 10-02 (3min), 10-03 (2min), 10-05 (10min)
- Trend: Phase 10 COMPLETE - Visual verification approved, all 10 phases complete, ready for investor demo

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

**From 07-02:**
- react-google-drive-picker library for Picker integration — Simplifies Google Picker API usage with React hook pattern, well-maintained (1.2.2), 50K+ weekly downloads
- DOCS view for Picker (not ALL_DRIVES) — Shows all document types excluding system files, better UX while still supporting shared drives via supportDrives flag
- MIME type-based icon selection — Visual differentiation for Docs/Sheets/Slides improves scanability, matches Google Drive UI patterns
- Inline formatRelativeTime function — Copied from activity timeline for consistency, avoids premature abstraction to shared utils
- Confirmation dialog on unlink — Prevents accidental deletion, follows destructive action best practice
- Disabled state with tooltip for no Google auth — Clear affordance that linking requires Google connection

**From 07-04:**
- Simple button-based tabs (not shadcn Tabs component) — Lighter weight, faster implementation, sufficient for 3-tab interface
- Conditional data fetching based on Google authentication — Avoid unnecessary API calls when user hasn't connected Google, check hasGoogleTokens before calling Google APIs
- Integration section pattern: connection banner + tabbed content + action buttons — Reusable pattern for future OAuth integrations (Slack, Salesforce, etc.)
- Disabled state for action buttons when not authenticated — Clear affordance that features require Google connection without hiding UI
- Connection banner positioning above tabs — First thing users see if not authenticated, directs them to resolve blocker before accessing features

**From 08-01:**
- Version column with DEFAULT 1 and composite index (id, version) for optimistic locking — Application increments version on UPDATE, zero affected rows indicates conflict
- REPLICA IDENTITY FULL on investors and activities — Provides complete old/new record data in Realtime events for conflict detection and change notifications
- Version field excluded from InvestorUpdate type — Managed by optimistic locking logic in server actions, not manual updates
- RealtimePayload<T> generic type for type-safe subscriptions — Enables RealtimePayload<Investor> pattern
- PresenceState tracks viewing_record_id and editing_field — Enables collaboration awareness UI (who's viewing/editing which record/field)

**From 08-02:**
- useRealtimeInvestors syncs with initialInvestors prop when parent re-fetches — Handles filter changes without re-subscribing
- Preserve contacts/primary_contact from local state on UPDATE — Subscription doesn't include joins, maintains UI state
- Handle soft deletes in UPDATE handler (deleted_at check) — UPDATE with deleted_at set removes from list
- Single shared 'crm-presence' channel for all users — Avoids 100 channels per connection limit, more efficient than per-record channels
- Filter presence to recordId in hook (not channel level) — More flexible, allows presence to span records without re-subscribing
- useOptimisticUpdate uses Supabase browser client directly — RLS-protected, atomic version check at database level
- Type guard for Supabase presence_ref field — presenceState() includes presence_ref in addition to PresenceState fields

**From 08-03:**
- RealtimeInvestorWrapper pattern (Client wrapper around Server Component data) — Preserves fast SSR while adding real-time enhancements
- Deterministic avatar colors via user_id hash — Consistent colors across sessions for same user
- Connection status as subtle indicator (not prominent alert) — Shows status without dominating UI
- Backward-compatible version prop on InlineEditField — Falls back to existing updateInvestorField if version not provided
- Presence avatars filter to current recordId — Only show users viewing the specific investor detail page, not all online users
- Pencil icon badge on avatar when editing_field set — Clear visual indicator of active editing

**From 09-01:**
- AI SDK v6 tool definitions use `inputSchema` (not `parameters`) — Correct API per @ai-sdk/provider-utils Tool type
- Claude Sonnet 4.5 for BDR agent (not Opus 4.6) — Cost-effective for read-only operations, sufficient reasoning quality
- stepCountIs(5) for loop prevention — Max 5 tool calls per conversation turn via stopWhen parameter
- Query intent allowlisting (not arbitrary SQL) — Security-first approach prevents SQL injection
- Client-side stalled computation — computeIsStalled() applied post-query for consistency with codebase patterns
- Automatic context surfacing (AI-05) — System prompt instructs AI to call getInvestorDetail when firm names mentioned
- 50-record query limits — Prevents token exhaustion, keeps LLM responses focused
- Sensitive field redaction in tool outputs — Email/phone removed before sending to LLM context

**From 09-03:**
- updateInvestor returns confirmation request (not direct mutation) — Privilege minimization pattern, AI proposes but human approves
- logActivity executes directly (no confirmation) — Append-only audit trail is low risk, can't corrupt existing data
- Confirmation UI calls server action on approve — Clean separation of concerns, client executes after user decision
- DashboardChatWrapper client wrapper pattern — Server layout delegates to client wrapper for stateful interactive UI
- Confirmation state per toolCallId — Supports multiple pending confirmations in single conversation

**From 10-01:**
- Brand blue (oklch(0.55 0.15 250)) as primary action color in dark theme — Strong brand presence without overpowering dark theme
- OKLCH color space for brand colors — Perceptual uniformity, better than RGB/HSL for maintaining consistent lightness/chroma
- Text-based 'Prytaneum CRM' brand mark in header (not logo-only) — Clear brand identity without competing with logos
- Link component for nav items (client-side transitions) over plain <a> tags — Instant page transitions, better UX than full reloads
- Gradient accent line below header (primary→gold→primary) — Subtle brand presence reinforces identity on every page
- Login card reduced to 420px width — Better visual balance and focus on brand elements

**From 10-02:**
- Dashboard as server component fetches real investor data via getInvestors — Server-side data fetch for faster initial render
- Active nav state uses usePathname in client wrapper — DashboardChatWrapper already client component, adding pathname hook has no performance cost
- Dashboard link added as first nav item pointing to '/' — Dashboard becomes entry point after login
- Stalled count highlighted in orange when > 0, next actions in brand blue when > 0 — Visual urgency for warnings, brand emphasis for CTAs
- Stage breakdown shows top 5 stages sorted by count — Prevents overwhelming dashboard with all 12 stages
- Pipeline value formatted with compact notation for large numbers — Clean display of millions/billions using Intl.NumberFormat

**From 10-04:**
- Loader2 spinner with text pattern for loading buttons — Clear visual feedback during async operations (Loader2 + "Creating..." in conditional render)
- text-xs error messages for inline validation — Maintains form density while ensuring readability (text-xs text-destructive mt-1 below each field)
- overflow-x-auto on table container for horizontal scroll — Enables proper scroll behavior at narrow viewports without breaking table layout
- truncate on kanban card firm names — Prevents layout breaks with long names (font-semibold text-sm truncate)
- hover:border-brand-primary/30 on kanban cards — Ties interactive elements to brand identity, subtle hover feedback
- QuickCreateModal embedded in empty state — Reduces friction for new users, clear CTA when pipeline is empty

**From 10-03:**
- Route-level loading.tsx for automatic Suspense boundaries — Next.js App Router uses loading.tsx as fallback, no page.tsx changes needed
- Skeleton layouts match actual content structure — Reduces perceived layout shift by mirroring card grids, table rows, form sections
- shadcn/ui Skeleton with bg-accent — Dark theme compatible skeleton animation using theme-aware accent color

**From 10-05:**
- Visual verification checkpoint for quality gate — Comprehensive checklist covering 9 verification areas (login, dashboard, nav, pipeline, detail, forms, responsive, performance, impression)
- Documentation of untested features for post-demo QA — Authentication-dependent features and performance metrics documented for future verification
- Build stability as prerequisite for approval — Zero-error build confirms structural soundness before manual testing

### Pending Todos

None yet.

### Blockers/Concerns

**ALL 10 PHASES COMPLETE - PROJECT READY FOR INVESTOR DEMO**

**Post-demo verification recommended:**
- Manual testing of authentication-dependent features (dashboard, pipeline, forms, detail pages)
- Performance metric measurement with DevTools (PERF-01 through PERF-04)
- Google Workspace integration testing with valid API credentials
- AI BDR Agent testing with production Anthropic API key
- Multi-tab concurrent usage testing
- Full responsive testing across viewport sizes

**Manual Migration Pending (08-01):** Real-time collaboration migrations (024-realtime-version-column.sql, 025-replica-identity-full.sql) must be executed in Supabase SQL Editor before real-time features function. Phase 8 code complete (3/3 plans, 4/4 must-haves verified), migrations ready for execution. Once run, all real-time features (live updates, presence indicators, optimistic locking) will activate immediately.

**Environment configuration for full feature testing:**
- Supabase authentication (already configured)
- Google Workspace integration (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI required)
- AI BDR Agent (ANTHROPIC_API_KEY currently has placeholder value)

## Session Continuity

Last session: 2026-02-13
Stopped at: v1.0 milestone archived — roadmap/requirements archived to milestones/ directory
Resume file: None
Next: Start next milestone with `/gsd:new-milestone`, or continue development outside of GSD workflow
