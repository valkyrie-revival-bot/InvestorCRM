# Phase 1: Foundation & Environment - Research

**Researched:** 2026-02-11
**Domain:** Next.js 16 + Supabase + shadcn/ui project initialization
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for a production-ready Next.js 16 application with Supabase backend, shadcn/ui component library, and Vercel deployment pipeline. The research focused on the specific tech stack required: Next.js 16 with App Router, Supabase with SSR support, shadcn/ui with Tailwind CSS v4, and Vercel AI SDK v6 with Claude API.

The standard approach for 2026 is:
1. Initialize Next.js 16 with App Router using `create-next-app` with TypeScript, Tailwind, ESLint, and Turbopack enabled by default
2. Install Supabase SSR client (`@supabase/ssr`) for proper cookie-based authentication in Server Components
3. Configure shadcn/ui with Tailwind CSS v4's new CSS-first configuration system
4. Set up Vercel deployment with proper environment variable management
5. Integrate Vercel AI SDK v6 with Anthropic provider for Claude API access

Key findings: Tailwind CSS v4 introduces breaking changes with CSS-first configuration, requiring careful migration from v3. Supabase deprecated old auth-helpers in favor of `@supabase/ssr`. Next.js 16 removed `serverRuntimeConfig` and `publicRuntimeConfig` in favor of direct environment variable access. Google Workspace SSO requires proper OAuth scope configuration for Drive, Gmail, and Calendar APIs.

**Primary recommendation:** Use `create-next-app@latest` with default settings (TypeScript, Tailwind, ESLint, App Router, Turbopack), then layer in Supabase SSR, shadcn/ui with Tailwind v4, and Vercel AI SDK. Avoid mixing deprecated packages (`@supabase/auth-helpers-*`) with new ones.

## Standard Stack

The established libraries/tools for Next.js 16 full-stack development:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.5 | Full-stack React framework | Official React team recommendation, first-class Vercel support, App Router with Server Components |
| @supabase/ssr | latest | Supabase SSR client | Official Supabase package for SSR frameworks, replaces deprecated auth-helpers |
| @supabase/supabase-js | latest | Supabase JavaScript client | Core client library for Supabase database and auth operations |
| shadcn/ui | latest | UI component library | Copy-paste components, full customization, Tailwind CSS v4 compatible |
| Tailwind CSS | 4.x | Utility-first CSS framework | Industry standard, v4 required for shadcn/ui modern setup |
| TypeScript | 5.x | Type system for JavaScript | Next.js default, catches errors at compile time |
| ai (Vercel AI SDK) | 6.x | AI integration toolkit | Vercel's official AI SDK, unified API for multiple providers |
| @ai-sdk/anthropic | latest | Claude provider for AI SDK | Official Anthropic integration for Vercel AI SDK |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | latest | Animation library for Tailwind v4 | Replaces deprecated tailwindcss-animate in v4 projects |
| lucide-react | latest | Icon library | shadcn/ui default icon set |
| next-themes | latest | Theme management | Dark mode support (recommended for shadcn/ui) |
| googleapis | latest | Google APIs client | Required for Drive, Gmail, Calendar integration |
| @radix-ui/* | latest | Headless UI primitives | shadcn/ui dependency, handles accessibility |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase | Firebase | Firebase has better Google integration but Supabase offers true PostgreSQL with better relational data handling |
| shadcn/ui | Material-UI, Chakra UI | Pre-built components faster but less customizable, larger bundle sizes |
| Vercel AI SDK | LangChain | LangChain more feature-rich but heavier, AI SDK simpler for chat interfaces |
| Tailwind CSS v4 | Tailwind CSS v3 | v3 more stable but v4 required for modern shadcn/ui, better CSS-first config |

**Installation:**
```bash
# Initialize Next.js 16 project
npx create-next-app@latest my-app --yes
cd my-app

# Install Supabase SSR
npm install @supabase/ssr @supabase/supabase-js

# Install shadcn/ui (initializes Tailwind v4 configuration)
npx shadcn@latest init

# Install Vercel AI SDK with Claude provider
npm install ai @ai-sdk/anthropic

# Install Google APIs client
npm install googleapis

# Install additional utilities (if not already included)
npm install lucide-react next-themes
```

## Architecture Patterns

### Recommended Project Structure

```
sales-tracking/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/             # OAuth callback handler
│   │       └── route.ts
│   ├── (dashboard)/              # Route group: authenticated routes
│   │   ├── layout.tsx            # Dashboard layout with auth check
│   │   ├── page.tsx
│   │   ├── leads/
│   │   └── contacts/
│   ├── api/                      # API routes
│   │   ├── chat/                 # AI chat endpoint
│   │   │   └── route.ts
│   │   └── auth/                 # Auth endpoints
│   │       └── callback/
│   │           └── route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind v4 CSS config
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── providers/                # Context providers
│   │   └── supabase-provider.tsx
│   └── [feature]/                # Feature-specific components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware client
│   ├── google/
│   │   ├── drive.ts
│   │   ├── gmail.ts
│   │   └── calendar.ts
│   └── utils.ts                  # cn() utility and helpers
├── middleware.ts                 # Auth middleware
├── .env.local                    # Local environment variables (gitignored)
├── .env.example                  # Example env file (committed)
├── components.json               # shadcn/ui configuration
├── tsconfig.json                 # TypeScript configuration
└── next.config.ts                # Next.js configuration
```

### Pattern 1: Supabase Client Creation (Server vs Browser)

**What:** Different Supabase client initialization patterns for server and browser contexts
**When to use:** Always - Server Components need server client, Client Components need browser client

**Server Client Example:**
```typescript
// lib/supabase/server.ts
// Source: https://context7.com/supabase/ssr/llms.txt
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
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
        }
      }
    }
  );
}
```

**Browser Client Example:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Pattern 2: Authentication Middleware

**What:** Refresh sessions on every request and protect authenticated routes
**When to use:** Required for all apps using Supabase auth with Next.js App Router

**Example:**
```typescript
// middleware.ts
// Source: https://context7.com/supabase/ssr/llms.txt
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
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
        }
      }
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if no user and accessing protected route
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Pattern 3: Tailwind CSS v4 Configuration

**What:** New CSS-first configuration system in globals.css
**When to use:** All shadcn/ui projects with Tailwind v4

**Example:**
```css
/* app/globals.css */
/* Source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/installation/manual.mdx */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
  /* ... other theme variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark theme variables */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --radius-lg: var(--radius);
  /* ... map CSS variables to Tailwind */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Pattern 4: Environment Variables Structure

**What:** Proper separation of public and server-only environment variables
**When to use:** All Next.js projects with external services

**Example:**
```bash
# .env.local (gitignored)
# Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/environment-variables.mdx

# Supabase (NEXT_PUBLIC_ exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-only secrets (NO NEXT_PUBLIC_ prefix)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...

# Google OAuth (configured in Supabase dashboard)
# These are handled by Supabase, no env vars needed

# Google APIs (for Drive, Gmail, Calendar)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
```

### Pattern 5: Vercel AI SDK Integration

**What:** Set up streaming AI responses with Claude API
**When to use:** All AI-powered features requiring conversational interfaces

**Example:**
```typescript
// app/api/chat/route.ts
// Source: https://github.com/vercel/ai/blob/main/content/cookbook/00-guides/18-claude-4.mdx
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

### Anti-Patterns to Avoid

- **Using Route Handlers unnecessarily in Server Components:** Both Route Handlers and Server Components run on the server - you can call database/API logic directly in Server Components without the extra network hop.
- **Mixing @supabase/auth-helpers-* with @supabase/ssr:** The old auth-helpers packages are deprecated and incompatible with the new SSR package. Use only @supabase/ssr.
- **Prefixing secrets with NEXT_PUBLIC_:** Variables with NEXT_PUBLIC_ are exposed to the browser. Never use this prefix for API keys, service role keys, or database credentials.
- **Using tailwind.config.js with Tailwind v4:** Tailwind v4 uses CSS-first configuration. Remove tailwind.config.js and move all config to globals.css with @theme directive.
- **Not refreshing sessions in middleware:** Expired sessions cause auth failures in Server Components. Always refresh sessions in middleware for Supabase auth.
- **Committing .env.local to git:** This file contains secrets. Always add to .gitignore. Use .env.example for documentation.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI components with accessibility | Custom components from scratch | shadcn/ui + Radix UI | Accessibility is complex (ARIA, keyboard nav, screen readers). Radix UI handles all edge cases. |
| Authentication with Google SSO | Custom OAuth flow | Supabase Auth with Google provider | OAuth has many security pitfalls (PKCE, state validation, token refresh). Supabase handles all of this. |
| AI streaming responses | Custom streaming implementation | Vercel AI SDK | Streaming AI responses requires managing SSE, backpressure, error handling. AI SDK abstracts this. |
| Dark mode theming | Custom theme context | next-themes | Handles SSR hydration mismatch, localStorage persistence, system preference detection. |
| Path aliases | Relative imports like ../../../ | TypeScript paths config | create-next-app configures @/* alias by default. Use it. |
| API rate limiting | Custom rate limiter | Vercel Edge Config + KV | Production rate limiting needs distributed state. Use Vercel's infrastructure. |
| Google API authentication | Manual token management | googleapis library with refresh tokens | Token refresh, scope validation, error handling are complex. googleapis handles it. |
| Form validation | Manual validation logic | React Hook Form + Zod | Forms have many edge cases (async validation, field dependencies). Use battle-tested libraries. |

**Key insight:** In modern Next.js development, most infrastructure concerns are solved by combining Next.js primitives (Server Components, Server Actions, Route Handlers) with specialized libraries. The ecosystem is mature - favor composition over custom implementation.

## Common Pitfalls

### Pitfall 1: Tailwind CSS v4 Migration Issues

**What goes wrong:** Installing shadcn/ui overwrites existing Tailwind v3 configuration, breaking existing styles. Border colors, animations, and color formats behave differently.

**Why it happens:** Tailwind v4 fundamentally changed configuration from tailwind.config.js to CSS-first. The new @theme directive, OKLCH color format, and removal of tailwindcss-animate plugin break v3 assumptions.

**How to avoid:**
- Start fresh with v4 if possible (this project is new, so no migration needed)
- If migrating: Use `@tailwindcss/upgrade@next` codemod to update deprecated utilities
- Replace tailwindcss-animate with tw-animate-css
- Ensure CSS variable names in :root match the mapping in @theme inline
- Remember border-color changed from currentColor to a configurable default

**Warning signs:**
- Animations don't work after shadcn/ui install
- Border colors appear incorrect or missing
- Build errors about unknown Tailwind directives
- Colors look washed out (HSL vs OKLCH)

**Sources:**
- [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4)
- [Updating shadcn/ui to Tailwind 4 - Shadcnblocks.com](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/)
- [Tailwind CSS v4.0: Complete Migration Guide](https://medium.com/@mernstackdevbykevin/tailwind-css-v4-0-complete-migration-guide-breaking-changes-you-need-to-know-7f99944a9f95)

### Pitfall 2: Supabase Auth Session Refresh Failures

**What goes wrong:** Users get logged out randomly, Server Components can't access user data, "Invalid Refresh Token" errors appear.

**Why it happens:** Server Components need fresh sessions, but without middleware refreshing sessions on every request, expired tokens cause failures. Cookie handling differences between server/client also cause issues.

**How to avoid:**
- Always implement middleware that refreshes sessions using createServerClient
- Never call supabase.auth.getSession() - always use supabase.auth.getUser()
- Use separate client utilities for browser vs server contexts
- Ensure cookie handling matches the @supabase/ssr pattern exactly (getAll/setAll)

**Warning signs:**
- Users log in successfully but pages show "not authenticated"
- Auth state works in browser but not in Server Components
- Refresh token errors in production but not development
- Middleware not updating response cookies

**Sources:**
- [How do you troubleshoot NextJS - Supabase Auth issues? - Supabase Docs](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV)
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/auth/troubleshooting)
- [How to Migrate from Supabase Auth Helpers to SSR package](https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM)

### Pitfall 3: Environment Variables Not Available in Browser

**What goes wrong:** Client Components show undefined for environment variables that work in Server Components. API calls fail with "Cannot read property 'SUPABASE_URL' of undefined".

**Why it happens:** Next.js only exposes environment variables prefixed with NEXT_PUBLIC_ to the browser. Server-only variables are stripped from the client bundle for security.

**How to avoid:**
- Prefix browser-accessible variables with NEXT_PUBLIC_
- Never prefix secrets (service role keys, API keys) with NEXT_PUBLIC_
- Use .env.local for secrets (gitignored), .env.example for documentation
- For Supabase: URL and ANON_KEY need NEXT_PUBLIC_, SERVICE_ROLE_KEY must NOT have it
- In production (Vercel), set environment variables in project settings, not in files

**Warning signs:**
- process.env.VARIABLE_NAME is undefined in Client Components but works in Server Components
- Build succeeds but runtime errors about missing env vars
- Hardcoded values work but env vars don't
- Different behavior between dev and production

**Sources:**
- [Guides: Environment Variables - Next.js](https://nextjs.org/docs/pages/guides/environment-variables)
- [Next.js Environment Variables: Secure Management Guide](https://nextjsstarter.com/blog/nextjs-environment-variables-secure-management-guide/)
- [How to Deploy a Next.js App with Environment Variables (Common Mistakes Explained)](https://javascript.plainenglish.io/how-to-deploy-a-next-js-app-with-environment-variables-common-mistakes-explained-59e52aadd7e0)

### Pitfall 4: Next.js App Router Context Errors

**What goes wrong:** "Cannot use context in Server Components" errors. Providers don't work as expected. State doesn't persist across navigation.

**Why it happens:** Server Components can't use React context (useState, useContext). Providers must be Client Components with 'use client' directive. Provider placement in App Router differs from Pages Router.

**How to avoid:**
- Mark all provider components with 'use client' at the top
- Extract providers into separate files (don't define in layout.tsx directly)
- Place providers in root layout.tsx, wrapping {children}
- For Supabase: Create a separate <SupabaseProvider> Client Component that passes client instance via context
- Remember: Server Components can pass data to Client Components via props, but not context

**Warning signs:**
- "use client" missing from provider files
- Context shows undefined in child components
- Errors about hooks being called in Server Components
- Auth state doesn't persist across page navigation

**Sources:**
- [Common mistakes with the Next.js App Router - Vercel](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

### Pitfall 5: Google OAuth Callback Configuration

**What goes wrong:** Google sign-in button works but redirects to error page. "Redirect URI mismatch" errors. Localhost works but production fails.

**Why it happens:** Google OAuth requires exact URL matching for redirect URIs. Supabase provides a callback URL, but it must be registered in Google Cloud Console exactly, including http vs https, trailing slashes, and subdomain differences.

**How to avoid:**
- Get exact callback URL from Supabase dashboard (Settings > Auth > Providers > Google)
- Add this URL to Google Cloud Console > Credentials > OAuth 2.0 Client > Authorized redirect URIs
- For development: Add both http://localhost:3000/auth/callback AND http://127.0.0.1:54321/auth/v1/callback
- For production: Add your Vercel URL callback exactly as shown in Supabase
- Configure Google Workspace SSO separately if using workspace accounts (different OAuth screen)
- Set up proper OAuth scopes for Drive, Gmail, Calendar in Google Cloud Console

**Warning signs:**
- "Redirect URI mismatch" error from Google
- Users can't log in with Google in production but dev works
- Wrong domain shown in Google OAuth consent screen
- Missing scopes when accessing Drive/Gmail/Calendar APIs after auth

**Sources:**
- [Set Up SSO with Google Workspace - Supabase Docs](https://supabase.com/docs/guides/platform/sso/gsuite)
- [Login with Google - Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js with Supabase Google Login: Step-by-Step Guide](https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501)

### Pitfall 6: Vercel Deployment Build Failures

**What goes wrong:** Build succeeds locally but fails on Vercel. "Module not found" errors. Environment variables work locally but not in production.

**Why it happens:** Vercel build environment differs from local (Node version, package manager, build cache). Environment variables must be set in Vercel dashboard, not just in .env.local. Lockfiles can pin old vulnerable versions.

**How to avoid:**
- Commit package-lock.json or pnpm-lock.yaml (ensures consistent installs)
- Set all NEXT_PUBLIC_ and server env vars in Vercel project settings
- Use correct Node version (check vercel.json or let Vercel auto-detect)
- Don't use relative paths in imports - use @/* alias
- Check build output settings: Next.js 16 uses .next directory by default
- If CVE warnings appear, delete lockfile and reinstall to get patched versions

**Warning signs:**
- Build succeeds locally but fails on Vercel
- Missing environment variables in production logs
- "Vulnerable Next.js version" warnings in Vercel dashboard
- Different behavior between preview and production deployments
- Module resolution errors for packages that work locally

**Sources:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [How I Fixed the "Vulnerable Next.js Version" Warning on Vercel](https://techliftdigital.in/blogs/how-i-fixed-the-vulnerable-nextjs-version-warning-on-vercel-step-by-step-guide)
- [Debugging and Fixing Next.js Deployment Issues in Vercel and AWS Lambda](https://medium.com/@mohantaankit2002/debugging-and-fixing-next-js-deployment-issues-in-vercel-and-aws-lambda-9a91a9016db2)

## Code Examples

Verified patterns from official sources:

### Initialize New Next.js 16 Project

```bash
# Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/01-getting-started/01-installation.mdx
npx create-next-app@latest sales-tracking --yes
cd sales-tracking
npm run dev
```

The `--yes` flag uses recommended defaults:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- src/ directory: No
- App Router: Yes
- Turbopack: Yes
- Import alias: @/*

### Initialize shadcn/ui with Tailwind v4

```bash
# Source: https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/README.md
npx shadcn@latest init
```

This creates `components.json` and updates `globals.css` with Tailwind v4 configuration. Choose "new-york" style, enable RSC, use CSS variables.

### Add shadcn/ui Components

```bash
# Add specific components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

Components are added to `components/ui/` and can be customized directly.

### Create Supabase Client Utilities

```typescript
// lib/supabase/client.ts
// Browser client for Client Components
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
// Server client for Server Components and Route Handlers
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
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
        }
      }
    }
  );
}
```

### Google OAuth Setup in Supabase

1. Create OAuth credentials in Google Cloud Console
2. Add credentials to Supabase dashboard: Authentication > Providers > Google
3. Add Supabase callback URL to Google Cloud Console Authorized Redirect URIs

```typescript
// app/(auth)/login/page.tsx
// Login with Google button
'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
      },
    });
  };

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  );
}
```

```typescript
// app/auth/callback/route.ts
// OAuth callback handler
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
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
          }
        }
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Vercel Deployment Configuration

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from CLI
vercel

# Or connect via Vercel dashboard (recommended)
# 1. Import Git repository
# 2. Vercel auto-detects Next.js
# 3. Set environment variables in project settings
# 4. Deploy
```

Environment variables to set in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### TypeScript Path Aliases Configuration

```json
// tsconfig.json
// Source: Next.js default configuration
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13 (stable in 14) | Server Components by default, simpler data fetching, better caching |
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Unified SSR package for all frameworks, simpler API |
| Tailwind v3 with tailwind.config.js | Tailwind v4 with CSS-first config | Dec 2024 | All config in CSS via @theme, no more JS config file |
| tailwindcss-animate | tw-animate-css | Tailwind v4 release | New plugin compatible with v4 architecture |
| serverRuntimeConfig/publicRuntimeConfig | Direct environment variables | Next.js 16 | Simpler, no getConfig() needed |
| getServerSideProps/getStaticProps | Server Components + fetch | Next.js 13+ | Less boilerplate, better streaming |
| next lint as CLI command | next lint removed, use ESLint directly | Next.js 16 | Configure ESLint via eslint.config.mjs |
| LangChain for simple chat | Vercel AI SDK | 2023-2024 | Simpler API, better streaming, framework integration |

**Deprecated/outdated:**
- **@supabase/auth-helpers-*** packages: Replaced by @supabase/ssr. All auth-helpers are unmaintained.
- **tailwindcss-animate**: Not compatible with Tailwind v4. Use tw-animate-css instead.
- **serverRuntimeConfig and publicRuntimeConfig**: Removed in Next.js 16. Use process.env directly.
- **next lint command**: Removed in Next.js 16. Use npx eslint instead.
- **getServerSideProps/getStaticProps**: Still work but App Router Server Components are preferred.
- **.eslintrc.* format**: While still supported, eslint.config.mjs (flat config) is now recommended.

## Open Questions

Things that couldn't be fully resolved:

1. **Google Workspace SSO vs Regular Google OAuth**
   - What we know: Supabase supports both regular Google OAuth and Google Workspace SSO. The setup process differs - Workspace SSO uses SAML/OIDC configured via Supabase dashboard.
   - What's unclear: Whether the requirement "Must use Google Workspace SSO" means workspace accounts only (restricting to specific domain) or just allowing workspace accounts to sign in (via regular OAuth).
   - Recommendation: Start with regular Google OAuth configured in Supabase (supports all Google accounts including Workspace). If domain restriction is needed (only @company.com accounts), configure Google Workspace SSO separately following Supabase's SSO guide. Clarify requirement with stakeholders during Phase 2 planning.

2. **AI Integration Scope for Phase 1**
   - What we know: Tech stack specifies Vercel AI SDK v6 + Claude API. Phase 1 is infrastructure-only.
   - What's unclear: Should AI SDK be installed and tested with a simple example in Phase 1, or deferred to later phases when AI features are built?
   - Recommendation: Install AI SDK and dependencies in Phase 1 (npm install ai @ai-sdk/anthropic), set ANTHROPIC_API_KEY environment variable, but don't build UI. Create a minimal API route (app/api/chat/route.ts) that echoes back messages as a connectivity test. This validates the setup without scope creep.

3. **Tailwind CSS v4 Stability**
   - What we know: Tailwind v4 was released recently (late 2024). shadcn/ui supports it. Breaking changes exist from v3.
   - What's unclear: Production readiness for tight deadline (2 days). Risk of undiscovered bugs or incomplete migration tooling.
   - Recommendation: Use Tailwind v4 as specified (required for modern shadcn/ui setup). However, if unexpected issues arise during Phase 1 verification, document an escape hatch: keep shadcn/ui but temporarily downgrade to Tailwind v3 using npx shadcn@latest init with v3 option. This is unlikely but good to know it's possible.

## Sources

### Primary (HIGH confidence)

- **/vercel/next.js/v16.1.5** - Next.js 16 official documentation (Context7)
  - Installation, App Router, environment variables, TypeScript configuration
- **/supabase/ssr** - Supabase SSR package documentation (Context7)
  - Server/browser client creation, middleware setup, authentication patterns
- **/shadcn-ui/ui** - shadcn/ui official documentation (Context7)
  - Installation, Tailwind v4 integration, component configuration
- **/vercel/ai** - Vercel AI SDK documentation (Context7)
  - Claude provider setup, streaming responses, Next.js integration
- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) - Official Tailwind v4 migration docs
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/auth/troubleshooting) - Official Supabase troubleshooting

### Secondary (MEDIUM confidence)

- [Next.js 16 App Router Project Structure: The Definitive Guide](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) - Verified against official docs
- [Common mistakes with the Next.js App Router - Vercel](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) - Official Vercel blog
- [Set Up SSO with Google Workspace - Supabase Docs](https://supabase.com/docs/guides/platform/sso/gsuite) - Official Supabase docs
- [Use Supabase with Next.js - Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - Official quickstart
- [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4) - Official shadcn migration guide
- [Next.js Environment Variables: Secure Management Guide](https://nextjsstarter.com/blog/nextjs-environment-variables-secure-management-guide/) - Community guide verified with official docs

### Tertiary (LOW confidence - WebSearch only)

- Various Medium articles on Tailwind v4 migration experiences - Real-world issues but not official sources
- Community GitHub discussions on Tailwind v4 and shadcn/ui integration - Useful for pitfall identification but not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 and official documentation
- Architecture: HIGH - Patterns sourced from official Supabase SSR and Next.js 16 docs
- Pitfalls: MEDIUM to HIGH - Mix of official troubleshooting docs and verified community reports
- Google Workspace integration: MEDIUM - Official docs exist but specific SSO requirement ambiguous

**Research date:** 2026-02-11
**Valid until:** 2026-03-15 (30 days - stable tech stack, Next.js 16 just released but mature)

**Notes:**
- Next.js 16 is very recent (v16.1.5) - minor version updates likely but breaking changes unlikely
- Tailwind v4 is newer (late 2024) - may have edge cases but shadcn/ui adoption indicates stability
- Supabase @supabase/ssr is the current standard and actively maintained
- Vercel AI SDK v6 is latest, actively developed, stable API for core features
- All core patterns verified against official documentation via Context7 or WebFetch
