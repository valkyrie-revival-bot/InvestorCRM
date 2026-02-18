'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Copy, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './chat-message';
import { toast } from 'sonner';
import { VoiceRecorder } from './voice-recorder';
import { AvatarDisplay } from './avatar-display';

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

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
  parts?: any[];
};

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(480); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      // Min width: 360px, Max width: 800px
      const clampedWidth = Math.max(360, Math.min(800, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const copyChat = async () => {
    const chatText = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'You' : 'Valhros Archon';
        return `${role}:\n${msg.content}\n`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(chatText);
      toast.success('Chat copied to clipboard');
    } catch (err) {
      console.error('Failed to copy chat:', err);
      toast.error('Failed to copy chat');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setAvatarVideoUrl(null);
  };

  const handleVoiceTranscript = (text: string) => {
    // Send transcribed text as message
    sendMessage(text);
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);

      // Call ElevenLabs API
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast.error('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      toast.error('Failed to generate voice');
    }
  };

  const generateAvatarVideo = async (text: string) => {
    // Use ElevenLabs TTS for realistic voice
    try {
      await speakText(text);
    } catch (error) {
      console.error('Speech error:', error);
      toast.error('Failed to speak response');
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message:', content);
      console.log('Current messages:', messages);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      console.log('Got reader:', !!reader);

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      console.log('Added empty assistant message');

      // Read the simple text stream
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();

        chunkCount++;

        if (done) {
          console.log(`Stream done after ${chunkCount} chunks`);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log(`Chunk ${chunkCount}: "${chunk.substring(0, 50)}..."`);

        // Simple text - just append
        assistantMessage.content += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...assistantMessage } : m
          )
        );
      }

      console.log('Stream finished.');
      console.log('Final message length:', assistantMessage.content.length);
      console.log('Final message:', assistantMessage.content);

      // Generate avatar video for the assistant's response
      if (assistantMessage.content && assistantMessage.content.trim().length > 0) {
        generateAvatarVideo(assistantMessage.content);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
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
        ref={panelRef}
        style={{ width: `${panelWidth}px` }}
        className={cn(
          'fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] flex-col bg-card shadow-lg',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Resize Handle */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors',
            'flex items-center justify-center group',
            isResizing && 'bg-primary/30'
          )}
          onMouseDown={handleResizeStart}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="size-4 text-muted-foreground" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 className="text-lg font-semibold">Valhros Archon</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={copyChat}
              disabled={messages.length === 0}
              title="Copy chat"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearChat}
              disabled={messages.length === 0}
              title="Clear chat"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Avatar Display */}
        <div className="border-b border-border bg-card">
          <AvatarDisplay
            videoUrl={avatarVideoUrl}
            isGenerating={isLoading}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                I'm Valhros Archon, your capital orchestration intelligence. I guide investor strategy, enforce mandate alignment, manage pipeline stages, and compound relationship leverage across M&A and fundraising.
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
                <ChatMessage key={message.id} message={message as any} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
          <div className="flex gap-2">
            <VoiceRecorder
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />
            <input
              name="message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type or hold mic to speak..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="inline-flex items-center justify-center shrink-0 rounded-md bg-primary px-3 text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
