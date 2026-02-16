/**
 * Chat API endpoint for AI BDR agent
 * Direct Anthropic API integration using fetch
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { BDR_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { validateUserInput } from '@/lib/ai/security';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body;

    console.log('Received chat request:', {
      messageCount: messages?.length,
    });

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Transform messages to Anthropic format
    const transformedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || (msg.parts?.find((p: any) => p.type === 'text')?.text || ''),
    }));

    // Validate latest user message
    const latestMessage = transformedMessages[transformedMessages.length - 1];
    if (latestMessage?.role === 'user' && latestMessage.content) {
      const validation = validateUserInput(latestMessage.content);
      if (!validation.valid) {
        return Response.json(
          { error: `Invalid input: ${validation.reason}` },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Making direct fetch to Anthropic API...');
    console.log('Transformed messages:', JSON.stringify(transformedMessages, null, 2));

    // Call Anthropic API directly with fetch
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: BDR_SYSTEM_PROMPT,
        messages: transformedMessages,
        stream: true,
      }),
    });

    console.log('Anthropic API response status:', anthropicResponse.status);
    console.log('Anthropic API response headers:', Object.fromEntries(anthropicResponse.headers.entries()));

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error response:', errorText);
      return Response.json(
        { error: `AI service error: ${errorText.substring(0, 200)}` },
        { status: anthropicResponse.status }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const reader = anthropicResponse.body?.getReader();

    if (!reader) {
      throw new Error('No response body from Anthropic');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('Stream completed');
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'content_block_delta') {
                    if (parsed.delta?.type === 'text_delta' && parsed.delta?.text) {
                      controller.enqueue(encoder.encode(parsed.delta.text));
                    }
                  }
                } catch (parseError) {
                  // Skip unparseable lines
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error details:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });
          const errorMsg = `Stream error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
