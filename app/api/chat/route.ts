/**
 * Chat API endpoint for AI BDR agent
 * Handles streaming conversations with Claude Sonnet 4.5 and tool calling
 */

import { streamText } from 'ai';
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
      maxSteps: 10, // Increased to allow continuation after tools
      maxRetries: 0,
    });

    console.log('Streaming response created');

    // Wait for the full response (including all tool steps) and stream it
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let hasContent = false;
          let allSteps: any[] = [];

          // Collect all steps to check if we need to force continuation
          for await (const part of result.fullStream) {
            allSteps.push(part);

            if (part.type === 'text-delta') {
              hasContent = true;
              controller.enqueue(encoder.encode(part.textDelta));
            }
          }

          console.log('Stream completed with', allSteps.length, 'parts');

          const finishPart = allSteps.find(p => p.type === 'finish');
          const finishReason = finishPart?.finishReason;

          console.log('Finish reason:', finishReason);
          console.log('Has text content:', hasContent);

          // If finished after tool calls without text, make a follow-up request
          if (!hasContent && finishReason === 'tool-calls') {
            console.log('Making follow-up request to get text response...');

            // Extract tool call information from steps
            const toolCalls = allSteps.filter(p => p.type === 'tool-call');
            const toolResults = allSteps.filter(p => p.type === 'tool-result');

            // Build summary of tool execution for follow-up
            const toolSummary = toolCalls.map(tc => {
              const result = toolResults.find(tr => tr.toolCallId === tc.toolCallId);
              // Fix: tool result data is in 'output', not 'result'
              const resultStr = JSON.stringify(result?.output || {});
              return `Tool ${tc.toolName} returned: ${resultStr}`;
            }).join('\n');

            // Create follow-up message asking for explanation
            const followUpMessages = [
              ...transformedMessages,
              {
                role: 'assistant' as const,
                content: `[Tool execution completed: ${toolCalls.length} tool(s) called]`,
              },
              {
                role: 'user' as const,
                content: `The tools have been executed. Here are the results:\n\n${toolSummary}\n\nPlease analyze these results and provide your response to my original question.`,
              },
            ];

            // Make follow-up request without tools (text-only)
            const followUpResult = streamText({
              model: anthropic('claude-sonnet-4-5'),
              system: BDR_SYSTEM_PROMPT,
              messages: followUpMessages,
              maxRetries: 0,
            });

            for await (const textChunk of followUpResult.textStream) {
              controller.enqueue(encoder.encode(textChunk));
            }
          } else if (!hasContent) {
            console.warn('No text generated and no tool calls found');
            const errorMsg = 'I encountered an issue processing your request. Please try again.';
            controller.enqueue(encoder.encode(errorMsg));
          }

          console.log('Text stream completed');
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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
