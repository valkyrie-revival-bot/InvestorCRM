/**
 * Meeting Transcript Upload API Route
 * Accepts plain text transcript files (.txt, .vtt) and stores the text
 * directly in the meetings table without requiring audio processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

export const maxDuration = 30;

/**
 * POST /api/meetings/transcript
 * Upload a text transcript file for a meeting
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const meetingId = formData.get('meetingId') as string | null;
    const file = formData.get('transcript') as File | null;

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Transcript file is required' }, { status: 400 });
    }

    // Only accept text-based formats
    const allowedTypes = ['text/plain', 'text/vtt', 'application/x-subrip'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isTextFile = allowedTypes.includes(file.type) || fileExt === 'txt' || fileExt === 'vtt' || fileExt === 'srt';

    if (!isTextFile) {
      return NextResponse.json(
        { error: 'Only .txt, .vtt, and .srt files are supported for direct transcript upload. For audio/video files, use the Upload Recording button.' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    // Read text content
    const rawText = await file.text();

    // For VTT/SRT files, strip timing metadata to get clean text
    let transcriptText = rawText;
    if (fileExt === 'vtt' || fileExt === 'srt') {
      transcriptText = rawText
        .replace(/WEBVTT\n*/g, '')
        .replace(/^\d+\n/gm, '') // Remove SRT sequence numbers
        .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}\n/gm, '') // Remove timestamps
        .replace(/<[^>]+>/g, '') // Remove HTML tags (VTT)
        .replace(/\n{3,}/g, '\n\n') // Normalize whitespace
        .trim();
    }

    if (!transcriptText.trim()) {
      return NextResponse.json({ error: 'Transcript file appears to be empty' }, { status: 400 });
    }

    // Update the meeting record with transcript text
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        transcript: { text: transcriptText, source: 'manual_upload', uploaded_at: new Date().toISOString() },
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Failed to save transcript:', updateError);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transcript uploaded successfully',
      character_count: transcriptText.length,
    });
  } catch (error) {
    console.error('Transcript upload error:', error);
    return NextResponse.json({ error: 'Failed to process transcript' }, { status: 500 });
  }
}
