# M&A Intelligence System - Impact Assessment

**Date:** 2026-02-12
**Trigger:** Scope transformation from "Investor CRM" to "M&A Intelligence System"

## Executive Summary

The addition of LinkedIn contacts, AI BDR agent, voice interface, and OSINT capabilities transforms this from a pipeline management tool into a comprehensive M&A intelligence platform. This assessment reviews all completed work (Phases 1-4) to validate compatibility and identify gaps.

---

## Completed Phases - Validation Status

### ✅ Phase 1: Foundation & Environment
**Status:** FULLY COMPATIBLE - No changes needed

**What was built:**
- Next.js 16 with App Router
- Supabase PostgreSQL + Auth
- Tailwind v4 dark theme
- shadcn/ui components

**Why it works:**
- Modern stack supports RAG/vector search (pgvector extension)
- Supabase Auth already integrates with Google (needed for Gmail/GChat APIs)
- Component library supports chat interfaces
- Dark theme appropriate for M&A intelligence platform

**Action:** None required

---

### ✅ Phase 2: Authentication & Security
**Status:** COMPATIBLE - Enhancement opportunities

**What was built:**
- Google Workspace SSO
- Role-based access control (4 team members)
- Three-tier audit logging
- JWT-based session management

**Gaps identified:**
1. **Missing OAuth scopes** for Gmail API + Google Chat API
2. **API rate limiting** not yet implemented (needed for OSINT + email automation)
3. **Service account** not configured for background jobs (daily emails)

**Enhancement needed:**
- Expand OAuth consent to include:
  - `https://www.googleapis.com/auth/gmail.send` (send emails)
  - `https://www.googleapis.com/auth/chat.spaces` (Google Chat integration)
- Add API rate limiter middleware
- Configure service account for scheduled jobs

**Priority:** Medium (Phase 7.5 integration work)

---

### ⚠️ Phase 3: Data Model & Core CRUD
**Status:** REQUIRES EXTENSION - Core tables good, missing relationship layer

**What was built:**
- `investors` table (20 fields)
- `contacts` table (investor contacts)
- `activities` table (immutable audit trail)
- RLS policies
- TypeScript types

**Gaps identified:**

#### 1. **Missing: LinkedIn Contacts Table**
Current `contacts` table stores investor contacts (people AT the investor firm).
Need separate table for LinkedIn network connections (your team's relationships).

```sql
-- NEW TABLE NEEDED
create table public.linkedin_contacts (
  id uuid primary key default gen_random_uuid(),

  -- LinkedIn data
  first_name text not null,
  last_name text not null,
  linkedin_url text not null unique,
  email text,
  company text,
  position text,
  connected_on date,

  -- Relationship tracking
  team_member_id uuid references auth.users(id),
  relationship_strength text, -- 'strong' | 'medium' | 'weak'
  last_interaction_date date,
  notes text,

  -- Standard fields
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_linkedin_contacts_team_member on linkedin_contacts(team_member_id);
create index idx_linkedin_contacts_company on linkedin_contacts(company);
create index idx_linkedin_contacts_email on linkedin_contacts(email) where email is not null;
```

#### 2. **Missing: Investor-Contact Relationship Mapping**
Need to map which LinkedIn contacts have relationships with which investors.

```sql
-- NEW TABLE NEEDED
create table public.investor_relationships (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references public.investors(id) on delete cascade,
  linkedin_contact_id uuid references public.linkedin_contacts(id) on delete cascade,

  -- Relationship metadata
  relationship_type text, -- 'works_at' | 'knows_decision_maker' | 'former_colleague'
  path_strength numeric(3,2), -- 0.0 to 1.0 (warm intro strength)
  verified boolean default false,
  notes text,

  created_at timestamptz default now(),

  unique(investor_id, linkedin_contact_id)
);

create index idx_investor_relationships_investor on investor_relationships(investor_id);
create index idx_investor_relationships_contact on investor_relationships(linkedin_contact_id);
```

#### 3. **Missing: Action Items / To-Do Table**
Current activity logging is immutable. Need mutable action items for daily to-do lists.

```sql
-- NEW TABLE NEEDED
create table public.action_items (
  id uuid primary key default gen_random_uuid(),

  -- Assignment
  assigned_to uuid references auth.users(id) not null,
  investor_id uuid references public.investors(id) on delete cascade,

  -- Content
  title text not null,
  description text,
  priority text not null default 'medium', -- 'high' | 'medium' | 'low'

  -- Lifecycle
  status text not null default 'pending', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date date,
  completed_at timestamptz,

  -- AI metadata
  generated_by_ai boolean default false,
  ai_context jsonb, -- Store prompt + reasoning

  -- Standard fields
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_action_items_assigned_to on action_items(assigned_to) where status != 'completed';
create index idx_action_items_due_date on action_items(due_date) where status != 'completed';
create index idx_action_items_investor on action_items(investor_id);
```

#### 4. **Missing: AI Agent Conversation History**
Need to log AI agent interactions separate from activities.

```sql
-- NEW TABLE NEEDED
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),

  -- Context
  user_id uuid references auth.users(id) not null,
  investor_id uuid references public.investors(id), -- nullable, not all convos are investor-specific

  -- Message
  role text not null, -- 'user' | 'assistant' | 'system'
  content text not null,

  -- Metadata
  tokens_used integer,
  model text, -- 'claude-opus-4' etc
  tools_called jsonb, -- Array of tool calls made

  -- Context window tracking
  conversation_id uuid not null, -- Group related messages
  sequence_number integer not null,

  created_at timestamptz default now()
);

create index idx_ai_conversations_user on ai_conversations(user_id, created_at desc);
create index idx_ai_conversations_conversation on ai_conversations(conversation_id, sequence_number);
create index idx_ai_conversations_investor on ai_conversations(investor_id) where investor_id is not null;
```

#### 5. **Missing: Knowledge Base Documents**
Track PDF embeddings for RAG.

```sql
-- NEW TABLE NEEDED
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),

  -- Document metadata
  filename text not null,
  document_type text not null, -- 'strategy' | 'faq' | 'valuation' | 'operating_model'
  file_path text not null, -- Google Drive path or local storage
  file_size_bytes bigint,

  -- Processing status
  processed boolean default false,
  embedding_model text, -- 'text-embedding-3-large' etc
  chunk_count integer,
  last_indexed_at timestamptz,

  -- Access control
  visibility text not null default 'team', -- 'team' | 'admin_only'

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Separate table for chunks (for vector search)
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.knowledge_documents(id) on delete cascade,

  -- Content
  content text not null,
  chunk_index integer not null,

  -- Vector embedding (pgvector extension required)
  embedding vector(1536), -- OpenAI ada-002 dimension

  -- Metadata for retrieval
  metadata jsonb, -- page number, section, etc

  created_at timestamptz default now()
);

create index idx_knowledge_chunks_document on knowledge_chunks(document_id);
-- Vector similarity search index (after pgvector extension enabled)
-- create index idx_knowledge_chunks_embedding on knowledge_chunks using ivfflat (embedding vector_cosine_ops);
```

#### 6. **Enhancement: Activities Table**
Current activities table is good but needs new activity types for AI agent actions.

**Current activity types:**
- call, email, meeting, note, stage_change, field_update

**Add new types:**
- `ai_call_plan` - AI generated call plan
- `ai_email_draft` - AI drafted email
- `ai_research` - AI conducted OSINT research
- `voice_interaction` - Voice conversation logged
- `linkedin_intro_request` - Warm intro requested via LinkedIn contact

**Action:** Add to ActivityType enum in types/investors.ts

---

### ✅ Phase 4: Pipeline Views & Search
**Status:** COMPATIBLE - Search needs extension

**What was built:**
- Table view with sorting
- Kanban board with drag-and-drop
- Real-time search (firm name, contacts, strategy notes, key objections)
- Multi-dimensional filtering (stage, allocator type, conviction, stalled)
- Activity timeline with type filtering

**Gaps identified:**

#### 1. **Search Scope Too Narrow**
Current search only covers investor table fields.

**Need to add:**
- Search across LinkedIn contacts
- Search across AI conversation history
- Search across knowledge documents (semantic search via RAG)

**Solution:** Create unified search endpoint that queries multiple tables

#### 2. **Missing: Relationship Graph View**
Kanban shows investors by stage. Need view that shows:
- Investors mapped to LinkedIn contacts
- Warm introduction paths
- Relationship strength visualization

**Action:** Add new view type in Phase 4.5

#### 3. **Missing: AI Chat Interface**
No UI for AI agent interaction yet.

**Action:** Add floating chat widget (Phase 8.5)

---

## New Tables Summary

| Table | Purpose | Phase |
|-------|---------|-------|
| `linkedin_contacts` | Store team's LinkedIn networks | 4.5 |
| `investor_relationships` | Map investors to contacts | 4.5 |
| `action_items` | Daily to-do lists | 5.5 |
| `ai_conversations` | AI agent chat history | 8.5 |
| `knowledge_documents` | RAG document tracking | 7.5 |
| `knowledge_chunks` | Vector embeddings for RAG | 7.5 |

---

## Search & Commonality Logic - Recommendations

### **Commonality Detection Algorithm**

When searching for connections between LinkedIn contacts and investors:

#### **1. Direct Employment Match (Strongest)**
```typescript
// Contact works at investor firm
linkedin_contact.company === investor.firm_name
→ Strength: 1.0 (100%)
→ Type: 'works_at'
```

#### **2. Shared Company History**
```typescript
// Contact previously worked at investor firm (needs work history data)
linkedin_contact.previous_companies.includes(investor.firm_name)
→ Strength: 0.7 (70%)
→ Type: 'former_colleague'
```

#### **3. Decision Maker Knowledge**
```typescript
// Contact knows someone at investor firm
investor.contacts.some(c =>
  linkedin_contacts.some(lc =>
    lc.company === c.company && lc.position.includes('Partner')
  )
)
→ Strength: 0.6 (60%)
→ Type: 'knows_decision_maker'
```

#### **4. Industry Overlap**
```typescript
// Contact is in same industry sector (requires industry tagging)
linkedin_contact.industry === investor.allocator_type
→ Strength: 0.3 (30%)
→ Type: 'industry_peer'
```

#### **5. Geographic Proximity**
```typescript
// Contact in same city/region (requires location data)
linkedin_contact.location === investor.location
→ Strength: 0.2 (20%)
→ Type: 'local_connection'
```

### **Warm Introduction Path Scoring**

When multiple paths exist to same investor:

```typescript
interface IntroductionPath {
  investor: Investor;
  contact: LinkedInContact;
  strength: number;
  hops: number; // 1 = direct, 2 = friend-of-friend
  relationship_type: string;
  last_interaction: Date;
}

function scoreIntroPath(path: IntroductionPath): number {
  let score = path.strength;

  // Recency bonus
  const daysSinceInteraction = daysBetween(path.last_interaction, new Date());
  if (daysSinceInteraction < 30) score *= 1.2;
  else if (daysSinceInteraction < 90) score *= 1.0;
  else score *= 0.8;

  // Hop penalty (2nd degree connections less valuable)
  score *= Math.pow(0.7, path.hops - 1);

  return score;
}
```

**Recommended thresholds:**
- Strong: score >= 0.7 → "High priority warm intro"
- Medium: score >= 0.4 → "Worth exploring"
- Weak: score < 0.4 → "Cold outreach"

---

## OSINT Integration - Key Questions

### **1. Data Sources**
What OSINT sources should the AI agent access?

**Recommended:**
- LinkedIn (already have connections data)
- Crunchbase (investor firm funding history)
- PitchBook (LP portfolio data - requires subscription)
- Google News (investor firm mentions)
- SEC filings (for public investors)
- Company websites (investor pages, team bios)

**Question:** Do you have API access to Crunchbase/PitchBook? Or scrape public data?

### **2. Research Triggers**
When should AI agent conduct OSINT research?

**Recommended triggers:**
- New investor added to pipeline → Auto-research
- Stage change to "Initial Contact" → Refresh research
- User asks "What do you know about [Investor]?" → On-demand
- Weekly batch job → Keep all Active investors up-to-date

**Question:** Prefer real-time or batch research?

### **3. Research Depth**
What level of detail?

**Option A: Light** (5-10 min per investor)
- Firm website scrape
- Recent news mentions (last 30 days)
- Key decision makers (from About page)
- Investment thesis (from website)

**Option B: Deep** (30-60 min per investor)
- Everything from Light, plus:
- Portfolio company analysis
- Historical funding rounds
- Team LinkedIn profiles
- Recent conference attendance
- Social media activity

**Question:** Which level for different stages?

### **4. Privacy & Ethics**
OSINT boundaries:

**Acceptable:**
- Public LinkedIn profiles
- Published news articles
- Company websites
- Public SEC filings
- Conference speaker lists

**Questionable (check legal):**
- Scraped email addresses
- Personal social media (non-professional)
- Unpublished contact info

**Question:** Where do you draw the line?

---

## Voice Interface - Architecture Questions

### **1. Voice Provider**
Which service for speech-to-text and text-to-speech?

**Options:**
- **OpenAI Whisper + TTS** (what you already use for Claude)
  - Pro: Integrated, excellent quality
  - Con: Slightly higher latency

- **Deepgram** (specialized for real-time)
  - Pro: Fastest, live streaming
  - Con: Another vendor

- **Google Cloud Speech-to-Text** (you're already on Google)
  - Pro: Native integration with GCP
  - Con: Less natural TTS

**Recommendation:** Start with OpenAI (already in package.json), migrate to Deepgram if latency issues.

### **2. Voice Activation**
How does user trigger voice input?

**Options:**
- **Push-to-talk** (hold button to speak)
  - Pro: Clear boundaries, no accidental activation
  - Con: Requires hand on keyboard

- **Wake word** ("Hey VALHROS")
  - Pro: Hands-free
  - Con: Privacy concerns, false positives

- **Always-on** (voice activity detection)
  - Pro: Most natural
  - Con: Everything goes to server

**Recommendation:** Push-to-talk for v1, add wake word later.

### **3. Conversation Context**
How long does AI remember conversation context?

**Recommendation:**
- Maintain context window per session (until page reload)
- Store conversation history in `ai_conversations` table
- Summarize after 10+ exchanges to compress context
- Reset context when switching investors

### **4. Voice Output**
Should AI always respond via voice, or only when triggered by voice input?

**Recommendation:**
- Voice input → Voice output (bidirectional)
- Text input → Text output (chat)
- User preference toggle in settings

---

## Daily To-Do Distribution

### **Email Format**
```
Subject: Your Daily Action Items - Feb 12, 2026

Hi Todd,

You have 5 action items for today:

HIGH PRIORITY
□ Call Sequoia Capital - Follow up on Materials Shared stage
  Due: Today | Investor: Sequoia Capital | Est. Value: $50M

MEDIUM PRIORITY
□ Draft email to Andreessen Horowitz - Introduction request via Mark Sampson
  Due: Tomorrow | Investor: a16z | Est. Value: $25M

□ Research Benchmark Capital - OSINT on recent portfolio exits
  Due: This week | Investor: Benchmark | Est. Value: $15M

---
View full pipeline: http://localhost:3001/investors
Manage action items: http://localhost:3001/tasks

Powered by VALHROS M&A Intelligence System
```

### **Google Chat Format**
```
🎯 Daily Action Items - Feb 12

*High Priority (2)*
• Call Sequoia Capital - Follow up
  Due: Today | $50M | [View](link)

*Medium Priority (3)*
• Draft email to a16z - Intro via Mark
  Due: Tomorrow | $25M | [View](link)

Reply 'done 1' to mark complete
```

**Question:** What time should daily emails send? (7am local time?)

---

## Sales Methodology Integration

You specified: MEDDIC, Sandler, Challenger, QBS, TAS, Chris Voss

### **How AI Agent Will Use Each:**

#### **MEDDIC (Qualification)**
```
When user asks: "Should we pursue this investor?"
AI evaluates:
- Metrics: Do they invest in our size/stage?
- Economic Buyer: Who makes the decision?
- Decision Criteria: What's important to them?
- Decision Process: How do they evaluate?
- Identify Pain: What problem do we solve?
- Champion: Do we have an internal advocate?

Output: Qualification score + gaps to address
```

#### **Sandler (Pain Finding)**
```
When generating call plans, AI structures around:
- Bonding & Rapport
- Up-front Contracts
- Pain (uncover investor's needs)
- Budget (do they have allocation available?)
- Decision (timeline and process)
- Fulfillment (how we meet their needs)

Output: Talk track for each stage
```

#### **Challenger (Teaching)**
```
When drafting emails, AI uses:
- Teach something unexpected about market
- Tailor message to investor's portfolio
- Take control of conversation

Output: Provocative, insight-driven emails
```

#### **QBS (Question-Based)**
```
AI suggests questions for each conversation:
- Status questions (establish rapport)
- Issue questions (identify concerns)
- Implication questions (amplify pain)
- Solution questions (create urgency)

Output: Questioning strategy by stage
```

#### **TAS (Target Account)**
```
For high-value investors (>$25M), AI creates:
- Account penetration strategy
- Multi-threading plan (multiple contacts)
- Political map (who influences whom)
- Value proposition by stakeholder

Output: Strategic account plan
```

#### **Chris Voss (Negotiation)**
```
During term sheet discussions, AI coaches:
- Tactical empathy phrases
- Mirroring and labeling
- Calibrated questions
- "No"-oriented questions
- Ackerman bargaining

Output: Negotiation talk tracks
```

---

## Recommendation: Phased Approach

### **Phase 4.5: Contact Intelligence** (INSERT NOW - 2-3 days)
**Why now:** Foundation for AI agent
- Import LinkedIn CSVs (4 files)
- Create linkedin_contacts + investor_relationships tables
- Build relationship mapping algorithm
- Add "Connections" tab to investor detail page
- Warm intro path visualization

### **Phase 5-6: Complete as planned** (3-4 days)
**Why:** Workflow foundation needed before AI
- Stage discipline & validation
- Activity logging enhancement
- Action items table + UI

### **Phase 7.5: Knowledge Base + RAG** (2-3 days)
**Why:** AI agent needs knowledge before it can coach
- Enable pgvector extension
- Ingest 5 PDFs to vector store
- Build semantic search API
- Test RAG retrieval quality

### **Phase 8.5: AI BDR Agent** (5-7 days)
**Why:** Main differentiator
- Floating chat widget UI
- Claude API integration with tool use
- Sales methodology prompts
- OSINT research tools
- Call plan generation
- Email drafting

### **Phase 8.6: Voice Interface** (2-3 days)
**Why:** Ultimate UX
- Whisper API integration
- TTS output
- Push-to-talk UI
- Conversation context management

### **Phase 8.7: Daily Automation** (1-2 days)
**Why:** Daily workflow automation
- Daily email digest
- Google Chat integration
- Scheduled jobs (Supabase Edge Functions)

---

## Critical Path Questions (Need Answers)

### **1. OSINT**
- [ ] Do you have Crunchbase/PitchBook API access?
- [ ] Real-time or batch OSINT research?
- [ ] Light vs Deep research per stage?
- [ ] Privacy boundaries?

### **2. Voice**
- [ ] Prefer OpenAI Whisper or Deepgram?
- [ ] Push-to-talk or wake word?
- [ ] Voice output always or on-demand?

### **3. To-Dos**
- [ ] Daily email send time? (7am?)
- [ ] Google Chat space/room setup?
- [ ] Action item priority rules?

### **4. AI Agent Personality**
- [ ] Tone: Direct but supportive? Or more aggressive Challenger-style?
- [ ] Formality level: Professional or slightly casual?
- [ ] Should AI proactively suggest actions or wait to be asked?

### **5. Sales Process**
- [ ] Which methodology per stage? (e.g., Sandler for early, MEDDIC for qualification, Voss for negotiation)
- [ ] Call script templates exist or should AI generate from PDFs?

---

## Next Steps

### **Immediate (Today):**
1. ✅ Update login page title (DONE)
2. Answer critical path questions above
3. Decide: Insert Phase 4.5 now or complete 5-6 first?

### **This Week:**
1. Create Phase 4.5 plan (Contact Intelligence)
2. Extend database schema (6 new tables)
3. Build LinkedIn CSV importer
4. Implement commonality detection

### **Next 2 Weeks:**
1. RAG knowledge base (ingest 5 PDFs)
2. AI BDR agent core (chat interface + Claude)
3. Voice interface
4. Daily automation

---

**Your call:** Do you want to answer the critical questions via Q&A, or should I make opinionated recommendations and we adjust as we build?
