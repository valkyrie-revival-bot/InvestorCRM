/**
 * Voice transcription endpoint
 * Uses OpenAI Whisper to convert speech to text
 */

import OpenAI from 'openai';
import { getSupabaseClient } from '@/lib/supabase/dynamic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Authenticate user
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Transcribing audio:', audioFile.name, audioFile.type, audioFile.size);

    // Convert File to format OpenAI expects
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

    // Create a File object that OpenAI SDK expects
    const file = new File([audioBlob], 'audio.webm', { type: audioFile.type });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    console.log('Transcription result:', transcription.text);

    return Response.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Transcription failed',
      },
      { status: 500 }
    );
  }
}
