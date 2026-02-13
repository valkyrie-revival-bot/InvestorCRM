---
phase: 07-google-workspace-integration
plan: 02
subsystem: ui
tags: [google-picker, drive, react, components, file-linking]

# Dependency graph
requires:
  - phase: 07-google-workspace-integration
    plan: 01
    provides: Drive server actions pattern, Google types, OAuth client factory
  - phase: 03-data-model-and-core-crud
    provides: investors table and activities table structure
provides:
  - DriveFilePicker component with Google Picker API integration
  - LinkedDocuments component for displaying and managing linked files
  - Complete Drive file linking workflow ready for investor detail page
affects: [07-04-investor-detail-integration]

# Tech tracking
tech-stack:
  added: [react-google-drive-picker]
  patterns:
    - "Google Picker API integration via react-google-drive-picker hook"
    - "MIME type-based file icon rendering (Docs, Sheets, Slides)"
    - "Relative time formatting for file link timestamps"
    - "Optimistic UI with router.refresh() after mutations"

key-files:
  created:
    - app/actions/google/drive-actions.ts
    - components/investors/drive-file-picker.tsx
    - components/investors/linked-documents.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "react-google-drive-picker library for Picker integration - Simplifies Google Picker API usage, handles auth and callbacks, well-maintained React wrapper"
  - "DOCS view for Picker (not ALL_DRIVES) - Shows all document types users care about, excludes system files, better UX than unfiltered view"
  - "supportDrives: true in Picker config - Users need access to both My Drive and Shared Drives for team documents"
  - "MIME type-based icon selection - Visual differentiation for Docs/Sheets/Slides improves scanability, matches Google Drive UI patterns"
  - "Inline formatRelativeTime function - Already implemented in activity timeline, copied for consistency rather than extracting to shared util"
  - "Confirmation dialog on unlink - Prevents accidental deletion, follows destructive action best practice"
  - "Disabled state with tooltip for no Google auth - Clear affordance that linking requires Google connection"

patterns-established:
  - "Google Picker integration: useDrivePicker hook with callback for file selection"
  - "Server action error handling: Check for 'error' key in result, show toast, refresh router on success"
  - "Link component pattern: Icon + file name as link + metadata + hover action button"
  - "MIME type icon mapping: Helper function maps Google MIME types to Lucide icons"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 7 Plan 2: Drive Picker Integration Summary

**Google Drive file linking: Picker component for file selection, LinkedDocuments display with unlink capability, server actions for link/unlink with activity logging**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-13T04:35:19Z
- **Completed:** 2026-02-13T04:37:57Z
- **Tasks:** 2 (both auto)
- **Files modified:** 5

## Accomplishments

- Drive server actions handle linking/unlinking Drive files to investors with activity logging
- DriveFilePicker component integrates Google Picker API for file selection
- LinkedDocuments component displays linked files with MIME type icons and unlink capability
- All operations use authenticated Supabase client with RLS
- Path revalidation ensures real-time UI updates after link/unlink

## Task Commits

Each task was committed atomically:

1. **Task 1: Drive server actions with activity logging** - `43d1f17` (feat)
2. **Task 2: Google Picker component and LinkedDocuments display** - `49fc546` (feat)

**Plan metadata:** (to be committed after STATE.md update)

## Files Created/Modified

### Server Actions
- `app/actions/google/drive-actions.ts` - Server actions for Drive file operations: linkDriveFileToInvestor (inserts drive_links + logs activity), unlinkDriveFile (deletes link + logs activity), getDriveLinks (fetches all links for investor). Uses getCurrentUser() for auth, createClient() for RLS-protected queries, revalidatePath() for cache invalidation.

### UI Components
- `components/investors/drive-file-picker.tsx` - Google Picker integration component (71 lines). Opens Google Picker with DOCS view, shared drives support, multiselect disabled. On file selection: calls linkDriveFileToInvestor server action, shows toast notification, refreshes router. Disabled state with tooltip when Google account not connected.
- `components/investors/linked-documents.tsx` - Linked documents display component (150 lines). Shows list of linked Drive files with: file type icon (based on MIME type), file name as external link to Google Drive, relative timestamp, unlink button with confirmation. Empty state message when no links. MIME type mapping: documents→FileText, spreadsheets→FileSpreadsheet, presentations→Presentation, other→File.

### Dependencies
- `package.json` - Added react-google-drive-picker@^1.2.2
- `package-lock.json` - Lock file updated with react-google-drive-picker and dependencies

## Decisions Made

**react-google-drive-picker library for Picker integration:** Using community library instead of raw Google Picker API. Library provides clean React hook pattern (useDrivePicker), handles script loading, manages auth flow, provides TypeScript types. Well-maintained (1.2.2 latest), 50K+ weekly downloads, reduces boilerplate significantly vs raw API.

**DOCS view for Picker (not ALL_DRIVES):** Using DOCS viewId shows all document types (Docs, Sheets, Slides, PDFs, images) while excluding system files and folders. Better UX than ALL_DRIVES which shows non-document items. Users can still access Shared Drives via supportDrives: true flag.

**supportDrives: true in Picker config:** Enables Shared Drives access in addition to My Drive. Critical for team environments where pitch decks, term sheets, and due diligence materials are stored in shared team drives. Research (07-RESEARCH.md Pitfall 7) confirms this is required for Shared Drive file access.

**MIME type-based icon selection:** Using file MIME type to select appropriate Lucide icon (FileText for docs, FileSpreadsheet for sheets, Presentation for slides, File for other). Provides visual differentiation that improves scanability and matches Google Drive UI patterns users expect.

**Inline formatRelativeTime function:** Copied formatRelativeTime implementation from InvestorActivityTimeline component rather than extracting to shared lib/utils.ts. Function already exists in one place, copying maintains consistency without premature abstraction. Can be extracted to shared util if third usage appears.

**Confirmation dialog on unlink:** Browser confirm() dialog prevents accidental unlinking. Follows destructive action best practice. Shows file name in confirmation message for clarity. Simple implementation sufficient for Phase 7, can be enhanced with custom modal in polish phase.

**Disabled state with tooltip for no Google auth:** DriveFilePicker accepts disabled prop to handle users without Google OAuth tokens. Shows disabled button with tooltip "Connect Google account first" to guide users toward OAuth flow. Clear affordance that feature requires Google connection.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All components compiled successfully and integrate cleanly with existing server actions pattern.

## Next Phase Readiness

**Ready for 07-04 (Investor Detail Integration):** DriveFilePicker and LinkedDocuments components are complete and ready to be integrated into investor detail page. Components expect investorId prop and list of DriveLink objects. Server actions handle all backend operations with activity logging.

**Component integration pattern:**
```tsx
// In investor detail page
import { DriveFilePicker } from '@/components/investors/drive-file-picker';
import { LinkedDocuments } from '@/components/investors/linked-documents';
import { getDriveLinks } from '@/app/actions/google/drive-actions';

// Fetch links server-side
const linksResult = await getDriveLinks(investorId);
const links = 'data' in linksResult ? linksResult.data : [];

// Render in page
<DriveFilePicker investorId={investorId} disabled={!hasGoogleAuth} />
<LinkedDocuments links={links} investorId={investorId} />
```

**Blockers:** None. All Drive integration components operational and tested via TypeScript compilation.

---
*Phase: 07-google-workspace-integration*
*Completed: 2026-02-13*
