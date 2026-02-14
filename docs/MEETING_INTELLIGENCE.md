# Meeting Intelligence System

AI-powered meeting recording capture, transcription, and intelligence extraction using Claude API.

## Features

### 1. Recording Capture
- Manual upload of audio/video meeting recordings
- Supports: MP3, WAV, MP4, WebM, MOV (up to 50MB)
- Integration with Google Calendar events
- Optional "Enable recording" checkbox when scheduling meetings

### 2. AI Transcription & Analysis
- Automatic transcription using Claude Sonnet 4.5
- Extracts structured insights:
  - **Summary**: Concise 2-3 sentence overview
  - **Key Topics**: Main discussion points
  - **Action Items**: Tasks with assignee, due date, and priority
  - **Objections**: Customer concerns and how they were addressed
  - **Next Steps**: Concrete follow-up actions
  - **Sentiment**: Overall meeting tone (positive/neutral/negative)

### 3. Automatic Task Creation
- Action items automatically become tasks
- Linked to investor record
- Includes due dates and priorities from AI analysis

### 4. Activity Feed Integration
- Meeting summaries added to investor timeline
- Includes sentiment and key topics
- Full audit trail of all meetings

## Usage

### Schedule a Meeting with Recording

1. Navigate to investor detail page
2. Click "Schedule Meeting" button
3. Fill in meeting details
4. **Check "Enable meeting recording & AI analysis"**
5. Click "Schedule Meeting"

This creates:
- Google Calendar event
- Meeting record in database (status: pending)

### Upload Recording

1. After the meeting, navigate to investor detail page
2. Find the meeting in "Meeting Intelligence" section
3. Click "Upload Recording" button
4. Select audio/video file (max 50MB)
5. Click "Upload & Analyze"

The system will:
1. Upload the file
2. Process with Claude API (transcription + analysis)
3. Extract insights and store in database
4. Create tasks from action items
5. Add summary to activity feed
6. Update meeting status to "completed"

### View Insights

**On Investor Detail Page:**
- Scroll to "Meeting Intelligence" section
- View all meetings for this investor
- Click to expand transcripts and insights

**On Meetings Page:**
- Navigate to `/meetings`
- View all meetings across all investors
- Filter by status, search by keyword
- See statistics dashboard

## API Endpoints

### POST /api/meetings/process

Upload and process a meeting recording.

**Request:**
```
Content-Type: multipart/form-data

meeting_id: UUID
file: audio/video file
```

**Response:**
```json
{
  "success": true,
  "meeting_id": "...",
  "transcript_id": "...",
  "processing_duration_ms": 12345,
  "action_items_created": 3
}
```

## Database Schema

### meetings table
- `id`: UUID primary key
- `investor_id`: Foreign key to investors
- `calendar_event_id`: Optional link to calendar event
- `meeting_title`: Title/subject
- `meeting_date`: When the meeting occurred
- `duration_minutes`: Meeting length
- `recording_url`: Storage URL for recording
- `status`: pending | processing | completed | failed
- `processing_error`: Error message if failed

### meeting_transcripts table
- `id`: UUID primary key
- `meeting_id`: Foreign key to meetings
- `transcript_text`: Full transcription
- `summary`: AI-generated summary
- `key_topics`: Array of main topics
- `action_items`: JSONB array with tasks
- `objections`: JSONB array with concerns
- `next_steps`: Array of follow-up actions
- `sentiment`: positive | neutral | negative
- `model_used`: AI model identifier
- `processing_duration_ms`: Processing time

## Components

### UploadRecordingModal
Modal for uploading meeting recordings. Validates file type and size, shows processing status.

### MeetingIntelligenceCard
Displays AI-extracted insights from a meeting:
- Summary and sentiment
- Key topics (badges)
- Action items with assignees and dates
- Objections with resolution status
- Next steps
- Collapsible full transcript

### MeetingIntelligenceDashboard
Lists meetings with filtering:
- Search by title or investor
- Filter by status
- Statistics cards (total, completed, pending, avg duration)
- Quick access to upload recordings

## Current Limitations

1. **Audio Processing**: The current implementation uses a mock transcription. In production, you need to:
   - Use OpenAI Whisper API for transcription
   - Or Google Cloud Speech-to-Text
   - Then pass transcript to Claude for analysis

2. **File Storage**: Files are currently sent directly to API. For production:
   - Upload to Supabase Storage
   - Process asynchronously with queue (e.g., Inngest, BullMQ)
   - Store file URLs in database

3. **Google Meet Auto-Capture**: Requires Google Workspace admin permissions:
   - Set up Google Drive API
   - Configure automatic recording
   - Monitor Drive folder for new recordings
   - Process automatically

## Testing

### Manual Testing

1. **Create a meeting**:
   ```bash
   # Navigate to investor detail page
   # Click "Schedule Meeting"
   # Check "Enable recording"
   # Submit form
   ```

2. **Upload a sample audio file**:
   - Any audio/video file under 50MB
   - MP3 or MP4 recommended
   - System will create mock transcript and analysis

3. **Verify results**:
   - Check meeting status changed to "completed"
   - View extracted insights on investor page
   - Verify tasks were created in Tasks section
   - Check activity feed for meeting summary

### Sample Mock Response

The system generates realistic mock data for testing:
```json
{
  "summary": "Demo meeting showcasing intelligence system...",
  "key_topics": ["Product Demo", "Pricing Discussion", "Next Steps"],
  "action_items": [
    {
      "description": "Send follow-up email with pricing proposal",
      "assignee": "Sales Team",
      "due_date": "2026-02-16",
      "priority": "high"
    }
  ],
  "objections": [
    {
      "objection": "Pricing concerns compared to competitors",
      "response": "Highlighted unique value propositions and ROI",
      "resolved": true
    }
  ],
  "next_steps": [
    "Review pricing proposal internally",
    "Schedule follow-up meeting in 2 weeks"
  ],
  "sentiment": "positive"
}
```

## Production Deployment

### 1. Set up Transcription Service

Choose one:

**Option A: OpenAI Whisper**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
});
```

**Option B: Google Cloud Speech-to-Text**
```typescript
import { SpeechClient } from '@google-cloud/speech';

const client = new SpeechClient();
const [response] = await client.recognize({
  audio: { content: audioBuffer },
  config: {
    encoding: 'LINEAR16',
    languageCode: 'en-US',
  },
});
```

### 2. Update Processing Route

Replace mock transcript with real transcription:

```typescript
// 1. Upload file to storage
const { data: upload } = await supabase.storage
  .from('meeting-recordings')
  .upload(`${meetingId}/${file.name}`, file);

// 2. Transcribe with Whisper
const transcription = await transcribeAudio(file);

// 3. Analyze with Claude
const analysis = await analyzeTranscript(transcription);

// 4. Store results
await storeTranscriptAndInsights(meetingId, analysis);
```

### 3. Configure Storage

```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('meeting-recordings', 'meeting-recordings', false);

-- Add RLS policies
create policy "Users can upload recordings"
on storage.objects for insert
to authenticated
with check (bucket_id = 'meeting-recordings');
```

### 4. Set up Background Processing

Use a queue for long-running jobs:

```typescript
// Queue job for async processing
await queue.enqueue('process-meeting', {
  meetingId,
  fileUrl,
});

// Worker processes the job
queue.process('process-meeting', async (job) => {
  await processRecording(job.data.meetingId, job.data.fileUrl);
});
```

## Environment Variables

Required:
```bash
# Already configured
ANTHROPIC_API_KEY=sk-ant-...

# Add for production transcription
OPENAI_API_KEY=sk-proj-...
# OR
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Troubleshooting

**Issue**: "Failed to process recording"
- Check file size (< 50MB)
- Verify file type is supported
- Check API keys are configured
- View processing_error in database

**Issue**: Tasks not created from action items
- Verify action_items JSON format
- Check investor_id exists
- Review server logs for errors

**Issue**: Meeting shows "processing" indefinitely
- Check API route timeout (maxDuration)
- Review server logs for errors
- Manually update status to failed if needed

## Future Enhancements

1. **Real-time Transcription**: Stream transcription as meeting progresses
2. **Speaker Diarization**: Identify different speakers
3. **Multi-language Support**: Detect and transcribe multiple languages
4. **Meeting Templates**: Pre-defined analysis templates by meeting type
5. **Integration with CRM**: Sync insights to external systems
6. **Automatic Recording**: Google Meet bot to join and record
7. **Video Analysis**: Extract visual cues and presentations
8. **Competitive Intelligence**: Track competitor mentions across meetings
