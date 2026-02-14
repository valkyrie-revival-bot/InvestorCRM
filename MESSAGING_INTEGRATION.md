# Messaging Integration - Google Chat & WhatsApp

Complete system-to-users communication via Google Chat and WhatsApp for internal team notifications and AI BDR queries.

## Overview

This integration enables:
- **System → Users notifications** (task reminders, pipeline alerts, AI insights)
- **Users → System queries** (ask questions, get summaries via Chat/WhatsApp)
- **Low volume internal use** (team communication, not investor outreach yet)

## Architecture

```
┌─────────────────┐
│   CRM System    │
│                 │
│  Notifications  │──┐
│   AI BDR        │  │
│   Webhooks      │  │
└─────────────────┘  │
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  Google Chat    │    │    WhatsApp      │
│   API Client    │    │  Web API Client  │
└─────────────────┘    └──────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Team Members  │
            └────────────────┘
```

## Database Schema

### Tables Created
1. **user_messaging_preferences** - User settings for channels and notification types
2. **google_chat_messages** - Message history for Google Chat
3. **whatsapp_messages** - Message history for WhatsApp
4. **message_queue** - Outbound message queue with retry logic

## Setup Instructions

### 1. Apply Database Migration

```bash
# Copy migration SQL to Supabase Dashboard → SQL Editor
cat supabase/migrations/20260214000002_create_messaging_tables.sql
```

**Or via command line:**
```bash
psql YOUR_DATABASE_URL < supabase/migrations/20260214000002_create_messaging_tables.sql
```

### 2. Google Chat Setup

#### A. Enable Google Chat API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same one used for Google Workspace)
3. Enable **Google Chat API**
4. No additional OAuth scopes needed (uses existing Google Workspace auth)

#### B. Configure Chat App (Optional - for bot interactions)
1. Go to Google Chat API → Configuration
2. Set up app details:
   - **App name**: Prytaneum CRM Bot
   - **Avatar URL**: Your logo
   - **Description**: CRM assistant for pipeline insights
3. Configure interactive features:
   - **App URL**: `https://your-domain.com/api/webhooks/google-chat`
   - **Connection settings**: HTTP
4. Set up permissions:
   - **Specific people and groups**: Add your team
   - **Functionality**: Messages, Slash commands

#### C. Test Google Chat
```bash
# In your CRM settings, enable Google Chat
# Leave Space ID empty for DM, or get space ID from Chat URL
# Format: spaces/AAAAA...
```

### 3. WhatsApp Web API Setup

#### A. Install Dependencies
```bash
npm install whatsapp-web.js qrcode-terminal
```

#### B. Initialize WhatsApp Client

Create initialization script:
```typescript
// scripts/init-whatsapp.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.whatsapp-session'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client ready!');
});

client.on('message', async (message) => {
  // Forward to webhook handler
  console.log('Message received:', message.from, message.body);
});

client.initialize();
```

Run initialization:
```bash
npx tsx scripts/init-whatsapp.ts
```

#### C. Scan QR Code
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Scan the QR code from terminal
4. Wait for "WhatsApp client ready!" message

#### D. Keep Client Running
For production, run in a separate process:
```bash
# Using PM2
pm2 start scripts/init-whatsapp.ts --name whatsapp-client

# Or Docker
docker-compose up -d whatsapp-client
```

### 4. Configure Environment Variables

Add to `.env.local`:
```bash
# Google Chat (uses existing Google Workspace credentials)
# No additional variables needed if Google Workspace already set up

# WhatsApp
WHATSAPP_SESSION_PATH=.whatsapp-session

# App URL for webhook callbacks
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Enable Messaging in Settings

1. Navigate to Settings → Messaging
2. Enable Google Chat:
   - Toggle "Enable Google Chat"
   - Leave Space ID empty for DM
3. Enable WhatsApp:
   - Toggle "Enable WhatsApp"
   - Enter phone number: +1234567890
   - Wait for verification (contact support)
4. Configure notification preferences:
   - Task Reminders ✓
   - Investor Updates ✓
   - Pipeline Alerts ✓
   - AI Insights (optional)
5. Click "Save Preferences"

## Usage

### Sending Notifications

```typescript
import { sendNotification } from '@/app/actions/messaging';

// Task reminder
await sendNotification({
  user_id: 'uuid',
  notification_type: 'task_reminder',
  data: {
    task_id: 'uuid',
    task_title: 'Follow up with Acme Corp',
    investor_name: 'Acme Corp',
    due_date: '2026-02-15',
  },
  channel: 'all', // or 'google_chat' or 'whatsapp'
});

// Pipeline alert
await sendNotification({
  user_id: 'uuid',
  notification_type: 'pipeline_alert',
  data: {
    alert_type: 'stalled_investor',
    count: 5,
    details: '5 investors have no activity in 30+ days',
  },
});
```

### Querying via Chat/WhatsApp

Users can send messages to query the CRM:

**Commands:**
- `pipeline` or `summary` → Get pipeline overview
- `tasks` or `overdue` → View pending tasks
- `stalled` or `stuck` → See stalled investors
- `help` → Show available commands

**Example:**
```
User: pipeline
Bot: 📊 Pipeline Summary

Total: 58 investors

Initial Contact: 15
Qualification: 12
Proposal: 8
Negotiation: 5
Closed Won: 18
```

## Testing

### Test Google Chat
1. Open Google Chat
2. Find the CRM bot (if configured) or send yourself a test
3. Run test notification:
```typescript
await sendNotification({
  user_id: YOUR_USER_ID,
  notification_type: 'pipeline_alert',
  data: {
    alert_type: 'test',
    count: 1,
    details: 'This is a test notification',
  },
  channel: 'google_chat',
});
```

### Test WhatsApp
1. Make sure WhatsApp Web client is running
2. Save your phone number in settings
3. Run test:
```typescript
await sendNotification({
  user_id: YOUR_USER_ID,
  notification_type: 'task_reminder',
  data: {
    task_id: 'test',
    task_title: 'Test Task',
    investor_name: 'Test Investor',
    due_date: '2026-02-15',
  },
  channel: 'whatsapp',
});
```

### Test Incoming Messages
1. Send a message to the bot via Google Chat or WhatsApp
2. Try commands:
   - "pipeline"
   - "tasks"
   - "stalled"
3. Check webhook logs for processing

## Webhook Endpoints

### Google Chat
**URL:** `POST /api/webhooks/google-chat`

**Events handled:**
- MESSAGE - User sends message
- ADDED_TO_SPACE - Bot added to room/DM
- REMOVED_FROM_SPACE - Bot removed

### WhatsApp
**URL:** `POST /api/webhooks/whatsapp`

**Events handled:**
- message - Incoming message from user

## Message Formats

### Google Chat - Card Format
```json
{
  "cardsV2": [{
    "card": {
      "header": {
        "title": "⏰ Task Reminder",
        "subtitle": "Acme Corp"
      },
      "sections": [{
        "widgets": [
          {
            "textParagraph": {
              "text": "**Follow up with Acme Corp**\nDue: 2026-02-15"
            }
          },
          {
            "buttons": [{
              "textButton": {
                "text": "View Task",
                "onClick": {
                  "openLink": {
                    "url": "https://crm.com/tasks/..."
                  }
                }
              }
            }]
          }
        ]
      }]
    }
  }]
}
```

### WhatsApp - Formatted Text
```
⏰ *Task Reminder*

Investor: Acme Corp
Task: Follow up with Acme Corp
Due: 2026-02-15

View: https://crm.com/tasks/...
```

## Production Considerations

### Google Chat
- ✅ Scales automatically with Google infrastructure
- ✅ No rate limits for DMs to your team
- ✅ OAuth handled by existing Google Workspace integration
- ⚠️ Requires verified Google Cloud project for public bot

### WhatsApp Web API
- ⚠️ Requires phone to be online (or use Cloud deployment)
- ⚠️ Rate limit: ~1000 messages/day per number
- ⚠️ Against WhatsApp ToS for commercial use (okay for low-volume internal)
- ✅ Quick to set up, no approval needed
- 🔄 For production/scale: Upgrade to WhatsApp Business API (requires Meta approval)

### Recommended Production Setup
1. **Google Chat**: Use official API (current implementation)
2. **WhatsApp**: Start with Web API, migrate to Business API when scaling
3. **Message Queue**: Use Redis instead of PostgreSQL for queue
4. **Worker Process**: Run message sending in separate service
5. **Monitoring**: Add error tracking and delivery metrics

## Future Enhancements

### Phase 2: Investor Communication
- Enable messaging investors (not just team)
- CRM-tracked investor conversations
- Message templates for compliance
- Conversation history per investor

### Phase 3: Advanced Features
- Voice messages (WhatsApp)
- Document sharing (Both)
- Group conversations (Google Chat)
- Scheduled messages
- Smart reply suggestions
- Message analytics

## Troubleshooting

### Google Chat not working
1. Check OAuth scopes include Chat API
2. Verify webhook URL is accessible
3. Check Google Cloud Console for API errors
4. Ensure user has Google Workspace account

### WhatsApp not working
1. Check if WhatsApp client is running: `pm2 status`
2. Verify QR code was scanned successfully
3. Check phone is online and WhatsApp is active
4. Review WhatsApp session: `ls -la .whatsapp-session/`
5. Restart client: `pm2 restart whatsapp-client`

### Messages not being sent
1. Check user messaging preferences are enabled
2. Verify phone number format (+1234567890)
3. Check message queue: `SELECT * FROM message_queue WHERE status = 'failed';`
4. Review webhook logs for errors

### Commands not working
1. Check webhook endpoints are accessible
2. Verify user exists in user_messaging_preferences
3. Check logs for incoming message processing
4. Ensure database permissions for webhook user

## Support

For issues or questions:
1. Check logs: `pm2 logs whatsapp-client`
2. Review webhook payloads in API routes
3. Check Supabase logs for database errors
4. Contact support with relevant log excerpts

---

**Version:** 1.0.0
**Last Updated:** 2026-02-14
**Status:** Ready for Internal Testing
