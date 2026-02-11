# Stack Research

**Domain:** M&A/Investor CRM with Google Workspace Integration
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

For a 2-day sprint to build a production-quality M&A/Investor CRM with Google Workspace integration, AI agents, and real-time collaboration, the optimal 2026 stack is:

**Core:** Next.js 16 App Router + TypeScript 5.7 + React 19
**Database:** Supabase (PostgreSQL + Real-time + Auth)
**AI:** Vercel AI SDK v6 + Anthropic Claude
**Google:** googleapis Node.js client
**UI:** shadcn/ui + Tailwind CSS v4
**Forms:** React Hook Form + Zod
**Deployment:** Vercel

This stack prioritizes rapid development velocity while maintaining production-grade quality. Every component is battle-tested, has excellent TypeScript support, and integrates seamlessly for the aggressive timeline.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.1.5 | Full-stack React framework | App Router with Server Components is the 2026 standard. Up to 76.7% faster local dev with Turbo, 96.3% faster Fast Refresh. Built-in optimistic auth patterns, automatic code-splitting, server actions for forms. Perfect for rapid prototyping with production quality. |
| **React** | 19.x | UI library | Automatic compiler optimizes rendering without manual memoization. Native form actions, useFormStatus/useFormState for server integration. 78% adoption among professional TypeScript developers in 2026. |
| **TypeScript** | 5.7+ | Type safety | Essential for CRM data integrity. Excellent React 19 compatibility (requires @types/react@^19.0.0). Latest ES2024 support. Type inference eliminates boilerplate. |
| **Node.js** | 20 LTS or 22 LTS | Runtime | Required for Google Workspace APIs client library. Stable LTS for production deployment. |

**Confidence:** HIGH - Verified via Context7 `/vercel/next.js/v16.1.5` and official Next.js docs updated Jan 2026.

### Database & Real-time

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Supabase** | Latest (1.25.04) | PostgreSQL + real-time + auth | Best choice for 2-day timeline. Provides: (1) Full Postgres database with migrations, (2) Built-in real-time subscriptions for multi-user collaboration, (3) Google OAuth integration out-of-box, (4) Row-level security for data isolation, (5) Storage for file uploads. Eliminates need for separate auth service, database hosting, and WebSocket infrastructure. Open-source, enterprise-grade. |
| **Drizzle ORM** | Latest | Database queries (optional) | Alternative to Prisma for PostgreSQL. Code-first TypeScript approach, zero build step (type inference only), 10x faster cold starts in serverless. Use if you need complex SQL queries or prefer SQL-like API. Skip if Supabase client SDK suffices for basic CRUD. |

**Why Supabase over custom Postgres:**
- Real-time subscriptions for live updates (investor pipeline changes)
- Google OAuth pre-configured (faster than implementing from scratch)
- Hosted, managed, automatic backups
- Row-level security for multi-tenant data isolation

**Why Drizzle over Prisma (if needed):**
- No code generation step (instant schema changes)
- Smaller bundle size for edge/serverless
- Faster cold starts on Vercel
- SQL-like syntax (better for complex CRM queries)

**Confidence:** HIGH - Context7 `/supabase/supabase` and multiple 2026 sources confirm production readiness.

### AI & Agents

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vercel AI SDK** | v6.0.0 (stable) | AI agent framework | Official Vercel toolkit for AI apps. Provides: (1) Unified API for all LLM providers, (2) Built-in streaming responses, (3) Tool calling for AI agents, (4) React hooks (useChat, useCompletion) for chat UI, (5) Server-side agent orchestration with ToolLoopAgent. Designed for production with type safety, error handling, and Next.js integration. |
| **Anthropic Claude** | Opus 4.6 / Sonnet 4.5 | LLM for AI BDR agent | Best coding/reasoning model in 2026. Native support in Vercel AI SDK via AI Gateway. Opus 4.6 has 1M token context (entire investor pipeline), adaptive thinking for complex reasoning, web search tool for real-time data. Sonnet 4.5 for cost-effective operations. |

**Implementation Pattern:**
```typescript
// Agent with tool calling (Context7 verified pattern)
const chatAgent = new ToolLoopAgent({
  model: anthropic('claude-opus-4.6'),
  instructions: 'You are an AI BDR managing M&A investor relationships',
  tools: {
    searchInvestors: { /* query CRM */ },
    updatePipeline: { /* update deal status */ },
    scheduleFollowup: { /* Google Calendar integration */ }
  }
});
```

**Why Vercel AI SDK over LangChain:**
- Native Next.js integration (same vendor)
- Simpler API (less abstraction layers)
- Better TypeScript types
- Built-in streaming and React hooks
- Lighter weight (faster cold starts)

**Confidence:** HIGH - Context7 `/vercel/ai/ai_6.0.0-beta.128` verified. AI SDK 6 is stable as of Jan 2026.

### Google Workspace Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **googleapis** | Latest | Google APIs client | Official Node.js client for all Google Workspace APIs. Supports OAuth 2.0, API keys, JWT tokens. Single library for Drive, Gmail, Calendar, Meet. Actively maintained (Dec 2025 updates). Required for: Drive storage, Gmail sync, Calendar scheduling, Meet recording capture. |

**Required APIs:**
- **Drive API:** Store documents, cap tables, deal files
- **Gmail API:** Sync investor communications
- **Calendar API:** Schedule meetings, track touchpoints
- **Meet API:** Capture meeting recordings (note: preview status, may have breaking changes)

**Authentication Flow:**
```typescript
// OAuth with Google (Supabase handles token storage)
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    queryParams: {
      access_type: 'offline',  // Get refresh token
      prompt: 'consent',
      scope: 'email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar'
    }
  }
})
```

**Confidence:** MEDIUM-HIGH - googleapis is official and stable. Meet API is in preview (potential breaking changes). Gmail/Drive/Calendar APIs are mature.

### UI & Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **shadcn/ui** | Latest | Component library | Production-ready React components (Radix UI + Tailwind). Copy-paste approach (full ownership, no dependency). Accessible, customizable. 1000+ pre-built patterns available. Perfect for rapid prototyping with professional design. Figma integration available. |
| **Tailwind CSS** | v4 (latest) | Styling framework | Industry standard in 2026. v4 features: 5x faster builds, 100x faster incremental builds, CSS-native config with @theme, automatic content detection (zero config). Professional-looking UI without custom CSS. |
| **Radix UI** | Latest | Headless primitives | Powers shadcn/ui. WAI-ARIA compliant accessibility. Used via shadcn/ui (no direct install needed). |

**Why shadcn/ui over Material-UI or Ant Design:**
- Modern design system (better for investor-facing UI)
- Full code ownership (customize anything)
- Smaller bundle (only copy what you need)
- Better TypeScript support
- Tailwind-native (consistent styling)

**Confidence:** HIGH - Multiple 2026 sources confirm shadcn/ui production readiness. Tailwind v4 is stable.

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React Hook Form** | Latest (7.x) | Form state management | Performance leader (uncontrolled components, minimal re-renders). 50% smaller than Formik, zero dependencies. Native Next.js Server Actions support. Excellent for complex CRM forms (multi-step investor onboarding). |
| **Zod** | Latest (3.x) | Schema validation | TypeScript-first validation. Generate TypeScript types from schemas (single source of truth). Runtime + compile-time safety. Works seamlessly with React Hook Form + Vercel AI SDK tools. Essential for data integrity in CRM. |

**Pattern:**
```typescript
const investorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  stage: z.enum(['seed', 'seriesA', 'seriesB']),
  checkSize: z.number().positive()
});

type Investor = z.infer<typeof investorSchema>;  // Auto-generated type
```

**Why React Hook Form over Formik:**
- 2x smaller bundle size
- Better performance (fewer re-renders)
- Native Server Actions support
- No dependencies (Formik has 9)

**Confidence:** HIGH - React Hook Form + Zod is the 2026 standard for Next.js forms.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **ESLint** | Code quality | Next.js has built-in ESLint config |
| **Prettier** | Code formatting | Use `prettier-plugin-tailwindcss` for class sorting |
| **TypeScript Strict Mode** | Type safety | Enable for CRM data integrity |
| **Vercel Dev Environment** | Local development | `next dev --turbo` (76% faster startup) |

---

## Installation

```bash
# Initialize Next.js project
npx create-next-app@latest prytaneum-crm --typescript --tailwind --app --no-src-dir

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install ai @ai-sdk/anthropic
npm install googleapis google-auth-library
npm install react-hook-form zod @hookform/resolvers
npm install date-fns  # Date utilities for CRM

# UI components (shadcn/ui - install as needed)
npx shadcn@latest init
npx shadcn@latest add button input form table dialog select

# Dev dependencies
npm install -D @types/node
npm install -D prettier prettier-plugin-tailwindcss
```

---

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| **Framework** | Next.js 16 App Router | Remix, SvelteKit | Never for this project. Next.js is optimal for Vercel deployment, has best AI SDK integration, and largest ecosystem. |
| **Database** | Supabase | Firebase, PlanetScale, Neon | Firebase if you need Google Cloud native integration (but weaker SQL support). PlanetScale/Neon if you already have Postgres expertise and want more control. Supabase wins on real-time + auth combo. |
| **ORM** | Drizzle (optional) | Prisma | Prisma if team is new to databases (gentler learning curve, better docs). Drizzle for performance and serverless. Skip ORM entirely if Supabase client SDK handles your queries. |
| **AI Framework** | Vercel AI SDK | LangChain, LlamaIndex | LangChain if you need complex agent orchestration (multi-agent systems, memory). For simple AI BDR chat, Vercel AI SDK is faster and simpler. |
| **LLM Provider** | Anthropic Claude | OpenAI GPT-4, Google Gemini | GPT-4 if you need function calling with JSON mode. Gemini if you need 2M token context. Claude Opus 4.6 is best overall for coding/reasoning in 2026. |
| **UI Library** | shadcn/ui + Tailwind | Material-UI, Chakra UI, Ant Design | Material-UI for Google-like design (but heavy bundle). Chakra UI for simpler component API. shadcn/ui is best for modern, customizable, professional design. |
| **Forms** | React Hook Form | Formik, Next.js Server Actions only | Formik if team already knows it (but slower). Pure Server Actions if forms are very simple (no client-side validation). React Hook Form is best for complex CRM forms. |
| **Hosting** | Vercel | Netlify, AWS Amplify, Railway | Netlify if you prefer it (similar DX). AWS Amplify if you're AWS-native. Railway for cheaper hosting. Vercel is optimal for Next.js (same creators, best integration). |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Pages Router (Next.js)** | Deprecated pattern. App Router is the 2026 standard. Server Components, streaming, and modern features only work in App Router. | Next.js App Router |
| **Create React App** | Unmaintained since 2022. No SSR, no modern React features. | Next.js |
| **MongoDB with TypeScript** | Weak schema enforcement. CRM needs relational data (investors → deals → meetings). Type safety is harder with document DBs. | PostgreSQL (via Supabase) |
| **Express.js API** | Unnecessary abstraction. Next.js Route Handlers + Server Actions replace Express entirely. | Next.js API Routes / Server Actions |
| **Redux / Zustand for server state** | Overkill. Use React Query or Supabase real-time subscriptions for server data. State management libraries are for client state only. | Supabase real-time + React hooks |
| **Styled Components / Emotion** | Runtime CSS-in-JS hurts performance (Server Components don't support it well). Tailwind is faster and more maintainable. | Tailwind CSS v4 |
| **Formik (new projects)** | Slower, larger bundle, more dependencies than React Hook Form. | React Hook Form |
| **Prisma for serverless/edge** | Slow cold starts (5s+ on Lambda). Heavy bundle. Use Drizzle for edge/serverless. | Drizzle ORM |
| **Self-hosted Postgres (for MVP)** | Operational overhead (backups, scaling, monitoring). Use managed service for 2-day sprint. | Supabase (managed Postgres) |
| **Firebase Firestore** | SQL is better for CRM relational data. Firestore lacks joins, transactions are limited, complex queries are hard. | Supabase (Postgres) |
| **LangChain (for simple AI)** | Over-engineered for basic chat agent. Heavy abstraction layer, slower execution, larger bundle. | Vercel AI SDK |

---

## Stack Patterns by Variant

### If you need offline-first / mobile app later:
- Add **Supabase Local-first** (currently beta) for offline sync
- Or use **ElectricSQL** for local-first Postgres sync
- Because: CRM needs to work offline for sales teams traveling

### If you need advanced analytics / BI:
- Add **Tremor** (React components for dashboards) or **Recharts**
- Connect **Metabase** or **Superset** directly to Supabase Postgres
- Because: Investor pipeline analytics, deal velocity metrics

### If you need document parsing (PDFs, emails):
- Add **Anthropic Claude with vision** for document extraction
- Or **Unstructured.io** for PDF parsing
- Because: Parse cap tables, term sheets, investor decks

### If you scale beyond 4 users:
- Implement **Supabase Row-Level Security (RLS)** policies immediately
- Add **audit logging** (track all investor data changes)
- Use **Vercel Edge Config** for feature flags
- Because: Multi-tenant data isolation, compliance, gradual rollouts

### If Google Meet API is too unstable (it's in preview):
- Use **Fireflies.ai API** or **Otter.ai API** for meeting transcription
- Or manually upload recordings to **Anthropic Claude** for analysis
- Because: Meet API may have breaking changes (preview status)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| React 19.x | Next.js 16.x ✅ | Requires @types/react@^19.0.0 |
| TypeScript 5.7 | React 19 ✅ | Remove explicit JSX.Element return types (breaking change) |
| Vercel AI SDK v6 | Next.js 16 ✅ | Stable as of Jan 2026 |
| Tailwind CSS v4 | Next.js 16 ✅ | Use @theme directive in CSS (no tailwind.config.js) |
| Supabase JS Client | Next.js 16 ✅ | Use @supabase/ssr for cookie handling |
| React Hook Form 7.x | React 19 ✅ | Fully compatible |
| Zod 3.x | All versions ✅ | No compatibility issues |
| googleapis | Node.js 20+ ✅ | Follows Node LTS schedule |

**Critical Compatibility Notes:**
1. **Meet API is in preview** - may have breaking changes before stable release
2. **Tailwind v4 changes config format** - use CSS-native @theme instead of tailwind.config.js
3. **React 19 JSX namespace change** - remove explicit `Promise<JSX.Element>` return types

---

## Architecture Decisions

### Why Server Components over Client Components (default):
- **Benefit:** Zero JavaScript sent to client for data fetching
- **Use case:** Investor list, deal pipeline, dashboard metrics
- **When to use Client:** Forms, AI chat interface, real-time updates

### Why Supabase over Firebase:
- **Postgres SQL** > Firestore NoSQL for relational CRM data (investors → deals → meetings)
- **Real-time subscriptions** work with SQL queries (Firebase requires denormalization)
- **Google OAuth** supported in both, but Supabase has better Node.js DX

### Why Vercel AI SDK over LangChain:
- **Simpler API** - less abstraction, faster to learn
- **Native Next.js integration** - same vendor as Next.js
- **Lighter bundle** - better for serverless cold starts
- **Built-in streaming** - better UX for AI chat

### Why Anthropic Claude over OpenAI GPT-4:
- **Better reasoning** - Opus 4.6 has adaptive thinking for complex CRM logic
- **Larger context** - 1M tokens (entire investor pipeline fits in one prompt)
- **Web search tool** - native real-time data access (verify investor info)
- **Coding ability** - better for generating SQL queries, data transformations

### Why React Hook Form over Formik:
- **Performance** - uncontrolled components, minimal re-renders
- **Bundle size** - 50% smaller, zero dependencies
- **Modern** - native Server Actions support for Next.js

---

## Trade-offs & Constraints

### Speed vs. Features:
**Decision:** Use Supabase for all auth, database, real-time, storage
**Trade-off:** Less control over infrastructure, vendor lock-in
**Rationale:** 2-day timeline demands managed services. Can migrate later if needed.

### Complexity vs. Power:
**Decision:** Vercel AI SDK over LangChain
**Trade-off:** Less flexibility for multi-agent orchestration
**Rationale:** Simple AI BDR chat doesn't need LangChain's complexity. Can upgrade later.

### Cost vs. Performance:
**Decision:** Claude Sonnet 4.5 for most operations, Opus 4.6 for complex reasoning
**Trade-off:** Higher LLM costs than GPT-3.5
**Rationale:** Investor-facing product needs best quality. 4 internal users = low volume.

### Customization vs. Speed:
**Decision:** shadcn/ui components (copy-paste approach)
**Trade-off:** More code in repo vs. npm dependency
**Rationale:** Full control for investor-facing UI. Easy to customize for branding.

### Type Safety vs. Development Speed:
**Decision:** TypeScript Strict Mode + Zod validation
**Trade-off:** More upfront type definitions
**Rationale:** CRM data integrity is critical. Bugs in investor data = business risk.

---

## Production Readiness Checklist

Before deploying to investors:

### Security:
- [ ] Enable Supabase Row-Level Security (RLS) policies
- [ ] Use environment variables for all API keys (never commit)
- [ ] Implement rate limiting on AI endpoints (Vercel Edge Config)
- [ ] Add CORS headers for API routes
- [ ] Enable Vercel Authentication (password-protect preview deployments)

### Performance:
- [ ] Enable Next.js Image Optimization (automatic)
- [ ] Use Server Components by default (Client only when needed)
- [ ] Implement React Suspense for loading states
- [ ] Enable Vercel Edge Functions for global latency reduction
- [ ] Use Supabase connection pooling (pgBouncer) for database

### Monitoring:
- [ ] Set up Vercel Analytics (built-in, free)
- [ ] Enable Supabase logs for database queries
- [ ] Add error tracking (Sentry or Vercel Error Tracking)
- [ ] Monitor AI token usage (Anthropic dashboard)
- [ ] Set up uptime monitoring (Vercel Status)

### Data:
- [ ] Implement database backups (Supabase automatic daily)
- [ ] Add audit logging for all investor data changes
- [ ] Set up data retention policies (GDPR compliance)
- [ ] Implement soft deletes (never hard delete investor data)

---

## Sources

### Context7 (HIGH confidence):
- `/vercel/next.js/v16.1.5` - Next.js 16 authentication patterns, production checklist
- `/supabase/supabase` - Supabase real-time, Google OAuth integration, storage
- `/vercel/ai/ai_6.0.0-beta.128` - AI SDK agents, tool calling, streaming
- `/websites/googleapis_dev_nodejs_googleapis` - Google Workspace APIs client library

### Official Documentation (HIGH confidence):
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) - Updated Jan 2026
- [Vercel AI SDK 6](https://vercel.com/blog/ai-sdk-6) - Stable release Jan 2026
- [Google Workspace APIs Node.js](https://developers.google.com/workspace/) - Updated Dec 2025
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) - Stable release 2025

### Web Research (MEDIUM-HIGH confidence):
- [Next.js Advanced Techniques 2026](https://medium.com/@hashbyt/how-to-master-next-js-in-2026-15-advanced-techniques-senior-devs-cant-ignore-93e09f1c728d)
- [React & Next.js Best Practices 2026](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)
- [Future of CRM 2026](https://www.outrightcrm.com/blog/future-of-crm/)
- [Top LLM Frameworks 2026](https://www.secondtalent.com/resources/top-llm-frameworks-for-building-ai-agents/)
- [Drizzle vs Prisma 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [shadcn/ui Best Practices 2026](https://medium.com/write-a-catalyst/shadcn-ui-best-practices-for-2026-444efd204f44)
- [Tailwind CSS v4 Tips](https://www.nikolailehbr.ink/blog/tailwindcss-v4-tips/)
- [React Hook Form vs Formik](https://refine.dev/blog/react-hook-form-vs-formik/)
- [Anthropic Claude + Vercel](https://vercel.com/blog/collaborating-with-anthropic-on-claude-sonnet-4-5)

### Version Verification:
- Next.js 16.1.5 - Latest stable (verified Context7 Jan 2026)
- React 19.x - Current stable with TypeScript 5.7 compatibility
- Vercel AI SDK v6.0.0 - Stable release (beta tag removed Jan 2026)
- Supabase 1.25.04 - Latest version (Context7 verified)
- TypeScript 5.7 - Latest (ES2024 support)
- Tailwind CSS v4 - Stable with Rust engine

---

**Research confidence:** HIGH for all core technologies. MEDIUM for Google Meet API (preview status, potential breaking changes).

**Last updated:** 2026-02-11

**Recommended review date:** 2026-03-11 (1 month) - Check for Next.js 16.2+ updates, AI SDK changes, Google Meet API stability.
