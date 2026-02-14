'use client';

import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { ToolResultCard } from './tool-result-card';
import { Loader2 } from 'lucide-react';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // AI SDK format: content is a string for user/assistant messages
  // Tool invocations are in toolInvocations array
  const messageAny = message as any;
  const textContent = typeof messageAny.content === 'string' ? messageAny.content : '';
  const toolInvocations = messageAny.toolInvocations || [];

  const hasContent = Boolean(textContent);
  const hasToolParts = toolInvocations.length > 0;

  return (
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      {/* Message Label */}
      <div className="text-xs text-muted-foreground">
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Message Content */}
      {hasContent && (
        <div
          className={cn(
            'max-w-[85%] rounded-lg p-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="whitespace-pre-wrap">{textContent}</div>
        </div>
      )}

      {/* Loading state for assistant messages with no content */}
      {!isUser && !hasContent && !hasToolParts && (
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      )}

      {/* Tool Invocations */}
      {hasToolParts && (
        <div className="flex w-full max-w-[85%] flex-col gap-2">
          {toolInvocations.map((invocation: any, index: number) => {
            // Extract tool information from the invocation
            const toolName = invocation.toolName || 'unknown';
            const result = invocation.result || {};
            const state = invocation.state || 'result';
            const toolCallId = invocation.toolCallId;

            return (
              <ToolResultCard
                key={toolCallId || `tool-${index}`}
                toolName={toolName}
                result={result}
                state={state}
                toolCallId={toolCallId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
