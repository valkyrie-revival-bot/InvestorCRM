# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning.

**Current focus:** Phase 3 - Data Model & Core CRUD

## Current Position

Phase: 3 of 10 (Data Model & Core CRUD)
Plan: 5 of 5 in current phase
Status: Phase complete
Last activity: 2026-02-12 — Completed 03-05-PLAN.md (Delete with Undo & Excel Migration)

Progress: [█████░░░░░] 52%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 6 min
- Total execution time: 1.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-environment | 3 | 29 min | 10 min |
| 02-authentication-security | 4 | 8 min | 2 min |
| 03-data-model-and-core-crud | 5 | 38 min | 8 min |

**Recent Trend:**
- Last 5 plans: 03-02 (3min), 03-03 (3min), 03-04 (3min), 03-05 (27min)
- Trend: Phase 3 complete - Plan 05 took longer due to Excel migration complexity and checkpoint verification

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

### Pending Todos

None yet.

### Blockers/Concerns

**Timeline Risk:** 2-day deadline (demo Friday Feb 13, 2026 at 10am ET) requires ruthless prioritization. Phase 10 (Polish) must receive 20-25% of total timeline to meet investor-grade quality standard.

**Parallelization Opportunity:** Phases 7 (Google Workspace) and 8 (Real-time Collaboration) can be developed in parallel with Phases 5-6 if multiple AI agents are orchestrated.

**Security Controls:** OAuth token management (Phase 2) and AI prompt injection defense (Phase 9) must be built correctly from start — cannot be retrofitted after security incident.

## Session Continuity

Last session: 2026-02-12 05:26 UTC
Stopped at: Completed 03-05-PLAN.md (Delete with Undo & Excel Migration)
Resume file: None
Next: Phase 3 complete - Move to Phase 4 (Dashboard & Views) for pipeline visualization and filtering
