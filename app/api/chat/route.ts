/**
 * Chat API endpoint for AI BDR agent
 * Direct Anthropic API integration with agentic tool loop
 *
 * Stream protocol:
 *   - Plain text bytes → streamed directly to client (text content)
 *   - TOOL_EVENT:{json}\n → tool call/result events parsed by chat panel
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { BDR_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { validateUserInput } from '@/lib/ai/security';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import { allTools, confirmationRequiredTools } from '@/lib/ai/tools';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Build Anthropic tool specs from the registered tool registry
// Each tool exposes .description and .inputSchema (Zod schema).
// We convert the Zod schema to JSON Schema for the Anthropic API.
// ---------------------------------------------------------------------------
function buildAnthropicTools() {
  return Object.entries(allTools).map(([name, toolDef]) => {
    // Access the Zod schema — stored as inputSchema (Vercel AI SDK convention used in this project)
    const zodSchema = (toolDef as any).inputSchema ?? (toolDef as any).parameters;
    const jsonSchema = zodSchema ? z.toJSONSchema(zodSchema) : { type: 'object', properties: {} };

    return {
      name,
      description: (toolDef as any).description ?? '',
      input_schema: jsonSchema,
    };
  });
}

const anthropicTools = buildAnthropicTools();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeAnthropicRequestBody(messages: any[], includeTools = true) {
  return JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: BDR_SYSTEM_PROMPT,
    messages,
    ...(includeTools ? { tools: anthropicTools } : {}),
    stream: true,
  });
}

function getAnthropicHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request: messages array required' }, { status: 400 });
    }

    // Authenticate
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Transform and validate messages
    const transformedMessages = messages
      .map((msg: any) => ({
        role: msg.role,
        content:
          msg.content || (msg.parts?.find((p: any) => p.type === 'text')?.text ?? ''),
      }))
      .filter((msg: any) => msg.content && msg.content.trim().length > 0);

    if (transformedMessages.length === 0) {
      return Response.json({ error: 'No valid messages provided' }, { status: 400 });
    }

    const latestMessage = transformedMessages[transformedMessages.length - 1];
    if (latestMessage?.role === 'user' && latestMessage.content) {
      const validation = validateUserInput(latestMessage.content);
      if (!validation.valid) {
        return Response.json({ error: `Invalid input: ${validation.reason}` }, { status: 400 });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim().replace(/\s+/g, '');
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // First Anthropic call
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(apiKey),
      body: makeAnthropicRequestBody(transformedMessages),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
      } catch {}
      return Response.json(
        { error: `Anthropic API Error: ${errorMessage}` },
        { status: anthropicResponse.status }
      );
    }

    const reader = anthropicResponse.body?.getReader();
    if (!reader) throw new Error('No response body from Anthropic');

    const encoder = new TextEncoder();

    // -----------------------------------------------------------------------
    // Streaming ReadableStream with agentic loop
    // -----------------------------------------------------------------------
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();

        // State for current Anthropic response
        let currentTextContent = '';
        const assistantContent: any[] = [];
        const pendingToolResults: any[] = [];

        // State for the current tool_use block being streamed
        let currentToolId = '';
        let currentToolName = '';
        let currentToolInputBuffer = '';
        let inToolUseBlock = false;

        // Whether any tool returned confirmation_required (stops second call)
        let hasConfirmationRequired = false;

        try {
          // ------------------------------------------------------------------
          // Parse and process first Anthropic SSE stream
          // ------------------------------------------------------------------
          let sseBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() ?? ''; // keep incomplete last line

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              let parsed: any;
              try {
                parsed = JSON.parse(data);
              } catch {
                continue;
              }

              switch (parsed.type) {
                case 'content_block_start': {
                  const block = parsed.content_block;
                  if (block?.type === 'text') {
                    inToolUseBlock = false;
                  } else if (block?.type === 'tool_use') {
                    inToolUseBlock = true;
                    currentToolId = block.id;
                    currentToolName = block.name;
                    currentToolInputBuffer = '';
                    // Notify client that a tool call is starting
                    controller.enqueue(
                      encoder.encode(
                        'TOOL_EVENT:' +
                          JSON.stringify({ type: 'call', toolName: currentToolName, toolCallId: currentToolId }) +
                          '\n'
                      )
                    );
                  }
                  break;
                }

                case 'content_block_delta': {
                  const delta = parsed.delta;
                  if (delta?.type === 'text_delta' && delta.text) {
                    currentTextContent += delta.text;
                    controller.enqueue(encoder.encode(delta.text));
                  } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
                    currentToolInputBuffer += delta.partial_json;
                  }
                  break;
                }

                case 'content_block_stop': {
                  if (inToolUseBlock && currentToolName) {
                    // Parse accumulated tool input and execute
                    let toolInput: any = {};
                    try {
                      toolInput = JSON.parse(currentToolInputBuffer || '{}');
                    } catch {
                      toolInput = {};
                    }

                    const toolDef = allTools[currentToolName as keyof typeof allTools];
                    let toolResult: any;

                    if (toolDef) {
                      try {
                        toolResult = await (toolDef as any).execute(toolInput, {});
                      } catch (execErr) {
                        toolResult = {
                          status: 'error',
                          message: `Tool execution error: ${execErr instanceof Error ? execErr.message : 'Unknown error'}`,
                        };
                      }
                    } else {
                      toolResult = { status: 'error', message: `Unknown tool: ${currentToolName}` };
                    }

                    // Send result to client
                    controller.enqueue(
                      encoder.encode(
                        'TOOL_EVENT:' +
                          JSON.stringify({
                            type: 'result',
                            toolName: currentToolName,
                            toolCallId: currentToolId,
                            result: toolResult,
                          }) +
                          '\n'
                      )
                    );

                    // Track confirmation-required status
                    if (toolResult?.status === 'confirmation_required') {
                      hasConfirmationRequired = true;
                    }

                    // Accumulate for potential second Anthropic call
                    assistantContent.push({
                      type: 'tool_use',
                      id: currentToolId,
                      name: currentToolName,
                      input: toolInput,
                    });

                    pendingToolResults.push({
                      type: 'tool_result',
                      tool_use_id: currentToolId,
                      content: JSON.stringify(toolResult),
                    });

                    inToolUseBlock = false;
                    currentToolName = '';
                    currentToolId = '';
                    currentToolInputBuffer = '';
                  } else if (currentTextContent && !inToolUseBlock) {
                    // Flush text block into assistant content
                    assistantContent.push({ type: 'text', text: currentTextContent });
                    currentTextContent = '';
                  }
                  break;
                }
              }
            }
          }

          // ------------------------------------------------------------------
          // Second Anthropic call for direct-execution tools
          // Only when tools ran AND none required confirmation
          // ------------------------------------------------------------------
          const hasToolResults = pendingToolResults.length > 0;
          const needsSecondCall = hasToolResults && !hasConfirmationRequired;

          if (needsSecondCall) {
            // Build assistant message content (text + tool_use blocks)
            const assistantMsgContent: any[] = [];
            if (currentTextContent) {
              assistantMsgContent.push({ type: 'text', text: currentTextContent });
            }
            assistantMsgContent.push(...assistantContent.filter((b) => b.type === 'tool_use'));

            const secondMessages = [
              ...transformedMessages,
              { role: 'assistant', content: assistantMsgContent },
              { role: 'user', content: pendingToolResults },
            ];

            const secondResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: getAnthropicHeaders(apiKey),
              body: makeAnthropicRequestBody(secondMessages),
            });

            if (secondResponse.ok) {
              const secondReader = secondResponse.body?.getReader();
              if (secondReader) {
                let secondSseBuffer = '';
                const secondDecoder = new TextDecoder();

                while (true) {
                  const { done, value } = await secondReader.read();
                  if (done) break;

                  secondSseBuffer += secondDecoder.decode(value, { stream: true });
                  const lines = secondSseBuffer.split('\n');
                  secondSseBuffer = lines.pop() ?? '';

                  for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                      const parsed = JSON.parse(data);
                      if (
                        parsed.type === 'content_block_delta' &&
                        parsed.delta?.type === 'text_delta' &&
                        parsed.delta.text
                      ) {
                        controller.enqueue(encoder.encode(parsed.delta.text));
                      }
                    } catch {}
                  }
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          const errMsg = `Stream error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          controller.enqueue(encoder.encode(errMsg));
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: `Server Error: ${errorMessage}` }, { status: 500 });
  }
}
