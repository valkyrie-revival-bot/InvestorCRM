/**
 * Meeting Transcription API Route
 * Handles audio file uploads, Whisper transcription, and action item extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for action items
interface ActionItem {
  description: string;
  assignee: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
}

interface TranscriptionResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * POST /api/meetings/transcribe
 * Upload audio file, transcribe with Whisper, extract action items
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const meetingId = formData.get('meetingId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'video/mp4',
      'audio/webm',
    ];

    if (!validMimeTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: mp3, mp4, m4a, wav, webm' },
        { status: 400 }
      );
    }

    // Update meeting status to processing
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Failed to update meeting status:', updateError);
    }

    // Step 1: Transcribe audio with Whisper
    console.log('Starting transcription for meeting:', meetingId);

    let transcriptionResult: TranscriptionResponse;
    try {
      transcriptionResult = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      }) as any;
    } catch (whisperError: any) {
      console.error('Whisper API error:', whisperError);

      // Update meeting status to failed
      await supabase
        .from('meetings')
        .update({
          status: 'failed',
          processing_error: whisperError.message || 'Transcription failed'
        })
        .eq('id', meetingId);

      return NextResponse.json(
        { error: `Transcription failed: ${whisperError.message}` },
        { status: 500 }
      );
    }

    const transcriptText = transcriptionResult.text;
    console.log('Transcription completed, length:', transcriptText.length);

    // Step 2: Extract action items and insights using GPT-4
    console.log('Extracting action items...');

    const extractionPrompt = `Analyze the following meeting transcript and extract:

1. Action items (tasks that need to be done)
2. Key topics discussed
3. Any objections or concerns raised
4. Next steps
5. Overall sentiment (positive/neutral/negative)

For action items, identify:
- Clear description of what needs to be done
- Who should do it (if mentioned)
- When it should be done by (if mentioned)
- Priority level (high/medium/low)

Return your analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary of the meeting",
  "key_topics": ["topic1", "topic2", ...],
  "action_items": [
    {
      "description": "Task description",
      "assignee": "Person name or null",
      "due_date": "YYYY-MM-DD or null",
      "priority": "high/medium/low"
    }
  ],
  "objections": [
    {
      "objection": "Concern raised",
      "response": "How it was addressed",
      "resolved": true/false
    }
  ],
  "next_steps": ["step1", "step2", ...],
  "sentiment": "positive/neutral/negative"
}

Transcript:
${transcriptText}`;

    let analysisResult;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes meeting transcripts and extracts actionable insights. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const analysisText = completion.choices[0].message.content;
      analysisResult = JSON.parse(analysisText || '{}');
    } catch (gptError: any) {
      console.error('GPT-4 extraction error:', gptError);
      // Continue without analysis
      analysisResult = {
        summary: 'Analysis unavailable',
        key_topics: [],
        action_items: [],
        objections: [],
        next_steps: [],
        sentiment: 'neutral'
      };
    }

    console.log('Extracted', analysisResult.action_items?.length || 0, 'action items');

    // Step 3: Store transcript and insights in database
    const { data: transcript, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .insert({
        meeting_id: meetingId,
        transcript_text: transcriptText,
        summary: analysisResult.summary || null,
        key_topics: analysisResult.key_topics || [],
        action_items: analysisResult.action_items || [],
        objections: analysisResult.objections || [],
        next_steps: analysisResult.next_steps || [],
        sentiment: analysisResult.sentiment || 'neutral',
        model_used: 'whisper-1 + gpt-4',
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Failed to save transcript:', transcriptError);

      // Update meeting status to failed
      await supabase
        .from('meetings')
        .update({
          status: 'failed',
          processing_error: 'Failed to save transcript'
        })
        .eq('id', meetingId);

      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      );
    }

    // Step 4: Get meeting details to link tasks to investor
    const { data: meeting } = await supabase
      .from('meetings')
      .select('investor_id')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      console.error('Meeting not found:', meetingId);
    }

    // Step 5: Auto-create tasks from action items
    const createdTasks: any[] = [];
    if (meeting && analysisResult.action_items?.length > 0) {
      console.log('Creating', analysisResult.action_items.length, 'tasks...');

      for (const item of analysisResult.action_items) {
        try {
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
              investor_id: meeting.investor_id,
              title: item.description,
              description: `Auto-generated from meeting transcript`,
              due_date: item.due_date || null,
              priority: item.priority || 'medium',
              status: 'pending',
              created_by: user.id,
              metadata: {
                source: 'meeting_transcript',
                meeting_id: meetingId,
                assignee: item.assignee
              }
            })
            .select()
            .single();

          if (taskError) {
            console.error('Failed to create task:', taskError);
          } else {
            createdTasks.push(task);
          }
        } catch (taskCreateError) {
          console.error('Error creating task:', taskCreateError);
        }
      }

      console.log('Created', createdTasks.length, 'tasks');
    }

    // Step 6: Update meeting status to completed
    await supabase
      .from('meetings')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', meetingId);

    // Return success response with all data
    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        text: transcriptText,
        segments: transcriptionResult.segments || [],
        summary: analysisResult.summary,
        key_topics: analysisResult.key_topics,
        action_items: analysisResult.action_items,
        objections: analysisResult.objections,
        next_steps: analysisResult.next_steps,
        sentiment: analysisResult.sentiment,
      },
      tasks_created: createdTasks.length,
      tasks: createdTasks,
    });

  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
