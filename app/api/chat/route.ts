/**
 * Chat API endpoint for AI BDR agent
 * Handles streaming conversations with Claude Sonnet 4.5 and tool calling
 */

import { streamText, stepCountIs, StreamData } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { BDR_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { allTools } from '@/lib/ai/tools';
import { validateUserInput } from '@/lib/ai/security';

/**
 * Maximum duration for streaming responses
 * Allows up to 60 seconds for complex queries with multiple tool calls
 */
export const maxDuration = 60;

/**
 * POST /api/chat
 * Accepts messages array and returns streaming AI response with tool calling
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
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

    // Transform messages from UI format to AI SDK format
    // useChat sends messages with parts array, but AI SDK expects content field
    const transformedMessages = messages.map((msg: any) => {
      // If message has parts array (from useChat), extract text content
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((p: any) => p.type === 'text');
        const content = textParts.map((p: any) => p.text).join(' ');
        return { role: msg.role, content };
      }
      // Otherwise, keep message as-is (already in correct format)
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

    // Stream AI response with tool calling
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: BDR_SYSTEM_PROMPT,
      messages: transformedMessages,
      tools: allTools,
      maxSteps: 5, // Prevent infinite tool calling loops
    });

    // Use experimental_streamText format for better compatibility
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
