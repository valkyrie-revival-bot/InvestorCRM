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

  // Extract text parts from message.parts
  const textParts = message.parts.filter((part: any) => part.type === 'text');
  const textContent = textParts.map((part: any) => part.text).join(' ');

  // Extract tool invocation parts
  const toolParts = message.parts.filter(
    (part: any) => part.type === 'tool-call' || part.type === 'tool-invocation'
  );

  const hasContent = Boolean(textContent);
  const hasToolParts = toolParts.length > 0;

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
          {toolParts.map((toolPart: any, index: number) => {
            // Extract tool information from the part
            const toolName = toolPart.toolName || 'unknown';
            const result = toolPart.result || {};
            const state = toolPart.state || 'result';
            const toolCallId = toolPart.toolCallId;

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
