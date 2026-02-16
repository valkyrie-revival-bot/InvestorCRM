'use client';

/**
 * Dashboard Chat Wrapper
 * Client component that manages chat panel state and renders dashboard header
 * Wraps server-rendered dashboard layout content
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Bot } from 'lucide-react';
import { ChatPanel } from './chat-panel';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardChatWrapperProps {
  children: React.ReactNode;
  userEmail: string;
}

export function DashboardChatWrapper({
  children,
  userEmail,
}: DashboardChatWrapperProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();

  // Helper function to determine if a nav link is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary h-px" />
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-6">
              {/* Logos flanking brand text */}
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/prytaneum.png"
                  alt="Prytaneum Partners"
                  width={100}
                  height={24}
                  className="h-5 w-auto"
                  priority
                />
                <div className="flex items-center gap-2 px-3">
                  <span className="text-lg font-bold tracking-tight text-foreground">Prytaneum</span>
                  <span className="text-xs text-brand-gold font-medium uppercase tracking-wider">CRM</span>
                </div>
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie"
                  width={80}
                  height={24}
                  className="h-5 w-auto"
                  priority
                />
              </div>
              <nav className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                    isActive('/dashboard')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/investors"
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                    isActive('/investors')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Pipeline
                </Link>
                <Link
                  href="/linkedin/import"
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                    isActive('/linkedin')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  LinkedIn
                </Link>
                <Link
                  href="/tasks"
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                    isActive('/tasks')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Tasks
                </Link>
                <Link
                  href="/settings/users"
                  className={cn(
                    "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                    isActive('/settings')
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {/* AI Chat Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`gap-2 ${
                  isChatOpen
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'border-brand-primary/50 hover:bg-brand-primary/10 text-brand-primary'
                }`}
              >
                <Bot className="size-4" />
                AI BDR
              </Button>
              <div className="h-6 w-px bg-border" />
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
