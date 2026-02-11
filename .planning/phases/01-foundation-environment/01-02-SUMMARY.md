---
phase: 01-foundation-environment
plan: 02
subsystem: infra
tags: [supabase, auth, middleware, environment, route-groups, theme]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Next.js 16 project with dependencies installed"
provides:
  - Supabase client utilities (browser, server, middleware)
  - Auth middleware with session refresh and route protection
  - Environment variable structure (.env.local, .env.example)
  - App Router route groups ((auth), (dashboard))
  - ThemeProvider with dark mode default
affects: [02-database-schema, all-phases]

# Tech tracking
tech-stack:
  added:
    - "@supabase/ssr client patterns"
    - "next-themes ThemeProvider"
  patterns:
    - Server/browser Supabase client separation
    - Middleware-based auth session refresh
    - Environment variable structure (NEXT_PUBLIC_ prefix pattern)
    - App Router route groups for auth separation
    - Dark mode theme with suppressHydrationWarning

key-files:
  created:
    - lib/supabase/client.ts
    - lib/supabase/server.ts
    - lib/supabase/middleware.ts
    - middleware.ts
    - .env.local
    - .env.example
    - components/providers/theme-provider.tsx
    - app/(auth)/login/page.tsx
    - app/(dashboard)/layout.tsx
    - app/(dashboard)/page.tsx
  modified:
    - app/layout.tsx
    - app/page.tsx
    - .gitignore

key-decisions:
  - "Used async cookies() for Next.js 16 compatibility in server client"
  - "Used getUser() not getSession() in middleware to force session refresh"
  - "Set dark theme as default (defaultTheme='dark') for authoritative aesthetic"
  - "Created placeholder login page (Google OAuth integration in Phase 2)"
  - "Updated .gitignore to allow .env.example while blocking .env*"

patterns-established:
  - "Browser client: lib/supabase/client.ts for Client Components"
  - "Server client: lib/supabase/server.ts with async cookie handling"
  - "Middleware: Always use getUser() not getSession() for auth checks"
  - "Route groups: (auth) for public, (dashboard) for protected"
  - "Environment vars: NEXT_PUBLIC_ for browser-exposed, plain for server-only"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 01 Plan 02: Supabase Configuration & Auth Infrastructure Summary

**Supabase client utilities (server/browser/middleware), auth middleware with session refresh, environment variable structure, route groups, and theme provider with dark mode default**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T17:20:45Z
- **Completed:** 2026-02-11T17:23:34Z
- **Tasks:** 2
- **Files created:** 13
- **Files modified:** 3

## Accomplishments
- Supabase browser client for Client Components (lib/supabase/client.ts)
- Supabase server client with async cookie handling for Next.js 16 (lib/supabase/server.ts)
- Middleware helper with getUser() for proper session refresh (lib/supabase/middleware.ts)
- Root middleware protecting /dashboard routes (middleware.ts)
- Environment variable structure (.env.local with placeholders, .env.example documented)
- ThemeProvider with dark mode default and suppressHydrationWarning
- Route groups: (auth) for login, (dashboard) for protected routes
- Login page with Google sign-in placeholder
- Dashboard home with investor pipeline stat cards (Total Investors, Active Conversations, Next Actions Due)
- Root page redirects to /dashboard
- TypeScript compiles without errors, Next.js build successful

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase client utilities and auth middleware** - `7bad037` (feat)
2. **Task 2: Create route groups, theme provider, and project structure** - `256275a` (feat)

## Files Created/Modified

### Task 1: Supabase client utilities and auth middleware
**Created:**
- `lib/supabase/client.ts` - Browser client with createBrowserClient
- `lib/supabase/server.ts` - Server client with async cookies() for Next.js 16
- `lib/supabase/middleware.ts` - Middleware helper using getUser() for session refresh
- `middleware.ts` - Root middleware protecting /dashboard routes
- `.env.local` - Environment variables with placeholder values (gitignored)
- `.env.example` - Documented environment variables (committed)

**Modified:**
- `.gitignore` - Added !.env.example to allow committing template while blocking .env*

### Task 2: Route groups, theme provider, and dashboard structure
**Created:**
- `components/providers/theme-provider.tsx` - ThemeProvider Client Component with next-themes
- `app/(auth)/login/page.tsx` - Login page with Google sign-in button placeholder
- `app/(dashboard)/layout.tsx` - Dashboard layout with header
- `app/(dashboard)/page.tsx` - Dashboard home with stat cards (0 investors, 0 conversations, 0 next actions)

**Modified:**
- `app/layout.tsx` - Added ThemeProvider wrapper, updated metadata, added suppressHydrationWarning
- `app/page.tsx` - Changed from static home to redirect("/dashboard")

## Decisions Made

**1. Used getUser() not getSession() in middleware**
- Rationale: getSession() reads from cookie without contacting Supabase Auth server, so it doesn't refresh expired sessions. getUser() always contacts the server and returns fresh session state. This is critical for security.

**2. Async cookies() in server client**
- Rationale: Next.js 16 changed cookies() to return a Promise. Must use `await cookies()` to avoid runtime errors.

**3. Dark theme as default**
- Rationale: Valkyrie's brand aesthetic is dark and authoritative. Setting `defaultTheme="dark"` matches the investor-grade professional appearance.

**4. suppressHydrationWarning on html tag**
- Rationale: next-themes manipulates the html element during hydration to apply theme class before React hydrates. This causes a hydration mismatch warning without suppressHydrationWarning.

**5. Placeholder login page (no OAuth implementation)**
- Rationale: Google OAuth integration happens in Phase 2 (Database Schema & Auth). This phase only sets up the infrastructure and UI structure.

**6. Allow .env.example in .gitignore**
- Rationale: Default Next.js .gitignore blocks all .env* files. We need to commit .env.example as documentation while keeping .env.local secret. Added !.env.example exception.

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Fixed .gitignore to allow .env.example**
- **Found during:** Task 1 (git add .env.example failed)
- **Issue:** Default .gitignore blocks all .env* files, including .env.example which needs to be committed as documentation
- **Fix:** Added `!.env.example` to .gitignore to allow committing template
- **Files modified:** .gitignore
- **Verification:** git add .env.example succeeded after fix
- **Committed in:** 7bad037 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical configuration)
**Impact on plan:** No scope change, just allowed .env.example to be committed per standard practice.

## Issues Encountered

**gitignore blocking .env.example**
- Problem: Default Next.js .gitignore uses `.env*` pattern which blocks .env.example
- Resolution: Added `!.env.example` exception to allow committing template
- Lesson: When .gitignore uses wildcards, explicit exceptions may be needed for template files

## User Setup Required

**Supabase project credentials needed for Phase 2:**
1. Create Supabase project at https://supabase.com/dashboard
2. Get credentials from: Project Settings -> API
   - NEXT_PUBLIC_SUPABASE_URL (Project URL)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY (anon/public key)
   - SUPABASE_SERVICE_ROLE_KEY (service_role key - keep secret!)
3. Update `.env.local` with real values

**Anthropic API key needed for Phase 9 (BDR Agent):**
1. Get API key from: https://console.anthropic.com/settings/keys
2. Update ANTHROPIC_API_KEY in `.env.local`

**Google OAuth credentials needed for Phase 2:**
- Will be configured when implementing Google Workspace auth
- Documented in .env.example for reference

## Next Phase Readiness

**Ready for Phase 01 Plan 03 (if exists):**
- Supabase infrastructure complete
- Auth middleware protecting routes
- Route groups established

**Ready for Phase 02 (Database Schema & Auth):**
- Supabase clients ready to use
- Middleware protecting /dashboard routes
- Environment variables structured
- Login page ready for OAuth implementation

**Ready for all UI development phases:**
- ThemeProvider with dark mode
- Dashboard layout structure
- Route groups separating auth and protected routes

**No blockers.** Auth infrastructure is solid. Database schema and Google OAuth can proceed in Phase 2.

---
*Phase: 01-foundation-environment*
*Completed: 2026-02-11*
