'use client';

/**
 * Investor list table component
 * Displays all investors with sorting, filtering, and clickable rows
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { InvestorWithContacts } from '@/types/investors';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';

interface InvestorListTableProps {
  investors: InvestorWithContacts[];
}

type SortField = 'est_value' | 'last_action_date' | 'next_action_date' | 'updated_at';
type SortDirection = 'asc' | 'desc';

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
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterPartner, setFilterPartner] = useState<string>('all');

  // Get unique values for filters
  const stages = useMemo(() => {
    const unique = Array.from(new Set(investors.map(inv => inv.stage)));
    return unique.sort();
  }, [investors]);

  const owners = useMemo(() => {
    const unique = Array.from(new Set(investors.map(inv => inv.relationship_owner)));
    return unique.sort();
  }, [investors]);

  const partners = useMemo(() => {
    const unique = Array.from(
      new Set(investors.map(inv => inv.partner_source).filter(Boolean))
    );
    return unique.sort();
  }, [investors]);

  // Apply filters and sorting
  const filteredAndSorted = useMemo(() => {
    let filtered = [...investors];

    // Apply filters
    if (filterStage !== 'all') {
      filtered = filtered.filter(inv => inv.stage === filterStage);
    }
    if (filterOwner !== 'all') {
      filtered = filtered.filter(inv => inv.relationship_owner === filterOwner);
    }
    if (filterPartner !== 'all') {
      filtered = filtered.filter(inv => inv.partner_source === filterPartner);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle nulls (put at end)
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Compare
      if (sortField === 'est_value') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      } else {
        // Date comparison
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return sortDirection === 'desc' ? bDate - aDate : aDate - bDate;
      }
    });

    return filtered;
  }, [investors, sortField, sortDirection, filterStage, filterOwner, filterPartner]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'est_value' ? 'desc' : 'desc');
    }
  };

  const clearFilters = () => {
    setFilterStage('all');
    setFilterOwner('all');
    setFilterPartner('all');
  };

  const hasActiveFilters = filterStage !== 'all' || filterOwner !== 'all' || filterPartner !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(stage => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map(owner => (
              <SelectItem key={owner} value={owner}>{owner}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPartner} onValueChange={setFilterPartner}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by partner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            {partners.map(partner => (
              <SelectItem key={partner} value={partner}>{partner}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredAndSorted.length} of {investors.length} investors
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firm Name / Contact</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Relationship Owner</TableHead>
              <TableHead>Partner / Agent</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('est_value')}
                  className="h-8 -ml-3"
                >
                  Est. Value
                  {sortField === 'est_value' && (
                    sortDirection === 'desc' ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('last_action_date')}
                  className="h-8 -ml-3"
                >
                  Last Action
                  {sortField === 'last_action_date' && (
                    sortDirection === 'desc' ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('next_action_date')}
                  className="h-8 -ml-3"
                >
                  Next Action
                  {sortField === 'next_action_date' && (
                    sortDirection === 'desc' ? <ArrowDown className="ml-1 h-4 w-4" /> : <ArrowUp className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-center">Stalled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((investor) => {
              const colors = getStageBadgeColor(investor.stage);
              const contactName = investor.primary_contact?.name || null;
              return (
                <TableRow key={investor.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/investors/${investor.id}`}
                      className="hover:underline block"
                    >
                      <div>{investor.firm_name}</div>
                      {contactName && (
                        <div className="text-sm text-muted-foreground font-normal">
                          {contactName}
                        </div>
                      )}
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
                  <TableCell className="text-muted-foreground">
                    {investor.partner_source || '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(investor.est_value)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(investor.last_action_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(investor.next_action_date)}
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
            {filteredAndSorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No investors match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
