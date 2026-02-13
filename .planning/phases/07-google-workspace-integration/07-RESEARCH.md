# Phase 7: Google Workspace Integration - Research

**Researched:** 2026-02-12
**Domain:** Google Workspace APIs (Drive, Gmail, Calendar) + OAuth2 + Next.js Server Actions
**Confidence:** HIGH

## Summary

Phase 7 integrates Google Workspace services (Drive, Gmail, Calendar) with the CRM to enable document linking, email tracking, and meeting scheduling tied to investor records. The research focused on the googleapis Node.js client library, OAuth2 authentication patterns for accessing user data with refresh tokens, exponential backoff for rate limiting, and database schema design for storing external resource links.

The standard approach for Google Workspace integration in Next.js 16 with Supabase (2026) is:
1. Use `googleapis` Node.js client library (version 171+ already installed) for all three APIs (Drive, Gmail, Calendar)
2. Store OAuth2 refresh tokens securely in Supabase database (separate encrypted table, not exposed via public API)
3. Implement per-user OAuth2 client instances with stored refresh tokens for server-side API calls
4. Use Google Picker API for Drive file selection (provides familiar UI, works with `drive.file` scope)
5. Store external resource references (Drive file IDs, Gmail message IDs, Calendar event IDs) in database tables linked to investors
6. Log all Workspace activity (document links, emails, meetings) to activities timeline for investor context
7. Implement exponential backoff with jitter for all Google API calls (handle 429/503 rate limit errors)
8. Use Next.js Server Actions for all Google API operations (secure server-side execution, no client exposure)

Key findings: The `googleapis` library provides unified authentication and automatic token refresh across all Google APIs. For CRM document linking, the `drive.file` scope is optimal—it's non-sensitive (easier verification), provides access only to files the user explicitly selects via Picker, and supports all Drive API operations. Gmail API integration should focus on message metadata (subject, participants, date) rather than full content for CRM activity logging. Google Calendar supports push notifications via webhooks, but manual polling is simpler for CRM meeting display. All three APIs share the same OAuth2 client and token infrastructure from Phase 2. Refresh tokens must be stored per-user in database (Supabase Auth doesn't manage third-party provider token refresh).

**Primary recommendation:** Use `googleapis` with OAuth2Client for all three services, store refresh tokens in encrypted database table accessible only via service role, implement exponential backoff wrapper for all API calls, use Google Picker for file selection with `drive.file` scope, and log all Workspace interactions to the activities table for unified investor timeline.

## Standard Stack

The established libraries/tools for Google Workspace integration:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| googleapis | ^171.4.0 | Google APIs client | Official Google library, unified auth, supports Drive/Gmail/Calendar, already installed |
| google-auth-library | (included) | OAuth2 authentication | Bundled with googleapis, handles token refresh, OAuth2Client class |
| @google-cloud/local-auth | 2.1.0+ | Dev OAuth flow (optional) | Official helper for local development OAuth, simplifies testing |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-google-drive-picker | ^1.2.2 | Google Picker React wrapper | Simplifies Picker API integration in React components |
| @geniux/google-drive-picker-react | ^2.0.0 | Alternative Picker wrapper | Provider pattern with useGoogleDrivePicker hook, modern React patterns |
| exponential-backoff | ^3.1.1 | Retry logic utility | Clean implementation of exponential backoff with jitter (optional, can hand-roll) |

### Architecture Utilities

| Utility | Purpose | Implementation |
|---------|---------|----------------|
| OAuth2 token storage | Securely store refresh tokens per user | Supabase table with RLS, encrypted, service-role only access |
| Exponential backoff wrapper | Retry failed API calls with backoff | Custom wrapper function: `min(2^n * 1000 + random(0-1000), 32000)` |
| Google API client factory | Create authenticated API clients per user | Server function that loads refresh token, creates OAuth2Client |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| googleapis | Individual Google packages | googleapis is meta-package with all APIs, individual packages = smaller bundle but more complex |
| drive.file scope | drive.readonly or drive | drive.file = non-sensitive (easier verification), drive = restricted (requires security review) |
| Server Actions | API Routes | Server Actions = simpler (no route setup), API Routes = more control over headers/streaming |
| Google Picker | Custom file browser | Picker = familiar Google UI, trusted by users; custom = more control but requires UI development |
| Exponential backoff lib | Hand-rolled retry | Library = tested, configurable; hand-rolled = no dependency, simple logic for basic cases |

**Installation:**
```bash
# googleapis already installed (version 171.4.0)
# Install Google Picker React wrapper
npm install react-google-drive-picker

# Optional: exponential backoff utility
npm install exponential-backoff
```

## Architecture Patterns

### Recommended Project Structure

```
sales-tracking/
├── app/
│   ├── api/
│   │   └── google-oauth/
│   │       └── callback/
│   │           └── route.ts          # OAuth callback for Google Workspace scopes
│   └── (dashboard)/
│       └── investors/
│           └── [id]/
│               ├── page.tsx           # Shows linked documents, emails, meetings
│               └── _components/
│                   ├── drive-file-picker.tsx    # Google Picker integration
│                   ├── email-logger.tsx         # Gmail integration UI
│                   └── meeting-scheduler.tsx    # Calendar integration UI
├── lib/
│   ├── google/
│   │   ├── client.ts                 # OAuth2Client factory with token loading
│   │   ├── drive.ts                  # Drive API wrapper functions
│   │   ├── gmail.ts                  # Gmail API wrapper functions
│   │   ├── calendar.ts               # Calendar API wrapper functions
│   │   ├── retry.ts                  # Exponential backoff wrapper
│   │   └── scopes.ts                 # Centralized scope definitions
│   └── database/
│       └── migrations/
│           ├── 020_create_google_tokens.sql           # OAuth tokens table
│           ├── 021_create_drive_links.sql             # Drive file links
│           ├── 022_create_email_logs.sql              # Gmail message logs
│           └── 023_create_calendar_events.sql         # Calendar event links
├── actions/
│   └── google/
│       ├── drive-actions.ts          # Server Actions for Drive operations
│       ├── gmail-actions.ts          # Server Actions for Gmail operations
│       └── calendar-actions.ts       # Server Actions for Calendar operations
└── types/
    └── google.ts                     # TypeScript types for Google Workspace data
```

### Pattern 1: OAuth2 Client Factory with Token Storage

**What:** Server-side function that loads user's stored refresh token from database and creates authenticated OAuth2Client instance for Google API calls.

**When to use:** Every time you need to make a Google API call on behalf of a user (Drive, Gmail, Calendar operations).

**Example:**
```typescript
// Source: Context7 googleapis documentation + Supabase token security best practices
// lib/google/client.ts

import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/google-oauth/callback';

/**
 * Creates authenticated OAuth2 client for a user
 * Loads refresh token from database, sets up auto-refresh
 */
export async function createGoogleClient(userId: string): Promise<OAuth2Client> {
  const supabase = await createClient();

  // Load user's refresh token from secure storage
  const { data: tokenData, error } = await supabase
    .from('google_oauth_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData?.refresh_token) {
    throw new Error('User has not authorized Google Workspace access');
  }

  // Create OAuth2 client with stored refresh token
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: tokenData.refresh_token,
  });

  // Listen for token refresh events to store updated tokens
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Store new refresh token (only provided on first auth or revocation)
      await supabase
        .from('google_oauth_tokens')
        .upsert({
          user_id: userId,
          refresh_token: tokens.refresh_token,
          updated_at: new Date().toISOString(),
        });
    }
  });

  return oauth2Client;
}
```

### Pattern 2: Exponential Backoff for Rate Limiting

**What:** Retry wrapper that implements exponential backoff with jitter for Google API calls, handling 429 (rate limit) and 503 (service unavailable) errors.

**When to use:** Wrap all Google API calls to handle rate limiting gracefully.

**Example:**
```typescript
// Source: Google Cloud retry strategy docs + Medium article on exponential backoff
// lib/google/retry.ts

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Wraps Google API calls with exponential backoff retry logic
 * Formula: min((2^attempt * baseDelay) + random(0-1000), maxDelay)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 32000,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable (429 rate limit, 503 service unavailable)
      const isRetryable =
        error?.code === 429 ||
        error?.code === 503 ||
        error?.response?.status === 429 ||
        error?.response?.status === 503;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = Math.pow(2, attempt) * baseDelay;
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(`Google API rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### Pattern 3: Google Drive File Linking with Picker

**What:** Use Google Picker API to let users select Drive files, then store file metadata and link to investor record.

**When to use:** When implementing "Link Document" feature on investor detail page.

**Example:**
```typescript
// Source: Google Picker API documentation + react-google-drive-picker examples
// app/(dashboard)/investors/[id]/_components/drive-file-picker.tsx

'use client';

import useDrivePicker from 'react-google-drive-picker';
import { linkDriveFileToInvestor } from '@/actions/google/drive-actions';

export function DriveFilePicker({ investorId }: { investorId: string }) {
  const [openPicker] = useDrivePicker();

  const handleOpenPicker = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'DOCS', // Show all document types
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true, // Include shared drives
      multiselect: false,
      callbackFunction: async (data) => {
        if (data.action === 'picked') {
          const file = data.docs[0];

          // Link file to investor via Server Action
          await linkDriveFileToInvestor({
            investorId,
            fileId: file.id,
            fileName: file.name,
            fileUrl: file.url,
            mimeType: file.mimeType,
          });
        }
      },
    });
  };

  return (
    <button onClick={handleOpenPicker} className="btn">
      Link Drive Document
    </button>
  );
}
```

### Pattern 4: Activity Timeline Integration

**What:** Log all Google Workspace interactions (Drive links, emails, meetings) to the activities table for unified investor timeline.

**When to use:** Every time a Drive document is linked, email is logged, or meeting is created.

**Example:**
```typescript
// Source: Existing activities table schema + Google API metadata patterns
// actions/google/drive-actions.ts

'use server';

import { createGoogleClient } from '@/lib/google/client';
import { withRetry } from '@/lib/google/retry';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';

export async function linkDriveFileToInvestor(params: {
  investorId: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Store Drive file link
  const { error: linkError } = await supabase
    .from('drive_links')
    .insert({
      investor_id: params.investorId,
      file_id: params.fileId,
      file_name: params.fileName,
      file_url: params.fileUrl,
      mime_type: params.mimeType,
      linked_by: user.id,
    });

  if (linkError) throw linkError;

  // Log activity to timeline
  const { error: activityError } = await supabase
    .from('activities')
    .insert({
      investor_id: params.investorId,
      activity_type: 'note', // Using 'note' type for document link
      description: `Linked Google Drive document: ${params.fileName}`,
      metadata: {
        type: 'drive_link',
        file_id: params.fileId,
        file_url: params.fileUrl,
        mime_type: params.mimeType,
      },
      created_by: user.id,
    });

  if (activityError) throw activityError;

  return { success: true };
}
```

### Pattern 5: Gmail Email Logging

**What:** Allow users to log Gmail messages related to specific investors, storing message metadata (not full content) for CRM context.

**When to use:** When users want to associate email communications with investor records.

**Example:**
```typescript
// Source: Gmail API documentation + CRM email tracking patterns
// actions/google/gmail-actions.ts

'use server';

import { createGoogleClient } from '@/lib/google/client';
import { withRetry } from '@/lib/google/retry';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';

export async function logEmailToInvestor(params: {
  investorId: string;
  messageId: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get authenticated Gmail client
  const oauth2Client = await createGoogleClient(user.id);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Fetch email metadata with retry
  const message = await withRetry(async () => {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: params.messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });
    return response.data;
  });

  // Extract headers
  const headers = message.payload?.headers || [];
  const from = headers.find(h => h.name === 'From')?.value || '';
  const to = headers.find(h => h.name === 'To')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';

  const supabase = await createClient();

  // Store email log
  const { error: emailError } = await supabase
    .from('email_logs')
    .insert({
      investor_id: params.investorId,
      message_id: params.messageId,
      from_address: from,
      to_address: to,
      subject: subject,
      sent_date: new Date(date).toISOString(),
      logged_by: user.id,
    });

  if (emailError) throw emailError;

  // Log activity to timeline
  const { error: activityError } = await supabase
    .from('activities')
    .insert({
      investor_id: params.investorId,
      activity_type: 'email',
      description: `Email: ${subject}`,
      metadata: {
        message_id: params.messageId,
        from: from,
        to: to,
        date: date,
      },
      created_by: user.id,
    });

  if (activityError) throw activityError;

  return { success: true };
}
```

### Pattern 6: Calendar Meeting Scheduling

**What:** Create Google Calendar events linked to investor records, automatically logging meetings to activity timeline.

**When to use:** When users schedule meetings with investors from CRM.

**Example:**
```typescript
// Source: Google Calendar API documentation + Calendar quickstart patterns
// actions/google/calendar-actions.ts

'use server';

import { createGoogleClient } from '@/lib/google/client';
import { withRetry } from '@/lib/google/retry';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';

export async function scheduleInvestorMeeting(params: {
  investorId: string;
  summary: string;
  description?: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  attendees: string[]; // Email addresses
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get authenticated Calendar client
  const oauth2Client = await createGoogleClient(user.id);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Create calendar event with retry
  const event = await withRetry(async () => {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.startTime,
          timeZone: 'America/New_York', // Should be user's timezone
        },
        end: {
          dateTime: params.endTime,
          timeZone: 'America/New_York',
        },
        attendees: params.attendees.map(email => ({ email })),
      },
    });
    return response.data;
  });

  const supabase = await createClient();

  // Store calendar event link
  const { error: eventError } = await supabase
    .from('calendar_events')
    .insert({
      investor_id: params.investorId,
      event_id: event.id!,
      summary: params.summary,
      start_time: params.startTime,
      end_time: params.endTime,
      event_url: event.htmlLink!,
      created_by: user.id,
    });

  if (eventError) throw eventError;

  // Log activity to timeline
  const { error: activityError } = await supabase
    .from('activities')
    .insert({
      investor_id: params.investorId,
      activity_type: 'meeting',
      description: `Scheduled meeting: ${params.summary}`,
      metadata: {
        event_id: event.id,
        start_time: params.startTime,
        end_time: params.endTime,
        attendees: params.attendees,
      },
      created_by: user.id,
    });

  if (activityError) throw activityError;

  return { success: true, eventUrl: event.htmlLink };
}
```

### Anti-Patterns to Avoid

- **Storing access tokens without refresh**: Access tokens expire in 1 hour. Always store refresh tokens, let googleapis handle access token refresh automatically.
- **Broad OAuth scopes**: Don't request `drive` (full access) when you only need `drive.file` (user-selected files). Follow principle of least privilege.
- **Client-side API calls**: Never call Google APIs from client components with user tokens. Always use Server Actions or API routes.
- **Missing retry logic**: Google APIs rate limit heavily. Not implementing exponential backoff will cause user-facing errors.
- **Ignoring token expiration**: Refresh tokens can expire (6 months unused, password change, user revocation). Handle "invalid_grant" errors gracefully.
- **Hardcoded quotas**: Google API quotas vary by API and project. Don't assume fixed limits—implement retry and graceful degradation.
- **Storing provider tokens in auth.users**: Supabase doesn't manage third-party provider token refresh. Use separate table with service-role-only access.
- **Not logging API errors**: Google API errors contain crucial debugging info (quota exceeded, permissions, invalid IDs). Log for troubleshooting.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth2 flow | Custom OAuth implementation | google-auth-library OAuth2Client | Handles PKCE, token refresh, state validation, security edge cases |
| File picker UI | Custom Drive file browser | Google Picker API | Users trust Google UI, handles permissions, supports shared drives, mobile-friendly |
| Rate limiting | Simple retry counter | Exponential backoff with jitter | Prevents thundering herd, respects Retry-After headers, proven algorithm |
| Email parsing | Regex for email headers | Gmail API metadata format | Handles complex email formats (multipart, encoding, threads), standard structure |
| Token encryption | Custom crypto | Supabase RLS + service-role | Database-level encryption, audit trail, revocation, battle-tested security |
| API client caching | In-memory OAuth2Client | Per-request client creation | Prevents token conflicts between users, server restart safety, stateless servers |

**Key insight:** Google APIs have complex edge cases (token expiration, quota limits, permission changes, rate limiting, user revocation) that are easy to miss but cause production bugs. The googleapis library and Google-provided tools handle these—don't reimplement.

## Common Pitfalls

### Pitfall 1: Refresh Token Not Stored on First Authorization

**What goes wrong:** User completes OAuth flow, but your code doesn't save the refresh token. Subsequent API calls fail with "invalid credentials" after 1 hour (access token expires).

**Why it happens:** Refresh tokens are only provided on the FIRST authorization when `access_type: 'offline'` is set. If you miss storing it, you must re-authorize the user (or revoke and re-grant access).

**How to avoid:**
1. Always set `access_type: 'offline'` in `generateAuthUrl()`
2. Listen to OAuth2Client `tokens` event and save refresh_token immediately
3. Store token in database transaction with error handling
4. Add logging to confirm token storage succeeded

**Warning signs:**
- Users can use features immediately after OAuth but fail after 1 hour
- Error logs show "invalid_grant" or "credentials not found"
- OAuth callback succeeds but no refresh token in database

### Pitfall 2: Using Wrong OAuth Scope for Drive Access

**What goes wrong:** Requesting `drive.readonly` or `drive` scope for file linking feature, causing security review requirements and user trust issues.

**Why it happens:** Developers assume broader scopes are "safer" or don't know about `drive.file` scope's capabilities.

**How to avoid:**
1. Use `drive.file` scope for document linking (non-sensitive, user-selected files only)
2. Combine with Google Picker API for file selection (Picker enforces per-file consent)
3. Only use `drive` scope if you genuinely need access to all user files

**Warning signs:**
- Google Cloud Console warns "restricted scope requires verification"
- Users see "This app wants to access ALL your Drive files" during OAuth
- OAuth consent screen takes >2 weeks to verify

### Pitfall 3: Not Implementing Exponential Backoff for Rate Limits

**What goes wrong:** API calls fail with 429 (rate limit exceeded) or 503 (service unavailable) errors during normal usage, especially with multiple users.

**Why it happens:** Google APIs have per-user and per-project quotas. Developers assume unlimited access or implement simple retry without backoff.

**How to avoid:**
1. Wrap all Google API calls with exponential backoff retry logic
2. Use formula: `min((2^attempt * 1000) + random(0-1000), 32000)`
3. Check for 429 and 503 status codes specifically
4. Respect Retry-After header if provided
5. Add jitter (random delay) to prevent thundering herd

**Warning signs:**
- Intermittent failures during peak usage times
- Error logs show "rateLimitExceeded" or "quotaExceeded"
- Multiple simultaneous operations all fail together

### Pitfall 4: Storing OAuth Tokens in Publicly Accessible Table

**What goes wrong:** OAuth refresh tokens stored in a table with Row Level Security policies that allow users to read their own tokens, exposing tokens to XSS attacks or accidental client-side leaks.

**Why it happens:** Developers treat OAuth tokens like user profile data, applying standard RLS patterns (users can read their own data).

**How to avoid:**
1. Create separate `google_oauth_tokens` table with NO RLS policies
2. Use service role access ONLY for token operations
3. Never expose tokens via public API or GraphQL
4. Encrypt tokens at application level if extra paranoid
5. Store tokens in auth schema or private schema if possible

**Warning signs:**
- Tokens visible in browser Network tab or client-side queries
- RLS policies reference user_id for token table
- Supabase JavaScript client can query token table directly

### Pitfall 5: Calendar Push Notifications Without HTTPS Webhook

**What goes wrong:** Attempting to set up Google Calendar push notifications (webhooks) for real-time event updates, but webhook endpoint isn't publicly accessible HTTPS.

**Why it happens:** Developers want real-time calendar sync but don't set up proper webhook infrastructure (HTTPS domain, endpoint handling, notification channel management).

**How to avoid:**
1. For MVP, use polling instead of webhooks (simpler, no webhook setup)
2. If webhooks needed: deploy webhook endpoint with valid HTTPS certificate
3. Implement channel renewal logic (channels expire, need recreation)
4. Handle sync vs exists vs not_exists notification states
5. Verify webhook requests are from Google (X-Goog-Channel-Token header)

**Warning signs:**
- Google API returns "invalid webhook URL" error
- Webhook notifications never arrive at endpoint
- Channel expiration errors after 1-7 days
- Missing channel ID tracking in database

### Pitfall 6: Gmail API Quota Exceeded with Message Content Fetching

**What goes wrong:** Fetching full email bodies for every message rapidly exhausts Gmail API quota (especially with large inboxes or message batches).

**Why it happens:** Developers fetch `format: 'full'` or `format: 'raw'` when they only need metadata (subject, sender, date) for CRM logging.

**How to avoid:**
1. Use `format: 'metadata'` for email logging (subject, participants, date only)
2. Specify exact headers needed: `metadataHeaders: ['From', 'To', 'Subject', 'Date']`
3. Only fetch full message if user explicitly requests content view
4. Implement caching for frequently accessed message metadata
5. Use batch requests for multiple messages (reduces quota usage)

**Warning signs:**
- Gmail API quota errors appear quickly with small numbers of emails
- Slow response times for email listing operations
- Large response payloads for simple metadata operations

### Pitfall 7: Not Handling Shared Drive File Access

**What goes wrong:** Users select files from Google Shared Drives via Picker, but Drive API calls fail with "File not found" or permission errors.

**Why it happens:** Shared Drive files require `supportsAllDrives: true` parameter in Drive API calls. Missing this parameter causes API to only search My Drive.

**How to avoid:**
1. Always set `supportsAllDrives: true` in Drive API calls
2. Enable `supportDrives: true` in Google Picker configuration
3. Handle both My Drive and Shared Drive file IDs uniformly
4. Test with Shared Drive files during development

**Warning signs:**
- Files selected via Picker don't appear in API results
- "File not found" errors for valid file IDs
- Works for personal files but fails for shared team files

## Code Examples

Verified patterns from official sources:

### OAuth2 Authorization URL Generation with Offline Access

```typescript
// Source: Context7 googleapis documentation
// Generate URL for user to authorize Google Workspace access

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_URL + '/api/google-oauth/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',        // User-selected Drive files
  'https://www.googleapis.com/auth/gmail.readonly',    // Read Gmail messages
  'https://www.googleapis.com/auth/calendar.events',   // Manage calendar events
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',  // CRITICAL: Required to get refresh token
  scope: SCOPES,
  prompt: 'consent',       // Force consent screen to ensure refresh token
});

// Redirect user to authUrl
```

### Token Exchange in OAuth Callback

```typescript
// Source: Context7 googleapis documentation
// Exchange authorization code for tokens and store refresh token

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_URL + '/api/google-oauth/callback'
);

// Get code from callback query parameter
const code = request.query.code;

// Exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);

// IMPORTANT: Store refresh_token in database
if (tokens.refresh_token) {
  await supabase
    .from('google_oauth_tokens')
    .upsert({
      user_id: userId,
      refresh_token: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    });
}

// Set credentials on client
oauth2Client.setCredentials(tokens);
```

### Drive API File Metadata Retrieval

```typescript
// Source: Context7 googleapis Drive API documentation
// Get metadata for a Drive file (used after Picker selection)

import { google } from 'googleapis';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const file = await drive.files.get({
  fileId: 'FILE_ID_FROM_PICKER',
  fields: 'id, name, mimeType, webViewLink, thumbnailLink, createdTime, modifiedTime',
  supportsAllDrives: true, // CRITICAL: Support Shared Drives
});

console.log('File name:', file.data.name);
console.log('View link:', file.data.webViewLink);
```

### Gmail Message Metadata Retrieval

```typescript
// Source: Context7 Gmail API documentation
// Fetch email metadata without full content (efficient for CRM logging)

import { google } from 'googleapis';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const message = await gmail.users.messages.get({
  userId: 'me',
  id: 'MESSAGE_ID',
  format: 'metadata',
  metadataHeaders: ['From', 'To', 'Subject', 'Date'], // Only headers needed
});

const headers = message.data.payload?.headers || [];
const subject = headers.find(h => h.name === 'Subject')?.value;
const from = headers.find(h => h.name === 'From')?.value;
```

### Calendar Event Creation

```typescript
// Source: Context7 Calendar API documentation
// Create calendar event and get event URL

import { google } from 'googleapis';

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const event = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: 'Meeting with Investor',
    description: 'Quarterly review meeting',
    start: {
      dateTime: '2026-02-15T10:00:00-05:00',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2026-02-15T11:00:00-05:00',
      timeZone: 'America/New_York',
    },
    attendees: [
      { email: 'investor@example.com' },
    ],
  },
});

console.log('Event created:', event.data.htmlLink);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual Google packages | googleapis meta-package | 2023 | Unified auth, simpler dependency management, consistent API |
| Custom file picker UI | Google Picker API | 2018 | User trust, mobile support, shared drives support, reduced dev time |
| drive scope for all access | drive.file for user-selected | 2020 | Non-sensitive classification, faster OAuth verification, better UX |
| Polling for Calendar updates | Push notifications (webhooks) | 2015 | Real-time updates, but adds complexity—polling still valid for simple cases |
| HS256 JWT signing | RS256 asymmetric keys | 2024 | Easier token validation, key rotation, recommended by Supabase |
| API Routes for Google calls | Server Actions | 2024 (Next.js 14+) | Simpler code, no route setup, automatic error handling |

**Deprecated/outdated:**
- `@google-cloud/local-auth` for production: Testing only, not suitable for multi-user web apps (requires local browser)
- Google+ API: Shut down 2019, use Google People API for profile data
- OAuth 2.0 Implicit Flow: Deprecated 2021, use Authorization Code Flow with PKCE
- `google-api-nodejs-client` package name: Renamed to `googleapis` in 2019

## Open Questions

Things that couldn't be fully resolved:

1. **Google API Quota Limits for CRM Usage**
   - What we know: Drive API has 20,000 requests/100 seconds per user, Gmail API has 250 quota units per second per user (message get = 5 units)
   - What's unclear: How these limits translate to realistic CRM usage patterns (10 investors × 5 operations/day = ? quota)
   - Recommendation: Implement quota monitoring from day 1, add caching for Drive file metadata, use metadata-only Gmail requests

2. **Calendar Webhook vs Polling Trade-offs**
   - What we know: Webhooks provide real-time updates but require HTTPS endpoint, channel management, renewal logic
   - What's unclear: Whether polling (every 5-15 minutes) is "good enough" for CRM use case vs webhook complexity
   - Recommendation: Start with polling for MVP (simpler), add webhooks in future phase if real-time sync becomes critical

3. **Shared Drive Permission Edge Cases**
   - What we know: Shared Drive files require `supportsAllDrives: true` parameter, have different permission models
   - What's unclear: How to handle cases where user has Shared Drive access but CRM app doesn't (delegated access limitations)
   - Recommendation: Document limitation that users can only link files they personally have access to, add error handling for permission errors

4. **Token Encryption at Database Level**
   - What we know: Supabase uses encryption at rest for all data, RLS can restrict access to service role only
   - What's unclear: Whether additional application-level encryption is needed for OAuth refresh tokens in Supabase context
   - Recommendation: Use service-role-only access table for tokens (no RLS), add application-level encryption if compliance requires it

5. **Gmail Thread Association vs Single Message**
   - What we know: Gmail organizes messages into threads (conversations), threads can span months
   - What's unclear: Should CRM log entire thread or just individual message? How to handle replies in existing thread?
   - Recommendation: Log individual messages (simpler), include thread_id in metadata for future thread grouping feature

## Sources

### Primary (HIGH confidence)

- Context7 `/websites/googleapis_dev_nodejs_googleapis` - OAuth2 authentication patterns, Drive/Gmail/Calendar API usage, token refresh handling
- Context7 `/websites/developers_google_workspace_gmail` - Gmail API integration patterns, message formats, API methods
- [Google Drive API - Choose scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) - Detailed scope descriptions and recommendations
- [Google Drive API - Roles and permissions](https://developers.google.com/drive/api/guides/ref-roles) - Permission management and sharing
- [Google Calendar API - Push notifications](https://developers.google.com/workspace/calendar/api/guides/push) - Webhook setup and channel management
- [Google Picker API Overview](https://developers.google.com/drive/picker/guides/overview) - Official Picker documentation

### Secondary (MEDIUM confidence)

- [Next.js Security: Server Components & Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) - Verified Nov 2024, Server Action security patterns
- [Supabase Auth: Token Security and RLS](https://supabase.com/docs/guides/auth/oauth-server/token-security) - OAuth token storage best practices
- [Google Cloud: Retry Strategy](https://docs.cloud.google.com/storage/docs/retry-strategy) - Official exponential backoff recommendations
- [Mastering Exponential Backoff in Distributed Systems](https://betterstack.com/community/guides/monitoring/exponential-backoff/) - Implementation patterns and formulas
- [Accessing Google Drive from Next.js](https://www.learncloudnative.com/blog/2024-09-23-gdrive-from-nextjs) - Modern Next.js integration patterns
- [Google Calendar Webhooks with Node.js - Stateful](https://stateful.com/blog/google-calendar-webhooks) - Webhook implementation details

### Tertiary (LOW confidence)

- WebSearch: "Google API common pitfalls mistakes to avoid quota management 2026" - General patterns and common issues, not specifically verified
- [react-google-drive-picker npm package](https://www.npmjs.com/package/react-google-drive-picker) - Community library, not officially supported by Google

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - googleapis is official Google library, well-documented, actively maintained
- Architecture: HIGH - OAuth2 patterns verified via Context7, Server Actions security from official Next.js docs, Supabase token storage from official docs
- Pitfalls: MEDIUM - Mix of official Google documentation (rate limiting, scopes) and community experience (shared drive issues, token storage)

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable APIs, but Google Cloud Console UI and quotas may change)
