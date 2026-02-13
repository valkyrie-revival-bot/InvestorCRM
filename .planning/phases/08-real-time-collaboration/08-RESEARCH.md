# Phase 8: Real-time Collaboration - Research

**Researched:** 2026-02-13
**Domain:** Real-time collaboration, Supabase Realtime, WebSocket subscriptions, optimistic locking
**Confidence:** HIGH

## Summary

Supabase Realtime provides three core features for building real-time collaborative applications: **Postgres Changes** (database CDC), **Presence** (user state tracking), and **Broadcast** (low-latency messaging). For this phase, we'll primarily use Postgres Changes and Presence.

The research confirms that Supabase's built-in Realtime capabilities fully satisfy all requirements for Phase 8. The stack includes Supabase Realtime for live updates, presence tracking for user awareness, and PostgreSQL version columns for optimistic locking. Next.js App Router requires careful consideration of Server/Client component boundaries, with all real-time subscriptions running exclusively in Client Components.

Key architectural decisions: (1) Use Postgres Changes subscriptions for COLLAB-01 and COLLAB-02, (2) implement Presence API for COLLAB-03, (3) add version columns with optimistic locking for COLLAB-04, and (4) manage subscriptions in React useEffect with proper cleanup to prevent memory leaks.

**Primary recommendation:** Use Supabase's native Realtime features with channel subscriptions, implement version-based optimistic locking at the database level, and structure Next.js components with Server Components for initial data fetching and Client Components for real-time subscriptions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | v2.58.0+ | Supabase client with Realtime | Official client, native WebSocket support, integrated auth |
| Supabase Realtime | Built-in | Live database changes, presence | Globally distributed, sub-second latency, RLS-aware |
| PostgreSQL REPLICA IDENTITY | Native | Track old/new record values | Standard CDC feature, required for UPDATE/DELETE tracking |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React 19 useOptimistic | 19+ | Optimistic UI updates | Optional: For instant UI feedback before server confirms |
| TanStack Query | v5+ | Optional: Cache sync with real-time | Only if using query cache invalidation patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Realtime | Pusher, Ably, Socket.io | More config, separate auth, additional cost, no RLS integration |
| Version column locking | SELECT FOR UPDATE | More complex, requires connection pooling awareness, harder to scale |
| Presence API | Custom WebSocket state | Must implement CRDT-like sync, handle reconnection, no auth integration |

**Installation:**
```bash
# No additional packages needed - already installed from Phase 3
# @supabase/supabase-js includes Realtime client
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── dashboard/
│       └── investors/
│           ├── page.tsx                    # Server Component - initial data fetch
│           └── components/
│               ├── InvestorRealtimeList.tsx    # Client Component - real-time updates
│               ├── InvestorPresence.tsx        # Client Component - user presence
│               └── KanbanRealtimeBoard.tsx     # Client Component - kanban updates
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Client-side Supabase instance
│   │   └── server.ts                       # Server-side Supabase instance
│   └── hooks/
│       ├── useRealtimeInvestors.ts         # Custom hook for investor subscriptions
│       ├── usePresence.ts                  # Custom hook for presence tracking
│       └── useOptimisticUpdate.ts          # Hook for optimistic locking updates
└── types/
    └── realtime.ts                         # TypeScript types for real-time payloads
```

### Pattern 1: Postgres Changes Subscription (COLLAB-01, COLLAB-02)
**What:** Subscribe to database table changes (INSERT, UPDATE, DELETE) and update local state
**When to use:** Any time users need to see live updates when teammates modify data
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
// Client Component: useRealtimeInvestors.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Investor } from '@/types'

export function useRealtimeInvestors(initialInvestors: Investor[]) {
  const [investors, setInvestors] = useState(initialInvestors)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('investors-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'investors'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInvestors((current) => [...current, payload.new as Investor])
          } else if (payload.eventType === 'UPDATE') {
            setInvestors((current) =>
              current.map((inv) =>
                inv.id === payload.new.id ? (payload.new as Investor) : inv
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setInvestors((current) =>
              current.filter((inv) => inv.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return investors
}
```

### Pattern 2: Presence Tracking (COLLAB-03)
**What:** Track which users are currently viewing/editing records using Supabase Presence
**When to use:** Show "who's viewing" indicators, collaborative cursor tracking, active user lists
**Example:**
```typescript
// Source: https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/README.md
// Client Component: usePresence.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface PresenceState {
  user_id: string
  username: string
  viewing_record_id: string | null
  editing_record_id: string | null
  online_at: string
}

export function usePresence(recordId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([])
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('investor-presence', {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as PresenceState[]
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'Unknown',
            viewing_record_id: recordId || null,
            editing_record_id: null,
            online_at: new Date().toISOString()
          })
        }
      })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, recordId, supabase])

  return { onlineUsers }
}
```

### Pattern 3: Optimistic Locking with Version Column (COLLAB-04)
**What:** Add version column to tables, increment on update, check for conflicts
**When to use:** Prevent conflicting edits when multiple users update the same record
**Example:**
```typescript
// Source: https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d
// Database migration
/*
ALTER TABLE investors ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE INDEX idx_investors_version ON investors(id, version);
*/

// Client: useOptimisticUpdate.ts
'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'

export function useOptimisticUpdate() {
  const supabase = createClient()

  const updateWithLocking = async (
    investorId: string,
    currentVersion: number,
    updates: Partial<Investor>
  ) => {
    // Update with version check
    const { data, error } = await supabase
      .from('investors')
      .update({
        ...updates,
        version: currentVersion + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', investorId)
      .eq('version', currentVersion) // Critical: check current version
      .select()
      .single()

    if (error || !data) {
      // No rows updated = conflict detected
      toast.error('This record was modified by another user. Please refresh and try again.')
      return { success: false, conflict: true }
    }

    toast.success('Updated successfully')
    return { success: true, conflict: false, data }
  }

  return { updateWithLocking }
}
```

### Pattern 4: Enable Old Record Tracking
**What:** Set REPLICA IDENTITY FULL to receive old record values in UPDATE/DELETE events
**When to use:** When you need to know what changed, for audit trails, or optimistic UI rollbacks
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/realtime/postgres-changes
-- Enable full old record tracking
ALTER TABLE investors REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;

-- Now UPDATE/DELETE events include payload.old with full record data
-- Note: With RLS enabled, old record contains only primary key(s)
```

### Pattern 5: Server Component + Client Component Composition
**What:** Server Components fetch initial data, pass to Client Components for real-time updates
**When to use:** Always in Next.js App Router with real-time features
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
// Server Component: app/dashboard/investors/page.tsx
import { createClient } from '@/lib/supabase/server'
import { InvestorRealtimeList } from './components/InvestorRealtimeList'

export default async function InvestorsPage() {
  const supabase = createClient()

  // Server-side initial fetch
  const { data: investors } = await supabase
    .from('investors')
    .select('*')
    .order('created_at', { ascending: false })

  // Pass to Client Component for real-time updates
  return <InvestorRealtimeList initialInvestors={investors || []} />
}

// Client Component: components/InvestorRealtimeList.tsx
'use client'

import { useRealtimeInvestors } from '@/hooks/useRealtimeInvestors'

export function InvestorRealtimeList({ initialInvestors }: Props) {
  const investors = useRealtimeInvestors(initialInvestors)

  return (
    <div>
      {investors.map((investor) => (
        <InvestorCard key={investor.id} investor={investor} />
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Subscribing in Server Components:** Real-time subscriptions require browser WebSocket connections and React hooks - only use Client Components
- **Not cleaning up channels:** Always call `supabase.removeChannel(channel)` in useEffect cleanup to prevent memory leaks
- **Subscribing without initial data:** Fetch initial state server-side or in the component, then enhance with real-time - don't rely solely on real-time for first render
- **Ignoring subscription status:** Handle connection errors, timeouts, and channel errors properly
- **Version column without index:** Always index (id, version) for efficient conflict checks
- **Updating without version check:** Every update must include `.eq('version', currentVersion)` or conflicts go undetected
- **Too many channels per user:** Limit to 100 channels per connection (plan limit) - consider shared channels vs per-record channels
- **Broadcasting sensitive data:** Real-time messages bypass RLS unless you configure RLS on `realtime.messages` table

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection management | Custom WebSocket client with reconnection logic | Supabase Realtime client | Handles reconnection, auth token refresh, heartbeats automatically |
| Presence state synchronization | Manual user state tracking across clients | Supabase Presence (CRDT-based) | Uses Conflict-free Replicated Data Types, handles network partitions |
| Change data capture | Polling database for changes | Postgres Changes subscription | Uses native PostgreSQL logical replication, sub-second latency |
| Conflict resolution UI | Custom "someone else edited" modal system | Version column + error handling | Standard database-level optimistic locking pattern |
| Auth context in real-time | Manually passing JWT with each message | Supabase RLS integration | Automatically applies user's RLS policies to real-time events |

**Key insight:** Real-time systems involve complex edge cases like network partitions, reconnection storms, message ordering, and state synchronization. Supabase Realtime solves these at infrastructure level with battle-tested patterns. Custom solutions inevitably rediscover these problems in production.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Unsubscribed Channels
**What goes wrong:** Channels stay active after component unmounts, consuming resources and potentially updating unmounted component state
**Why it happens:** Forgetting cleanup function in useEffect, or storing channel reference incorrectly
**How to avoid:**
- Always return cleanup function: `return () => { supabase.removeChannel(channel) }`
- Store channel in useEffect scope, not component state
- Supabase auto-cleans after 30s disconnect, but explicit cleanup prevents performance degradation
**Warning signs:**
- Increasing WebSocket connections in browser DevTools
- "Can't perform state update on unmounted component" warnings
- Memory usage growing over time
**Source:** [Supabase removeChannel docs](https://supabase.com/docs/reference/javascript/removechannel)

### Pitfall 2: Race Conditions with Optimistic Updates
**What goes wrong:** Real-time update arrives while user is editing, causing data to revert or overwrite unsaved changes
**Why it happens:** Update event triggers state change while user has form open with stale data
**How to avoid:**
- Track "editing" state - don't apply real-time updates to records currently being edited
- Use optimistic UI pattern: apply change immediately, rollback if conflict detected
- Consider React 19's `useOptimistic` hook for safer optimistic updates
- Show "This record was updated by [user]" notification, let user choose to refresh or continue
**Warning signs:**
- User complaints about "losing changes"
- Form fields changing while typing
- Save conflicts immediately after receiving real-time update
**Source:** [TkDodo - Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)

### Pitfall 3: RLS Performance Impact on Real-time
**What goes wrong:** Real-time subscriptions become slow as table grows, especially with complex RLS policies
**Why it happens:** Supabase evaluates RLS policies on every row for every real-time event
**How to avoid:**
- Keep RLS policies simple - prefer indexed column checks (user_id, team_id)
- Avoid `select` subqueries in RLS policies for real-time tables
- Use filters in subscription: `.on('postgres_changes', { filter: 'team_id=eq.123' })`
- Consider denormalizing team membership for faster checks
- Monitor query performance in Supabase Dashboard
**Warning signs:**
- Real-time updates delayed more than 2-3 seconds
- High database CPU during real-time activity
- Slow queries in Supabase logs with RLS policy evaluation
**Source:** [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 4: Exceeding Realtime Connection Limits
**What goes wrong:** Users can't connect, receive "too_many_connections" errors
**Why it happens:** Each browser tab = 1 connection, each connection can join 100 channels max
**How to avoid:**
- Free tier: 200 concurrent connections, Pro: 500 (or 10,000 with add-on)
- Share channels across components - don't create multiple channels for same table
- Unsubscribe when user leaves page/section
- Use filters to reduce channel count: one channel with filters vs many specific channels
- Consider upgrading plan if hitting limits consistently
**Warning signs:**
- WebSocket errors in console: `too_many_channels`, `too_many_connections`
- Intermittent connection failures during peak usage
- Users report "live updates stopped working"
**Source:** [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)

### Pitfall 5: Not Handling Subscription Errors
**What goes wrong:** Connection drops, users think app is broken, data becomes stale
**Why it happens:** Network issues, Realtime service restarts, exceeding rate limits
**How to avoid:**
- Always handle subscription callback status: `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`
- Show connection status indicator in UI (online/offline/reconnecting)
- Implement exponential backoff for reconnection attempts
- Fetch fresh data on reconnection to catch missed updates
- Log errors for monitoring (Sentry, LogRocket, etc.)
**Warning signs:**
- Users refresh page to "fix" stale data
- Realtime updates work intermittently
- Silent failures - app looks fine but data doesn't update
**Source:** [Supabase Realtime JS docs](https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/README.md)

### Pitfall 6: Version Column Without Proper Migration
**What goes wrong:** Existing records have NULL or duplicate version values, conflict detection fails
**Why it happens:** Adding version column without default value or not initializing existing rows
**How to avoid:**
```sql
-- Correct migration
ALTER TABLE investors ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Initialize existing rows (if adding to populated table)
UPDATE investors SET version = 1 WHERE version IS NULL;

-- Add index for performance
CREATE INDEX idx_investors_version ON investors(id, version);
```
**Warning signs:**
- Updates succeed even when they should conflict
- NULL constraint violations on update
- Slow updates due to missing index
**Source:** [Medium - Optimistic Locking](https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d)

### Pitfall 7: Forgetting REPLICA IDENTITY for Old Values
**What goes wrong:** `payload.old` only contains primary keys, can't show "what changed" in UI
**Why it happens:** PostgreSQL default replica identity is only primary keys
**How to avoid:**
```sql
ALTER TABLE investors REPLICA IDENTITY FULL;
```
**Limitation:** With RLS enabled, old record still only contains primary keys for DELETE operations
**Warning signs:**
- Can't display "Changed from X to Y" in notifications
- Audit trail missing previous values
- Optimistic UI rollback doesn't have old data
**Source:** [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

## Code Examples

Verified patterns from official sources:

### Complete Real-time Investor Component
```typescript
// Source: Context7 Supabase docs + Next.js App Router patterns
// app/dashboard/investors/components/InvestorRealtimeList.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Investor } from '@/types'
import { InvestorCard } from './InvestorCard'
import { ConnectionStatus } from './ConnectionStatus'

interface Props {
  initialInvestors: Investor[]
}

export function InvestorRealtimeList({ initialInvestors }: Props) {
  const [investors, setInvestors] = useState(initialInvestors)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('investors-all-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investors'
        },
        (payload) => {
          console.log('Received change:', payload)

          if (payload.eventType === 'INSERT') {
            setInvestors((current) => [payload.new as Investor, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setInvestors((current) =>
              current.map((inv) =>
                inv.id === payload.new.id ? (payload.new as Investor) : inv
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setInvestors((current) =>
              current.filter((inv) => inv.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
          console.log('Subscribed to investors changes')
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error')
          console.error('Channel error:', err)
        } else if (status === 'TIMED_OUT') {
          setStatus('error')
          console.error('Subscription timed out')
        }
      })

    return () => {
      console.log('Unsubscribing from channel')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div>
      <ConnectionStatus status={status} />
      <div className="grid gap-4">
        {investors.map((investor) => (
          <InvestorCard key={investor.id} investor={investor} />
        ))}
      </div>
    </div>
  )
}
```

### Kanban Real-time Updates with Filters
```typescript
// Source: Context7 Supabase docs
// components/KanbanRealtimeBoard.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Investor } from '@/types'

export function KanbanRealtimeBoard({ teamId }: { teamId: string }) {
  const [investors, setInvestors] = useState<Investor[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchInvestors = async () => {
      const { data } = await supabase
        .from('investors')
        .select('*')
        .eq('team_id', teamId)
      setInvestors(data || [])
    }
    fetchInvestors()

    // Subscribe with filter for this team only
    const channel = supabase
      .channel(`kanban-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'investors',
          filter: `team_id=eq.${teamId}` // Only this team's updates
        },
        (payload) => {
          // Update when investor moves between stages
          setInvestors((current) =>
            current.map((inv) =>
              inv.id === payload.new.id ? (payload.new as Investor) : inv
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, supabase])

  // Group by stage for kanban columns
  const stages = ['lead', 'contacted', 'meeting', 'proposal', 'closed']

  return (
    <div className="flex gap-4">
      {stages.map((stage) => {
        const stageInvestors = investors.filter((inv) => inv.stage === stage)
        return (
          <KanbanColumn
            key={stage}
            stage={stage}
            investors={stageInvestors}
          />
        )
      })}
    </div>
  )
}
```

### Update with Optimistic Locking
```typescript
// hooks/useOptimisticUpdate.ts
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Investor } from '@/types'

export function useOptimisticUpdate() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const updateInvestor = async (
    investorId: string,
    currentVersion: number,
    updates: Partial<Investor>
  ) => {
    setIsUpdating(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('investors')
        .update({
          ...updates,
          version: currentVersion + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', investorId)
        .eq('version', currentVersion) // Conflict check
        .select()
        .single()

      if (updateError || !data) {
        setError('This record was modified by another user. Please refresh.')
        return { success: false, conflict: true }
      }

      return { success: true, conflict: false, data }
    } catch (err) {
      setError('Update failed. Please try again.')
      return { success: false, conflict: false }
    } finally {
      setIsUpdating(false)
    }
  }

  return { updateInvestor, isUpdating, error }
}

// Usage in component
function InvestorForm({ investor }: { investor: Investor }) {
  const { updateInvestor, isUpdating, error } = useOptimisticUpdate()

  const handleSubmit = async (formData: FormData) => {
    const result = await updateInvestor(
      investor.id,
      investor.version,
      { name: formData.get('name') as string }
    )

    if (result.conflict) {
      // Show conflict message, refresh data
      alert('Please refresh - someone else edited this record')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="name" defaultValue={investor.name} />
      <button disabled={isUpdating}>Save</button>
    </form>
  )
}
```

### Presence with Record-Level Tracking
```typescript
// hooks/useRecordPresence.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface UserPresence {
  user_id: string
  username: string
  record_id: string
  action: 'viewing' | 'editing'
  timestamp: string
}

export function useRecordPresence(recordId: string) {
  const [presentUsers, setPresentUsers] = useState<UserPresence[]>([])
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`record-${recordId}`, {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as UserPresence[]
        // Filter to only users on THIS record
        setPresentUsers(users.filter((u) => u.record_id === recordId))
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined record:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left record:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'Unknown',
            record_id: recordId,
            action: 'viewing',
            timestamp: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, recordId, supabase])

  const updateAction = async (action: 'viewing' | 'editing') => {
    const channel = supabase.getChannel(`record-${recordId}`)
    if (channel) {
      await channel.track({
        user_id: user!.id,
        username: user!.email?.split('@')[0] || 'Unknown',
        record_id: recordId,
        action,
        timestamp: new Date().toISOString()
      })
    }
  }

  return { presentUsers, updateAction }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling database every 5s | WebSocket subscriptions | 2020+ | Sub-second latency, 95% less database load |
| Custom WebSocket servers | Managed Realtime services (Supabase, Ably) | 2021+ | No infrastructure management, global distribution |
| Pessimistic locking (SELECT FOR UPDATE) | Optimistic locking with version columns | Always been both | Optimistic scales better, fewer connection locks |
| Manual conflict resolution | Framework-level optimistic UI (React useOptimistic) | React 19 (2024) | Built-in support for temporary optimistic state |
| Custom presence tracking | CRDT-based Presence APIs | 2022+ | Automatic state reconciliation, network partition handling |

**Deprecated/outdated:**
- **Polling for real-time updates:** Replaced by WebSocket subscriptions - polling is now only for fallback scenarios
- **Long-polling/SSE for bi-directional:** WebSockets are standard, more efficient
- **Manual JWT passing in messages:** Modern services integrate auth context automatically
- **Firebase Realtime Database:** Still works but superseded by Firestore, Supabase for PostgreSQL use cases

## Open Questions

Things that couldn't be fully resolved:

1. **RLS and Old Record Limitation**
   - What we know: With RLS enabled + REPLICA IDENTITY FULL, DELETE operations only return primary keys in `payload.old`
   - What's unclear: Is this a PostgreSQL limitation or Supabase implementation choice? Can it be worked around?
   - Recommendation: For audit trails of deletions, create a `deleted_records` table with BEFORE DELETE trigger to capture full record
   - Source: [Supabase Issue #34356](https://github.com/supabase/supabase/issues/34356)

2. **Optimal Channel Granularity**
   - What we know: Can create per-record channels or one shared channel with filters
   - What's unclear: Performance tradeoff between many filtered subscriptions vs many channels
   - Recommendation: Start with one channel per table with filters, measure at scale, split if needed
   - Next step: Load testing to determine breakpoint

3. **Conflict Resolution UI Patterns**
   - What we know: Detect conflicts with version column, show error message
   - What's unclear: Best UX for presenting conflicts - show diff? Auto-merge? Force refresh?
   - Recommendation: For MVP, show "Record updated by [user]" with Refresh button. Consider 3-way merge UI in future
   - Research: User testing to determine acceptable conflict UX

4. **React Server Components and Real-time**
   - What we know: Real-time subscriptions only work in Client Components
   - What's unclear: Best pattern for initial data fetch - Server Component prop passing vs client-side initial fetch
   - Recommendation: Use Server Component for initial fetch (SEO, speed) → pass to Client Component for real-time
   - Validation: Confirm no hydration issues with this pattern

## Sources

### Primary (HIGH confidence)
- [Context7: /websites/supabase](https://context7.com) - Realtime capabilities, patterns, examples
- [Context7: /supabase/supabase-js](https://context7.com) - JavaScript client API, subscriptions, presence
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) - Connection limits, quotas, constraints
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - CDC setup, REPLICA IDENTITY
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization) - RLS integration, security
- [Supabase JavaScript removeChannel](https://supabase.com/docs/reference/javascript/removechannel) - Cleanup best practices
- [Next.js App Router: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Component patterns

### Secondary (MEDIUM confidence)
- [Medium: Optimistic Locking with Version Column](https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d) - Optimistic locking pattern verified with PostgreSQL docs
- [TkDodo: Concurrent Optimistic Updates in React Query](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - Race condition handling patterns
- [Supabase Blog: Realtime Broadcast and Presence Authorization](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization) - Security patterns
- [PostgreSQL MVCC Documentation](https://www.postgresql.org/docs/current/mvcc.html) - Official concurrency control docs

### Tertiary (LOW confidence)
- Web search results on real-time collaboration best practices - General patterns, not Supabase-specific
- Community discussions on GitHub about cleanup patterns - Anecdotal evidence, needs validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs, Context7 verification, well-documented APIs
- Architecture: HIGH - Next.js patterns documented, Supabase examples verified, clear Server/Client boundaries
- Pitfalls: MEDIUM-HIGH - Mix of official docs (high) and community reports (medium), some anecdotal

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days) - Supabase Realtime is stable, but check for version updates and new features
