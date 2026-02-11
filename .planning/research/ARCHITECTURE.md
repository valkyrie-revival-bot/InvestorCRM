# Architecture Research

**Domain:** Web-based CRM with AI Agents and Real-time Collaboration
**Researched:** 2026-02-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ React UI   │  │ AI Chat    │  │ Real-time  │  │ Auth     │  │
│  │ Components │  │ Interface  │  │ Updates    │  │ Provider │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬─────┘  │
│        │               │               │              │         │
├────────┴───────────────┴───────────────┴──────────────┴─────────┤
│                   APPLICATION LAYER (Next.js)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Next.js App Router (Server Components)        │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  API Routes     │  Server Actions  │  Route Handlers    │    │
│  └─────┬────────────────────┬────────────────────┬─────────┘    │
│        │                    │                    │               │
├────────┴────────────────────┴────────────────────┴───────────────┤
│                      INTEGRATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Google       │  │ AI Agent     │  │ Real-time    │          │
│  │ Workspace    │  │ Service      │  │ Sync Engine  │          │
│  │ APIs         │  │ (Claude/GPT) │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
├─────────┴─────────────────┴─────────────────┴───────────────────┤
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Firestore     │  │ Google Drive  │  │ Session       │       │
│  │ (Primary DB)  │  │ (Documents)   │  │ Storage       │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Client Layer** | User interface, real-time updates, chat UI | React components (mix of Server/Client Components) |
| **App Router** | Request routing, SSR, data fetching | Next.js 15+ App Router with Server Components |
| **API Routes** | External API proxy, authentication flow | Next.js Route Handlers (`app/api/*/route.ts`) |
| **AI Agent Service** | Conversational interface, CRM actions | Claude/GPT API with function calling |
| **Google Workspace Integration** | Drive, Gmail, Calendar, Meet APIs | OAuth2 + REST API clients |
| **Real-time Sync** | Multi-user collaboration, live updates | Firestore listeners (`onSnapshot`) |
| **Data Layer** | Primary data store, document storage | Firestore (NoSQL) + Google Drive |

## Recommended Project Structure

```
prytaneum-crm/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth-gated routes
│   │   ├── dashboard/       # Main CRM interface
│   │   ├── contacts/        # Contact management
│   │   ├── deals/           # Deal pipeline
│   │   └── chat/            # AI BDR agent interface
│   ├── api/                 # API Routes
│   │   ├── auth/            # NextAuth/OAuth handlers
│   │   ├── google/          # Google Workspace proxy
│   │   ├── ai-agent/        # AI agent endpoints
│   │   └── webhook/         # External webhooks
│   ├── login/               # Public login page
│   └── layout.tsx           # Root layout with providers
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── crm/                 # CRM-specific components
│   ├── ai-chat/             # AI chat interface
│   └── realtime/            # Real-time collaboration widgets
├── lib/                     # Core business logic
│   ├── firestore/           # Firestore client & queries
│   ├── google/              # Google API clients
│   ├── ai-agent/            # AI agent orchestration
│   ├── auth/                # Authentication utilities
│   └── types/               # TypeScript types
├── hooks/                   # React hooks
│   ├── useRealtime.ts       # Firestore real-time listener
│   ├── useGoogleAuth.ts     # Google OAuth hook
│   └── useAIAgent.ts        # AI agent interaction hook
├── middleware.ts            # Next.js middleware (auth)
└── firebase.config.ts       # Firebase initialization
```

### Structure Rationale

- **app/**: Next.js 15 App Router for file-based routing, Server Components by default, and built-in API routes
- **app/(auth)/**: Route groups enforce authentication middleware without affecting URL structure
- **lib/**: Business logic separated from UI for testability and reusability across Server/Client Components
- **components/**: Mix of Server Components (default) and Client Components (marked with 'use client')
- **hooks/**: Custom React hooks for Client Components to manage real-time subscriptions and state

## Architectural Patterns

### Pattern 1: Modular Monolith

**What:** Single deployable application with clear module boundaries (auth, CRM, AI, integrations)

**When to use:** MVP and rapid development (2-day timeline), team size < 10 developers, < 1M requests/day

**Trade-offs:**
- ✅ **Pros:** Faster development, simpler debugging, single deployment, shared code easy to refactor
- ❌ **Cons:** Entire app redeploys for any change, can't scale components independently
- 🎯 **2026 Recommendation:** 42% of organizations that adopted microservices are consolidating back to modular monoliths to reduce complexity

**Example:**
```typescript
// lib/modules/crm/contacts.ts - CRM module
export class ContactService {
  async getContact(id: string) {
    return await firestore.collection('contacts').doc(id).get()
  }
}

// lib/modules/ai/agent.ts - AI module
export class AIAgentService {
  async chat(message: string, context: CRMContext) {
    // Clear module boundary but same deployment
    return await claude.messages.create({...})
  }
}
```

### Pattern 2: Server Components with Client Islands

**What:** Default to Server Components for data fetching, use Client Components only for interactivity

**When to use:** Next.js 13+ App Router, when you need SEO, fast initial page loads, and reduced JavaScript bundle size

**Trade-offs:**
- ✅ **Pros:** Better performance (less JS to browser), direct database access in components, automatic code splitting
- ❌ **Cons:** Learning curve for Server/Client boundary, can't use React hooks in Server Components
- 🎯 **2026 Recommendation:** Standard pattern for all new Next.js apps

**Example:**
```typescript
// app/contacts/[id]/page.tsx - Server Component (default)
export default async function ContactPage({ params }: { params: { id: string } }) {
  // Direct Firestore access on server
  const contact = await getContact(params.id)

  return (
    <div>
      <h1>{contact.name}</h1>
      {/* Client Component for interactivity */}
      <ContactActions contact={contact} />
    </div>
  )
}

// components/crm/ContactActions.tsx - Client Component
'use client'
export function ContactActions({ contact }) {
  // Can use useState, onClick, etc.
  const [status, setStatus] = useState(contact.status)
  return <button onClick={() => updateStatus(contact.id, status)}>...</button>
}
```

### Pattern 3: Real-time Listeners with Firestore

**What:** Subscribe to Firestore document/collection changes via `onSnapshot()` for live multi-user updates

**When to use:** Real-time collaboration, live dashboards, chat interfaces, multi-user editing

**Trade-offs:**
- ✅ **Pros:** Automatic updates, no polling needed, built-in conflict resolution, scales to 1M+ concurrent connections
- ❌ **Cons:** Firestore charges per document read (including listener triggers), need proper cleanup to avoid memory leaks
- 🎯 **2026 Recommendation:** Firestore listeners are simpler than WebSockets for most use cases; hybrid approach (Firestore + WebSockets) if cost is a concern

**Example:**
```typescript
// hooks/useRealtime.ts
'use client'
import { useEffect, useState } from 'react'
import { onSnapshot, collection, query, where } from 'firebase/firestore'

export function useRealtimeDeals(userId: string) {
  const [deals, setDeals] = useState([])

  useEffect(() => {
    const q = query(
      collection(firestore, 'deals'),
      where('assignedTo', '==', userId)
    )

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const changes = snapshot.docChanges()
        changes.forEach(change => {
          if (change.type === 'added') {
            console.log('New deal:', change.doc.data())
          } else if (change.type === 'modified') {
            console.log('Modified deal:', change.doc.data())
          }
        })
        setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      },
      (error) => console.error('Listener error:', error)
    )

    // Cleanup on unmount
    return () => unsubscribe()
  }, [userId])

  return deals
}
```

### Pattern 4: AI Agent with Function Calling

**What:** Conversational AI agent that can execute CRM actions (create contact, update deal, schedule meeting) via function calling

**When to use:** Agentic CRM, AI BDR, natural language CRM interface

**Trade-offs:**
- ✅ **Pros:** Natural user experience, automates workflows, reduces clicks, handles complex multi-step tasks
- ❌ **Cons:** AI API costs, potential errors in function calls, need guardrails for data safety
- 🎯 **2026 Recommendation:** 75% of B2B customer interactions handled by AI agents (up from 30% in 2023); use Claude for more reliable CRM API calls vs GPT

**Example:**
```typescript
// lib/ai-agent/agent.ts
import Anthropic from '@anthropic-ai/sdk'

const tools = [
  {
    name: 'create_contact',
    description: 'Create a new contact in the CRM',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        company: { type: 'string' }
      }
    }
  },
  {
    name: 'update_deal_stage',
    description: 'Move a deal to a different pipeline stage',
    input_schema: {
      type: 'object',
      properties: {
        dealId: { type: 'string' },
        newStage: { type: 'string', enum: ['lead', 'qualified', 'proposal', 'closed'] }
      }
    }
  }
]

export async function aiAgentChat(userMessage: string, conversationHistory: Message[]) {
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    tools,
    messages: [...conversationHistory, { role: 'user', content: userMessage }]
  })

  // Handle tool calls
  if (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(c => c.type === 'tool_use')

    if (toolUse.name === 'create_contact') {
      const result = await createContact(toolUse.input)
      return { success: true, message: `Created contact: ${result.name}` }
    }
    // ... handle other tools
  }

  return { success: true, message: response.content[0].text }
}
```

### Pattern 5: Google Workspace Integration via OAuth2

**What:** Backend proxy for Google APIs (Drive, Gmail, Calendar, Meet) with OAuth2 token management

**When to use:** SSO authentication, access to user's Google data, document linking, meeting scheduling

**Trade-offs:**
- ✅ **Pros:** Secure token storage, refresh token rotation, single auth flow for all Google APIs
- ❌ **Cons:** Need backend to store refresh tokens, OAuth consent screen setup, token expiry management
- 🎯 **2026 Recommendation:** Use NextAuth.js (or Auth.js) for OAuth flow + backend API routes to proxy Google API calls

**Example:**
```typescript
// app/api/google/drive/route.ts - Backend proxy for Google Drive
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  const session = await getServerSession()

  // Use refresh token from database
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken
  })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const response = await drive.files.list({
    q: "mimeType='application/pdf'",
    fields: 'files(id, name, webViewLink)'
  })

  return Response.json({ files: response.data.files })
}

// Client-side usage
async function fetchUserDocuments() {
  const res = await fetch('/api/google/drive')
  const { files } = await res.json()
  return files
}
```

## Data Flow

### Request Flow: User Action → Database

```
[User clicks "Create Contact"]
    ↓
[Client Component] → handleSubmit() → fetch('/api/contacts', { method: 'POST' })
    ↓
[Next.js API Route] → validateAuth() → createContact(data)
    ↓
[Firestore Service] → firestore.collection('contacts').add(data)
    ↓
[Firestore Database] → Document created with auto-generated ID
    ↓
[Real-time Listener] → onSnapshot() triggers for all subscribed clients
    ↓
[All Users' Browsers] → UI updates automatically with new contact
```

### Real-time Collaboration Flow

```
[User A edits Deal #123]
    ↓
[Client Component] → updateDeal(dealId, changes)
    ↓
[API Route] → firestore.collection('deals').doc(dealId).update(changes)
    ↓
[Firestore] → Document updated (atomic operation)
    ↓
[Real-time Sync Engine] → Firestore triggers onSnapshot listeners
    ↓
[User B's Browser] → onSnapshot callback fires with updated data
    ↓
[User B's UI] → React state updates → Component re-renders with fresh data
```

### AI Agent Interaction Flow

```
[User types message in AI chat]
    ↓
[ChatInterface Component] → sendMessage(text)
    ↓
[API Route /api/ai-agent] → aiAgentChat(message, conversationHistory)
    ↓
[AI Agent Service] → Claude API with tool definitions
    ↓
[Claude responds] → "I'll create that contact for you"
    ↓ (tool_use)
[Function Handler] → executeFunction('create_contact', params)
    ↓
[CRM Service] → firestore.collection('contacts').add(contactData)
    ↓
[AI Agent] → Return confirmation to user
    ↓
[ChatInterface] → Display "Created contact: John Doe"
```

### Google Workspace Integration Flow

```
[User clicks "Link Document"]
    ↓
[Client] → Google Drive Picker (frontend widget)
    ↓
[User selects file] → fileId returned to client
    ↓
[Client] → POST /api/contacts/{id}/attach-document { fileId }
    ↓
[API Route] → Verify user has access to file
    ↓
[Google Drive API] → drive.files.get(fileId) with user's OAuth token
    ↓
[Backend] → Store { fileId, fileName, webViewLink } in Firestore
    ↓
[Firestore] → contactDoc.update({ documents: [..., newDoc] })
    ↓
[Real-time Listener] → All users see document linked to contact
```

### Key Data Flows

1. **Authentication Flow:** User logs in with Google SSO → NextAuth creates session → Refresh token stored in database → Access token in browser cookie → API routes validate session on every request

2. **State Management:** Firestore as source of truth → Server Components fetch on server → Client Components subscribe with `onSnapshot` → No client-side state management library needed (React state + Firestore listeners sufficient)

3. **Multi-user Conflict Resolution:** Firestore handles conflicts automatically → Last write wins → Use transactions for critical operations (e.g., incrementing deal value)

## Build Order & Dependencies

### Phase 0: Foundation (Hour 1)
**Build first - everything depends on this:**
- ✅ Next.js project setup with TypeScript
- ✅ Firestore initialization and config
- ✅ Environment variables (.env.local)
- ✅ Basic project structure (folders)

**Why first:** All other components need these to function

### Phase 1: Authentication (Hour 2-3)
**Build next - gates all features:**
- ✅ Google OAuth setup (NextAuth/Auth.js)
- ✅ Login page (`app/login/page.tsx`)
- ✅ Auth middleware (`middleware.ts`)
- ✅ Session management

**Dependencies:** Phase 0
**Blocks:** Everything in Phase 2+

### Phase 2A: Core CRM (Hours 4-8) - **Can build in parallel with 2B**
**Primary data model:**
- ✅ Firestore schema design (contacts, deals, activities)
- ✅ Server Components for CRM pages
- ✅ Basic CRUD operations (lib/firestore/*)
- ✅ Real-time listeners (hooks/useRealtime.ts)
- ✅ Dashboard, contacts list, deal pipeline

**Dependencies:** Phase 0, Phase 1
**Parallel with:** Phase 2B (Google integration)

### Phase 2B: Google Workspace (Hours 4-8) - **Can build in parallel with 2A**
**External integrations:**
- ✅ Google Drive API integration
- ✅ Gmail API integration (optional for MVP)
- ✅ Calendar API integration (optional for MVP)
- ✅ Document picker UI component

**Dependencies:** Phase 0, Phase 1
**Parallel with:** Phase 2A (Core CRM)

### Phase 3: AI Agent (Hours 9-12)
**Advanced feature - requires CRM data:**
- ✅ AI chat interface component
- ✅ Claude API integration with function calling
- ✅ Tool definitions for CRM actions
- ✅ Conversation history management

**Dependencies:** Phase 2A (needs CRM data model and operations)
**Can integrate with:** Phase 2B (AI can trigger Google API actions)

### Phase 4: Polish (Hours 13-16)
**Final touches:**
- ✅ UI improvements and responsive design
- ✅ Error handling and loading states
- ✅ Meeting recording integration (if time permits)
- ✅ Testing and bug fixes

**Dependencies:** All previous phases

### Build Order Rationale

1. **Sequential dependencies:** Auth must be done before anything else (blocks all features)
2. **Parallel opportunities:** CRM core and Google integration can be built simultaneously by different developers or in separate sessions
3. **Progressive enhancement:** AI agent is last because it depends on CRM operations being functional
4. **MVP-first:** Meeting transcription is optional for Day 2 MVP; can be deferred

### Recommended 2-Day Split

**Day 1 (Foundation + Core):**
- Morning: Phase 0 + Phase 1 (Auth)
- Afternoon: Phase 2A (Core CRM with real-time)
- Evening: Basic UI and testing

**Day 2 (Integration + Polish):**
- Morning: Phase 2B (Google Workspace) + Phase 3 (AI Agent)
- Afternoon: Phase 4 (Polish + testing)
- Evening: Deployment and final testing

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Modular monolith is perfect; single Next.js deployment on Vercel; Firestore free tier sufficient |
| 1k-10k users | Same architecture; move to Firestore paid tier (~$100-500/mo); add Redis cache for hot data; optimize Firestore listeners to reduce read costs |
| 10k-100k users | Consider hybrid: PostgreSQL for primary data + Firestore for real-time; use WebSockets instead of Firestore listeners to reduce cost; add CDN for static assets |
| 100k+ users | Microservices for AI agent (separate deployment, scales independently); event-driven architecture (Pub/Sub); dedicated real-time infrastructure (Pusher, Ably) |

### Scaling Priorities

1. **First bottleneck (at ~5k users):** Firestore listener costs spike
   - **Fix:** Implement smarter subscriptions (only subscribe to visible data), add caching layer, hybrid Firestore + WebSockets

2. **Second bottleneck (at ~50k users):** AI agent API costs and latency
   - **Fix:** Separate AI agent into microservice, add request queuing, implement response caching for common queries

3. **Third bottleneck (at ~100k users):** Database query performance
   - **Fix:** Move to PostgreSQL or Firestore with better indexing, implement read replicas, add search index (Algolia, Typesense)

## Anti-Patterns

### Anti-Pattern 1: Premature Microservices

**What people do:** Split into microservices from day 1 ("AI agent service", "CRM service", "notification service")

**Why it's wrong:**
- 3x slower development for MVP
- Complex deployment and debugging across services
- Network latency between services
- Over-engineering for a scale you don't have

**Do this instead:**
- Build modular monolith with clear module boundaries in `/lib`
- Use folder structure to enforce separation: `/lib/modules/crm`, `/lib/modules/ai`
- Extract to microservices only after hitting 50+ developers or 1M+ req/day

### Anti-Pattern 2: Client-Side Firestore Queries

**What people do:** Import Firestore SDK directly in Client Components and query from browser

**Why it's wrong:**
- Exposes Firestore config to client
- Harder to implement auth rules
- Difficult to audit data access
- Can't transform data server-side

**Do this instead:**
- Query Firestore in Server Components or API Routes
- Pass data as props to Client Components
- Use API routes as backend proxy for sensitive operations
```typescript
// ❌ Bad: Client Component with direct Firestore query
'use client'
import { collection, getDocs } from 'firebase/firestore'

export function ContactList() {
  useEffect(() => {
    const contacts = await getDocs(collection(firestore, 'contacts'))
    // Exposed to client, can't enforce backend auth
  }, [])
}

// ✅ Good: Server Component with server-side query
export default async function ContactList() {
  const contacts = await getContacts() // Server-side function
  return <ClientContactList contacts={contacts} />
}
```

### Anti-Pattern 3: Storing Secrets in Client-Side .env

**What people do:** Put API keys (Claude API key, Google service account) in `NEXT_PUBLIC_*` env vars

**Why it's wrong:**
- Exposes secrets to browser (visible in Network tab)
- Anyone can steal and use your API keys
- Security vulnerability

**Do this instead:**
- **Never** prefix secrets with `NEXT_PUBLIC_`
- Store secrets in server-only env vars
- Access secrets only in Server Components, API Routes, or Server Actions
```typescript
// ❌ Bad: Client-side API key
// .env.local
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-... // Exposed to browser!

// ✅ Good: Server-only API key
// .env.local
CLAUDE_API_KEY=sk-ant-... // Only accessible on server

// app/api/ai-agent/route.ts
export async function POST(request: Request) {
  const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  // Safe: runs on server only
}
```

### Anti-Pattern 4: No Real-time Listener Cleanup

**What people do:** Set up Firestore listeners without cleaning them up on unmount

**Why it's wrong:**
- Memory leaks
- Multiple listeners firing for same data
- Increased Firestore read costs (ghost listeners keep reading)

**Do this instead:**
- Always return cleanup function from `useEffect`
- Store `unsubscribe` function and call it
```typescript
// ❌ Bad: No cleanup
useEffect(() => {
  onSnapshot(docRef, (snapshot) => {
    setData(snapshot.data())
  })
}, []) // Listener never cleaned up!

// ✅ Good: Proper cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    setData(snapshot.data())
  })
  return () => unsubscribe() // Cleanup on unmount
}, [])
```

### Anti-Pattern 5: Overusing AI Agent for Simple Actions

**What people do:** Route every CRM action through AI agent ("Click the button? No, tell the AI to do it!")

**Why it's wrong:**
- Higher latency (AI roundtrip adds 1-3 seconds)
- Higher cost ($0.01-0.10 per AI call vs free direct action)
- Worse UX for simple tasks

**Do this instead:**
- Direct UI for common actions (create contact, update deal stage)
- AI agent for complex workflows (research a company and create contact with enriched data)
- AI agent as optional enhancement, not required path

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Google Drive** | OAuth2 + REST API via backend proxy | Store fileId references in Firestore; use Drive Picker for file selection |
| **Google Gmail** | OAuth2 + REST API via backend proxy | Read-only access to user's emails; link emails to CRM records |
| **Google Calendar** | OAuth2 + REST API via backend proxy | Create calendar events; sync meeting times to deals |
| **Google Meet** | REST API for meeting metadata + recordings | Use Meet API to register for transcripts/recordings post-meeting |
| **Claude API** | Server-side API calls only | Never expose API key to client; use streaming for chat interface |
| **Firestore** | Firebase SDK (Admin on server, client SDK for listeners) | Admin SDK for Server Components/API Routes; client SDK in Client Components for real-time listeners |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client ↔ Server** | API Routes + Server Components | Server Components for data fetching; API Routes for mutations; avoid exposing Firestore queries to client |
| **App ↔ Firestore** | Firebase SDK (Admin for server, Client for listeners) | Centralize queries in `/lib/firestore/` for reusability; use TypeScript types for type safety |
| **App ↔ Google APIs** | Backend proxy (API Routes) | Never call Google APIs directly from client; store refresh tokens securely in database |
| **App ↔ AI Agent** | API Routes with streaming | Use Server-Sent Events (SSE) or streaming for real-time AI responses; handle tool calls server-side |
| **CRM Modules ↔ AI Agent** | Function calls (internal) | AI agent calls CRM functions directly; no API layer needed (same process) |

## Sources

### Architecture Patterns
- [2026 CRM Outlook: AI, Humans, and Scale Converge](https://www.crmbuyer.com/story/2026-crm-outlook-ai-humans-and-scale-converge-177583.html)
- [How to Integrate AI Agents with CRM - 2025](https://www.aalpha.net/blog/how-to-integrate-ai-agents-with-crm/)
- [Agentic CRM: Complete Guide + Top 5 Agentic CRMs](https://www.creatio.com/glossary/agentic-crm)
- [From Fragmented Systems To Intelligent Workflows: How CRM Platforms Like Salesforce Power Data-driven Enterprise Operations](https://dataconomy.com/2026/01/23/from-fragmented-systems-to-intelligent-workflows-how-crm-platforms-like-salesforce-power-data-driven-enterprise-operations/)

### Real-time Collaboration
- [Cost-Effective Real-Time Collaboration with PostgreSQL, WebSockets, and Firestore](https://devniket.medium.com/cost-effective-real-time-collaboration-with-postgresql-websockets-and-firestore-399b13242760)
- [Firebase vs WebSocket: Differences and how they work together](https://ably.com/topic/firebase-vs-websocket)
- [Implementing Real-Time Features in Web Apps with WebSockets and Firebase](https://arbisoft.com/blogs/implementing-real-time-features-in-web-apps-with-web-sockets-and-firebase)
- [Websocket Alternative: How to use Firestore to Listen to Realtime Events](https://canopas.com/websocket-alternative-how-to-use-firestore-to-listen-to-realtime-events-141e634d04bc)

### Google Workspace Integration
- [Google Workspace APIs](https://developers.google.com/workspace)
- [Google Workspace API Essentials](https://rollout.com/integration-guides/google-workspace-admin/api-essentials)
- [GPTBots × Google Drive Enterprise Integration Architecture](https://www.gptbots.ai/blog/googledrive-integration)
- [Google Drive API overview](https://developers.google.com/workspace/drive/api/guides/about-sdk)
- [How to get Google Meet transcripts programmatically](https://www.recall.ai/blog/how-to-get-transcripts-from-google-meet-developer-edition)

### AI Agent Architecture
- [A Complete Guide to AI Agent Architecture in 2026](https://www.lindy.ai/blog/ai-agent-architecture)
- [What Is an AI BDR? A Beginner's Guide for 2026](https://reply.io/blog/what-is-an-ai-bdr/)
- [Building AI Agents in 2026: Chatbots to Agentic Architectures](https://levelup.gitconnected.com/the-2026-roadmap-to-ai-agent-mastery-5e43756c0f26)
- [Claude-flow: Agent orchestration platform for Claude](https://github.com/ruvnet/claude-flow)
- [Build AI Agents with Claude Agent SDK and Microsoft Agent Framework](https://devblogs.microsoft.com/semantic-kernel/build-ai-agents-with-claude-agent-sdk-and-microsoft-agent-framework/)

### Next.js & Authentication
- [Google Sign-In with NextAuth.js](https://next-auth.js.org/providers/google)
- [Setting Up Google Sign-In in a Next.js App](https://www.codemancers.com/blog/2024-04-17-set-up-google-signin-next-js)
- [How to implement Google authentication in Next.js 15](https://clerk.com/blog/nextjs-google-authentication)
- [NextAuth.js 2025: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)

### MVP Development & Architecture Decisions
- [MVP Development Guide 2026: Build, Launch & Scale Faster](https://www.creolestudios.com/mvp-development-guide/)
- [Monolith vs Microservices for MVP Apps: Cost & Speed](https://shivlab.com/blog/monolith-vs-microservices-mvp-apps-cost-speed-growth/)
- [Monolith vs Microservices Decision Framework 2026](https://www.agilesoftlabs.com/blog/2026/02/monolith-vs-microservices-decision)
- [Microservices vs Monoliths in 2026: When Each Architecture Wins](https://www.javacodegeeks.com/2025/12/microservices-vs-monoliths-in-2026-when-each-architecture-wins.html)

### Firestore & Firebase
- [Google Cloud Firestore Node.js Client - Context7](https://context7.com/googleapis/nodejs-firestore/llms.txt)
- [Firestore Real-time Listeners Documentation](https://github.com/googleapis/nodejs-firestore/blob/main/api-report/firestore.api.md)

### Next.js Documentation
- [Next.js Official Documentation - Context7](https://context7.com/vercel/next.js)
- [Next.js Server and Client Components](https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/05-server-and-client-components.mdx)
- [Next.js API Routes and Data Fetching](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/fetch.mdx)

---
*Architecture research for: Prytaneum/Valkyrie M&A Investor CRM*
*Researched: 2026-02-11*
*Confidence: HIGH (verified with Context7, official docs, and 2026 industry sources)*
