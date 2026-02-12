# Phase 3: Data Model & Core CRUD - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Building the database schema and CRUD operations for investor pipeline records. This is the foundational data layer that all other pipeline features (views, search, workflow, activities) will build upon. Scope includes: investor records, contact entities, activity logging, data migration from existing Excel file, and basic CRUD operations.

Export functionality deferred to Phase 7 (Google Workspace Integration) where it will be implemented as Google Drive/Sheets export.

</domain>

<decisions>
## Implementation Decisions

### Data Schema Structure

**Core entities:**
- **Investors** (main table): 20 fields from existing Excel structure
- **Contacts** (separate table): Full entities with name, email, phone, title, notes
- **Activities** (separate table): Timestamped activity log for full history

**Field list (from PRYTANEUM LP CRM.xlsx):**
1. Firm Name (required)
2. Primary Contact (→ relationship to contacts table)
3. Relationship Owner (required)
4. Partner / Source
5. Est. value
6. Stage (required)
7. Entry Date
8. Last Action Date
9. Stalled
10. Allocator Type
11. Internal Conviction
12. Internal Priority
13. Investment Committee Timing
14. Next Action
15. Next Action Date
16. Current strategy notes
17. Current strategy date
18. Last strategy notes
19. Last strategy date
20. Key Objection / Risk

**Required fields for new investor:**
- Firm Name
- Stage
- Relationship Owner

**Data relationships:**
- Investor ← many Contacts (one-to-many)
- Investor ← many Activities (one-to-many)
- Contact fields: name (required), email, phone, title, notes

### Form Experience

**Create flow:**
- Quick create modal with only required fields (Firm Name, Stage, Relationship Owner)
- Redirect to full detail page after creation
- Detail page has all 20+ fields for additional data entry

**Editing behavior:**
- Inline editing: click any field to edit directly (like Notion/Linear)
- Auto-save on blur: changes save when you click away from field
- No edit mode toggle required

**Field organization:**
- Collapsible sections grouping related fields
- Suggested sections: Basic Info, Pipeline Status, Strategy, Activity
- **Critical requirement**: Must be clean, professional, and intuitive for basic users (2 of 5 team members are non-technical)

### Import/Export Mechanics

**Export:**
- Deferred to Phase 7 (Google Workspace Integration)
- Will export directly to Google Drive as Google Sheets
- No local download feature in Phase 3

**Import:**
- One-time migration script (not user-facing feature)
- Import existing 16 investor rows from PRYTANEUM LP CRM.xlsx
- Best-effort validation: import valid data, use sensible defaults for missing required fields, log issues
- Contact migration: Create basic contact entities with just name field populated from "Primary Contact" column

### Deletion & History

**Deletion type:**
- Soft delete with `deleted_at` timestamp
- Records marked deleted but remain in database (recoverable, maintains audit trail)

**Cascade behavior:**
- Keep related contacts and activities active when investor is soft-deleted
- Allows contact reuse and preserves activity history

**Restore capability:**
- Immediate: Undo toast notification (10 second window after delete)
- Later: Admin-only restore view to recover older deletions

**Permissions:**
- Any authenticated user can delete
- Deletion requires confirmation modal
- Soft delete means low risk of data loss

</decisions>

<specifics>
## Specific Ideas

- Form editing should feel like Notion or Linear - click to edit, changes save automatically
- Detail page must be simple enough for 2 non-technical team members to use confidently
- Migration script will import from existing PRYTANEUM LP CRM.xlsx file in project directory

</specifics>

<deferred>
## Deferred Ideas

- Export functionality - deferred to Phase 7 (Google Workspace Integration) where it will be implemented as Google Drive/Sheets export
- User-facing import UI - using one-time migration script instead

</deferred>

---

*Phase: 03-data-model-and-core-crud*
*Context gathered: 2026-02-11*
