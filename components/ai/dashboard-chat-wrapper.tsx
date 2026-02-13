'use client';

/**
 * Dashboard Chat Wrapper
 * Client component that manages chat panel state and renders dashboard header
 * Wraps server-rendered dashboard layout content
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Bot } from 'lucide-react';
import { ChatPanel } from './chat-panel';
import Image from 'next/image';

interface DashboardChatWrapperProps {
  children: React.ReactNode;
  userEmail: string;
}

export function DashboardChatWrapper({
  children,
  userEmail,
}: DashboardChatWrapperProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <nav className="flex items-center gap-6">
              <a
                href="/investors"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pipeline
              </a>
              <a
                href="/linkedin/import"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="/settings/users"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </a>
            </nav>
            <div className="flex items-center gap-4">
              {/* AI Chat Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="gap-2"
              >
                <Bot className="size-4" />
                AI BDR
              </Button>

              <div className="flex items-center gap-3">
                <Image
                  src="/logos/prytaneum.png"
                  alt="Prytaneum Partners"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
                <div className="h-6 w-px bg-border" />
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
              <div className="h-6 w-px bg-border ml-2" />
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="container mx-auto py-6 px-4">{children}</main>
      </div>

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
