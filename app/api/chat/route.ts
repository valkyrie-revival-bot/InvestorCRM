/**
 * Chat API endpoint for AI BDR agent
 * Handles streaming conversations with Claude Sonnet 4.5
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { BDR_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { validateUserInput } from '@/lib/ai/security';

/**
 * Maximum duration for streaming responses
 * Allows up to 60 seconds for complex queries
 */
export const maxDuration = 60;

/**
 * POST /api/chat
 * Accepts messages array and returns streaming AI response
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body;

    console.log('Received chat request:', {
      messageCount: messages?.length,
      lastMessage: messages?.[messages.length - 1],
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
    const transformedMessages = messages.map((msg: any) => {
      // If message has parts array, extract text content
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((p: any) => p.type === 'text');
        const content = textParts.map((p: any) => p.text).join(' ');
        return { role: msg.role, content };
      }
      return msg;
    });

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

    // Create Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('Anthropic client created');

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting Anthropic stream...');

          const streamResponse = await client.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            system: BDR_SYSTEM_PROMPT,
            messages: transformedMessages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          });

          console.log('Stream created, waiting for chunks...');

          for await (const event of streamResponse) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          console.log('Stream completed successfully');
          controller.close();
        } catch (error) {
          console.error('Anthropic streaming error:', error);
          const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
