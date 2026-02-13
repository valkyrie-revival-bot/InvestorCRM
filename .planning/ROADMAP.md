# Roadmap: Prytaneum/Valkyrie M&A Investor CRM

## Overview

This roadmap delivers a production-ready investor CRM in 2 days through aggressive parallel development. We start with foundational authentication and data infrastructure, then build core pipeline management and Google Workspace integration in parallel. Once the CRM foundation is solid, we layer on the AI BDR agent (our competitive differentiator) and polish the UI to investor-grade quality. The roadmap maps all 60 v1 requirements to 10 phases designed for maximum parallelization while respecting technical dependencies.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Environment** - Project scaffolding, tech stack setup, deployment pipeline
- [x] **Phase 2: Authentication & Security** - Google Workspace SSO, session management, audit logging
- [x] **Phase 3: Data Model & Core CRUD** - Database schema, investor records, basic operations
- [ ] **Phase 4: Pipeline Views & Search** - Table view, kanban view, filtering, search
- [x] **Phase 5: Stage Discipline & Workflow** - Stage definitions, validation rules, drag-and-drop
- [ ] **Phase 6: Activity & Strategy Management** - Activity logging, strategy notes, next actions
- [ ] **Phase 7: Google Workspace Integration** - Drive, Gmail, Calendar integration
- [ ] **Phase 8: Real-time Collaboration** - Multi-user live updates, conflict resolution
- [ ] **Phase 9: AI BDR Agent** - Conversational interface, pipeline queries, AI-powered guidance
- [ ] **Phase 10: UI Polish & Performance** - Brand identity, responsive design, optimization

## Phase Details

### Phase 1: Foundation & Environment
**Goal**: Development environment is configured with modern stack and deployment pipeline ready
**Depends on**: Nothing (first phase)
**Requirements**: None (infrastructure prerequisite)
**Success Criteria** (what must be TRUE):
  1. Next.js 16 project initializes successfully with App Router and TypeScript
  2. Supabase project is created and connected with environment variables configured
  3. Development server runs locally without errors
  4. Vercel deployment pipeline is configured and first deploy succeeds
  5. shadcn/ui component library is installed and theme configured
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Initialize Next.js 16 project with all dependencies and shadcn/ui (Wave 1)
- [x] 01-02-PLAN.md -- Configure Supabase clients, auth middleware, route groups, theme provider (Wave 2)
- [x] 01-03-PLAN.md -- Verify dev server, deploy to Vercel, visual checkpoint (Wave 3)

### Phase 2: Authentication & Security
**Goal**: Users can securely authenticate with Google Workspace SSO and access is audit logged
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can log in with Google Workspace account (organization accounts only)
  2. User session persists across browser refresh and tab closure
  3. OAuth tokens are managed with 90-day re-consent workflow configured
  4. System enforces role-based access control for 5 team members
  5. All sensitive data access is logged with timestamp and user identity
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md -- Database schema: user_roles, auth hook, supa_audit, audit tables, RLS helpers (Wave 1)
- [x] 02-02-PLAN.md -- Google OAuth login flow: branded login page, callback route, sign-out (Wave 1)
- [x] 02-03-PLAN.md -- Auth provider, session management, role hooks, session expiry modal (Wave 2)
- [x] 02-04-PLAN.md -- Audit log UI, user management page, end-to-end verification (Wave 3)

### Phase 3: Data Model & Core CRUD
**Goal**: Investor records can be created, read, updated, and deleted with proper data persistence
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-03, DATA-04, PIPE-06, PIPE-07, PIPE-08, PIPE-09 (DATA-02 deferred to Phase 7)
**Success Criteria** (what must be TRUE):
  1. User can create new investor record via structured form capturing all 20 data fields
  2. User can edit existing investor record with full field access and inline validation
  3. User can delete investor record with confirmation prompt
  4. ~~User can export pipeline data to CSV/Excel format~~ (Deferred to Phase 7 - Google Drive/Sheets export)
  5. Existing Excel data migrated via one-time script (not user-facing import UI)
  6. All data persists in Supabase PostgreSQL with proper schema and constraints
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md -- Database schema (investors, contacts, activities), RLS policies, indexes, TypeScript types (Wave 1)
- [x] 03-02-PLAN.md -- Zod validation schemas and CRUD server actions (Wave 2)
- [x] 03-03-PLAN.md -- Investors list page with quick create modal (Wave 3)
- [x] 03-04-PLAN.md -- Detail page with inline editing and collapsible sections (Wave 3)
- [x] 03-05-PLAN.md -- Delete confirmation, undo toast, Excel migration, verification (Wave 4)

### Phase 4: Pipeline Views & Search
**Goal**: Users can view and navigate investor pipeline in multiple formats with powerful search
**Depends on**: Phase 3
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-12
**Success Criteria** (what must be TRUE):
  1. User can view investor pipeline in table format with sortable columns
  2. User can filter pipeline by stage, allocator type, internal conviction, and stalled status
  3. User can search pipeline by firm name, contact name, or any text field with results appearing in under 500ms
  4. User can view investor pipeline in kanban/board format organized by stage
  5. User can view activity history timeline for each investor record
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- View switcher with enhanced search, filters (allocator type, conviction, stalled), and Table/Board tabs (Wave 1)
- [x] 04-02-PLAN.md -- Kanban board with drag-and-drop stage transitions using @hello-pangea/dnd (Wave 2)
- [x] 04-03-PLAN.md -- Activity timeline on investor detail page with type filtering (Wave 1)

### Phase 4.5: Contact Intelligence & LinkedIn Network (URGENT)
**Goal**: Import team LinkedIn networks and map relationships to investors for warm introduction paths
**Depends on**: Phase 4
**Requirements**: New capability - relationship intelligence layer
**Success Criteria** (what must be TRUE):
  1. User can import LinkedIn connection CSVs (4 team members)
  2. System stores and indexes LinkedIn contacts separately from investor contacts
  3. System automatically detects commonalities between LinkedIn contacts and investors
  4. User can view warm introduction paths with strength scoring
  5. System maps relationships (works_at, knows_decision_maker, former_colleague, etc.)
  6. User sees "Connections" tab on investor detail page showing related LinkedIn contacts
**Plans**: 3 plans

Plans:
- [ ] 04.5-01-PLAN.md -- Database schema (linkedin_contacts, investor_relationships), TypeScript types, Zod schema, npm deps (Wave 1)
- [ ] 04.5-02-PLAN.md -- CSV parser, company normalizer, import server action, LinkedIn import UI page (Wave 2)
- [ ] 04.5-03-PLAN.md -- Fuzzy matching engine, relationship detection, strength scoring, Connections section on investor detail (Wave 3)

### Phase 5: Stage Discipline & Workflow
**Goal**: Pipeline stages enforce disciplined progression with validation rules and automated tracking
**Depends on**: Phase 4
**Requirements**: STAGE-01, STAGE-02, STAGE-03, STAGE-04, STAGE-05, STAGE-06, PIPE-05
**Success Criteria** (what must be TRUE):
  1. System enforces stage definitions from "Initial Contact" through "Won/Lost/Delayed"
  2. System requires exit checklist confirmation before advancing stage with explicit criteria
  3. System blocks premature stage advancement if criteria not met (with override option)
  4. User can drag-and-drop investors between stages in kanban view
  5. System automatically updates "Stage Entry Date" when stage changes
  6. System flags investor as "Stalled" if no meaningful LP action for 30+ days
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md -- Stage definitions config, DB migration for stage_entry_date trigger, TypeScript types (Wave 1)
- [x] 05-02-PLAN.md -- Stage transition server action, validation dialog, override dialog (Wave 2)
- [x] 05-03-PLAN.md -- Kanban board validation integration, stalled detection, visual verification (Wave 3)

### Phase 6: Activity & Strategy Management
**Goal**: Users can log operational updates and evolve strategic thinking separate from activities
**Depends on**: Phase 5
**Requirements**: STRAT-01, STRAT-02, STRAT-03, STRAT-04, STRAT-05, PIPE-10, PIPE-11
**Success Criteria** (what must be TRUE):
  1. User can record activity updates (calls, emails, meetings, LP actions) with timestamps
  2. User can set next action and target date for each investor
  3. User can enter current strategy notes for each investor
  4. System automatically archives previous strategy to "Last Strategy" with date
  5. User can access strategy history showing evolution over time
  6. User can document key objections/risks per investor in dedicated field
**Plans**: TBD

Plans:
- [ ] 06-01: Build activity logging system with timestamp tracking
- [ ] 06-02: Implement next action and target date management
- [ ] 06-03: Create strategy management with automatic archiving
- [ ] 06-04: Build strategy history view and key objection tracking

### Phase 7: Google Workspace Integration
**Goal**: CRM integrates seamlessly with Google Drive, Gmail, and Calendar for document management and scheduling
**Depends on**: Phase 2 (OAuth infrastructure)
**Requirements**: GOOG-01, GOOG-02, GOOG-03, GOOG-04, GOOG-05, GOOG-06, GOOG-07, GOOG-08, GOOG-09, GOOG-10
**Success Criteria** (what must be TRUE):
  1. User can link Google Drive documents to specific investor records
  2. User can view linked documents directly from investor detail page
  3. User can log emails related to specific investors via Gmail integration
  4. User can schedule meetings with investors via Calendar integration
  5. System automatically logs scheduled meetings in activity timeline
  6. All Google API calls implement exponential backoff for rate limiting
**Plans**: TBD

Plans:
- [ ] 07-01: Implement Google Drive integration with document picker
- [ ] 07-02: Build Gmail integration for email activity logging
- [ ] 07-03: Integrate Google Calendar for meeting scheduling
- [ ] 07-04: Implement API rate limiting and exponential backoff

### Phase 8: Real-time Collaboration
**Goal**: Multiple team members can work simultaneously with live updates and conflict prevention
**Depends on**: Phase 3 (data model must exist)
**Requirements**: COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-04
**Success Criteria** (what must be TRUE):
  1. User sees live updates when teammate edits investor record (updates within 1 second)
  2. User sees live updates when teammate moves investor in kanban view
  3. System shows which users are currently viewing/editing each record
  4. System prevents conflicting edits with optimistic locking mechanism
**Plans**: TBD

Plans:
- [ ] 08-01: Implement Supabase real-time subscriptions for live updates
- [ ] 08-02: Build presence system showing active users per record
- [ ] 08-03: Create optimistic locking and conflict resolution

### Phase 9: AI BDR Agent
**Goal**: Conversational AI agent provides pipeline intelligence and strategic recommendations
**Depends on**: Phase 3, 4, 5, 6 (needs complete CRM to query and update)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08
**Success Criteria** (what must be TRUE):
  1. User can access conversational chat interface from main UI
  2. User can query pipeline with natural language ("Show me stalled investors")
  3. User can ask for strategy suggestions based on current pipeline data
  4. User can update investor records conversationally through AI agent
  5. AI agent surfaces relevant investor context and history automatically
  6. AI agent recommends prioritization and next actions based on pipeline state
  7. System validates AI input to prevent prompt injection attacks
  8. AI agent operates with read-only access by default (privilege minimization)
**Plans**: TBD

Plans:
- [ ] 09-01: Build chat interface with Vercel AI SDK and streaming
- [ ] 09-02: Integrate Claude Opus 4.6 with function calling for CRM actions
- [ ] 09-03: Implement pipeline query and analysis tools
- [ ] 09-04: Build AI security controls (input validation, privilege minimization)
- [ ] 09-05: Create strategy suggestion and prioritization logic

### Phase 10: UI Polish & Performance
**Goal**: Application meets investor-grade design quality with branded identity and optimal performance
**Depends on**: All previous phases (polish applies across entire application)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Application reflects Prytaneum/Valkyrie brand identity (logos, colors, typography)
  2. Application uses shadcn/ui component library consistently across all views
  3. Application is fully responsive for desktop/laptop screens (1280px minimum)
  4. Application meets investor-grade design quality standards suitable for external demo
  5. Navigation is intuitive with clear information architecture
  6. Forms provide inline validation and helpful error messages
  7. System provides loading states and progress indicators for all async operations
  8. Pipeline views load in under 2 seconds for 100 investor records
  9. Search results appear in under 500ms
  10. Real-time updates propagate to all users within 1 second
  11. System handles 4 concurrent users without performance degradation
**Plans**: TBD

Plans:
- [ ] 10-01: Implement Prytaneum/Valkyrie brand identity across application
- [ ] 10-02: Polish all UI components for consistency and quality
- [ ] 10-03: Optimize performance for pipeline views and search
- [ ] 10-04: Add comprehensive loading states and error handling
- [ ] 10-05: Conduct final UX review and accessibility improvements

## Progress

**Execution Order:**
Phases execute in numeric order. Phases 7 and 8 can be developed in parallel with Phases 5-6 if multiple developers/agents available.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Environment | 3/3 | Complete | 2026-02-11 |
| 2. Authentication & Security | 4/4 | Complete | 2026-02-11 |
| 3. Data Model & Core CRUD | 5/5 | Complete | 2026-02-12 |
| 4. Pipeline Views & Search | 3/3 | Complete | 2026-02-12 |
| 4.5. Contact Intelligence (INSERTED) | 3/3 | Complete | 2026-02-12 |
| 5. Stage Discipline & Workflow | 3/3 | Complete | 2026-02-12 |
| 6. Activity & Strategy Management | 0/TBD | Not started | - |
| 7. Google Workspace Integration | 0/TBD | Not started | - |
| 8. Real-time Collaboration | 0/TBD | Not started | - |
| 9. AI BDR Agent | 0/TBD | Not started | - |
| 10. UI Polish & Performance | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-12 after Phase 5 execution (Stage Discipline & Workflow - 3 plans complete, validation dialogs, stalled detection, 6/6 must-haves verified)*
