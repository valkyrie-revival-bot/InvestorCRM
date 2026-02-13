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

  // Extract text content from message
  const textContent = typeof message.content === 'string'
    ? message.content
    : Array.isArray(message.content)
      ? message.content.find((part: any) => part.type === 'text')?.text || ''
      : '';

  // Extract tool invocations from message
  const toolInvocations = Array.isArray(message.content)
    ? message.content.filter((part: any) => part.type === 'tool-call' || part.type === 'tool-result')
    : (message as any).toolInvocations || [];

  const hasContent = Boolean(textContent);
  const hasToolInvocations = toolInvocations.length > 0;

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
      {!isUser && !hasContent && !hasToolInvocations && (
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      )}

      {/* Tool Invocations */}
      {hasToolInvocations && (
        <div className="flex w-full max-w-[85%] flex-col gap-2">
          {toolInvocations.map((toolInvocation: any, index: number) => {
            // Handle both tool-call and tool-result types
            const toolName = toolInvocation.toolName || toolInvocation.name || 'unknown';
            const result = toolInvocation.result || toolInvocation.args || {};
            const state = toolInvocation.state || (toolInvocation.type === 'tool-call' ? 'partial-call' : 'result');

            return (
              <ToolResultCard
                key={toolInvocation.toolCallId || `tool-${index}`}
                toolName={toolName}
                result={result}
                state={state}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
