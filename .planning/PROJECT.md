# Prytaneum/Valkyrie M&A Investor CRM

## What This Is

A web-based CRM application for managing M&A/investor activity, built for Prytaneum/Valkyrie's deal flow operations. The system replaces their current ChatGPT Project + Google Sheets workflow with a professional, integrated platform that tracks investor relationships, automates meeting intelligence, manages documents, and provides AI-powered strategic guidance through a conversational BDR agent. The application serves 4 internal users and will be demonstrated to external investors.

## Core Value

The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning, not optimism or scattered updates.

## Requirements

### Validated

**Core Pipeline Management (v1.0):**
- ✓ View investor pipeline in table format with sorting, filtering, search — v1.0
- ✓ View investor pipeline in kanban/board format organized by stage — v1.0
- ✓ Add new investor records via structured forms — v1.0
- ✓ Edit existing investor records with full field access — v1.0
- ✓ Track 20+ data fields per investor (firm, contact, stage, strategy, etc.) — v1.0
- ✓ Enforce stage discipline (stage reflects completed work, not intent) — v1.0
- ✓ Record activity updates (calls, emails, meetings, LP actions) — v1.0
- ✓ Track next actions and target dates per investor — v1.0
- ✓ Support 4 concurrent users with role-based access — v1.0

**AI BDR Agent (v1.0):**
- ✓ Conversational chat interface accessible from main UI — v1.0
- ✓ Answer questions about specific investors based on pipeline data — v1.0
- ✓ Provide strategy suggestions for advancing relationships — v1.0
- ✓ Surface relevant investor context and history — v1.0
- ✓ Recommend prioritization and next actions — v1.0 (requires ANTHROPIC_API_KEY)

**Google Workspace Integration (v1.0):**
- ✓ Google Workspace SSO authentication (team login via company accounts) — v1.0
- ✓ Google Drive integration for document storage and linking — v1.0 (requires GOOGLE_CLIENT_ID)
- ✓ Link documents to specific investor records — v1.0
- ✓ Google Calendar integration for meeting scheduling — v1.0 (requires GOOGLE_CLIENT_ID)
- ✓ Data persistence using Supabase PostgreSQL (replaced Google Sheets constraint) — v1.0

**Professional UI/UX (v1.0):**
- ✓ Branded interface reflecting Prytaneum/Valkyrie identity (logos, colors, typography) — v1.0
- ✓ Investor-grade design quality suitable for external demonstration — v1.0
- ✓ Responsive layout optimized for desktop/laptop use (1280px+) — v1.0
- ✓ Custom design system with consistent shadcn/ui components — v1.0
- ✓ Professional navigation and information architecture — v1.0

**LinkedIn Intelligence (v1.0 - Phase 4.5 insertion):**
- ✓ LinkedIn CSV import with batch processing (19K+ contacts) — v1.0
- ✓ Company matching via fuzzy search with pg_trgm — v1.0
- ✓ Warm introduction path detection with strength scoring — v1.0
- ✓ Relationship path ranking (works_at, former_colleague, knows_decision_maker) — v1.0

**Real-time Collaboration (v1.0):**
- ✓ Multi-user live updates via Supabase Realtime — v1.0
- ✓ Presence indicators (who's viewing/editing) — v1.0
- ✓ Optimistic locking with version control — v1.0
- ✓ Conflict resolution on concurrent edits — v1.0

### Active

**Advanced Features (Demonstrate Capability):**
- [ ] Automatic GMeet recording capture and transcription
- [ ] Meeting intelligence pipeline (recordings → transcripts → minutes → action items)
- [ ] Relationship graph visualization (LinkedIn network connections)
- [ ] Document e-signature workflow using Google Docs native signing
- [ ] Email document distribution from within CRM

**Environment Configuration (Post-Demo):**
- [ ] Google OAuth credentials setup (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] Anthropic API key configuration (for AI BDR)
- [ ] Real-time collaboration migrations (024-025.sql in Supabase)
- [ ] Performance testing with authenticated sessions (PERF-01 through PERF-04)

### Out of Scope

- M&A Targets view (different data model, prioritized for v1.1) — focus investor view first
- Portfolio Companies view (post-acquisition management, planned for v2) — not core to fundraising
- Fund Management view (group-level operations, planned for v2) — separate concern
- Mobile native apps (iOS/Android) — web-first approach, mobile later
- Real-time team chat/messaging — not requested, Slack/email sufficient
- Third-party API for external integrations — internal tool first
- Offline mode — web application requires connectivity
- Multi-language support — English only for v1
- Custom reporting/dashboards — use pipeline views initially

## Context

**Current State (v1.0 Shipped — Feb 13, 2026):**
- Production CRM with 15,229 LOC TypeScript/TSX shipped in 2 days
- Built with Next.js 16, Supabase PostgreSQL, Google Workspace integration
- Supports 4 concurrent users with real-time collaboration
- Deployed and ready for Friday investor demo at 10am ET
- Replaces ChatGPT Project + Google Sheets workflow

**Original State (Feb 11, 2026):**
- Team used ChatGPT Project + Google Sheets for investor management
- Existing Excel file had ~5 investor records with 20-column data schema
- Workflow emphasized disciplined stage progression and strategy reviews
- Stage changes governed by exit checklists (prevent premature optimism)
- Strategy development separate from operational activity updates
- Relationship mapping via LinkedIn CSV exports (quarterly refresh)
- 4 team members: Christopher Morino, Jackson Dickfos, and 2 others

**Data Model (from existing Excel):**
- Identity: Firm Name, Primary Contact, Relationship Owner, Partner/Source
- Economics: Estimated Value
- Pipeline: Stage, Entry Date, Last Action Date, Stalled flag
- Type: Allocator Type (Family Office, HNWI, Endowment, etc.)
- Assessment: Internal Conviction, Internal Priority
- Decision: Investment Committee Timing
- Execution: Next Action, Next Action Date
- Strategy: Current/Last strategy notes and dates, Key Objection/Risk

**Stage Definitions:**
Not Yet Approached → Initial Contact → First Conversation Held → Materials Shared → NDA / Data Room → Active Due Diligence → LPA / Legal → Won / Committed / Lost / Passed / Delayed

**Brand Identity:**
- Prytaneum Partners: "Full control, zero chaos" — minimalist, operational precision aesthetic
- Valkyrie Revival: "REVIVE. SCALE. THRIVE." — Norse mythology theme, dark/authoritative, technology-forward

## Constraints

- **Timeline**: Demo/v1 launch Friday Feb 13, 2026 at 10am ET (2 days from project start)
- **Tech Stack**: Must integrate with Google Workspace ecosystem (Drive, Gmail, Calendar, Meet)
- **Data Storage**: Must use Google ecosystem tools (Sheets, Firestore, Drive) — no external databases without Google integration
- **Authentication**: Google Workspace SSO only — no email/password, no other OAuth providers
- **Users**: 4 internal team members initially
- **Audience**: Will be demonstrated to external investors — requires professional polish
- **Performance**: Reasonable performance for <100 investor records initially
- **Security**: Google Workspace security model, data residency in Google Drive per user requirements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus investor view for v1, defer M&A targets | Core use case, existing data structure, Friday demo focus | ✓ Good — shipped investor CRM, deferred targets to v1.1 |
| Use Supabase PostgreSQL (changed from Google Sheets) | Better performance, real-time support, proper relational model | ✓ Good — enabled real-time collaboration and LinkedIn intelligence |
| BDR agent as chat interface (not voice) | Faster implementation, demonstrates AI capability effectively | ✓ Good — clean UI, 5 tools, streaming responses |
| Demonstrate advanced features vs fully building | Meeting intelligence and relationship graph shown in demo, full polish post-Friday | ✓ Good — core features complete, advanced capabilities documented for post-demo |
| Aggressive parallel development with AI agents | Leverage AI's ability to work 24/7 with unlimited parallelization to meet 2-day timeline | ✓ Good — 10.5 phases, 37 plans completed in 7.8 hours total development time |

---
*Last updated: 2026-02-13 after v1.0 milestone completion*
