'use client';

import { useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'Show me stalled investors',
  'Pipeline summary by stage',
  'High value opportunities',
  'What needs attention this week?',
  'Strategy review for recent investors',
  'Top priority deals',
];

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    setInput(message);
    // Trigger submit on next tick to allow input to update
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 0);
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={cn(
          'fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-[420px] flex-col bg-card shadow-lg',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 className="text-lg font-semibold">AI BDR Agent</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hi! I'm your AI BDR assistant. Ask me about your investor pipeline, strategy suggestions, or upcoming actions.
              </p>

              {/* Suggested Prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      disabled={isLoading}
                      className={cn(
                        'rounded-lg border border-border bg-background px-3 py-2 text-sm',
                        'transition-colors hover:bg-muted',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p className="text-xs">{error.message}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => handleSubmit()}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
