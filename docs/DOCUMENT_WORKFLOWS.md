# Document Workflows Documentation

## Overview

This module implements e-signature and email distribution features for Google Drive documents linked to investor records. Users can request signatures and send documents via Gmail API directly from the investor detail page.

## Features

### 1. E-Signature Workflow

Request signatures for documents stored in Google Drive.

**User Flow:**
1. Navigate to investor detail page
2. Hover over a linked document
3. Click "Request Signature" (pen icon)
4. Fill in signature request form:
   - Signer email (required)
   - Signer name (optional)
   - Message (optional)
5. Email sent via Gmail API with document link
6. Request tracked in database with status

**Status States:**
- `pending` - Request sent, awaiting response
- `signed` - Document signed by recipient
- `declined` - Signature declined by recipient

### 2. Email Distribution

Send documents via email with Gmail API integration.

**User Flow:**
1. Navigate to investor detail page
2. Hover over a linked document
3. Click "Email Document" (mail icon)
4. Compose email:
   - To (required)
   - Subject (pre-filled, editable)
   - Body (optional message)
5. Document link automatically appended to email
6. Email sent via Gmail API
7. Activity logged to investor timeline

## Database Schema

### `signature_requests` Table

```sql
CREATE TABLE signature_requests (
  id uuid PRIMARY KEY,
  investor_id uuid REFERENCES investors(id),
  drive_link_id uuid REFERENCES drive_links(id),
  signer_email text NOT NULL,
  signer_name text,
  message text,
  status text CHECK (status IN ('pending', 'signed', 'declined')),
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  requested_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `document_emails` Table

```sql
CREATE TABLE document_emails (
  id uuid PRIMARY KEY,
  investor_id uuid REFERENCES investors(id),
  drive_link_id uuid REFERENCES drive_links(id),
  to_address text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  message_id text, -- Gmail message ID
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

## API Endpoints

### Gmail Send API

**Endpoint:** `POST /api/gmail/send`

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Document: filename.pdf",
  "body": "Email body content"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "gmail-message-id"
}
```

**Error Responses:**
- `401` - Not authenticated or Google auth required
- `400` - Missing required fields
- `500` - Failed to send email

## Server Actions

### `createSignatureRequest`

Creates a signature request and sends notification email.

```typescript
await createSignatureRequest({
  investorId: 'uuid',
  driveLinkId: 'uuid',
  signerEmail: 'signer@example.com',
  signerName: 'John Doe', // optional
  message: 'Please sign this document.' // optional
});
```

### `updateSignatureRequestStatus`

Updates signature request status (signed/declined).

```typescript
await updateSignatureRequestStatus('request-id', 'signed');
```

### `getSignatureRequests`

Retrieves all signature requests for an investor.

```typescript
const result = await getSignatureRequests('investor-id');
```

### `sendDocumentEmail`

Sends a document via email with Gmail API.

```typescript
await sendDocumentEmail({
  investorId: 'uuid',
  driveLinkId: 'uuid',
  to: 'recipient@example.com',
  subject: 'Document: filename.pdf',
  body: 'Please review this document.'
});
```

### `getDocumentEmails`

Retrieves all document emails for an investor.

```typescript
const result = await getDocumentEmails('investor-id');
```

## Components

### `SignatureRequestModal`

Modal dialog for requesting document signatures.

**Props:**
- `driveLink: DriveLink` - Document to request signature for
- `investorId: string` - Investor UUID
- `open: boolean` - Modal open state
- `onOpenChange: (open: boolean) => void` - State handler

**Usage:**
```tsx
<SignatureRequestModal
  driveLink={driveLink}
  investorId={investorId}
  open={signatureModalOpen}
  onOpenChange={setSignatureModalOpen}
/>
```

### `EmailDocumentModal`

Modal dialog for emailing documents.

**Props:**
- `driveLink: DriveLink` - Document to email
- `investorId: string` - Investor UUID
- `open: boolean` - Modal open state
- `onOpenChange: (open: boolean) => void` - State handler

**Usage:**
```tsx
<EmailDocumentModal
  driveLink={driveLink}
  investorId={investorId}
  open={emailModalOpen}
  onOpenChange={setEmailModalOpen}
/>
```

### `LinkedDocuments` (Updated)

Displays linked documents with action buttons (signature request, email, unlink).

**Props:**
- `links: DriveLink[]` - Array of linked documents
- `investorId: string` - Investor UUID

## Activity Logging

All document workflow actions are logged to the investor activity timeline:

**Signature Request:**
```typescript
{
  activity_type: 'note',
  description: 'Signature requested from email@example.com for Document.pdf',
  metadata: {
    type: 'signature_request',
    signer_email: 'email@example.com',
    document_name: 'Document.pdf'
  }
}
```

**Document Email:**
```typescript
{
  activity_type: 'email',
  description: 'Sent document "Document.pdf" to email@example.com',
  metadata: {
    type: 'document_email',
    to: 'email@example.com',
    subject: 'Document: Document.pdf',
    document_name: 'Document.pdf',
    message_id: 'gmail-message-id'
  }
}
```

## Security & Permissions

### Row Level Security (RLS)

Both tables have RLS policies that:
- Allow authenticated users to SELECT records for non-deleted investors
- Allow authenticated users to INSERT records for non-deleted investors
- Allow authenticated users to UPDATE signature requests for non-deleted investors

### Google OAuth

Gmail API calls require valid Google OAuth tokens:
- Tokens stored in `google_oauth_tokens` table (service-role only)
- OAuth2 client created via `createGoogleClient(userId)`
- Automatic token refresh handled by `googleapis` library

## Testing

### Unit Tests

**Component Tests:**
- `/components/documents/__tests__/signature-request-modal.test.tsx`
- `/components/documents/__tests__/email-document-modal.test.tsx`

**API Tests:**
- `/app/api/gmail/send/__tests__/route.test.ts`

### Manual Testing

1. **Signature Request:**
   - Link a Google Doc to an investor
   - Click signature request button
   - Verify email sent and request logged

2. **Email Document:**
   - Link a document to an investor
   - Click email button
   - Verify email sent with document link

3. **Error Handling:**
   - Test without Google OAuth connection
   - Test with invalid email addresses
   - Test with missing required fields

## Migration

Apply migration to create tables:

```bash
# Run migration
psql -h your-db-host -U postgres -d your-db < supabase/migrations/20260214000003_document_workflows.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

## Future Enhancements

1. **E-Signature Integration:**
   - DocuSign API integration
   - Adobe Sign integration
   - Native signature capture

2. **Email Templates:**
   - Pre-defined templates
   - Template variables
   - HTML email support

3. **Tracking:**
   - Email open tracking
   - Link click tracking
   - Signature completion webhooks

4. **Batch Operations:**
   - Send to multiple recipients
   - Bulk signature requests
   - Template-based batch emails

## Troubleshooting

### Gmail API Errors

**Error: "User has not authorized Google Workspace access"**
- Solution: User needs to connect Google account via OAuth flow

**Error: "invalid_grant"**
- Solution: User's refresh token expired, re-authenticate via OAuth

### Missing Document Link

**Error: "Document not found"**
- Solution: Verify drive_link_id exists and is not deleted

### Email Not Sending

1. Check Google OAuth connection status
2. Verify Gmail API is enabled in Google Cloud Console
3. Check user has sufficient Gmail API quota
4. Verify email addresses are valid format

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Google OAuth tokens are valid
3. Check RLS policies allow operation
4. Review activity logs for investor
