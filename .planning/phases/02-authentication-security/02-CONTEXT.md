# Phase 2: Authentication & Security - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Google Workspace SSO authentication for the team (5 users initially, ability to add more), with session management, role-based access control, and comprehensive audit logging. This phase delivers secure authentication infrastructure - the foundation for all subsequent features.

</domain>

<decisions>
## Implementation Decisions

### Login flow UX
- Branded login page (current placeholder) with both **Prytaneum** and **Valkyrie** logos displayed prominently
- Application title: **"Prytaneum Partners / Valkyrie Revival Fund Investor CRM Powered by VALHROS"**
- Centered card layout with Google sign-in button

### Session behavior
- **Sliding expiration** - sessions extend automatically when user is active (keep users logged in as long as they're using the app)
- **Session expiry UX** - show modal overlay: "Session expired. Sign in to continue" (preserves current page, user can re-auth and continue where they left off)

### Role definitions
- **Team size:** 5 users initially (not 4), with ability to add more users over time
- **Two roles:**
  - **Admin** (initially 3 admins) - Full control: can delete investors, manage users (add/remove, change roles), change system settings (Google Workspace, API keys, audit config)
  - **Member** (initially 2 members) - Can add/edit investor information, run reports, query data, see visualizations and dashboards - **CANNOT delete records**
- **Role assignment:** Any admin can assign roles when adding new team members

### Audit logging scope
- **Comprehensive logging** - log ALL events:
  - Data changes (create, update, delete of investor records)
  - Authentication events (logins, logouts, failed auth attempts)
  - Permission changes (role changes, user additions/removals)
- **Log visibility:** Admins have full access, Members have read-only access (can view but not export or modify logs)
- **Log UI:** Both global audit log page (searchable/filterable) AND per-investor activity history on investor detail pages

### Claude's Discretion
- OAuth flow implementation (redirect vs popup - choose based on security best practices)
- Post-login destination (dashboard vs last visited page - choose based on typical CRM patterns)
- Error message styling and placement
- Session duration (balance security and convenience for small team)
- Multi-tab logout behavior
- Audit log retention period (choose based on compliance standards)

</decisions>

<specifics>
## Specific Ideas

- Brand identity is critical: Both Prytaneum and Valkyrie logos must be visible, full application title displayed
- Valkyrie aesthetic carries through: Dark mode remains default from Phase 1
- Team structure: Partners (admins) + analysts (members) - admins have strategic control, members handle day-to-day pipeline updates

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 02-authentication-security*
*Context gathered: 2026-02-11*
