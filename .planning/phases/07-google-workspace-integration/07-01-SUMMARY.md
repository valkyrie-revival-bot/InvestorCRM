---
phase: 07-google-workspace-integration
plan: 01
subsystem: api
tags: [google, oauth, googleapis, drive, gmail, calendar, retry, exponential-backoff]

# Dependency graph
requires:
  - phase: 02-authentication-security
    provides: Supabase auth helpers (createClient, createAdminClient) and RLS pattern
  - phase: 03-data-model-and-core-crud
    provides: investors table structure and foreign key pattern
provides:
  - Google OAuth token storage with service-role-only access pattern
  - Database tables for Drive links, email logs, and calendar events with RLS
  - OAuth2Client factory with auto-refresh and token persistence
  - Exponential backoff retry wrapper for Google API rate limits
  - OAuth callback route for token exchange
affects: [07-02-drive-picker, 07-03-gmail-logger, 07-04-calendar-sync]

# Tech tracking
tech-stack:
  added: [googleapis, google-auth-library]
  patterns:
    - "Service-role-only token storage (no RLS policies on sensitive tables)"
    - "OAuth2Client token refresh event listener for automatic persistence"
    - "Exponential backoff with jitter for API retry"
    - "State parameter for post-OAuth redirect navigation"

key-files:
  created:
    - lib/database/migrations/020-google-oauth-tokens.sql
    - lib/database/migrations/021-drive-links.sql
    - lib/database/migrations/022-email-logs.sql
    - lib/database/migrations/023-calendar-events.sql
    - types/google.ts
    - lib/google/scopes.ts
    - lib/google/retry.ts
    - lib/google/client.ts
    - app/api/google-oauth/callback/route.ts
  modified:
    - .env.example

key-decisions:
  - "Service-role-only access for google_oauth_tokens table (no RLS) - Refresh tokens must never be exposed to client, only server-side API routes access via admin client"
  - "RLS policies for link tables with investor soft-delete check - Drive/email/calendar links visible only if parent investor not deleted"
  - "drive.file scope (not drive.readonly.metadata) - Non-sensitive scope, user must explicitly select files via Picker"
  - "Retry only 429/503 errors with exponential backoff - Other errors (auth, validation) should fail fast, rate limits benefit from backoff"
  - "OAuth2Client token refresh listener - Automatically persist refreshed access tokens without manual polling"
  - "State parameter for redirect URL - Preserves user's intended destination after OAuth flow"

patterns-established:
  - "Service-role-only pattern: Tables with sensitive data (tokens, credentials) use REVOKE + GRANT service_role, no RLS policies"
  - "Link table pattern: investor_id FK with soft-delete check in RLS, unique constraint on (investor_id, external_id)"
  - "Google client factory: createGoogleClient(userId) loads tokens, returns authenticated OAuth2Client with auto-refresh"
  - "Retry wrapper: withRetry(() => apiCall()) handles rate limiting transparently for all Google API calls"

# Metrics
duration: 101min
completed: 2026-02-13
---

# Phase 7 Plan 1: Google Workspace Integration Foundation Summary

**Google OAuth foundation with service-role token storage, Drive/Gmail/Calendar link tables, authenticated client factory with auto-refresh, and exponential backoff retry for rate limits**

## Performance

- **Duration:** 1h 41min (101 minutes total, with human-action checkpoint)
- **Started:** 2026-02-12T22:51:09-05:00
- **Completed:** 2026-02-13T04:32:00Z
- **Tasks:** 3 (2 auto + 1 human-action checkpoint)
- **Files modified:** 10

## Accomplishments

- Google OAuth token storage with service-role-only access pattern (no client exposure)
- Database schema for Drive file links, Gmail email logs, and Calendar events with RLS
- OAuth2Client factory loads user refresh tokens and auto-persists token refreshes
- Exponential backoff wrapper retries Google API calls on 429/503 errors (max 32s delay)
- OAuth callback route exchanges authorization code for tokens and stores in database

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations and TypeScript types** - `144a2b0` (feat)
2. **Task 2: Google API library modules and OAuth callback route** - `c7d6530` (feat)
3. **Task 3: Execute SQL migrations 020-023** - User completed (human-action checkpoint)

**Plan metadata:** (to be committed after STATE.md update)

## Files Created/Modified

### Database Migrations
- `lib/database/migrations/020-google-oauth-tokens.sql` - Secure token storage table with service-role-only access, no RLS policies, stores refresh/access tokens per user
- `lib/database/migrations/021-drive-links.sql` - Drive file links table with investor FK, unique constraint on (investor_id, file_id), RLS policies
- `lib/database/migrations/022-email-logs.sql` - Gmail message logs table with thread_id for conversation grouping, unique constraint on (investor_id, message_id)
- `lib/database/migrations/023-calendar-events.sql` - Calendar events table with start/end times, attendees array, unique constraint on (investor_id, event_id)

### TypeScript Types
- `types/google.ts` - TypeScript interfaces for all Google Workspace entities (GoogleOAuthToken, DriveLink, EmailLog, CalendarEvent) plus insert types (DriveLinkInsert, EmailLogInsert, CalendarEventInsert) and GoogleWorkspaceStatus

### Google Library Modules
- `lib/google/scopes.ts` - Centralized scope definitions (drive.file, gmail.readonly, calendar.events) with human-readable descriptions for consent UI
- `lib/google/retry.ts` - Exponential backoff wrapper withRetry() with jitter, retries 429/503 errors up to 5 times with max 32s delay
- `lib/google/client.ts` - OAuth2Client factory createGoogleClient() loads tokens from DB, auto-persists refreshed tokens via event listener; getGoogleAuthUrl() generates auth URL with state parameter; hasGoogleTokens() checks if user authorized
- `app/api/google-oauth/callback/route.ts` - OAuth callback GET handler exchanges code for tokens, stores refresh token via admin client, redirects to state URL or /investors

### Configuration
- `.env.example` - Added GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_GOOGLE_API_KEY, NEXT_PUBLIC_GOOGLE_CLIENT_ID with descriptions

## Decisions Made

**Service-role-only access for google_oauth_tokens table (no RLS):** Refresh tokens are highly sensitive credentials that must never be exposed to client code. Table uses REVOKE ALL from public/anon/authenticated and GRANT ALL to service_role only. Server-side routes use createAdminClient() to bypass RLS. This pattern prevents accidental token leakage even if RLS policies misconfigured.

**RLS policies for link tables with investor soft-delete check:** Drive links, email logs, and calendar events use RLS policies that check parent investor not soft-deleted (WHERE investors.deleted_at IS NULL). Prevents orphaned links from appearing in UI after investor deletion. DELETE policies restrict to own links only (via linked_by/logged_by/created_by).

**drive.file scope (not drive.readonly.metadata):** Using minimal Google Drive scope that only accesses user-selected files. Non-sensitive scope doesn't require Google API verification process. User explicitly chooses files via Picker in 07-02, no access to Drive metadata or other files.

**Retry only 429/503 errors with exponential backoff:** Retry logic targets rate limiting (429) and service unavailable (503) errors only. Other errors (auth failures, validation errors, not found) should fail fast. Exponential backoff with jitter (random 0-1000ms) prevents thundering herd. Max delay capped at 32s (2^5 * 1000ms).

**OAuth2Client token refresh listener:** Google Auth Library fires 'tokens' event when access token auto-refreshed. Listener captures new tokens and persists to database via admin client. Eliminates need for manual token polling or refresh logic in application code.

**State parameter for redirect URL:** OAuth flow accepts optional redirectUrl via state parameter (JSON-encoded). After successful token exchange, user redirected to intended destination instead of hardcoded /investors. Improves UX for OAuth triggered from deep links or settings pages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Human-action checkpoint for SQL migrations:** Migrations 020-023 require manual execution in Supabase SQL Editor (project pattern established in Phase 1). User confirmed "migrations done" after executing all 4 migrations. This is expected workflow, not a deviation.

## User Setup Required

**External services require manual configuration.** See [07-USER-SETUP.md](./07-USER-SETUP.md) for:
- Google Cloud Console OAuth 2.0 client setup
- Google Drive API, Gmail API, Calendar API, Picker API enablement
- Environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_GOOGLE_API_KEY, NEXT_PUBLIC_GOOGLE_CLIENT_ID)
- OAuth redirect URI configuration ({NEXT_PUBLIC_URL}/api/google-oauth/callback)
- Authorized JavaScript origin for Picker ({NEXT_PUBLIC_URL})

## Next Phase Readiness

**Ready for 07-02 (Drive Picker):** Database tables created, OAuth flow functional, client factory operational. Drive Picker can use createGoogleClient() to authenticate and store file links in drive_links table.

**Ready for 07-03 (Gmail Logger):** Email logs table created with thread_id for conversation grouping. Gmail API calls can use withRetry() wrapper to handle rate limits gracefully.

**Ready for 07-04 (Calendar Sync):** Calendar events table created with attendees array and time range fields. Calendar API client can be created via createGoogleClient() with auto-refresh.

**Blockers:** None. All three service integrations can proceed in parallel using this foundation.

---
*Phase: 07-google-workspace-integration*
*Completed: 2026-02-13*
