# Phase 10: UI Polish & Performance - Research

**Researched:** 2026-02-13
**Domain:** Next.js 16 App Router UI/UX and performance optimization
**Confidence:** HIGH

## Summary

This research covers implementing investor-grade UI polish and performance optimization for a Next.js 16 dashboard application with Tailwind v4, shadcn/ui, and Supabase. The phase elevates an existing functional investor CRM to production-ready quality suitable for external demo to investors/LPs.

**Key findings:**
- Next.js 16 provides robust performance primitives (React Server Components, Suspense, streaming, granular caching) for dashboard optimization
- Tailwind v4's CSS-first architecture with `@theme` directive and OKLCH colors simplifies brand identity implementation
- shadcn/ui with Radix UI primitives provides accessible, consistent components with built-in WCAG compliance
- Modern loading patterns combine skeleton screens, Suspense boundaries, and streaming for perceived performance
- Performance targets (2s load, 500ms search, 1s real-time) are achievable with proper architecture patterns

**Primary recommendation:** Leverage Next.js 16's React Server Components for static/cached content, wrap dynamic sections in Suspense with skeleton fallbacks, implement CSS variables for brand theming, and use shadcn/ui consistently across all views.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.5 | App framework | Built-in performance optimizations (Turbopack, RSC, streaming), official React framework |
| React | 19.x | UI library | Required by Next.js 16, Server Components support |
| Tailwind CSS | v4.x | Styling | CSS-first architecture with `@theme` directive, OKLCH colors, zero-runtime |
| shadcn/ui | Latest | Component library | Accessible Radix UI primitives, New York style, customizable, WCAG compliant |
| tw-animate-css | Latest | Animations | Tailwind v4 compatible replacement for tailwindcss-animate, CSS-first |
| React Hook Form | 7.66.0 | Form management | Performant, minimal re-renders, official resolver ecosystem |
| Zod | Latest | Validation | Type-safe schemas, integrates with React Hook Form, inline validation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | Latest | Form validation adapter | Integrates Zod with React Hook Form |
| next/image | Built-in | Image optimization | All images, especially logos (auto-optimization, WebP, lazy loading) |
| Lucide React | Latest | Icons | Default icon library for shadcn/ui |
| clsx / tailwind-merge | Latest | Class utilities | Conditional styling, merging Tailwind classes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Material UI, Chakra UI | shadcn/ui provides copy-paste components (no dependency bloat), better Tailwind integration, Radix UI accessibility |
| tw-animate-css | tailwindcss-animate | tw-animate-css is Tailwind v4 compatible (CSS-first), tailwindcss-animate uses deprecated JS plugin system |
| React Hook Form + Zod | Formik + Yup | React Hook Form has better performance (fewer re-renders), Zod has better TypeScript inference |
| OKLCH colors | HSL/RGB | OKLCH is perceptually uniform, future-proof (Safari 16.4+, Chrome 111+, Firefox 128+ support) |

**Installation:**
```bash
# Core dependencies (likely already installed)
npm install next@latest react@latest react-dom@latest
npm install tailwindcss@next
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react clsx tailwind-merge

# shadcn/ui components (install as needed)
npx shadcn@latest add button
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add skeleton
npx shadcn@latest add navigation-menu
npx shadcn@latest add sidebar

# tw-animate-css (download and import)
# Download from https://github.com/Wombosvideo/tw-animate-css
# Add @import "tw-animate-css" to globals.css
npm install -D tw-animate-css
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── (auth)/                # Auth routes (login, register)
├── (dashboard)/           # Main dashboard routes
│   ├── layout.tsx        # Dashboard shell with nav
│   ├── investors/        # Investor views
│   │   ├── page.tsx     # Server Component (cached data)
│   │   ├── loading.tsx  # Route-level skeleton
│   │   └── [...slug]/   # Dynamic routes
│   ├── pipeline/
│   └── activities/
├── api/                   # API routes
├── globals.css            # Tailwind + theme variables
└── layout.tsx             # Root layout

components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── form.tsx
│   ├── skeleton.tsx
│   └── ...
├── investors/             # Feature-specific components
│   ├── investor-table.tsx
│   ├── investor-form.tsx
│   └── investor-skeleton.tsx
├── loading/               # Reusable loading states
│   ├── table-skeleton.tsx
│   ├── card-skeleton.tsx
│   └── ...
└── nav/
    ├── app-sidebar.tsx
    └── breadcrumb.tsx

lib/
├── supabase/
│   ├── client.ts          # Client-side Supabase
│   └── server.ts          # Server-side Supabase
├── validators/            # Zod schemas
│   ├── investor.ts
│   └── activity.ts
└── utils.ts               # cn(), formatters, etc.
```

### Pattern 1: Server Component with Suspense Boundaries

**What:** Leverage React Server Components for data fetching, wrap dynamic sections in Suspense with skeleton fallbacks
**When to use:** Dashboard pages with static shell + dynamic data sections
**Example:**
```typescript
// Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/01-getting-started/07-fetching-data.mdx
import { Suspense } from 'react'
import InvestorTableSkeleton from '@/components/loading/investor-table-skeleton'
import InvestorTable from '@/components/investors/investor-table'

export default function InvestorsPage() {
  return (
    <div>
      {/* Static header - renders immediately */}
      <header>
        <h1>Investor Pipeline</h1>
        <p>Manage your investor relationships</p>
      </header>

      {/* Dynamic table - streams in after data loads */}
      <Suspense fallback={<InvestorTableSkeleton />}>
        <InvestorTable />
      </Suspense>
    </div>
  )
}
```

### Pattern 2: Granular Data Caching Strategies

**What:** Use Next.js 16 cache directives (`use cache`, `force-cache`, `no-store`, `revalidate`) for optimal performance
**When to use:** Differentiate between static, shared, and user-specific data
**Example:**
```typescript
// Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/03-file-conventions/loading.mdx
import { cacheLife, cacheTag } from 'next/cache'

// Static data - cached at build time, shared across users
async function getInvestorStages() {
  'use cache'
  cacheTag('stages')
  // Pipeline stages don't change often
  return db.stages.findAll()
}

// Dynamic shared data - cached at runtime with TTL
async function getInvestorCounts() {
  'use cache: remote'
  cacheTag('investor-counts')
  cacheLife({ expire: 60 }) // 1 minute
  // Counts update frequently but same for all users
  return db.investors.count({ groupBy: 'stage' })
}

// User-specific data - private cache per user
async function getUserPreferences() {
  'use cache: private'
  cacheLife({ expire: 300 }) // 5 minutes
  const userId = await getSessionUserId()
  return db.preferences.find({ where: { userId } })
}
```

### Pattern 3: Brand Identity with CSS Variables

**What:** Define brand colors and typography as CSS variables in Tailwind v4's `@theme` directive
**When to use:** Implementing Prytaneum/Valkyrie brand identity
**Example:**
```css
/* Source: https://ui.shadcn.com/docs/theming + https://tailwindcss.com/docs/theme */
/* app/globals.css */

@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Prytaneum/Valkyrie brand colors (OKLCH) */
  --color-brand-primary: oklch(0.45 0.15 250);  /* Deep blue */
  --color-brand-gold: oklch(0.75 0.12 85);      /* Gold accent */

  /* Override shadcn/ui defaults for dark theme */
  --color-background: oklch(0.14 0.00 286);     /* Near-black */
  --color-foreground: oklch(0.985 0 0);         /* Near-white */
  --color-primary: oklch(0.45 0.15 250);        /* Brand primary */
  --color-accent: oklch(0.75 0.12 85);          /* Brand gold */

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-heading: "Montserrat", system-ui, sans-serif;
}

/* Use in components: bg-brand-primary, text-brand-gold, font-heading */
```

### Pattern 4: Form Validation with Zod + React Hook Form + shadcn/ui

**What:** Type-safe inline validation with helpful error messages
**When to use:** All forms (investor CRUD, activities, filters)
**Example:**
```typescript
// Source: https://github.com/react-hook-form/documentation/blob/master/src/content/get-started.mdx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const investorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  stage: z.enum(['lead', 'qualified', 'meeting', 'negotiation', 'commitment'])
})

type InvestorFormData = z.infer<typeof investorSchema>

export function InvestorForm({ onSubmit }: { onSubmit: (data: InvestorFormData) => void }) {
  const form = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: { name: '', email: '', stage: 'lead' }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <div>
              <FormControl>
                <Input placeholder="Investor name" {...field} />
              </FormControl>
              <FormMessage /> {/* Shows inline error */}
            </div>
          )}
        />
        <Button type="submit">Save Investor</Button>
      </form>
    </Form>
  )
}
```

### Pattern 5: Loading States with Skeleton Screens

**What:** Match skeleton shapes to actual content layout using shadcn/ui Skeleton component
**When to use:** All async content loads (tables, cards, lists)
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/radix/skeleton
import { Skeleton } from '@/components/ui/skeleton'

export function InvestorTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-[200px]" /> {/* Search input */}
        <Skeleton className="h-8 w-[100px]" /> {/* Filter button */}
      </div>

      {/* Table rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-[40px]" />  {/* Checkbox */}
            <Skeleton className="h-12 flex-1" />     {/* Name */}
            <Skeleton className="h-12 w-[150px]" /> {/* Stage */}
            <Skeleton className="h-12 w-[100px]" /> {/* Actions */}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 6: Responsive Navigation with shadcn/ui Sidebar

**What:** Mobile-responsive sidebar with keyboard navigation and WCAG compliance
**When to use:** Main application navigation
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/radix/sidebar (inferred pattern)
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card">
      <NavigationMenu orientation="vertical" className="p-4">
        <NavigationMenuItem>
          <NavigationMenuLink href="/dashboard" className={cn(/* styles */)}>
            Dashboard
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/investors" className={cn(/* styles */)}>
            Investors
          </NavigationMenuLink>
        </NavigationMenuItem>
        {/* More nav items */}
      </NavigationMenu>
    </aside>
  )
}
```

### Pattern 7: Image Optimization for Logos

**What:** Use Next.js Image component with priority flag for above-the-fold logos
**When to use:** All images, especially logos and brand assets
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/images
import Image from 'next/image'

export function AppHeader() {
  return (
    <header className="flex items-center gap-4 p-4">
      <Image
        src="/logos/prytaneum-logo.svg"
        alt="Prytaneum"
        width={120}
        height={40}
        priority // Load immediately (above-the-fold)
        className="h-10 w-auto"
      />
      <Image
        src="/logos/valkyrie-logo.svg"
        alt="Valkyrie"
        width={120}
        height={40}
        priority
        className="h-10 w-auto"
      />
    </header>
  )
}
```

### Pattern 8: Performance Monitoring with Core Web Vitals

**What:** Track LCP, INP, CLS metrics using Next.js built-in instrumentation
**When to use:** Production monitoring to validate performance targets
**Example:**
```typescript
// Source: https://nextjs.org/docs/pages/api-reference/functions/use-report-web-vitals
// instrumentation-client.ts (root of project)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'browser') {
    const { reportWebVitals } = await import('./lib/report-web-vitals')
    reportWebVitals({
      onLCP: (metric) => console.log('LCP:', metric.value, 'ms'),
      onINP: (metric) => console.log('INP:', metric.value, 'ms'),
      onCLS: (metric) => console.log('CLS:', metric.value),
    })
  }
}
```

### Anti-Patterns to Avoid

- **Client-side data fetching for initial load:** Use Server Components instead for better performance and SEO
- **Global loading states:** Use Suspense boundaries for granular loading (prevents flash of loading UI on cached routes)
- **Inline styles over Tailwind classes:** Loses design system consistency and increases CSS bloat
- **Custom form validation logic:** Use Zod schemas to avoid reimplementing validation rules
- **Generic loading spinners:** Use skeleton screens that match content layout for better perceived performance
- **Fetching all data upfront:** Use streaming and progressive loading for large datasets
- **Ignoring accessibility:** shadcn/ui provides WCAG compliance out of the box, don't break it with custom implementations
- **Hardcoded colors:** Use CSS variables for brand colors to enable easy theming

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic with useState | Zod + React Hook Form | Type safety, reusable schemas, server/client validation, inline errors, less code |
| Loading states | Custom loading flags with useState | Suspense + loading.tsx | Native React feature, automatic, SSR-friendly, better UX |
| Color theming | CSS classes with hardcoded colors | Tailwind v4 `@theme` with CSS variables | Runtime theming, design tokens, consistent palette, easy brand updates |
| UI components | Custom buttons, inputs, modals | shadcn/ui | Accessibility (WCAG), keyboard navigation, focus management, battle-tested |
| Image optimization | `<img>` tags | Next.js Image component | Auto WebP, lazy loading, responsive sizes, layout shift prevention |
| Icons | Custom SVG imports | Lucide React | Consistent design, tree-shakeable, 1000+ icons, TypeScript types |
| Class merging | Manual string concatenation | clsx + tailwind-merge | Handles conditional classes, resolves Tailwind conflicts |
| Skeleton screens | Animated divs with custom CSS | shadcn/ui Skeleton | Consistent animation, matches design system, accessible |
| Navigation prefetching | Manual prefetch logic | Next.js Link component | Automatic viewport-based prefetch, layout deduplication, incremental |
| Performance monitoring | Custom analytics | Next.js instrumentation + useReportWebVitals | Native Core Web Vitals tracking, Vercel Analytics integration |

**Key insight:** Next.js 16 + Tailwind v4 + shadcn/ui provide a complete design system with performance optimizations built-in. Custom solutions often miss edge cases (accessibility, keyboard nav, focus management, responsive behavior, dark mode) that battle-tested libraries handle automatically.

## Common Pitfalls

### Pitfall 1: Client Components Blocking Server Components
**What goes wrong:** Wrapping Server Components in Client Components prevents streaming and increases bundle size
**Why it happens:** Developers add 'use client' too high in component tree or wrap entire pages
**How to avoid:** Keep 'use client' boundary as low as possible—only interactive components need it. Server Components can render Client Components, but not vice versa.
**Warning signs:** Slow page loads, large bundle sizes, loss of streaming benefits
**Prevention strategy:** Start with Server Components by default, add 'use client' only when using hooks (useState, useEffect) or browser APIs

### Pitfall 2: Over-Fetching Data in Dashboard Views
**What goes wrong:** Loading all 80+ investors at once causes 2+ second load times
**Why it happens:** Fetching entire dataset without pagination or virtualization
**How to avoid:** Implement server-side pagination (10-25 records per page), use Supabase range queries, add search/filter on server
**Warning signs:** Slow initial page load, database query timeouts, poor UX on mobile
**Prevention strategy:** Load minimal data for initial view, paginate or virtualize for large lists

### Pitfall 3: Real-Time Subscription Overload
**What goes wrong:** Subscribing to all investor changes causes performance degradation with multiple users
**Why it happens:** Too many active Supabase subscriptions or overly broad filters
**How to avoid:** Subscribe only to current view (e.g., only investors on current page), unsubscribe on unmount, use filters in subscription
**Warning signs:** Increased latency, Supabase connection limits, unnecessary re-renders
**Prevention strategy:** Limit subscriptions to 1-2 per page, use RLS filters, consider polling for non-critical updates

### Pitfall 4: Layout Shift from Missing Image Dimensions
**What goes wrong:** Logo/images load and cause content to jump (poor CLS score)
**Why it happens:** Not specifying width/height on Image components
**How to avoid:** Always provide width/height props (or use fill mode), add priority flag for above-the-fold images
**Warning signs:** Visible content jumping during page load, poor Core Web Vitals CLS score
**Prevention strategy:** Measure all logos/images, specify exact dimensions in Image component

### Pitfall 5: Inconsistent Component Usage
**What goes wrong:** Mixing custom buttons with shadcn/ui buttons creates visual inconsistency
**Why it happens:** Adding custom components without checking shadcn/ui library first
**How to avoid:** Create components.json config, audit all components to use shadcn/ui, customize via className instead of new components
**Warning signs:** Inconsistent spacing, colors, hover states, accessibility issues
**Prevention strategy:** Use shadcn/ui components exclusively, extend via Tailwind classes not new components

### Pitfall 6: Blocking Render with Sequential Data Fetches
**What goes wrong:** Waterfalling data fetches (fetch A, then fetch B, then fetch C) causes slow page loads
**Why it happens:** Sequential await statements in Server Components
**How to avoid:** Use Promise.all() to parallelize independent fetches, split into separate Suspense boundaries
**Warning signs:** Slow TTFB, sequential network requests in DevTools
**Prevention strategy:** Identify independent data fetches, parallelize with Promise.all()

### Pitfall 7: Missing Loading States for User Actions
**What goes wrong:** Button clicks with no feedback frustrate users during async operations
**Why it happens:** Forgetting to add loading state to buttons during form submission or mutations
**How to avoid:** Use React Hook Form's isSubmitting state, shadcn/ui Button loading prop, disable during async operations
**Warning signs:** Multiple form submissions, user confusion about whether action worked
**Prevention strategy:** Always show loading state for async user actions (submit, save, delete)

### Pitfall 8: Hardcoding Brand Colors
**What goes wrong:** Cannot easily update brand colors, dark mode breaks, inconsistent palette
**Why it happens:** Using Tailwind classes with default colors instead of CSS variables
**How to avoid:** Define brand colors in @theme directive, use semantic names (brand-primary, brand-gold)
**Warning signs:** Search codebase shows bg-blue-500 instead of bg-brand-primary
**Prevention strategy:** Define all brand colors as CSS variables, never use default color palette for brand-specific elements

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Dashboard Page with Streaming

```typescript
// app/(dashboard)/investors/page.tsx
// Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/01-getting-started/07-fetching-data.mdx
import { Suspense } from 'react'
import { InvestorTable } from '@/components/investors/investor-table'
import { InvestorStats } from '@/components/investors/investor-stats'
import { InvestorTableSkeleton } from '@/components/loading/investor-table-skeleton'
import { StatsCardsSkeleton } from '@/components/loading/stats-cards-skeleton'

export default function InvestorsPage() {
  return (
    <div className="container py-8 space-y-8">
      {/* Static header - renders immediately */}
      <header>
        <h1 className="text-3xl font-heading font-bold">Investor Pipeline</h1>
        <p className="text-muted-foreground">
          Track your investor relationships from lead to commitment
        </p>
      </header>

      {/* Stats cards - load independently */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <InvestorStats />
      </Suspense>

      {/* Main table - streams in after data loads */}
      <Suspense fallback={<InvestorTableSkeleton />}>
        <InvestorTable />
      </Suspense>
    </div>
  )
}
```

### Example 2: Investor Form with Inline Validation

```typescript
// components/investors/investor-form.tsx
// Source: https://github.com/react-hook-form/documentation/blob/master/src/content/get-started.mdx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const investorSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  firm: z.string().min(1, { message: 'Firm is required' }),
  stage: z.enum(['lead', 'qualified', 'meeting', 'negotiation', 'commitment']),
  checkSize: z.number().min(0, { message: 'Check size must be positive' }).optional(),
})

type InvestorFormData = z.infer<typeof investorSchema>

export function InvestorForm({
  defaultValues,
  onSubmit
}: {
  defaultValues?: Partial<InvestorFormData>
  onSubmit: (data: InvestorFormData) => Promise<void>
}) {
  const form = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: defaultValues ?? {
      name: '',
      email: '',
      firm: '',
      stage: 'lead',
    }
  })

  async function handleSubmit(data: InvestorFormData) {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      // Handle error
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage /> {/* Shows inline error */}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="commitment">Commitment</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Investor'}
        </Button>
      </form>
    </Form>
  )
}
```

### Example 3: Brand Identity Theme Configuration

```css
/* app/globals.css */
/* Source: https://ui.shadcn.com/docs/theming + https://tailwindcss.com/docs/theme */

@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Prytaneum/Valkyrie Brand Identity */
  --color-brand-primary: oklch(0.45 0.15 250);     /* Deep blue */
  --color-brand-primary-hover: oklch(0.40 0.15 250);
  --color-brand-gold: oklch(0.75 0.12 85);         /* Gold accent */
  --color-brand-gold-hover: oklch(0.70 0.12 85);

  /* Dark theme base (default for Valkyrie aesthetic) */
  --color-background: oklch(0.14 0.00 286);        /* Near-black */
  --color-foreground: oklch(0.985 0 0);            /* Near-white */

  /* Override shadcn/ui semantic colors */
  --color-primary: oklch(0.45 0.15 250);           /* Brand primary */
  --color-primary-foreground: oklch(0.985 0 0);
  --color-accent: oklch(0.75 0.12 85);             /* Brand gold */
  --color-accent-foreground: oklch(0.14 0.00 286);

  --color-card: oklch(0.21 0.006 285.885);
  --color-card-foreground: oklch(0.985 0 0);

  --color-border: oklch(1 0 0 / 10%);
  --color-input: oklch(1 0 0 / 15%);

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-heading: "Montserrat", system-ui, -apple-system, sans-serif;
  --font-mono: "Fira Code", "Consolas", monospace;

  /* Spacing & sizing for dashboard */
  --radius: 0.625rem;
  --spacing-section: 2rem;
  --spacing-card: 1.5rem;
}

/* Light theme override (if needed) */
.light {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.14 0.00 286);
  --color-primary: oklch(0.45 0.15 250);
  --color-primary-foreground: oklch(0.985 0 0);
  /* ... other light mode overrides */
}

/* Apply base styles */
@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}
```

### Example 4: Table Skeleton with Matching Layout

```typescript
// components/loading/investor-table-skeleton.tsx
// Source: https://ui.shadcn.com/docs/components/radix/skeleton
import { Skeleton } from '@/components/ui/skeleton'

export function InvestorTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filter bar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-sm" /> {/* Search input */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" /> {/* Stage filter */}
          <Skeleton className="h-10 w-[100px]" /> {/* Sort */}
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-4 border-b pb-3">
        <Skeleton className="h-4 w-[40px]" />  {/* Checkbox */}
        <Skeleton className="h-4 flex-1" />     {/* Name */}
        <Skeleton className="h-4 w-[150px]" /> {/* Firm */}
        <Skeleton className="h-4 w-[120px]" /> {/* Stage */}
        <Skeleton className="h-4 w-[100px]" /> {/* Check Size */}
        <Skeleton className="h-4 w-[80px]" />  {/* Actions */}
      </div>

      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-[40px]" />  {/* Checkbox */}
            <Skeleton className="h-12 flex-1" />     {/* Name */}
            <Skeleton className="h-12 w-[150px]" /> {/* Firm */}
            <Skeleton className="h-12 w-[120px]" /> {/* Stage */}
            <Skeleton className="h-12 w-[100px]" /> {/* Check Size */}
            <Skeleton className="h-12 w-[80px]" />  {/* Actions */}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-9 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
      </div>
    </div>
  )
}
```

### Example 5: Cached Data Fetching with Revalidation

```typescript
// app/(dashboard)/investors/investor-table.tsx (Server Component)
// Source: https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/01-directives/use-cache-remote.mdx
import { createServerClient } from '@/lib/supabase/server'
import { cacheLife, cacheTag } from 'next/cache'

async function getInvestors() {
  'use cache: remote'
  cacheTag('investors')
  cacheLife({ expire: 60 }) // Cache for 1 minute

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) throw error
  return data
}

export async function InvestorTable() {
  const investors = await getInvestors()

  return (
    <div className="rounded-lg border">
      {/* Render table with investors data */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Firm</th>
            <th>Stage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((investor) => (
            <tr key={investor.id}>
              <td>{investor.name}</td>
              <td>{investor.firm}</td>
              <td>{investor.stage}</td>
              <td>{/* Actions */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next.js 13+ (stable in 14+) | Server Components, streaming, layouts, better data fetching |
| Webpack | Turbopack | Next.js 16 (stable) | 2-5× faster builds, 10× faster Fast Refresh |
| JavaScript config (tailwind.config.js) | CSS-first (@theme directive) | Tailwind v4 (2024) | Zero-runtime, better performance, easier sharing, CSS variables |
| tailwindcss-animate | tw-animate-css | Tailwind v4 migration | Compatible with v4 CSS-first architecture |
| HSL/RGB colors | OKLCH colors | 2023+ (browser support) | Perceptually uniform, better gradients, future-proof |
| getStaticProps/getServerSideProps | Server Components + fetch cache | Next.js 13+ App Router | More granular caching, simpler mental model |
| Client-side data fetching (useEffect) | Server Components | React 18+ | Better performance, SEO, smaller bundle |
| FID (First Input Delay) | INP (Interaction to Next Paint) | 2024 Core Web Vitals update | Better measure of responsiveness |
| Manual prefetching | Automatic layout deduplication | Next.js 16 | Smarter prefetching, less bandwidth |

**Deprecated/outdated:**
- **tailwindcss-animate:** Replaced by tw-animate-css for Tailwind v4 compatibility (uses deprecated JS plugin system)
- **Pages Router:** Still supported but App Router is recommended for new projects
- **Client Components for data fetching:** Use Server Components by default, Client Components only for interactivity
- **Inline fetch without cache options:** Always specify caching strategy (force-cache, no-store, revalidate)
- **FID metric:** Replaced by INP in Core Web Vitals (measures total interaction latency, not just input delay)

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase Real-Time Performance at Scale**
   - What we know: Single-threaded Postgres Changes can bottleneck at scale, Broadcast is multi-threaded
   - What's unclear: Exact performance with 4 concurrent users subscribing to 80+ investor updates
   - Recommendation: Test with realistic load, consider switching to Broadcast if bottlenecks occur, implement subscription filters

2. **Prytaneum/Valkyrie Logo Formats**
   - What we know: Next.js Image component supports SVG, PNG, JPG, WebP
   - What's unclear: Which format Prytaneum/Valkyrie logos exist in, whether they need conversion
   - Recommendation: Use SVG for logos if available (scalable, small file size), PNG with transparency as fallback

3. **Target Device Resolution Range**
   - What we know: 1280px minimum stated in requirements
   - What's unclear: Maximum resolution to test (1920px? 2560px? 4K?), whether laptop 13" (1440x900) is in scope
   - Recommendation: Test 1280px-1920px as primary range, ensure fluid typography scales well to 2560px+

4. **Performance Budget for 100 Investors**
   - What we know: Target is <2s for pipeline views with 100 investors
   - What's unclear: Whether this includes only initial HTML or fully interactive (TTI), whether client-side filtering is acceptable
   - Recommendation: Measure LCP (Largest Contentful Paint) as proxy, implement server-side pagination if approaching limit

5. **Dark Mode Exclusivity**
   - What we know: Dark theme is default (Valkyrie aesthetic)
   - What's unclear: Whether light mode toggle is needed for investor demo, or dark-only is acceptable
   - Recommendation: Implement dark-only initially, add light mode toggle only if explicitly requested (saves scope)

## Sources

### Primary (HIGH confidence)

- [Next.js v16.1.5 Documentation](https://github.com/vercel/next.js/blob/v16.1.5/docs/) - App Router, Server Components, caching, performance
- [shadcn/ui Documentation](https://ui.shadcn.com/docs) - Components, theming, accessibility patterns
- [React Hook Form Documentation](https://github.com/react-hook-form/documentation) - Form validation, Zod integration
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - v4 theming, @theme directive, OKLCH colors
- Context7 queries for Next.js 16, shadcn/ui, React Hook Form

### Secondary (MEDIUM confidence)

- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) - Turbopack stability, routing improvements (verified with official source)
- [Tailwind v4 Guide](https://tailkits.com/blog/tailwind-v4-custom-colors/) - Custom colors implementation (verified with docs)
- [tw-animate-css GitHub](https://github.com/Wombosvideo/tw-animate-css) - Tailwind v4 animation library (official replacement)
- [Supabase Real-Time Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks) - Performance characteristics (official docs)
- [shadcn/ui Accessibility Guide](https://www.newline.co/@eyalcohen/alt-text-and-beyond-making-your-website-accessible-with-shadcnui--0dd38704) - WCAG compliance patterns (verified with Radix UI docs)

### Tertiary (LOW confidence)

- WebSearch results for investor-grade UI patterns (multiple sources, general best practices, not specific to stack)
- WebSearch results for responsive testing tools (informational, no implementation details)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 or official docs, versions confirmed
- Architecture: HIGH - Next.js 16 patterns from official docs, shadcn/ui from official site, React Hook Form from Context7
- Pitfalls: MEDIUM - Based on Next.js 16 docs and common patterns, some inferred from community experience
- Performance targets: MEDIUM - General Next.js capabilities verified, specific targets (2s, 500ms, 1s) need validation with actual data

**Research date:** 2026-02-13
**Valid until:** ~30 days (Next.js/React stable, Tailwind v4 recently released but stable)

## Sources Referenced

**Brand Identity Implementation:**
- [Custom Colours in Tailwind CSS v4](https://medium.com/@dvasquez.422/custom-colours-in-tailwind-css-v4-acc3322cd2da)
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind v4 Colors: Add & Customize Fast](https://tailkits.com/blog/tailwind-v4-custom-colors/)
- [shadcn/ui Theming Documentation](https://ui.shadcn.com/docs/theming)

**Investor-Grade UI Quality:**
- [Fintech UI Examples to Build Trust](https://www.eleken.co/blog-posts/trusted-fintech-ui-examples)
- [B2B SaaS UX Design in 2026: Challenges & Patterns](https://www.onething.design/post/b2b-saas-ux-design)
- [Successful Investment Platform UI/UX Best Practices](https://rondesignlab.com/blog/design-news/most-sucessful-practices-for-investment-platform-ui-ux)
- [7 Latest Fintech UX Design Trends & Case Studies for 2026](https://www.designstudiouiux.com/blog/fintech-ux-design-trends/)

**Performance Optimization:**
- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16)
- [I Migrated a React App to Next.js 16 and Got a 218% Performance Boost](https://medium.com/@desertwebdesigns/i-migrated-a-react-app-to-next-js-16-and-got-a-218-performance-boost-on-mobile-8ae35ee2a739)
- [Next.js 16 Deep Dive: Performance, Caching, & the Future of React Apps](https://medium.com/@rtsekov/next-js-16-deep-dive-performance-caching-the-future-of-react-apps-76c1e55c583a)

**Loading States & Skeletons:**
- [Best Practices for Loading States in Next.js](https://www.getfishtank.com/insights/best-practices-for-loading-states-in-nextjs)
- [Next.js loading.js File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Enhancing User Experience with Skeleton Loaders in React.js and Next.js](https://medium.com/@pysquad/enhancing-user-experience-with-skeleton-loaders-in-react-js-and-next-js-86b80b89e59d)
- [shadcn/ui Skeleton Component](https://ui.shadcn.com/docs/components/radix/skeleton)

**Responsive Design & Testing:**
- [BrowserStack Responsive Testing](https://www.browserstack.com/responsive)
- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [Responsive Viewer](https://responsiveviewer.org/)

**Form Validation:**
- [Learn Zod validation with React Hook Form](https://www.contentful.com/blog/react-hook-form-validation-zod/)
- [How to Validate Forms with Zod and React-Hook-Form](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)
- [Zod React Hook Form: Complete Guide 2026](https://practicaldev.online/blog/reactjs/react-hook-form-zod-validation-guide)

**Performance Monitoring:**
- [Next.js useReportWebVitals](https://nextjs.org/docs/pages/api-reference/functions/use-report-web-vitals)
- [Next.js Web Performance & Core Web Vitals](https://nextjs.org/learn/seo/web-performance)
- [Tracking Web Vitals in Next.js with OpenTelemetry](https://signoz.io/blog/opentelemetry-nextjs-web-vitals/)

**Navigation & Accessibility:**
- [Alt-Text and Beyond: Making Your Website Accessible with shadcn/ui](https://www.newline.co/@eyalcohen/alt-text-and-beyond-making-your-website-accessible-with-shadcnui--0dd38704)
- [Building Stunning and Accessible Navigation Menus with ShadCN](https://www.antstack.com/blog/building-stunning-and-accessible-navigation-menus-with-shad-cn-ant-stack/)
- [Accessible Navigation Example 2026 - WCAG 2.2 Compliant Guide](https://www.thewcag.com/examples/navigation)

**Next.js Prefetching:**
- [Next.js Prefetching Documentation](https://nextjs.org/docs/app/guides/prefetching)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)

**Animations:**
- [tw-animate-css GitHub Repository](https://github.com/Wombosvideo/tw-animate-css)
- [tw-animate-css npm Package](https://www.npmjs.com/package/tw-animate-css)

**Image Optimization:**
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images)
- [Next.js Image Optimization: Best Practices for Performance](https://learn.programming-hero.com/nextjs-image-optimization/)

**Supabase Real-Time:**
- [Supabase Real-Time Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [How to Implement Supabase Realtime in Your Project](https://chat2db.ai/resources/blog/supabase-realtime-guide)
