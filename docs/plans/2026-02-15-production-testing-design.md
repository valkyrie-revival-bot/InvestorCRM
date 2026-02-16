# Production Testing & Polishing Design
**Date:** 2026-02-15
**Goal:** Comprehensive production testing and issue resolution for valhros.com

## Context
Production instance at valhros.com needs full validation. Current issue: confusing dashboard routing where `/dashboard` redirects to `/investors` (pipeline view), while actual dashboard with metrics is at `/` (root).

## Architecture

### Test Infrastructure
- **Target:** valhros.com (production)
- **Framework:** Playwright with parallel execution
- **Auth:** Production Google OAuth credentials via env vars
- **Execution:** Parallel test agents for maximum speed
- **Config:** New `playwright.config.prod.ts` for production testing

### Routing Fix
**Problem:**
- `app/dashboard/page.tsx` redirects to `/investors` causing confusion
- Actual dashboard at `/` (root) via `app/(dashboard)/page.tsx`

**Solution:**
- Remove `app/dashboard/` directory entirely
- Ensure `/` serves dashboard with metrics
- Ensure `/investors` serves pipeline view
- Update navigation to use correct routes

## Test Coverage

### 1. Core Navigation & Routing
- [x] Remove confusing `/dashboard` redirect
- [ ] `/` loads dashboard with metrics
- [ ] `/investors` loads pipeline view
- [ ] All nav links work correctly
- [ ] Active page highlighting works

### 2. Authentication
- [ ] Login with Google OAuth
- [ ] Session persistence across page loads
- [ ] Protected routes redirect to login
- [ ] Logout clears session

### 3. Dashboard Page
- [ ] Metrics display: Total Investors, Active Deals, Stalled, Pipeline Value
- [ ] Next Actions Due count
- [ ] Stage Breakdown (top 5 stages)
- [ ] Empty state with CTA button
- [ ] Error state handling
- [ ] "View Pipeline" button navigates to /investors

### 4. Pipeline Views
- [ ] Table view loads with real data
- [ ] Kanban view loads with real data
- [ ] Switch between table/kanban views
- [ ] Search functionality filters investors
- [ ] Stage filter works
- [ ] Stalled filter works
- [ ] Sorting works (firm name, stage, value, etc.)
- [ ] Responsive layout (desktop)

### 5. Investor CRUD Operations
- [ ] **Create:** Quick create modal works
- [ ] **Create:** Full form validation
- [ ] **Read:** Investor detail page loads
- [ ] **Read:** All fields display correctly
- [ ] **Update:** Inline field editing works
- [ ] **Update:** Stage changes with validation
- [ ] **Delete:** Soft delete investor
- [ ] **Delete:** Undo delete within 10 seconds
- [ ] **Delete:** Permanent delete after undo window
- [ ] **Delete:** Test records can be cleaned up

### 6. Activity Management
- [ ] Log activity modal opens
- [ ] Create note activity
- [ ] Create call activity
- [ ] Create email activity
- [ ] Create meeting activity
- [ ] Activity timeline displays correctly
- [ ] Activity filtering by type
- [ ] Next action embedded in activity form

### 7. Google Workspace Integration
- [ ] Google auth connection status shows
- [ ] Drive file picker opens
- [ ] Link files to investor
- [ ] View linked files
- [ ] Unlink files
- [ ] Calendar events integration
- [ ] Email logs integration

### 8. AI BDR Agent
- [ ] Chat interface accessible from nav
- [ ] Chat modal opens
- [ ] Send message to agent
- [ ] Agent responds (streaming)
- [ ] Agent can query investor data
- [ ] Agent can search investors
- [ ] Agent can provide strategy suggestions
- [ ] Tool calls execute correctly
- [ ] Update confirmations work

### 9. Real-time Collaboration
- [ ] Live updates when data changes
- [ ] Presence indicators show other users
- [ ] Optimistic updates work
- [ ] Conflict resolution on concurrent edits
- [ ] Multi-tab synchronization

### 10. Contact Management
- [ ] View contacts on investor detail
- [ ] Add new contact
- [ ] Edit contact
- [ ] Set primary contact
- [ ] Delete contact

### 11. LinkedIn Intelligence
- [ ] Import LinkedIn CSV
- [ ] View warm intro paths
- [ ] Path strength indicators
- [ ] Company matching

### 12. Strategy Management
- [ ] View current strategy
- [ ] Edit strategy notes
- [ ] Strategy history auto-archives
- [ ] View strategy history

## Execution Plan

### Phase 1: Fix Routing Issue (Blocking)
1. Remove `app/dashboard/` directory
2. Verify routes work locally
3. Commit fix
4. Deploy to production
5. Verify production routes

### Phase 2: Create Production Test Config
1. Create `playwright.config.prod.ts`
2. Set baseURL to https://valhros.com
3. Configure auth for production
4. Set up parallel execution

### Phase 3: Parallel Test Execution
Run these test suites in parallel:
- **Agent 1:** Auth + Navigation + Routing
- **Agent 2:** Dashboard + Pipeline Views
- **Agent 3:** Investor CRUD + Delete Operations
- **Agent 4:** Activities + Contacts + Strategy
- **Agent 5:** Google Integration + LinkedIn Import
- **Agent 6:** AI BDR Agent + Real-time

### Phase 4: Issue Resolution
- Fix any test failures immediately
- Re-run failed tests
- Verify fixes in production

### Phase 5: Test Data Cleanup
- Use delete functionality to remove test records
- Verify soft delete works
- Verify permanent delete works

### Phase 6: Final Smoke Test
- Complete user flow from login to creating investor to deleting
- Verify all critical paths work
- Performance check (load times, responsiveness)

## Success Criteria
- ✅ All routing confusion resolved
- ✅ All test suites pass against production
- ✅ Delete functionality verified working
- ✅ AI BDR Agent fully functional
- ✅ All Google integrations working
- ✅ Real-time collaboration working
- ✅ Test records cleaned up
- ✅ Production ready for use

## Timeline
- **Total estimated:** 2-3 hours
- Phase 1 (Routing fix): 10 min
- Phase 2 (Test config): 10 min
- Phase 3 (Test execution): 60-90 min (parallel)
- Phase 4 (Fix issues): 30-60 min
- Phase 5 (Cleanup): 10 min
- Phase 6 (Smoke test): 10 min

## Notes
- Run tests in parallel to maximize speed
- Production credentials required (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY)
- Test against real production data
- Prioritize delete functionality (test records need cleanup)
- No interruptions until completion
