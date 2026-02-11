# Phase 2: Authentication & Security - Research

**Researched:** 2026-02-11
**Domain:** Google Workspace OAuth + Supabase Auth + RBAC + Audit Logging
**Confidence:** HIGH

## Summary

Phase 2 implements production-grade authentication and security infrastructure using Supabase Auth with Google Workspace OAuth, role-based access control (RBAC), comprehensive audit logging, and session management. The research focused on the specific requirements: Google OAuth for organization accounts, sliding session expiration, two-role RBAC (Admin/Member), and comprehensive audit logging for all authentication and data events.

The standard approach for Supabase authentication in Next.js 16 (2026) is:
1. Configure Google OAuth provider in Supabase with domain restrictions for workspace accounts
2. Implement PKCE OAuth flow with redirect-based authentication (security best practice)
3. Use Supabase Auth Hooks to add custom claims (user roles) to JWT tokens
4. Integrate role claims with Row Level Security (RLS) policies for database-level authorization
5. Implement automatic session refresh in middleware (sliding expiration via token refresh)
6. Use `supa_audit` extension for database change tracking + auth audit logs for authentication events
7. Create custom database triggers for comprehensive audit logging of all relevant events

Key findings: Supabase's built-in auth audit logs automatically capture all authentication events. The `supa_audit` PostgreSQL extension provides generic table auditing for data changes. Auth Hooks (introduced 2024) are the modern approach to RBAC via custom JWT claims. Middleware must use `getUser()` not `getSession()` for security. Google Workspace OAuth requires proper redirect URI configuration and optional domain restrictions. Session "sliding expiration" is implemented via automatic token refresh (built into Supabase), not manual session extension.

**Primary recommendation:** Use Supabase's built-in Auth Hooks for RBAC with JWT custom claims, `supa_audit` extension for data audit logging, and auth audit logs for authentication tracking. Implement session expiry UX using `onAuthStateChange` listener to detect session loss and show re-auth modal. Domain restriction for workspace accounts is configured in Google Cloud Console OAuth settings, not Supabase.

## Standard Stack

The established libraries/tools for authentication and security with Supabase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | latest | Supabase SSR client | Official package for Next.js SSR auth, handles cookie-based sessions |
| @supabase/supabase-js | latest | Supabase JavaScript client | Core client library for auth operations (signInWithOAuth, getUser) |
| Next.js middleware | built-in | Session refresh proxy | Required for token refresh, prevents session expiry in Server Components |
| Supabase Auth Hooks | built-in | Custom JWT claims | Official RBAC solution, adds user roles to access tokens (2024+) |
| supa_audit extension | built-in | Database audit logging | Official Supabase PostgreSQL extension for table change tracking |
| PostgreSQL triggers | built-in | Custom audit logic | Standard approach for complex audit requirements |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jwt-decode | ^4.0.0 | JWT parsing | Client-side role extraction from access tokens |
| React Context | built-in | Auth state sharing | Share user/session across Client Components |
| Google Cloud Console | N/A | OAuth configuration | Required for Google OAuth setup, domain restrictions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth Hooks | Row-based role table only | Auth Hooks add roles to JWT (stateless), row-based requires DB query per request (slower) |
| supa_audit | PGAudit extension | PGAudit logs to files (harder to query), supa_audit logs to tables (SQL queries) |
| Redirect flow | Popup OAuth flow | Redirect more secure (prevents popup blockers, better UX), popup can be blocked by browsers |
| Built-in auth audit logs | Custom auth event tracking | Built-in logs are comprehensive and automatic, custom requires manual event capture |

**Installation:**
```bash
# Core dependencies already installed in Phase 1
# @supabase/ssr and @supabase/supabase-js

# Add JWT decoding for client-side role access
npm install jwt-decode

# Enable supa_audit extension in Supabase SQL Editor
# (Not an npm package - PostgreSQL extension)
```

## Architecture Patterns

### Recommended Project Structure

```
sales-tracking/
├── app/
│   ├── (auth)/                      # Authentication route group
│   │   ├── login/
│   │   │   └── page.tsx             # Branded login page with Google button
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts         # OAuth callback handler (PKCE code exchange)
│   ├── (dashboard)/                 # Protected routes
│   │   ├── layout.tsx               # Auth check + role provider
│   │   ├── audit-logs/
│   │   │   └── page.tsx             # Global audit log page
│   │   ├── settings/
│   │   │   └── users/
│   │   │       └── page.tsx         # User management (admin only)
│   │   └── investors/
│   │       └── [id]/
│   │           └── page.tsx         # Investor detail with activity history
│   └── api/
│       └── auth/
│           └── refresh/
│               └── route.ts         # Manual refresh endpoint (if needed)
├── components/
│   ├── auth/
│   │   ├── session-expiry-modal.tsx # Session expired re-auth modal
│   │   ├── auth-provider.tsx        # Auth state context provider
│   │   └── role-guard.tsx           # Component-level role protection
│   └── audit/
│       └── audit-log-table.tsx      # Audit log display component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # ✓ Already exists from Phase 1
│   │   ├── server.ts                # ✓ Already exists from Phase 1
│   │   ├── middleware.ts            # ✓ Already exists from Phase 1
│   │   └── auth-helpers.ts          # New: Role checking, auth utilities
│   ├── database/
│   │   └── migrations/
│   │       ├── 001_create_user_roles.sql
│   │       ├── 002_create_auth_hook.sql
│   │       ├── 003_enable_supa_audit.sql
│   │       ├── 004_create_rls_policies.sql
│   │       └── 005_create_audit_triggers.sql
│   └── hooks/
│       ├── use-auth.ts              # Auth context hook
│       └── use-role.ts              # Role checking hook
├── middleware.ts                    # ✓ Already exists, enhance for auth
└── types/
    └── auth.ts                      # Role types, user types
```

### Pattern 1: Google OAuth with PKCE Flow (Redirect-based)

**What:** Redirect-based OAuth flow with PKCE (Proof Key for Code Exchange) for security
**When to use:** All Google OAuth implementations (security best practice, required for SSR)

**Example:**
```typescript
// app/(auth)/login/page.tsx
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google
'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',  // Get refresh token from Google
          prompt: 'consent',       // Force consent screen (ensures refresh token)
        },
      },
    });

    if (error) {
      console.error('Login error:', error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[450px]">
        <CardHeader className="text-center">
          {/* Both Prytaneum and Valkyrie logos here */}
          <CardTitle className="text-xl">
            Prytaneum Partners / Valkyrie Revival Fund
            <br />
            Investor CRM Powered by VALHROS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleLogin} className="w-full">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescript
// app/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Exchange code for session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Validate next parameter to prevent open redirect
      const safeNext = next.startsWith('/') ? next : '/dashboard';
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  // Auth failed, redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
```

### Pattern 2: RBAC with Auth Hooks and Custom Claims

**What:** Add user roles to JWT tokens using Supabase Auth Hooks, integrate with RLS
**When to use:** All applications requiring role-based access control

**Database Setup:**
```sql
-- 001_create_user_roles.sql
-- Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

-- Create role enum (Admin, Member)
create type public.app_role as enum ('admin', 'member');

-- User roles table
create table public.user_roles (
  id        bigint generated by default as identity primary key,
  user_id   uuid references auth.users on delete cascade not null,
  role      app_role not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Only admins can manage roles
create policy "Admins can manage user roles"
  on public.user_roles
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- All authenticated users can view roles
create policy "Users can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (true);
```

```sql
-- 002_create_auth_hook.sql
-- Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

-- Auth Hook to add role to JWT
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    -- Fetch user's role (only one role per user in this system)
    select role into user_role
    from public.user_roles
    where user_id = (event->>'user_id')::uuid
    limit 1;

    claims := event->'claims';

    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      -- Default to member if no role assigned
      claims := jsonb_set(claims, '{user_role}', '"member"');
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;

-- Grant execute to supabase_auth_admin
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Revoke from authenticated and public
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

**Client-side Role Access:**
```typescript
// lib/hooks/use-role.ts
// Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';

type AppRole = 'admin' | 'member';

interface JWTPayload {
  user_role?: AppRole;
}

export function useRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getRole() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        const payload = jwtDecode<JWTPayload>(session.access_token);
        setRole(payload.user_role || 'member');
      }

      setLoading(false);
    }

    getRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.access_token) {
          const payload = jwtDecode<JWTPayload>(session.access_token);
          setRole(payload.user_role || 'member');
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
```

### Pattern 3: RLS Policies for Role-Based Data Access

**What:** Database-level authorization using roles from JWT claims
**When to use:** All data tables requiring role-based access control

**Example:**
```sql
-- 004_create_rls_policies.sql
-- Example for investors table

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (auth.jwt() ->> 'user_role')::text = 'admin';
end;
$$ language plpgsql stable security definer;

-- RLS policies for investors table
alter table public.investors enable row level security;

-- All authenticated users can view investors
create policy "All users can view investors"
  on public.investors
  for select
  to authenticated
  using (true);

-- All authenticated users can insert/update investors
create policy "All users can insert investors"
  on public.investors
  for insert
  to authenticated
  with check (true);

create policy "All users can update investors"
  on public.investors
  for update
  to authenticated
  using (true);

-- Only admins can delete investors
create policy "Only admins can delete investors"
  on public.investors
  for delete
  to authenticated
  using (is_admin());
```

### Pattern 4: Comprehensive Audit Logging

**What:** Combine Supabase auth audit logs, supa_audit for data changes, custom triggers for business events
**When to use:** All production applications requiring compliance and security monitoring

**Setup supa_audit:**
```sql
-- 003_enable_supa_audit.sql
-- Source: https://github.com/supabase/supa_audit

-- Install extension
create extension if not exists supa_audit cascade;

-- Enable tracking on investors table
select audit.enable_tracking('public.investors'::regclass);

-- Enable tracking on user_roles table
select audit.enable_tracking('public.user_roles'::regclass);

-- Query audit history for a specific table
-- select * from audit.record_version
-- where table_oid = 'public.investors'::regclass::oid
-- order by ts desc;
```

**Custom Audit Trigger for Business Events:**
```sql
-- 005_create_audit_triggers.sql
-- Custom audit table for application-level events
-- Source: https://supabase.com/docs/guides/database/postgres/triggers

create table if not exists public.app_audit_log (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users,
  user_email text,
  event_type text not null, -- 'role_change', 'settings_update', etc.
  resource_type text,       -- 'user', 'investor', 'settings'
  resource_id text,
  action text not null,     -- 'create', 'update', 'delete'
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,           -- Additional context
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.app_audit_log enable row level security;

-- Admins can view all logs
create policy "Admins can view all audit logs"
  on public.app_audit_log
  for select
  to authenticated
  using (is_admin());

-- Members can view logs (read-only as per requirements)
create policy "Members can view audit logs"
  on public.app_audit_log
  for select
  to authenticated
  using (true);

-- Function to log role changes
create or replace function public.log_role_change()
returns trigger as $$
declare
  actor_email text;
begin
  select email into actor_email from auth.users where id = auth.uid();

  if (TG_OP = 'INSERT') then
    insert into public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, new_data
    ) values (
      auth.uid(), actor_email, 'role_change', 'user',
      NEW.user_id::text, 'assign_role',
      jsonb_build_object('role', NEW.role)
    );
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    insert into public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, old_data, new_data
    ) values (
      auth.uid(), actor_email, 'role_change', 'user',
      NEW.user_id::text, 'change_role',
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
    return NEW;
  elsif (TG_OP = 'DELETE') then
    insert into public.app_audit_log (
      user_id, user_email, event_type, resource_type,
      resource_id, action, old_data
    ) values (
      auth.uid(), actor_email, 'role_change', 'user',
      OLD.user_id::text, 'remove_role',
      jsonb_build_object('role', OLD.role)
    );
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger on user_roles table
create trigger user_roles_audit_trigger
  after insert or update or delete on public.user_roles
  for each row execute function public.log_role_change();
```

### Pattern 5: Session Expiry Detection and Re-Auth Modal

**What:** Detect session expiration and show modal overlay for re-authentication
**When to use:** All applications with session management

**Example:**
```typescript
// components/auth/session-expiry-modal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SessionExpiryModal() {
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setIsExpired(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReAuth = async () => {
    // Store current path to return after re-auth
    const currentPath = window.location.pathname;
    sessionStorage.setItem('returnPath', currentPath);

    // Redirect to login
    router.push('/login');
  };

  return (
    <Dialog open={isExpired} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            Your session has expired. Please sign in again to continue.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleReAuth} className="w-full">
          Sign In to Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 6: Middleware Session Refresh (Sliding Expiration)

**What:** Automatically refresh tokens in middleware (implements sliding expiration behavior)
**When to use:** All Supabase auth implementations (already exists from Phase 1, verify behavior)

**Example:**
```typescript
// lib/supabase/middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // CRITICAL: Use getUser() not getSession() for security
  // This validates the JWT and refreshes if needed (sliding expiration)
  const { data: { user } } = await supabase.auth.getUser();

  // Protect authenticated routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
```

### Anti-Patterns to Avoid

- **Using getSession() instead of getUser() in middleware:** getSession() doesn't validate tokens, getUser() does. Always use getUser() for security.
- **Storing roles in localStorage:** Roles should come from JWT claims, not client-side storage (easily tampered).
- **Not validating redirect URLs in OAuth callback:** Open redirect vulnerability. Always validate the `next` parameter.
- **Hand-rolling session expiry detection:** Use Supabase's `onAuthStateChange` listener, don't poll endpoints.
- **Creating custom JWT tokens:** Use Supabase's auth system and Auth Hooks for custom claims.
- **Logging sensitive data in audit logs:** Don't log passwords, tokens, or PII beyond what's necessary.
- **Using popup-based OAuth flow:** Popup blockers interfere, redirect-based is more reliable.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow with Google | Custom OAuth implementation | Supabase Auth with Google provider | OAuth has security pitfalls (PKCE, state validation, token refresh, CSRF). Supabase handles all edge cases. |
| JWT token refresh logic | Manual token refresh | Supabase auto-refresh in middleware | Token refresh has race conditions, timing issues. Supabase handles refresh window (10s), revocation, security. |
| Role-based access control | Application-layer role checks | Auth Hooks + RLS policies | Database-level authorization is more secure (can't bypass), Auth Hooks add roles to JWT (stateless). |
| Audit logging | Custom logging tables + application code | supa_audit extension + triggers | Generic audit solution handles all CRUD ops, stable record IDs, query optimization. Edge cases are complex. |
| Session expiry UX | Custom timer/polling | onAuthStateChange listener | Supabase broadcasts auth state changes, multi-tab sync via BroadcastChannel, no polling overhead. |
| Google Workspace domain restriction | Application-level email validation | Google OAuth domain restriction | Configure in Google Cloud Console OAuth settings, enforced at OAuth level (can't bypass). |

**Key insight:** Supabase Auth provides enterprise-grade authentication with hooks for customization. The combination of Auth Hooks (JWT claims) + RLS policies + audit extensions covers 95% of auth/security requirements without custom code. Focus implementation effort on business logic, not auth infrastructure.

## Common Pitfalls

### Pitfall 1: Using getSession() Instead of getUser()

**What goes wrong:** Session validation passes in middleware but malicious users can forge session cookies, bypassing authentication.

**Why it happens:** `getSession()` reads from cookies without server-side validation. Cookies can be spoofed by anyone. `getUser()` validates the JWT with Supabase auth server every time.

**How to avoid:**
- Always use `supabase.auth.getUser()` in middleware and Server Components
- Never trust `getSession()` for authorization decisions
- Use `getSession()` only for client-side UX (getting user data already validated elsewhere)
- Phase 1 research explicitly warned about this - verify middleware uses getUser()

**Warning signs:**
- Middleware uses `getSession()` instead of `getUser()`
- Auth protection can be bypassed by manipulating cookies
- Security audit flags session validation issues
- Documentation says "trust getUser, not getSession"

**Sources:**
- [Setting up Server-Side Auth for Next.js - Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase + Next.js Guide… The Real Way - Medium](https://medium.com/@iamqitmeeer/supabase-next-js-guide-the-real-way-01a7f2bd140c)

### Pitfall 2: Auth Hook Permissions Not Set Correctly

**What goes wrong:** Auth Hook function executes for all users or fails silently, roles don't appear in JWT, or unauthorized users can call the function.

**Why it happens:** Auth Hooks must be granted to `supabase_auth_admin` role and revoked from `authenticated`, `anon`, and `public` roles. Incorrect permissions break the hook or create security holes.

**How to avoid:**
- After creating Auth Hook function, always run: `grant execute on function public.custom_access_token_hook to supabase_auth_admin;`
- Then revoke: `revoke execute on function public.custom_access_token_hook from authenticated, anon, public;`
- Test by logging in and decoding JWT to verify custom claims appear
- Configure hook in Supabase Dashboard: Authentication > Hooks > Custom Access Token Hook

**Warning signs:**
- Roles don't appear in decoded JWT tokens
- Auth Hook function not showing in Supabase Dashboard hooks configuration
- Errors in auth logs about permission denied
- Users can execute the hook function directly (security issue)

**Sources:**
- [Custom Claims & Role-based Access Control (RBAC) - Supabase Docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### Pitfall 3: Google OAuth Redirect URI Mismatch

**What goes wrong:** "Redirect URI mismatch" error from Google, users can't complete OAuth flow, works in dev but fails in production.

**Why it happens:** Google requires exact URL matching for redirect URIs. Supabase provides a specific callback URL that must be registered in Google Cloud Console exactly (http vs https, subdomain, trailing slash).

**How to avoid:**
- Get exact callback URL from Supabase Dashboard: Authentication > Providers > Google
- Add to Google Cloud Console: APIs & Services > Credentials > OAuth 2.0 Client IDs > Authorized redirect URIs
- For local development: Add both `http://localhost:54321/auth/v1/callback` (Supabase local) and `http://127.0.0.1:54321/auth/v1/callback`
- For production: Add `https://<project-ref>.supabase.co/auth/v1/callback`
- If using custom domain: Add custom domain callback URL
- Don't add your app's callback route - add Supabase's callback URL

**Warning signs:**
- "Redirect URI mismatch" error page from Google
- OAuth flow redirects to Google but fails on return
- Works in one environment but not another
- Callback URL in error message doesn't match Google Cloud Console list

**Sources:**
- [Login with Google - Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js with Supabase Google Login: Step-by-Step Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501)

### Pitfall 4: Google Workspace Domain Restriction Not Enforced

**What goes wrong:** Any Google account (gmail.com) can sign in, not just organization workspace accounts (@company.com).

**Why it happens:** Domain restriction is configured in Google Cloud Console OAuth consent screen, not in Supabase. By default, Google OAuth allows all Google accounts.

**How to avoid:**
- **Option 1 (OAuth level - recommended):** Configure in Google Cloud Console > OAuth consent screen > Internal (restricts to workspace domain) OR set up domain verification and use "hd" parameter
- **Option 2 (Application level):** Add email domain check in callback route or Auth Hook, reject non-workspace accounts
- For requirement "organization accounts only," use Internal OAuth consent screen (Google Workspace only)
- Test with both workspace and personal Google accounts to verify restriction

**Warning signs:**
- Personal Gmail accounts can sign in when only workspace accounts should be allowed
- No "hd" (hosted domain) claim in user metadata
- OAuth consent screen shows "External" instead of "Internal"
- User email domain doesn't match organization domain

**Sources:**
- [Set Up SSO with Google Workspace - Supabase Docs](https://supabase.com/docs/guides/platform/sso/gsuite)
- [Login with Google - Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

### Pitfall 5: RLS Policies Not Enabled on Tables

**What goes wrong:** Role-based restrictions don't work, all authenticated users can delete records even though policies say only admins can.

**Why it happens:** Creating RLS policies doesn't enable RLS on the table. Must explicitly run `alter table <table> enable row level security;` or all queries bypass policies.

**How to avoid:**
- Always run `alter table public.<table> enable row level security;` before creating policies
- Verify with: `select tablename, rowsecurity from pg_tables where schemaname = 'public';`
- Test with both admin and member accounts to verify policies enforce correctly
- Remember: RLS applies to ALL roles including service_role unless explicitly bypassed

**Warning signs:**
- Policies created but authorization doesn't work
- Member users can delete records when they shouldn't
- `rowsecurity` column shows `false` in pg_tables
- No errors but policies don't enforce

**Sources:**
- [Row Level Security - Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Custom Claims & Role-based Access Control (RBAC) - Supabase Docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### Pitfall 6: Audit Logs Not Accessible to Members

**What goes wrong:** Members can't view audit logs even though requirement says "Members have read-only access."

**Why it happens:** Default RLS policies may restrict audit log visibility to admins only, or audit tables don't have RLS policies allowing select for all authenticated users.

**How to avoid:**
- Create explicit RLS policy on `app_audit_log` table: `for select to authenticated using (true);`
- For `audit.record_version` (supa_audit), ensure authenticated role has select permission
- Distinguish between read access (select) and write access (insert/update/delete)
- Test UI with both admin and member accounts to verify visibility

**Warning signs:**
- Member users see empty audit log table or get permission denied errors
- UI shows audit logs for admins but not members
- RLS policy exists but only checks `is_admin()` for select
- Audit log page returns 403 or empty results for members

**Sources:**
- Requirements specified "Members have read-only access (can view but not export or modify logs)"

### Pitfall 7: Session Expiry Modal Appears on Every Page Load

**What goes wrong:** Session expiry modal shows repeatedly, even when session is valid, or appears immediately on login.

**Why it happens:** `onAuthStateChange` listener fires multiple times during normal auth flows (SIGNED_IN, TOKEN_REFRESHED). Treating all events as expiry triggers false positives.

**How to avoid:**
- Only show modal on `SIGNED_OUT` event when user was previously authenticated
- Don't show modal on `TOKEN_REFRESHED` with valid session
- Add state tracking to prevent showing modal multiple times
- Clear modal state after successful re-authentication
- Use session storage to track if user was previously authenticated

**Warning signs:**
- Modal appears on every page navigation
- Modal shows immediately after successful login
- Multiple modal instances stack on top of each other
- Modal appears when session is still valid

**Sources:**
- [User sessions - Supabase Docs](https://supabase.com/docs/guides/auth/sessions)

## Code Examples

Verified patterns from official sources:

### Configure Auth Hook in Supabase Dashboard

After creating the SQL function, configure in Dashboard:

1. Navigate to: Authentication > Hooks
2. Select "Custom Access Token Hook"
3. Enter schema: `public`
4. Enter function name: `custom_access_token_hook`
5. Enable hook

**Verification:**
```typescript
// Decode JWT to verify role claim exists
import { jwtDecode } from 'jwt-decode';

const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  const payload = jwtDecode(session.access_token);
  console.log('User role:', payload.user_role); // Should show 'admin' or 'member'
}
```

### Query Audit Logs (supa_audit)

```sql
-- Get all changes to investors table
select
  ts as timestamp,
  op as operation,
  record->>'name' as investor_name,
  old_record as previous_state,
  record as current_state
from audit.record_version
where table_oid = 'public.investors'::regclass::oid
order by ts desc;

-- Get history for specific investor (by primary key)
select * from audit.record_version
where table_oid = 'public.investors'::regclass::oid
  and record_id = audit.primary_key_values('public.investors'::regclass::oid, '{"id": 123}')
order by ts desc;
```

### Query Auth Audit Logs

```sql
-- Source: https://supabase.com/docs/guides/auth/audit-logs

-- Get all auth events for specific user
select
  created_at,
  payload->>'action' as action,
  payload->>'actor_username' as username,
  ip_address,
  payload->>'error' as error
from auth.audit_log_entries
where (payload->>'actor_username')::text = 'user@example.com'
order by created_at desc;

-- Get all failed login attempts
select
  created_at,
  payload->>'actor_username' as username,
  ip_address,
  payload->>'error' as error
from auth.audit_log_entries
where payload->>'action' = 'user_signedin'
  and payload->>'error' is not null
order by created_at desc;
```

### Protect Client Component by Role

```typescript
// components/auth/role-guard.tsx
'use client';

import { useRole } from '@/lib/hooks/use-role';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'member')[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useRole();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback || <div>Access Denied</div>;
  }

  return <>{children}</>;
}

// Usage
<RoleGuard allowedRoles={['admin']}>
  <DeleteButton />
</RoleGuard>
```

### Protect Server Component by Role

```typescript
// app/(dashboard)/settings/users/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default async function UserManagementPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get session to access JWT with role claim
  const { data: { session } } = await supabase.auth.getSession();
  const payload = session?.access_token ? jwtDecode<{ user_role?: string }>(session.access_token) : null;

  if (payload?.user_role !== 'admin') {
    redirect('/dashboard'); // Or show 403 page
  }

  // Render admin-only content
  return <div>User Management (Admin Only)</div>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom RBAC tables queried on every request | Auth Hooks with JWT custom claims | 2024 | Roles in JWT (stateless), no DB query per request, works with RLS |
| pgaudit logging to files | supa_audit extension logging to tables | 2023 | SQL queries for audit logs, easier filtering/reporting, stable record IDs |
| Manual session refresh endpoints | Automatic refresh in middleware | @supabase/ssr release | Sliding expiration automatic, no manual refresh needed |
| Popup OAuth flow | Redirect-based PKCE flow | 2023+ | Better security, no popup blockers, required for SSR |
| getSession() for auth checks | getUser() for auth validation | 2024 docs update | Server-side JWT validation, prevents session spoofing |
| localStorage for auth state | Cookie-based sessions via @supabase/ssr | 2024 | SSR compatible, more secure, http-only cookies option |

**Deprecated/outdated:**
- **Popup-based OAuth flow:** Blocked by browsers, poor UX. Use redirect-based PKCE flow.
- **Custom session refresh logic:** Use Supabase's automatic refresh in middleware.
- **Row-based role checks on every request:** Use Auth Hooks to add roles to JWT (one-time DB query).
- **getSession() for authorization:** Always use getUser() in middleware/Server Components.
- **auth.users metadata for roles:** Use custom claims in JWT via Auth Hooks (more scalable).

## Open Questions

Things that couldn't be fully resolved:

1. **Google Workspace Domain Restriction Implementation**
   - What we know: Google OAuth can restrict to workspace accounts via "Internal" OAuth consent screen (Google Cloud Console) or "hd" parameter. Supabase supports standard Google OAuth.
   - What's unclear: Whether user wants technical enforcement (OAuth level) or application-level validation (check email domain in callback).
   - Recommendation: Configure OAuth consent screen as "Internal" (workspace only) in Google Cloud Console for technical enforcement. This is the security best practice and prevents any non-workspace accounts from authenticating. If mixed access needed later, can switch to "External" and add domain validation in code.

2. **Session Duration Configuration**
   - What we know: Supabase allows configuring JWT expiry (default 1 hour), inactivity timeout, and time-boxed sessions (Pro plan feature). Requirement says "balance security and convenience for small team."
   - What's unclear: Specific duration values (e.g., 8-hour workday, 1 hour, 24 hours).
   - Recommendation: Use default 1-hour access token expiry with automatic refresh (sliding expiration). This balances security (short-lived tokens) with convenience (auto-refresh keeps users logged in while active). Configure inactivity timeout of 24 hours (session ends if no activity for 1 day). Can be adjusted based on user feedback.

3. **Audit Log Retention Period**
   - What we know: Audit logs accumulate in database, consuming storage. Compliance requirements often dictate retention (30 days, 90 days, 1 year, 7 years).
   - What's unclear: Specific retention requirement for this CRM (investment fund may have regulatory requirements).
   - Recommendation: Default to 1 year retention (common for financial data). Create scheduled job (pg_cron) to archive/delete logs older than 1 year. Confirm with stakeholders if longer retention needed for compliance. Consider partitioning audit tables by month for performance.

4. **Multi-Tab Logout Behavior**
   - What we know: Supabase uses BroadcastChannel API for multi-tab sync. When user logs out in one tab, other tabs receive auth state change event.
   - What's unclear: Should other tabs redirect to login immediately, show modal, or wait for next navigation?
   - Recommendation: Use `onAuthStateChange` listener to detect logout in other tabs and redirect to login page immediately. This prevents users from seeing stale authenticated UI. Phase 1 middleware already protects routes, so any navigation attempt will redirect anyway.

5. **Post-Login Destination Strategy**
   - What we know: Requirement allows Claude's discretion for "dashboard vs last visited page." Common CRM pattern is to preserve user's location.
   - What's unclear: Whether to implement "return to last page" or always go to dashboard.
   - Recommendation: Implement "return to last visited page" pattern using `next` query parameter in OAuth redirect. Store intended destination in sessionStorage before redirecting to login. After successful auth, redirect to stored path or default to `/dashboard`. This provides better UX (user doesn't lose their place) with minimal complexity.

## Sources

### Primary (HIGH confidence)

- [Login with Google - Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Setting up Server-Side Auth for Next.js - Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Custom Claims & Role-based Access Control (RBAC) - Supabase Docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Auth Audit Logs - Supabase Docs](https://supabase.com/docs/guides/auth/audit-logs)
- [User sessions - Supabase Docs](https://supabase.com/docs/guides/auth/sessions)
- [Postgres Triggers - Supabase Docs](https://supabase.com/docs/guides/database/postgres/triggers)
- [GitHub - supabase/supa_audit](https://github.com/supabase/supa_audit)
- [Row Level Security - Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Set Up SSO with Google Workspace - Supabase Docs](https://supabase.com/docs/guides/platform/sso/gsuite)
- [Redirect URLs - Supabase Docs](https://supabase.com/docs/guides/auth/redirect-urls)

### Secondary (MEDIUM confidence)

- [Building Role-Based Access Control (RBAC) with Supabase Row-Level Security - Medium](https://medium.com/@lakshaykapoor08/building-role-based-access-control-rbac-with-supabase-row-level-security-c82eb1865dfd)
- [Next.js with Supabase Google Login: Step-by-Step Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501)
- [Supabase + Next.js Guide… The Real Way - Medium](https://medium.com/@iamqitmeeer/supabase-next-js-guide-the-real-way-01a7f2bd140c)
- [Simple Audit Trail for Supabase Database - Medium](https://medium.com/@harish.siri/simpe-audit-trail-for-supabase-database-efefcce622ff)

### Tertiary (LOW confidence)

- Community discussions about multi-tab session sync - Real-world issues but implementation details vary
- Stack Overflow patterns for session expiry UX - Useful patterns but not Supabase-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries (Supabase Auth, Auth Hooks, supa_audit) verified via official documentation
- Architecture patterns: HIGH - RBAC with Auth Hooks is official Supabase pattern (2024), supa_audit is official extension
- Session management: HIGH - Automatic refresh documented, sliding expiration is built-in behavior
- Audit logging: HIGH - Three-tier approach (auth logs, supa_audit, custom triggers) verified with official docs
- Google OAuth: MEDIUM to HIGH - OAuth setup verified, domain restriction configuration confirmed but implementation choice (OAuth vs app-level) left to planning
- Pitfalls: HIGH - All pitfalls verified with official troubleshooting docs or community reports

**Research date:** 2026-02-11
**Valid until:** 2026-03-13 (30 days - stable auth patterns, Supabase Auth Hooks mature as of 2024)

**Notes:**
- Supabase Auth Hooks released in 2024 as official RBAC solution - mature and production-ready
- supa_audit is official Supabase extension, actively maintained
- Automatic session refresh via middleware is standard pattern, well-documented
- All security patterns (getUser vs getSession, PKCE flow, RLS) verified with official sources
- Google Workspace domain restriction is standard OAuth feature, well-supported
- Phase 1 already established Supabase client utilities and middleware - Phase 2 extends with auth logic
