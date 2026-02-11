# Prytaneum/Valkyrie M&A Investor CRM

## What This Is

A web-based CRM application for managing M&A/investor activity, built for Prytaneum/Valkyrie's deal flow operations. The system replaces their current ChatGPT Project + Google Sheets workflow with a professional, integrated platform that tracks investor relationships, automates meeting intelligence, manages documents, and provides AI-powered strategic guidance through a conversational BDR agent. The application serves 4 internal users and will be demonstrated to external investors.

## Core Value

The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning, not optimism or scattered updates.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Core Pipeline Management:**
- [ ] View investor pipeline in table format with sorting, filtering, search
- [ ] View investor pipeline in kanban/board format organized by stage
- [ ] Add new investor records via structured forms
- [ ] Edit existing investor records with full field access
- [ ] Track 20+ data fields per investor (firm, contact, stage, strategy, etc.)
- [ ] Enforce stage discipline (stage reflects completed work, not intent)
- [ ] Record activity updates (calls, emails, meetings, LP actions)
- [ ] Track next actions and target dates per investor
- [ ] Support 4 concurrent users with role-based access

**AI BDR Agent:**
- [ ] Conversational chat interface accessible from main UI
- [ ] Answer questions about specific investors based on pipeline data
- [ ] Provide strategy suggestions for advancing relationships
- [ ] Surface relevant investor context and history
- [ ] Recommend prioritization and next actions

**Google Workspace Integration:**
- [ ] Google Workspace SSO authentication (team login via company accounts)
- [ ] Google Drive integration for document storage and linking
- [ ] Link documents to specific investor records
- [ ] Google Calendar integration for meeting scheduling
- [ ] Data persistence using Google ecosystem (Sheets, Firestore, or similar)

**Professional UI/UX:**
- [ ] Branded interface reflecting Prytaneum/Valkyrie identity (logos, colors, typography)
- [ ] Investor-grade design quality suitable for external demonstration
- [ ] Responsive layout optimized for desktop/laptop use
- [ ] Custom design system with consistent components
- [ ] Professional navigation and information architecture

**Advanced Features (Demonstrate Capability):**
- [ ] Automatic GMeet recording capture and transcription
- [ ] Meeting intelligence pipeline (recordings → transcripts → minutes → action items)
- [ ] Relationship graph visualization (LinkedIn network connections)
- [ ] Warm introduction path suggestions based on network analysis
- [ ] Document e-signature workflow using Google Docs native signing
- [ ] Email document distribution from within CRM

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

**Current State:**
- Team currently uses ChatGPT Project + Google Sheets for investor management
- Existing Excel file contains ~5 investor records with 20-column data schema
- Workflow emphasizes disciplined stage progression and strategy reviews
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
| Focus investor view for v1, defer M&A targets | Core use case, existing data structure, Friday demo focus | — Pending |
| Use Google Sheets as initial data store | Team familiarity, rapid development, meets data storage constraint | — Pending |
| BDR agent as chat interface (not voice) | Faster implementation, demonstrates AI capability effectively | — Pending |
| Demonstrate advanced features vs fully building | Meeting intelligence and relationship graph shown in demo, full polish post-Friday | — Pending |
| Aggressive parallel development with AI agents | Leverage AI's ability to work 24/7 with unlimited parallelization to meet 2-day timeline | — Pending |

---
*Last updated: 2026-02-11 after initialization*
