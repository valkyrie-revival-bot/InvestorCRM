# Requirements: Prytaneum/Valkyrie M&A Investor CRM

**Defined:** 2026-02-11
**Core Value:** The investor pipeline must be accurate, accessible, and actionable — enabling the team to make disciplined fundraising decisions grounded in facts, real-time intelligence, and institutional learning.

## v1 Requirements

Requirements for Friday Feb 13, 2026 10am ET demo/launch. Each maps to roadmap phases.

### Authentication & Security

- [ ] **AUTH-01**: User can log in with Google Workspace SSO (organization accounts only)
- [ ] **AUTH-02**: OAuth tokens are managed with 90-day re-consent workflow
- [ ] **AUTH-03**: User session persists across browser refresh
- [ ] **AUTH-04**: System enforces role-based access control (4 team users)
- [ ] **AUTH-05**: All sensitive data access is audit logged with timestamp and user

### Core Pipeline Management

- [ ] **PIPE-01**: User can view investor pipeline in table format with sorting by any column
- [ ] **PIPE-02**: User can filter pipeline by stage, allocator type, internal conviction, stalled status
- [ ] **PIPE-03**: User can search pipeline by firm name, contact name, or any text field
- [ ] **PIPE-04**: User can view investor pipeline in kanban/board format organized by stage
- [ ] **PIPE-05**: User can drag-and-drop investors between stages in kanban view
- [ ] **PIPE-06**: User can create new investor record via structured form (20+ fields)
- [ ] **PIPE-07**: User can edit existing investor record with full field access
- [ ] **PIPE-08**: User can delete investor record with confirmation prompt
- [ ] **PIPE-09**: System tracks 20 data fields per investor (firm, contact, stage, value, dates, strategy, etc.)
- [ ] **PIPE-10**: User can record activity updates (calls, emails, meetings, LP actions) with timestamps
- [ ] **PIPE-11**: User can set next action and target date for each investor
- [ ] **PIPE-12**: User can view activity history timeline for each investor

### Stage Discipline & Workflow

- [ ] **STAGE-01**: System enforces stage definitions (Initial Contact → Materials Shared → NDA → Due Diligence → Won/Lost/Delayed)
- [ ] **STAGE-02**: System requires exit checklist confirmation before advancing stage
- [ ] **STAGE-03**: System blocks premature stage advancement if criteria not met
- [ ] **STAGE-04**: User can override stage block with explicit confirmation and reason
- [ ] **STAGE-05**: System automatically updates "Stage Entry Date" when stage changes
- [ ] **STAGE-06**: System flags investor as "Stalled" if no meaningful LP action for 30+ days

### Strategy Management

- [ ] **STRAT-01**: User can enter current strategy notes for each investor
- [ ] **STRAT-02**: System automatically archives previous strategy to "Last Strategy" with date
- [ ] **STRAT-03**: User can access strategy history showing evolution over time
- [ ] **STRAT-04**: System supports separate "Strategy Review" mode distinct from operational updates
- [ ] **STRAT-05**: User can document key objections/risks per investor

### AI BDR Agent

- [ ] **AI-01**: User can access conversational chat interface from main UI
- [ ] **AI-02**: User can query pipeline ("Show me stalled investors")
- [ ] **AI-03**: User can ask for strategy suggestions based on pipeline data
- [ ] **AI-04**: User can update investor records conversationally through AI agent
- [ ] **AI-05**: AI agent surfaces relevant investor context and history automatically
- [ ] **AI-06**: AI agent recommends prioritization and next actions
- [ ] **AI-07**: System validates AI input to prevent prompt injection attacks
- [ ] **AI-08**: AI agent operates with read-only access by default (privilege minimization)

### Google Workspace Integration

- [ ] **GOOG-01**: User can authenticate via Google Workspace SSO
- [ ] **GOOG-02**: System connects to Google Drive for document storage
- [ ] **GOOG-03**: User can link Google Drive documents to specific investor records
- [ ] **GOOG-04**: User can view linked documents directly from investor detail page
- [ ] **GOOG-05**: System integrates with Gmail API to capture email activity
- [ ] **GOOG-06**: User can log emails related to specific investors
- [ ] **GOOG-07**: System integrates with Google Calendar for meeting scheduling
- [ ] **GOOG-08**: User can schedule meetings with investors via Calendar integration
- [ ] **GOOG-09**: System automatically logs scheduled meetings in activity timeline
- [ ] **GOOG-10**: System implements exponential backoff for all Google API calls

### Real-time Collaboration

- [ ] **COLLAB-01**: User sees live updates when teammate edits investor record
- [ ] **COLLAB-02**: User sees live updates when teammate moves investor in kanban view
- [ ] **COLLAB-03**: System shows which users are currently viewing/editing each record
- [ ] **COLLAB-04**: System prevents conflicting edits with optimistic locking

### Professional UI/UX

- [ ] **UI-01**: Application reflects Prytaneum/Valkyrie brand identity (logos, colors, typography)
- [ ] **UI-02**: Application uses shadcn/ui component library for consistency
- [ ] **UI-03**: Application is fully responsive for desktop/laptop screens (1280px+)
- [ ] **UI-04**: Application meets investor-grade design quality standards
- [ ] **UI-05**: Navigation is intuitive with clear information architecture
- [ ] **UI-06**: Forms provide inline validation and helpful error messages
- [ ] **UI-07**: System provides loading states and progress indicators for async operations

### Data Model & Export

- [ ] **DATA-01**: System persists all data in Google ecosystem (Supabase/Firestore, not Google Sheets)
- [ ] **DATA-02**: User can export pipeline data to CSV/Excel format
- [ ] **DATA-03**: System maintains data integrity with proper foreign keys and constraints
- [ ] **DATA-04**: System supports bulk import from existing Excel file

### Performance & Reliability

- [ ] **PERF-01**: Pipeline views load in under 2 seconds for 100 investor records
- [ ] **PERF-02**: Search results appear in under 500ms
- [ ] **PERF-03**: Real-time updates propagate to all users within 1 second
- [ ] **PERF-04**: System handles 4 concurrent users without performance degradation

## v2 Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Meeting Intelligence

- **MEET-01**: System automatically captures Google Meet recordings
- **MEET-02**: System transcribes meeting recordings via Fireflies.ai or similar
- **MEET-03**: AI generates meeting minutes from transcripts
- **MEET-04**: AI extracts action items from meeting minutes
- **MEET-05**: System links meeting notes to investor records

### Relationship Intelligence

- **REL-01**: System imports LinkedIn connection data (CSV export)
- **REL-02**: System visualizes relationship graph showing team connections
- **REL-03**: System suggests warm introduction paths based on network
- **REL-04**: System identifies key individuals at target firms
- **REL-05**: System tracks investment history of LP firms

### Document Management

- **DOC-01**: User can send documents directly from CRM via email
- **DOC-02**: System tracks which documents were sent to which investors
- **DOC-03**: System integrates with Google Docs native e-signature
- **DOC-04**: System tracks document signing status
- **DOC-05**: System auto-sends NDAs and fund intro docs based on stage

### Advanced Analytics

- **ANALYTICS-01**: System provides dashboard with pipeline metrics
- **ANALYTICS-02**: System tracks conversion rates between stages
- **ANALYTICS-03**: System identifies stalled deals automatically
- **ANALYTICS-04**: System generates investor activity reports
- **ANALYTICS-05**: System predicts deal close probability with ML

### M&A Targets View

- **TARGET-01**: User can switch to M&A targets view (separate pipeline)
- **TARGET-02**: System tracks acquisition target companies with different data model
- **TARGET-03**: System aligns target tracking with acquisition doctrine
- **TARGET-04**: User can link investors to specific target deals

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile native apps (iOS/Android) | Web-first approach, mobile later when usage patterns validated |
| Real-time team chat/messaging | Slack/email sufficient, avoid building communication platform |
| Third-party API for external integrations | Internal tool first, API later if needed |
| Offline mode | Web application requires connectivity, complexity not justified |
| Multi-language support | English only for v1, team and investors are English-speaking |
| Custom reporting/dashboards | Use pipeline views initially, build custom reports based on usage |
| Automated email sequences | Focus on relationship quality not email automation |
| Social media integration | Not core to investor relationships |
| Fund accounting | Specialized domain, use existing tools |
| Portfolio company management | Separate concern, plan for v2 |
| Fund-level management view | Separate concern, plan for v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| PIPE-01 | Phase 4 | Pending |
| PIPE-02 | Phase 4 | Pending |
| PIPE-03 | Phase 4 | Pending |
| PIPE-04 | Phase 4 | Pending |
| PIPE-05 | Phase 5 | Pending |
| PIPE-06 | Phase 3 | Pending |
| PIPE-07 | Phase 3 | Pending |
| PIPE-08 | Phase 3 | Pending |
| PIPE-09 | Phase 3 | Pending |
| PIPE-10 | Phase 6 | Pending |
| PIPE-11 | Phase 6 | Pending |
| PIPE-12 | Phase 4 | Pending |
| STAGE-01 | Phase 5 | Pending |
| STAGE-02 | Phase 5 | Pending |
| STAGE-03 | Phase 5 | Pending |
| STAGE-04 | Phase 5 | Pending |
| STAGE-05 | Phase 5 | Pending |
| STAGE-06 | Phase 5 | Pending |
| STRAT-01 | Phase 6 | Pending |
| STRAT-02 | Phase 6 | Pending |
| STRAT-03 | Phase 6 | Pending |
| STRAT-04 | Phase 6 | Pending |
| STRAT-05 | Phase 6 | Pending |
| AI-01 | Phase 9 | Pending |
| AI-02 | Phase 9 | Pending |
| AI-03 | Phase 9 | Pending |
| AI-04 | Phase 9 | Pending |
| AI-05 | Phase 9 | Pending |
| AI-06 | Phase 9 | Pending |
| AI-07 | Phase 9 | Pending |
| AI-08 | Phase 9 | Pending |
| GOOG-01 | Phase 7 | Pending |
| GOOG-02 | Phase 7 | Pending |
| GOOG-03 | Phase 7 | Pending |
| GOOG-04 | Phase 7 | Pending |
| GOOG-05 | Phase 7 | Pending |
| GOOG-06 | Phase 7 | Pending |
| GOOG-07 | Phase 7 | Pending |
| GOOG-08 | Phase 7 | Pending |
| GOOG-09 | Phase 7 | Pending |
| GOOG-10 | Phase 7 | Pending |
| COLLAB-01 | Phase 8 | Pending |
| COLLAB-02 | Phase 8 | Pending |
| COLLAB-03 | Phase 8 | Pending |
| COLLAB-04 | Phase 8 | Pending |
| UI-01 | Phase 10 | Pending |
| UI-02 | Phase 10 | Pending |
| UI-03 | Phase 10 | Pending |
| UI-04 | Phase 10 | Pending |
| UI-05 | Phase 10 | Pending |
| UI-06 | Phase 10 | Pending |
| UI-07 | Phase 10 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| PERF-01 | Phase 10 | Pending |
| PERF-02 | Phase 10 | Pending |
| PERF-03 | Phase 10 | Pending |
| PERF-04 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60/60 (100%)
- Unmapped: 0

**Phase Mapping Summary:**
- Phase 1 (Foundation): 0 requirements (infrastructure prerequisite)
- Phase 2 (Authentication): 5 requirements (AUTH-01 to AUTH-05)
- Phase 3 (Data Model): 8 requirements (DATA-01 to DATA-04, PIPE-06 to PIPE-09)
- Phase 4 (Pipeline Views): 5 requirements (PIPE-01 to PIPE-04, PIPE-12)
- Phase 5 (Stage Discipline): 7 requirements (STAGE-01 to STAGE-06, PIPE-05)
- Phase 6 (Activity & Strategy): 7 requirements (STRAT-01 to STRAT-05, PIPE-10, PIPE-11)
- Phase 7 (Google Workspace): 10 requirements (GOOG-01 to GOOG-10)
- Phase 8 (Real-time Collaboration): 4 requirements (COLLAB-01 to COLLAB-04)
- Phase 9 (AI BDR Agent): 8 requirements (AI-01 to AI-08)
- Phase 10 (UI Polish & Performance): 11 requirements (UI-01 to UI-07, PERF-01 to PERF-04)

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation with full traceability mapping*
