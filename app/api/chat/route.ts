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

    // Transform messages to Anthropic format and filter out invalid ones
    const transformedMessages = messages
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content || (msg.parts?.find((p: any) => p.type === 'text')?.text || ''),
      }))
      .filter((msg: any) => msg.content && msg.content.trim().length > 0); // Filter out empty messages

    // Validate we have at least one message
    if (transformedMessages.length === 0) {
      return Response.json(
        { error: 'No valid messages provided' },
        { status: 400 }
      );
    }

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

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim().replace(/\s+/g, '');
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Making direct fetch to Anthropic API...');
    console.log('Request body:', JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: BDR_SYSTEM_PROMPT.substring(0, 100) + '...',
      messages: transformedMessages,
    }, null, 2));

    console.log('About to call Anthropic API with model:', 'claude-sonnet-4-5-20250929');
    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey.length);

    // Call Anthropic API directly with fetch
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 (latest)
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
      console.error('=== ANTHROPIC API ERROR ===');
      console.error('Status:', anthropicResponse.status);
      console.error('Full error response:', errorText);
      console.error('==========================');

      // Try to parse as JSON for better error details
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
      } catch (e) {
        // Not JSON, use raw text
      }

      return Response.json(
        { error: `Anthropic API Error: ${errorMessage}` },
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
    console.error('=== CHAT API EXCEPTION ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('========================');

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
