'use client';

/**
 * Investor list table component
 * Displays all investors with clickable rows that navigate to detail page
 */

import Link from 'next/link';
import type { Investor } from '@/types/investors';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface InvestorListTableProps {
  investors: Investor[];
}

// Stage badge color mapping
function getStageBadgeColor(stage: string): {
  bg: string;
  text: string;
} {
  const stageUpper = stage.toUpperCase();

  // Early stages (Not Yet Approached, Initial Contact)
  if (stageUpper.includes('NOT YET') || stageUpper.includes('INITIAL CONTACT')) {
    return { bg: 'bg-zinc-500/20', text: 'text-zinc-300' };
  }

  // Active stages (First Conversation, Materials Shared, NDA)
  if (
    stageUpper.includes('CONVERSATION') ||
    stageUpper.includes('MATERIALS') ||
    stageUpper.includes('NDA')
  ) {
    return { bg: 'bg-blue-500/20', text: 'text-blue-300' };
  }

  // Hot stages (Due Diligence, LPA/Legal)
  if (stageUpper.includes('DUE DILIGENCE') || stageUpper.includes('LPA') || stageUpper.includes('LEGAL')) {
    return { bg: 'bg-amber-500/20', text: 'text-amber-300' };
  }

  // Won/Committed
  if (stageUpper.includes('WON') || stageUpper.includes('COMMITTED')) {
    return { bg: 'bg-green-500/20', text: 'text-green-300' };
  }

  // Lost/Passed
  if (stageUpper.includes('LOST') || stageUpper.includes('PASSED')) {
    return { bg: 'bg-red-500/20', text: 'text-red-300' };
  }

  // Delayed
  if (stageUpper.includes('DELAYED')) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-300' };
  }

  // Default
  return { bg: 'bg-zinc-500/20', text: 'text-zinc-300' };
}

// Format currency
function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format date as relative or short date
function formatDate(dateString: string | null): string {
  if (!dateString) return '—';

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // If within last 30 days, show relative
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 30) return `${diffInDays} days ago`;

  // Otherwise show short date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function InvestorListTable({ investors }: InvestorListTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firm Name</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Relationship Owner</TableHead>
            <TableHead className="text-right">Est. Value</TableHead>
            <TableHead>Last Action</TableHead>
            <TableHead className="text-center">Stalled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((investor) => {
            const colors = getStageBadgeColor(investor.stage);
            return (
              <TableRow key={investor.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link
                    href={`/investors/${investor.id}`}
                    className="hover:underline"
                  >
                    {investor.firm_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${colors.bg} ${colors.text} border-0`}
                  >
                    {investor.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {investor.relationship_owner}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(investor.est_value)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(investor.last_action_date)}
                </TableCell>
                <TableCell className="text-center">
                  {investor.stalled && (
                    <span
                      className="text-orange-400"
                      title="Pipeline stalled"
                    >
                      ⚠
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
