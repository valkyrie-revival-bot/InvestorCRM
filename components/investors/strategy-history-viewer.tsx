'use client';

/**
 * StrategyHistoryViewer - Displays strategy version history
 *
 * Features:
 * - Collapsed by default, shows "View strategy history" link if lastStrategy exists
 * - Expands to show last strategy immediately (from props, no fetch)
 * - "Load full history" button fetches complete history from server
 * - All entries displayed in reverse chronological order
 */

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import { getStrategyHistory } from '@/app/actions/investors';

interface StrategyHistoryEntry {
  id: string;
  strategy_notes: string;
  strategy_date: string | null;
  created_at: string;
}

interface StrategyHistoryViewerProps {
  investorId: string;
  lastStrategy: string | null;
  lastStrategyDate: string | null;
}

export function StrategyHistoryViewer({
  investorId,
  lastStrategy,
  lastStrategyDate,
}: StrategyHistoryViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullHistory, setFullHistory] = useState<StrategyHistoryEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render if no last strategy exists
  if (!lastStrategy) {
    return null;
  }

  // Load full history from server
  const loadFullHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getStrategyHistory(investorId);

      if (result.error) {
        setError(result.error);
      } else {
        setFullHistory(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <History className="h-4 w-4 mr-2" />
          View strategy history
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {/* Last Strategy (from props - no fetch needed) */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-xs text-muted-foreground mb-2">
            {formatDate(lastStrategyDate)}
          </div>
          <div className="text-sm whitespace-pre-wrap">{lastStrategy}</div>
        </div>

        {/* Load Full History Button */}
        {!fullHistory && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadFullHistory}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load full history'
            )}
          </Button>
        )}

        {/* Error State */}
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {/* Full History Entries */}
        {fullHistory && fullHistory.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Full History ({fullHistory.length} {fullHistory.length === 1 ? 'entry' : 'entries'})
            </div>
            {fullHistory.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground mb-2">
                  {formatDate(entry.strategy_date || entry.created_at)}
                </div>
                <div className="text-sm whitespace-pre-wrap">{entry.strategy_notes}</div>
              </div>
            ))}
          </div>
        )}

        {/* No History State */}
        {fullHistory && fullHistory.length === 0 && (
          <div className="text-sm text-muted-foreground italic">
            No additional history found beyond the last strategy shown above.
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
