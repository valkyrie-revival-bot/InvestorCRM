/**
 * Generate animated avatar video with D-ID
 * Takes text input, returns video URL with talking avatar
 */

import { createTalk, getTalkStatus } from '@/lib/ai/did-client';
import { getSupabaseClient } from '@/lib/supabase/dynamic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text input required' }, { status: 400 });
    }

    // Create avatar video with D-ID
    // Use absolute URL for the avatar image
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/avatar-archon.png`;

    console.log('Creating D-ID talk with avatar:', avatarUrl);

    const talkResult = await createTalk({
      sourceUrl: avatarUrl,
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-GuyNeural', // Male voice, professional
        },
      },
      config: {
        stitch: true,
        result_format: 'mp4',
      },
    });

    console.log('D-ID talk created:', talkResult.id);

    // Poll for completion (D-ID takes 30-60 seconds to generate)
    let status = talkResult.status;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds

    while (status === 'created' || status === 'processing') {
      if (attempts >= maxAttempts) {
        return Response.json(
          { error: 'Video generation timeout' },
          { status: 408 }
        );
      }

      // Wait 1 second between checks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResult = await getTalkStatus(talkResult.id);
      status = statusResult.status;
      attempts++;

      console.log(`D-ID status check ${attempts}:`, status);

      if (status === 'done') {
        return Response.json({
          success: true,
          videoUrl: statusResult.result_url,
          talkId: talkResult.id,
        });
      }

      if (status === 'error') {
        return Response.json(
          {
            error: statusResult.error?.description || 'Video generation failed',
          },
          { status: 500 }
        );
      }
    }

    // Should not reach here
    return Response.json({ error: 'Unexpected status' }, { status: 500 });
  } catch (error) {
    console.error('Avatar generation error:', error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate avatar',
      },
      { status: 500 }
    );
  }
}
