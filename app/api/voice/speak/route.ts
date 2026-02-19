/**
 * ElevenLabs Text-to-Speech endpoint
 * Converts text to realistic voice audio using ElevenLabs API
 */

import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Adam voice - deep, authoritative, professional
// Model: eleven_turbo_v2_5 (low latency, high quality, multilingual)
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam

export async function POST(req: Request) {
  try {
    // Authenticate user
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text input required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    console.log('Generating speech with ElevenLabs:', {
      textLength: text.length,
      voiceId: VOICE_ID,
    });

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', response.status, error);
      return Response.json(
        { error: `ElevenLabs API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Return audio stream
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Speech generation error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Speech generation failed',
      },
      { status: 500 }
    );
  }
}
