'use client';

/**
 * Memoized kanban card component
 * Displays investor summary in kanban board columns
 */

import React from 'react';
import Link from 'next/link';
import type { InvestorWithContacts } from '@/types/investors';
import { computeIsStalled } from '@/lib/stage-definitions';
import { Badge } from '@/components/ui/badge';

interface KanbanCardProps {
  investor: InvestorWithContacts;
}

// Format currency helper
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function KanbanCardComponent({ investor }: KanbanCardProps) {
  // Compute stalled status dynamically
  const isStalled = computeIsStalled(investor.last_action_date, investor.stage as any);

  // Calculate days in stage if stage_entry_date exists
  let daysInStage: number | null = null;
  if (investor.stage_entry_date) {
    const entryDate = new Date(investor.stage_entry_date);
    const now = new Date();
    daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <Link
      href={`/investors/${investor.id}`}
      className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all"
    >
      {/* Firm name */}
      <div className="font-semibold text-sm truncate mb-1">
        {investor.firm_name}
      </div>

      {/* Primary contact name */}
      {investor.primary_contact?.name && (
        <div className="text-sm text-muted-foreground">
          {investor.primary_contact.name}
        </div>
      )}

      {/* Days in stage */}
      {daysInStage !== null && (
        <div className={`text-xs mt-1 ${isStalled ? 'text-orange-400' : 'text-muted-foreground'}`}>
          {daysInStage}d in stage
        </div>
      )}

      {/* Bottom row: value, stalled badge, next action */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {/* Estimated value */}
        {investor.est_value != null && (
          <div className="text-xs font-medium">
            {formatCurrency(investor.est_value)}
          </div>
        )}

        {/* Stalled badge - computed dynamically */}
        {isStalled && (
          <Badge variant="outline" className="border-orange-500/50 bg-orange-500/10 text-orange-300">
            Stalled
          </Badge>
        )}

        {/* Next action date */}
        {investor.next_action_date && (
          <div className="text-xs text-muted-foreground ml-auto">
            Next: {formatDate(investor.next_action_date)}
          </div>
        )}
      </div>
    </Link>
  );
}

// Custom comparison function - only re-render if key fields changed
const areEqual = (prevProps: KanbanCardProps, nextProps: KanbanCardProps) => {
  const prev = prevProps.investor;
  const next = nextProps.investor;

  return (
    prev.id === next.id &&
    prev.firm_name === next.firm_name &&
    prev.est_value === next.est_value &&
    prev.stage === next.stage &&
    prev.stage_entry_date === next.stage_entry_date &&
    prev.last_action_date === next.last_action_date &&
    prev.next_action_date === next.next_action_date &&
    prev.primary_contact?.name === next.primary_contact?.name
  );
};

export const KanbanCard = React.memo(KanbanCardComponent, areEqual);
