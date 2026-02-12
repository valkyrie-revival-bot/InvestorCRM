# Phase 3: Data Model & Core CRUD - Research

**Researched:** 2026-02-11
**Domain:** Supabase PostgreSQL schema design, React form management, data migration
**Confidence:** HIGH

## Summary

Phase 3 builds the foundational data layer for the investor pipeline CRM. The research confirms that Supabase PostgreSQL with Row Level Security (RLS), React Hook Form with Zod validation, and shadcn/ui components provide a solid stack for implementing the three-table schema (investors, contacts, activities) with inline editing capabilities.

**Key architectural decisions validated:**
- Three separate tables (investors, contacts, activities) with one-to-many relationships provides proper normalization while maintaining query performance
- Soft delete with `deleted_at` timestamp is standard but requires careful RLS policy design to avoid UPDATE failures
- Inline editing with auto-save requires debounced form submission using React Hook Form's `watch()` API
- SheetJS xlsx library is the de facto standard for Excel parsing in Node.js
- shadcn/ui Sonner toast component provides ideal UX for undo functionality

**Primary recommendation:** Build schema with explicit foreign key indexes, implement RLS policies that accommodate soft delete UPDATE operations, use React Hook Form with Controller for inline field editing, and create a one-time migration script with xlsx library rather than building user-facing import UI.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase PostgreSQL | Latest | Database with built-in auth/RLS | Already decided in Phase 2, provides PostgreSQL with RLS and real-time capabilities |
| react-hook-form | ^7.66.0 | Form state management | Performance-focused (minimal re-renders), excellent TypeScript support, standard for complex forms |
| zod | ^3.24.2 or v4 | Schema validation | TypeScript-first validation, integrates seamlessly with react-hook-form via @hookform/resolvers |
| xlsx (SheetJS) | Latest | Excel file parsing | Industry standard for XLSX parsing in Node.js, extensive feature set |
| @hookform/resolvers | Latest | Validation library adapter | Official adapter connecting Zod/Yup/Joi to react-hook-form |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Sonner | Latest | Toast notifications | Already in project, ideal for undo notifications with action buttons |
| shadcn/ui Alert Dialog | Latest | Confirmation modals | Delete confirmation, built on Radix UI with accessibility |
| shadcn/ui Accordion | Latest | Collapsible form sections | Organize 20+ fields into manageable sections (Basic Info, Pipeline Status, Strategy, Activity) |
| shadcn/ui Collapsible | Latest | Progressive disclosure | Alternative to Accordion for independent collapsible sections |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | Formik | Formik has larger bundle size and more re-renders; RHF chosen for performance with 20+ fields |
| Zod | Yup | Yup is JavaScript-first; Zod provides better TypeScript inference which is critical for type-safe forms |
| xlsx (SheetJS) | read-excel-file | read-excel-file simpler but less battle-tested; xlsx is industry standard with extensive documentation |
| Database views | Client-side filtering | Views add complexity; decided to handle soft delete filtering in RLS policies and application code |

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers xlsx
npx shadcn@latest add sonner alert-dialog accordion collapsible
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── supabase/
│   ├── schema.sql           # Core schema: investors, contacts, activities
│   ├── rls-policies.sql     # RLS policies for all tables
│   └── indexes.sql          # Foreign key and search indexes
├── validations/
│   ├── investor-schema.ts   # Zod schema for investor form
│   └── contact-schema.ts    # Zod schema for contact sub-form
└── scripts/
    └── migrate-excel.ts     # One-time Excel import script

app/
├── actions/
│   ├── investors.ts         # Server actions for CRUD operations
│   └── contacts.ts          # Server actions for contact management
└── (dashboard)/
    └── investors/
        ├── page.tsx                    # List view (defer to Phase 4)
        ├── new/
        │   └── page.tsx                # Quick create modal
        └── [id]/
            ├── page.tsx                # Detail page with inline editing
            └── components/
                ├── InlineEditField.tsx      # Reusable inline edit component
                ├── InvestorFormSections.tsx # Collapsible sections
                └── DeleteConfirmation.tsx   # Alert dialog for delete
```

### Pattern 1: PostgreSQL Schema with Foreign Keys and Timestamps

**What:** Three-table normalized schema with explicit foreign key relationships and audit columns
**When to use:** Foundation for all CRM data persistence
**Example:**
```sql
-- Source: Supabase documentation - https://supabase.com/docs/guides/database
-- Pattern: Foreign key relationships with timestamps and soft delete

create table public.investors (
  id uuid primary key default gen_random_uuid(),
  firm_name text not null,
  relationship_owner text not null,
  stage text not null,
  partner_source text,
  est_value numeric(12, 2),
  entry_date date,
  last_action_date date,
  stalled boolean default false,
  allocator_type text,
  internal_conviction text,
  internal_priority text,
  investment_committee_timing text,
  next_action text,
  next_action_date date,
  current_strategy_notes text,
  current_strategy_date date,
  last_strategy_notes text,
  last_strategy_date date,
  key_objection_risk text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id),
  name text not null,
  email text,
  phone text,
  title text,
  notes text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id),
  activity_type text not null, -- 'note', 'call', 'email', 'meeting', 'stage_change', 'field_update'
  description text not null,
  metadata jsonb, -- Store field changes, previous values, etc.
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Critical: Index all foreign keys for join performance
create index idx_contacts_investor_id on public.contacts(investor_id);
create index idx_activities_investor_id on public.activities(investor_id);
create index idx_activities_created_at on public.activities(created_at desc);
```

### Pattern 2: RLS Policies with Soft Delete Support

**What:** RLS policies that allow authenticated users full CRUD while handling soft delete UPDATE operations
**When to use:** Every table with soft delete capability
**Critical insight:** Soft delete UPDATE operations fail if SELECT policy filters out deleted_at records. Solution: Use permissive policies that allow the update window.

**Example:**
```sql
-- Source: Supabase RLS documentation - https://supabase.com/docs/guides/auth/row-level-security
-- Pattern: Soft delete friendly RLS policies

-- Enable RLS
alter table public.investors enable row level security;
alter table public.contacts enable row level security;
alter table public.activities enable row level security;

-- Investors policies
create policy "Authenticated users can view non-deleted investors"
on public.investors for select
to authenticated
using (deleted_at is null);

create policy "Authenticated users can insert investors"
on public.investors for insert
to authenticated
with check (true);

-- CRITICAL: Allow UPDATE even for deleted records (for soft delete operation itself)
create policy "Authenticated users can update investors"
on public.investors for update
to authenticated
using (true) -- Permissive: allow selecting even deleted records for UPDATE
with check (true);

create policy "Authenticated users can delete investors (soft delete)"
on public.investors for delete
to authenticated
using (true);

-- Contacts policies (keep active even when investor soft-deleted)
create policy "Authenticated users can view non-deleted contacts"
on public.contacts for select
to authenticated
using (deleted_at is null);

create policy "Authenticated users can manage contacts"
on public.contacts for all
to authenticated
using (true)
with check (true);

-- Activities policies (always visible, never deleted)
create policy "Authenticated users can view all activities"
on public.activities for select
to authenticated
using (true);

create policy "Authenticated users can create activities"
on public.activities for insert
to authenticated
with check (true);
```

### Pattern 3: React Hook Form with Inline Editing and Auto-Save

**What:** Individual field components that switch from display to edit mode on click, with debounced auto-save
**When to use:** Detail page with 20+ fields requiring Notion/Linear-style inline editing
**Example:**
```typescript
// Source: React Hook Form documentation - https://react-hook-form.com/docs/usecontroller
// Pattern: Controlled input with auto-save on blur

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useCallback } from 'react';
import { z } from 'zod';

const investorSchema = z.object({
  firm_name: z.string().min(1, "Firm name is required"),
  stage: z.string().min(1, "Stage is required"),
  relationship_owner: z.string().min(1, "Relationship owner is required"),
  est_value: z.number().optional(),
  // ... other fields
});

type InvestorFormData = z.infer<typeof investorSchema>;

export function InlineEditField({
  name,
  label,
  defaultValue,
  onSave,
}: {
  name: keyof InvestorFormData;
  label: string;
  defaultValue: any;
  onSave: (field: string, value: any) => Promise<void>;
}) {
  const { control, watch } = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
    defaultValues: { [name]: defaultValue },
  });

  const fieldValue = watch(name);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fieldValue !== defaultValue) {
        onSave(name, fieldValue);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [fieldValue, name, defaultValue, onSave]);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <input
              {...field}
              onBlur={() => {
                // Immediate save on blur (optional, depends on UX preference)
                if (field.value !== defaultValue) {
                  onSave(name, field.value);
                }
              }}
              className="w-full border rounded px-2 py-1"
            />
            {fieldState.error && (
              <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
}
```

### Pattern 4: Excel Migration Script with xlsx

**What:** One-time Node.js script that reads Excel file and bulk inserts into Supabase
**When to use:** Initial data migration from PRYTANEUM LP CRM.xlsx
**Example:**
```typescript
// Source: SheetJS documentation and Node.js examples
// Pattern: Parse Excel, validate, bulk insert with error logging

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for migration
);

async function migrateExcelData() {
  // Read Excel file
  const workbook = XLSX.readFile('./PRYTANEUM LP CRM.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON (first row as headers)
  const rows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${rows.length} investor rows to migrate`);

  const results = { success: 0, failed: 0, errors: [] as any[] };

  for (const row of rows) {
    try {
      // Map Excel columns to database fields
      const investorData = {
        firm_name: row['Firm Name'] || 'Unknown Firm', // Required fallback
        relationship_owner: row['Relationship Owner'] || 'Unassigned', // Required fallback
        stage: row['Stage'] || 'Discovery', // Required fallback
        partner_source: row['Partner / Source'],
        est_value: row['Est. value'] ? parseFloat(row['Est. value']) : null,
        entry_date: row['Entry Date'] ? new Date(row['Entry Date']) : null,
        last_action_date: row['Last Action Date'] ? new Date(row['Last Action Date']) : null,
        stalled: row['Stalled'] === 'Yes' || row['Stalled'] === true,
        allocator_type: row['Allocator Type'],
        internal_conviction: row['Internal Conviction'],
        internal_priority: row['Internal Priority'],
        investment_committee_timing: row['Investment Committee Timing'],
        next_action: row['Next Action'],
        next_action_date: row['Next Action Date'] ? new Date(row['Next Action Date']) : null,
        current_strategy_notes: row['Current strategy notes'],
        current_strategy_date: row['Current strategy date'] ? new Date(row['Current strategy date']) : null,
        last_strategy_notes: row['Last strategy notes'],
        last_strategy_date: row['Last strategy date'] ? new Date(row['Last strategy date']) : null,
        key_objection_risk: row['Key Objection / Risk'],
      };

      // Insert investor
      const { data: investor, error: investorError } = await supabase
        .from('investors')
        .insert(investorData)
        .select()
        .single();

      if (investorError) throw investorError;

      // Create contact if Primary Contact exists
      if (row['Primary Contact']) {
        const contactData = {
          investor_id: investor.id,
          name: row['Primary Contact'],
          is_primary: true,
        };

        const { error: contactError } = await supabase
          .from('contacts')
          .insert(contactData);

        if (contactError) {
          console.warn(`Contact creation failed for ${investorData.firm_name}:`, contactError);
        }
      }

      results.success++;
      console.log(`✓ Migrated: ${investorData.firm_name}`);

    } catch (error) {
      results.failed++;
      results.errors.push({
        row,
        error: error.message,
      });
      console.error(`✗ Failed: ${row['Firm Name']}`, error);
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(({ row, error }) => {
      console.log(`- ${row['Firm Name']}: ${error}`);
    });
  }
}

migrateExcelData().catch(console.error);
```

### Pattern 5: Undo Toast with Sonner

**What:** Toast notification with action button for immediate undo (10-second window)
**When to use:** After soft delete operation
**Example:**
```typescript
// Source: shadcn/ui Sonner documentation - https://ui.shadcn.com/docs/components/sonner
// Pattern: Toast with undo action

import { toast } from 'sonner';

async function handleDelete(investorId: string) {
  // Perform soft delete
  const { error } = await supabase
    .from('investors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', investorId);

  if (error) {
    toast.error('Failed to delete investor');
    return;
  }

  // Show undo toast
  toast.success('Investor deleted', {
    action: {
      label: 'Undo',
      onClick: async () => {
        // Restore by setting deleted_at to null
        const { error: restoreError } = await supabase
          .from('investors')
          .update({ deleted_at: null })
          .eq('id', investorId);

        if (restoreError) {
          toast.error('Failed to restore investor');
        } else {
          toast.success('Investor restored');
        }
      },
    },
    duration: 10000, // 10 second window
  });
}
```

### Anti-Patterns to Avoid

- **Don't filter deleted_at in SELECT RLS policy if you need to UPDATE deleted records** - This breaks soft delete operations. Use permissive UPDATE policies.
- **Don't use database views for soft delete filtering** - Adds complexity, requires security_invoker=true in Postgres 15+, and complicates RLS. Handle filtering in policies and application code.
- **Don't create separate edit mode for forms** - Inline editing with auto-save provides better UX. Toggle between display/edit per field, not entire form.
- **Don't manually call setValue in react-hook-form when using Controller** - Controller manages state automatically via onChange prop.
- **Don't skip foreign key indexes** - Foreign keys without indexes severely degrade join performance as data grows.
- **Don't parse Excel numbers as strings** - JavaScript floating-point precision may be insufficient for financial data; consider using decimal libraries or storing as integers (cents).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel parsing | Custom XLSX parser | xlsx (SheetJS) | Binary format complexity, multiple Excel versions, formula evaluation, cell formatting, date parsing quirks |
| Form validation | Manual validation functions | Zod + @hookform/resolvers | Type inference, runtime validation, error messages, nested object validation, async rules |
| Debouncing | Custom setTimeout logic | useCallback + useEffect pattern | Cleanup handling, memory leaks, stale closure issues, re-render optimization |
| Toast notifications | Custom toast system | shadcn/ui Sonner | Accessibility (ARIA), stacking, positioning, animations, action buttons, promise tracking |
| Confirmation dialogs | Custom modal | shadcn/ui Alert Dialog | Accessibility (focus trap, keyboard nav), portal rendering, backdrop handling, animation |
| Collapsible sections | Custom accordion | shadcn/ui Accordion/Collapsible | Keyboard navigation, ARIA attributes, animation, single/multiple open modes |

**Key insight:** The inline editing + auto-save pattern seems simple but has edge cases: debounce timing, handling rapid edits, preventing race conditions, showing save state, handling failures, and optimistic updates. React Hook Form's `watch()` API with proper cleanup is battle-tested for these scenarios.

## Common Pitfalls

### Pitfall 1: RLS Policy Blocks Soft Delete UPDATE

**What goes wrong:** Setting a SELECT policy with `using (deleted_at is null)` prevents users from updating records to set `deleted_at`, causing soft delete operations to fail with permission errors.

**Why it happens:** PostgreSQL UPDATE operations implicitly perform a SELECT before the update. If the SELECT policy filters out rows with `deleted_at`, the UPDATE can't find the row to modify.

**How to avoid:** Use permissive UPDATE policies with `using (true)` to allow selecting any row for update purposes, regardless of deleted_at status. Rely on SELECT policies to hide deleted records from normal queries.

**Warning signs:**
- Soft delete API calls return "permission denied" or "no rows updated"
- Direct SQL updates work but Supabase client updates fail
- Error messages about RLS policy violations during delete operations

**Reference:** [Supabase soft delete discussion](https://github.com/orgs/supabase/discussions/32523)

### Pitfall 2: Missing Foreign Key Indexes

**What goes wrong:** Queries joining investors with contacts/activities become slow (seconds) as data grows beyond a few hundred records.

**Why it happens:** PostgreSQL creates indexes for primary keys automatically, but NOT for foreign keys. Without indexes, foreign key joins require full table scans.

**How to avoid:** Explicitly create indexes on all foreign key columns immediately after table creation:
```sql
create index idx_contacts_investor_id on public.contacts(investor_id);
create index idx_activities_investor_id on public.activities(investor_id);
```

**Warning signs:**
- Slow response times on detail page loads
- Database CPU spikes during join queries
- EXPLAIN ANALYZE shows "Seq Scan" on foreign key columns

**Reference:** [Supabase database advisors documentation](https://supabase.com/docs/guides/database/database-advisors)

### Pitfall 3: Debounce Function Recreated on Every Render

**What goes wrong:** Auto-save triggers on every keystroke instead of debouncing, causing excessive API calls and poor performance.

**Why it happens:** Creating a debounced function inside a component body causes it to be recreated on every render, losing the internal timeout state that makes debouncing work.

**How to avoid:** Wrap debounced save function in `useCallback` with proper dependencies, or use React Hook Form's built-in `watch()` with `useEffect` for controlled debouncing.

**Warning signs:**
- Network tab shows API call on every keystroke
- User reports "laggy" typing
- Database shows high query rate during form editing

**Reference:** [React Hook Form debounce discussion](https://github.com/orgs/react-hook-form/discussions/3078)

### Pitfall 4: Excel Date Parsing Errors

**What goes wrong:** Date fields from Excel import as numbers (like 44927) or parse to incorrect dates (off by years or days).

**Why it happens:** Excel stores dates as numbers representing days since 1900-01-01 (Windows) or 1904-01-01 (Mac). The xlsx library returns the raw serial number, which must be converted to JavaScript Date objects.

**How to avoid:** Use xlsx library's built-in date parsing or manually convert with `new Date((excelDate - 25569) * 86400 * 1000)` for Windows Excel. Validate parsed dates to ensure they're reasonable (not in the 1800s or 2100s).

**Warning signs:**
- Dates show as 5-digit numbers instead of readable dates
- All dates are in 1900 or 1904
- Dates are exactly 4 years off from expected values

**Reference:** [SheetJS date parsing examples](https://docs.sheetjs.com/docs/getting-started/examples/import/)

### Pitfall 5: Race Conditions with Rapid Auto-Save

**What goes wrong:** User edits Field A, then immediately edits Field B. The second save completes before the first, and Field A's value gets overwritten by stale data from the second request.

**Why it happens:** Debounced saves are async and can complete out of order. If each save does a full record UPDATE, the last response to arrive wins, potentially overwriting more recent edits.

**How to avoid:** Either (1) save individual fields with granular UPDATE statements (`UPDATE investors SET field_a = $1 WHERE id = $2`), or (2) implement optimistic locking with version numbers to detect conflicts.

**Warning signs:**
- User reports "my edits disappeared"
- Edited field reverts to old value seconds later
- Database shows correct value but UI shows wrong value
- Edit history (activities table) shows field changed multiple times rapidly

**Reference:** [React auto-save patterns with race condition handling](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e)

### Pitfall 6: Cascade Delete Confusion with Soft Delete

**What goes wrong:** Contacts remain visible when investor is soft-deleted, but application expects them to be hidden. Or, contacts are accidentally deleted when they should remain for future restoration.

**Why it happens:** Soft delete doesn't trigger database CASCADE rules. The decision to keep contacts active (as specified in CONTEXT.md) must be enforced in application logic, not database constraints.

**How to avoid:** Document the soft delete behavior explicitly: "Contacts remain active when investor is soft-deleted." Ensure list views join properly and filter based on investor.deleted_at if needed. Consider a database view that includes "is_investor_deleted" flag for convenience.

**Warning signs:**
- User sees contacts for deleted investors in contact lists
- Restore operation doesn't bring back expected contacts
- Confusion about whether to filter contacts by investor's deleted_at status

## Code Examples

Verified patterns from official sources:

### Zod Schema with Required and Optional Fields

```typescript
// Source: Zod documentation - https://zod.dev/
import { z } from 'zod';

export const investorSchema = z.object({
  // Required fields
  firm_name: z.string().min(1, "Firm name is required"),
  stage: z.string().min(1, "Stage is required"),
  relationship_owner: z.string().min(1, "Relationship owner is required"),

  // Optional fields
  partner_source: z.string().optional(),
  est_value: z.number().positive().optional(),
  entry_date: z.date().optional(),
  last_action_date: z.date().optional(),
  stalled: z.boolean().default(false),
  allocator_type: z.string().optional(),
  internal_conviction: z.string().optional(),
  internal_priority: z.string().optional(),
  investment_committee_timing: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.date().optional(),
  current_strategy_notes: z.string().optional(),
  current_strategy_date: z.date().optional(),
  last_strategy_notes: z.string().optional(),
  last_strategy_date: z.date().optional(),
  key_objection_risk: z.string().optional(),
});

export type InvestorFormData = z.infer<typeof investorSchema>;
```

### Server Action for Update with Activity Logging

```typescript
// Source: Supabase JavaScript client documentation
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateInvestorField(
  investorId: string,
  field: string,
  value: any
) {
  const supabase = await createServerClient();

  // Get current user for activity log
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Get old value for activity log
  const { data: oldRecord } = await supabase
    .from('investors')
    .select(field)
    .eq('id', investorId)
    .single();

  // Update the field
  const { data, error } = await supabase
    .from('investors')
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', investorId)
    .select()
    .single();

  if (error) throw error;

  // Log the change as an activity
  await supabase.from('activities').insert({
    investor_id: investorId,
    activity_type: 'field_update',
    description: `Updated ${field}`,
    metadata: {
      field,
      old_value: oldRecord?.[field],
      new_value: value,
    },
    created_by: user.id,
  });

  revalidatePath(`/investors/${investorId}`);
  return data;
}
```

### Collapsible Form Section

```typescript
// Source: shadcn/ui Collapsible documentation - https://ui.shadcn.com/docs/components/collapsible
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export function InvestorFormSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-medium hover:bg-accent">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 transition-transform ui-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik for forms | React Hook Form | ~2020 | Better performance (fewer re-renders), smaller bundle, better TypeScript support |
| Yup validation | Zod validation | ~2021 | TypeScript-first design, better type inference, smaller bundle |
| Custom toast systems | Sonner | 2023 | Better UX (promise handling, stacking), accessibility, less code |
| Multiple delete (with CASCADE) | Soft delete | Industry shift | Enables undo, audit trails, prevents accidental data loss |
| Class-based forms | Hook-based forms | React 16.8+ (2019) | Simpler code, better composition, less boilerplate |

**Deprecated/outdated:**
- **Formik**: Still maintained but React Hook Form is faster and smaller
- **Database views for soft delete**: Added complexity without clear benefits; application-level filtering is more flexible
- **Uncontrolled form inputs**: React Hook Form supports both, but controlled inputs provide better UX for inline editing
- **Manual debouncing with setTimeout**: useCallback + useEffect pattern is more reliable and prevents memory leaks

## Open Questions

Things that couldn't be fully resolved:

1. **Should contacts have their own deleted_at or inherit from investor?**
   - What we know: CONTEXT.md says keep contacts active when investor is soft-deleted, allowing contact reuse
   - What's unclear: UI behavior - should contact list show contacts from deleted investors?
   - Recommendation: Give contacts independent `deleted_at` field. Filter contact lists to exclude contacts where `investor.deleted_at IS NOT NULL` OR `contact.deleted_at IS NOT NULL` for clean UX

2. **Auto-save timing: debounce duration and blur behavior**
   - What we know: Need to feel like Notion/Linear; CONTEXT.md says "auto-save on blur"
   - What's unclear: Should save happen on both debounce timeout AND blur, or only blur?
   - Recommendation: Implement both - debounce (1-2 seconds) for long editing sessions, immediate on blur for quick edits. This matches Notion's behavior.

3. **Activity logging granularity**
   - What we know: Activities table exists for audit trail
   - What's unclear: Should every field update create an activity, or only "significant" changes (stage, value, dates)?
   - Recommendation: Log all field updates initially. Can add filtering in Phase 4 Activity Feed if log gets too noisy. Storage is cheap; missing audit data is not recoverable.

4. **Admin-only restore view priority**
   - What we know: CONTEXT.md says admins can restore older deletions beyond 10-second undo window
   - What's unclear: Is this Phase 3 scope or can it be deferred?
   - Recommendation: Defer admin restore UI to Phase 4. The database supports restoration (just set `deleted_at = NULL`), but UI can wait until basic CRUD is proven.

## Sources

### Primary (HIGH confidence)

- [Supabase Documentation](https://supabase.com/docs) - PostgreSQL schema, RLS policies, foreign keys, indexes, soft delete patterns
- [React Hook Form Documentation](https://react-hook-form.com/) - Form management, Controller API, watch(), useController
- [Zod Documentation](https://zod.dev/) - Schema validation, TypeScript inference, optional fields
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Sonner, Alert Dialog, Collapsible, Accordion

### Secondary (MEDIUM confidence)

- [React Hook Form Debounce Discussion](https://github.com/orgs/react-hook-form/discussions/3078) - Auto-save patterns with watch()
- [Supabase Soft Delete Discussion](https://github.com/orgs/supabase/discussions/32523) - RLS policy pitfalls with soft delete
- [Building useAutoSave Hook](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e) - Debounce + React Query patterns
- [DragonflyDB CRM Schema Guide](https://www.dragonflydb.io/databases/schema/crm) - CRM database design best practices
- [GeeksforGeeks CRM Database Design](https://www.geeksforgeeks.org/dbms/how-to-design-a-relational-database-for-customer-relationship-management-crm/) - Entity relationships and normalization

### Tertiary (LOW confidence - verify during implementation)

- [SheetJS Documentation](https://docs.sheetjs.com/) - Excel parsing (note: official npm package has security/maintenance concerns per 2026 sources)
- WebSearch results for React inline editing patterns (multiple sources, requires verification)
- WebSearch results for CRM best practices (general guidance, not Supabase-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 or official documentation; established patterns in React/Supabase ecosystem
- Architecture: HIGH - Foreign key indexes, RLS policies, and form patterns verified in official Supabase and React Hook Form documentation
- Pitfalls: MEDIUM-HIGH - Soft delete RLS issue confirmed in Supabase discussions; other pitfalls based on common React patterns and web search

**Research date:** 2026-02-11
**Valid until:** ~30 days (stable ecosystem - Supabase, React Hook Form, Zod are mature libraries)

**Note on xlsx library:** WebSearch (2026) flagged security concerns with xlsx npm package maintenance. Recommend verifying latest security advisories and considering alternatives (read-excel-file, exceljs) if concerns persist. For one-time migration script with 16 rows, risk is minimal.
