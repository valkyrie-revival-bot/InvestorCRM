# Bulk Operations and User Preferences System

This document describes the bulk operations and user preferences features added to the sales tracking application.

## Overview

The system enables:
1. Multi-select and bulk operations on investors, tasks, and interactions
2. Comprehensive user preferences for UI, notifications, and integrations
3. Persistent settings stored in database with RLS policies

## Architecture

### Database Schema

#### User Preferences Table
- `user_preferences`: Stores UI and notification preferences per user
  - Theme (light/dark/system)
  - Density (comfortable/compact)
  - Default view (list/grid/kanban)
  - Items per page (10/25/50/100)
  - Email notification settings
  - Task reminder settings
  - Overdue alerts

#### Extended Messaging Preferences
- Added email notification columns to `user_messaging_preferences`
- Supports Google Chat, WhatsApp, and email channels

### API Routes

#### Bulk Operations API
- `POST /api/bulk`: Execute bulk operations
  - Supports tasks (update status, priority, due date, delete)
  - Supports investors (delete, add tags, export)
  - Supports interactions (delete, change type)
  - Validates max 500 items per operation
  - Returns success/failure counts

#### Preferences API
- `GET/POST /api/preferences`: User preferences CRUD
- `GET/POST /api/preferences/messaging`: Messaging preferences CRUD

### Components

#### Investor List with Bulk Operations
- `investor-list-table-with-bulk.tsx`: Enhanced investor list
  - Checkbox column for selection
  - "Select all" functionality
  - Selected count badge
  - Bulk actions dropdown (export, delete)
  - Confirmation dialogs
  - Optimistic UI updates

#### Task List with Bulk Operations
- `task-list-with-bulk.tsx`: Enhanced task list
  - Multi-select checkboxes
  - Bulk status change
  - Bulk priority change
  - Bulk due date assignment
  - Bulk delete with confirmation

#### Settings Page
- `app/(dashboard)/settings/page.tsx`: Server component
- `settings-page-client.tsx`: Client component with tabs
  - Profile tab: Name, email (read-only)
  - Notifications tab: Email settings, task reminders
  - UI Preferences tab: Theme, density, default view
  - Integrations tab: Google Workspace, WhatsApp status

### Types

#### Preferences Types (`types/preferences.ts`)
```typescript
- Theme: 'light' | 'dark' | 'system'
- Density: 'comfortable' | 'compact'
- DefaultView: 'list' | 'grid' | 'kanban'
- ItemsPerPage: 10 | 25 | 50 | 100
- EmailFrequency: 'immediate' | 'daily' | 'weekly' | 'off'
- TaskReminderSetting: '24h' | '1h' | 'off'
```

#### Bulk Operation Types
```typescript
- BulkOperationType: Operation types
- BulkEntityType: 'investors' | 'tasks' | 'interactions'
- BulkOperationRequest: Request payload
- BulkOperationResponse: Response with success/failure counts
```

## Features

### Bulk Operations

#### Task Bulk Operations
1. **Bulk Status Change**: Update multiple tasks to pending/completed/cancelled
2. **Bulk Priority Change**: Set priority to low/medium/high
3. **Bulk Due Date Assignment**: Assign same due date to multiple tasks
4. **Bulk Delete**: Delete multiple tasks with confirmation

#### Investor Bulk Operations
1. **Bulk Export**: Export selected investors to CSV
2. **Bulk Delete**: Soft-delete multiple investors
3. **Bulk Tagging**: Add tags to multiple investors (placeholder)

#### Interaction Bulk Operations
1. **Bulk Delete**: Delete multiple interactions
2. **Bulk Type Change**: Change interaction type for multiple records

### User Preferences

#### UI Preferences
- **Theme**: Light, dark, or system preference
  - Applied immediately to DOM
  - Persisted across sessions
- **Density**: Comfortable or compact spacing
- **Default View**: Preferred list view (list/grid/kanban)
- **Items Per Page**: Pagination size (10/25/50/100)

#### Notification Preferences
- **Email Notifications**: Master toggle
- **Email Frequency**: Immediate, daily digest, weekly digest, or off
- **Task Reminders**: 24h before, 1h before, or off
- **Overdue Alerts**: Toggle for overdue task notifications
- **Notification Types**:
  - Task reminders
  - Investor updates
  - Pipeline alerts
  - AI insights

#### Integration Settings
- **Google Workspace**: Connection status and reconnect button
- **WhatsApp**: Connection status (placeholder)

## User Experience

### Multi-Select UX
1. Click checkbox to select individual items
2. Click "Select all" to select all visible items
3. Selected count badge shows number of selections
4. Bulk actions toolbar appears when items are selected
5. Clear selections automatically after operation completes

### Settings UX
1. Organized into 4 tabs for easy navigation
2. Changes tracked in real-time
3. Save button appears only when changes detected
4. Floating save button in bottom-right corner
5. Success/error toasts for feedback
6. Theme changes applied immediately without save

### Confirmation Dialogs
- Delete operations require explicit confirmation
- Show number of items affected
- Cancel and confirm buttons clearly labeled
- Processing state shown during operations

## Testing

### Playwright Tests (`tests/e2e/bulk-operations-preferences.spec.ts`)

#### Task Bulk Operations Tests
- Multi-select checkboxes visible
- Selection and deselection works
- Bulk actions toolbar appears
- Bulk update status
- Bulk update priority
- Bulk assign due date
- Bulk delete with confirmation

#### Investor Bulk Operations Tests
- Multi-select on investor list
- Bulk export to CSV
- Bulk delete with confirmation
- Progress indicator for large operations

#### User Preferences Tests
- Settings page displays correctly
- Theme change and immediate application
- Email notifications toggle
- UI density change
- Email frequency update
- Task reminder settings
- Save button appears on changes
- Integration status display
- Preferences persist across sessions
- UI density applied to lists

## Security

### RLS Policies
- Users can only read/write their own preferences
- Bulk operations validate user authentication
- All operations logged for audit trail

### Validation
- Max 500 items per bulk operation
- Input sanitization on all preference updates
- Type validation for all preference values
- Date format validation for due dates

## Performance

### Optimizations
- Single transaction for bulk updates
- Optimistic UI updates with rollback on error
- Debounced preference change detection
- Indexed database columns for fast lookups
- Minimal re-renders using React hooks

### Database
- Indexed user_id columns for fast lookups
- Triggers for automatic updated_at timestamps
- Constraints for data integrity

## Migration

### Database Migration: `20260214000005_user_preferences.sql`
```sql
-- Creates user_preferences table
-- Adds email columns to user_messaging_preferences
-- Sets up RLS policies
-- Creates indexes
```

### Running the Migration
```bash
# Apply migration to database
psql <connection_string> < supabase/migrations/20260214000005_user_preferences.sql
```

## Usage Examples

### Using Bulk Operations

```typescript
// In a component
const handleBulkStatusChange = async () => {
  const response = await fetch('/api/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_type: 'tasks',
      operation: 'update_status',
      item_ids: selectedIds,
      data: { status: 'completed' }
    })
  });

  const result = await response.json();
  if (result.success) {
    toast.success(result.message);
  }
};
```

### Saving Preferences

```typescript
// In settings component
const handleSave = async () => {
  const response = await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      theme: 'dark',
      density: 'compact',
      email_notifications: true
    })
  });

  if (response.ok) {
    toast.success('Settings saved');
  }
};
```

## Future Enhancements

### Planned Features
1. Bulk tag management for investors
2. Advanced bulk editing with field picker
3. Bulk email sending to investors
4. Preference presets/templates
5. Team-wide default preferences
6. Custom notification schedules
7. Preference import/export
8. More granular notification controls

### Performance Improvements
1. Virtual scrolling for large selections
2. Batch API requests for very large operations
3. Background job processing for 500+ items
4. Real-time progress updates via WebSocket
5. Caching of user preferences

## Troubleshooting

### Common Issues

#### Bulk Operation Fails
- Check item count (max 500)
- Verify user has permission
- Check network connection
- Review error in response

#### Preferences Not Saving
- Check browser console for errors
- Verify API route is accessible
- Check database connection
- Ensure RLS policies are correct

#### Theme Not Applying
- Clear browser cache
- Check localStorage
- Verify theme value is valid
- Check for CSS conflicts

## Support

For issues or questions:
1. Check this documentation
2. Review Playwright test examples
3. Check API route code
4. Review component implementations
5. Contact development team
