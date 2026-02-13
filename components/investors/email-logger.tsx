'use client';

/**
 * EmailLogger component
 * Search Gmail messages and log selected emails to investor records
 */

import { useState } from 'react';
import { Search, Mail, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  searchEmails,
  logEmailToInvestor,
  type GmailMessage,
} from '@/app/actions/google/gmail-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmailLoggerProps {
  investorId: string;
  investorName: string;
  disabled?: boolean;
}

export function EmailLogger({
  investorId,
  investorName,
  disabled = false,
}: EmailLoggerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GmailMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [loggingMessageId, setLoggingMessageId] = useState<string | null>(null);

  // Pre-fill search with investor name for convenience
  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !searchQuery) {
      setSearchQuery(investorName);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setAuthRequired(false);

    try {
      const result = await searchEmails({
        query: searchQuery,
        maxResults: 20,
      });

      if (result.error === 'google_auth_required') {
        setAuthRequired(true);
        setSearchResults([]);
      } else if (result.error) {
        toast.error(result.error);
        setSearchResults([]);
      } else {
        setSearchResults(result.data || []);
        if (result.data?.length === 0) {
          toast.info('No emails found');
        }
      }
    } catch (error) {
      toast.error('Failed to search emails');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogEmail = async (message: GmailMessage) => {
    setLoggingMessageId(message.messageId);

    try {
      const result = await logEmailToInvestor({
        investorId,
        messageId: message.messageId,
        threadId: message.threadId || undefined,
        from: message.from,
        to: message.to,
        subject: message.subject,
        sentDate: message.date,
        snippet: message.snippet,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Email logged successfully');
        // Remove logged email from results
        setSearchResults((prev) =>
          prev.filter((m) => m.messageId !== message.messageId)
        );
      }
    } catch (error) {
      toast.error('Failed to log email');
    } finally {
      setLoggingMessageId(null);
    }
  };

  const formatEmailDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Extract email address from "Name <email@domain.com>" format
  const extractEmail = (emailString: string): string => {
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  };

  const triggerButton = (
    <Button variant="outline" size="sm" disabled={disabled}>
      <Mail className="h-4 w-4 mr-2" />
      Log Email
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {disabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
              <TooltipContent>
                <p>Google account not connected</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          triggerButton
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Log Email from Gmail</DialogTitle>
        </DialogHeader>

        {/* Search Section */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Search Gmail</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              placeholder="Search Gmail (e.g., from:investor@firm.com)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              autoFocus
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Use Gmail operators like from:, to:, subject:, after:2024/01/01
          </p>
        </div>

        {/* Auth Required Message */}
        {authRequired && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                Google account not connected
              </p>
              <p className="text-xs text-muted-foreground">
                Connect your Google account to search and log emails
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Navigate to settings or trigger OAuth flow
                  window.location.href = '/settings';
                }}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Connect Google Account
              </Button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2">
            <Label className="text-xs text-muted-foreground">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </Label>
            <div className="space-y-2">
              {searchResults.map((message) => (
                <div
                  key={message.messageId}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm truncate">
                        {message.subject || '(No Subject)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From: {truncateText(extractEmail(message.from), 40)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatEmailDate(message.date)}
                      </p>
                      {message.snippet && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {truncateText(message.snippet, 150)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLogEmail(message)}
                      disabled={loggingMessageId === message.messageId}
                      className="shrink-0"
                    >
                      {loggingMessageId === message.messageId ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Logging
                        </>
                      ) : (
                        'Log'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
