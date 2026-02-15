'use client';

/**
 * Investor list table with bulk operations
 * Displays pre-filtered investors with sorting, multi-select, and bulk actions
 */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { InvestorWithContacts } from '@/types/investors';
import type { BulkOperationRequest } from '@/types/preferences';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface InvestorListTableWithBulkProps {
  investors: InvestorWithContacts[];
  searchQuery?: string;
  onBulkComplete?: () => void;
}

type SortField = 'est_value' | 'last_action_date' | 'next_action_date' | 'updated_at';
type SortDirection = 'asc' | 'desc';

// Stage badge color mapping
function getStageBadgeColor(stage: string): {
  bg: string;
  text: string;
} {
  const stageUpper = stage.toUpperCase();

  if (stageUpper.includes('NOT YET') || stageUpper.includes('INITIAL CONTACT')) {
    return { bg: 'bg-zinc-500/20', text: 'text-zinc-300' };
  }
  if (
    stageUpper.includes('CONVERSATION') ||
    stageUpper.includes('MATERIALS') ||
    stageUpper.includes('NDA')
  ) {
    return { bg: 'bg-blue-500/20', text: 'text-blue-300' };
  }
  if (stageUpper.includes('DUE DILIGENCE') || stageUpper.includes('LPA') || stageUpper.includes('LEGAL')) {
    return { bg: 'bg-amber-500/20', text: 'text-amber-300' };
  }
  if (stageUpper.includes('WON') || stageUpper.includes('COMMITTED')) {
    return { bg: 'bg-green-500/20', text: 'text-green-300' };
  }
  if (stageUpper.includes('LOST') || stageUpper.includes('PASSED')) {
    return { bg: 'bg-red-500/20', text: 'text-red-300' };
  }
  if (stageUpper.includes('DELAYED')) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-300' };
  }
  return { bg: 'bg-zinc-500/20', text: 'text-zinc-300' };
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPastDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFutureDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays < 0) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays < 7) return `In ${diffInDays} days`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-500/30 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function InvestorListTableWithBulk({
  investors,
  searchQuery = '',
  onBulkComplete,
}: InvestorListTableWithBulkProps) {
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply sorting
  const sortedInvestors = useMemo(() => {
    const sorted = [...investors];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (sortField === 'est_value') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      } else {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return sortDirection === 'desc' ? bDate - aDate : aDate - bDate;
      }
    });
    return sorted;
  }, [investors, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'est_value' ? 'desc' : 'desc');
    }
  };

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedInvestors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedInvestors.map(inv => inv.id)));
    }
  }, [sortedInvestors, selectedIds.size]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Bulk operations
  const executeBulkOperation = async (operation: string, data?: any) => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      const request: BulkOperationRequest = {
        entity_type: 'investors',
        operation: operation as any,
        item_ids: Array.from(selectedIds),
        data,
      };

      const response = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        onBulkComplete?.();
      } else {
        toast.error(result.message || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Failed to execute bulk operation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    await executeBulkOperation('delete');
    setShowDeleteDialog(false);
  };

  const handleBulkExport = () => {
    // Export selected investors as CSV
    const selected = sortedInvestors.filter(inv => selectedIds.has(inv.id));
    const csv = [
      ['Firm Name', 'Stage', 'Relationship Owner', 'Partner/Agent', 'Est. Value', 'Last Action', 'Next Action', 'Stalled'].join(','),
      ...selected.map(inv => [
        `"${inv.firm_name}"`,
        `"${inv.stage}"`,
        `"${inv.relationship_owner}"`,
        `"${inv.partner_source || ''}"`,
        inv.est_value || '',
        inv.last_action_date || '',
        inv.next_action_date || '',
        inv.stalled ? 'Yes' : 'No',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investors-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} investor${selected.length !== 1 ? 's' : ''}`);
  };

  const isAllSelected = sortedInvestors.length > 0 && selectedIds.size === sortedInvestors.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < sortedInvestors.length;

  return (
    <>
      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-3">
          <Badge variant="secondary" className="text-sm">
            {selectedIds.size} selected
          </Badge>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkExport}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected || (isSomeSelected ? 'indeterminate' : false)}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
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
            {sortedInvestors.map((investor) => {
              const colors = getStageBadgeColor(investor.stage);
              const contactName = investor.primary_contact?.name || null;
              const isSelected = selectedIds.has(investor.id);

              return (
                <TableRow key={investor.id} className={isSelected ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(investor.id)}
                      aria-label={`Select ${investor.firm_name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/investors/${investor.id}`}
                      className="hover:underline text-foreground font-medium block"
                    >
                      <div>{highlightMatch(investor.firm_name, searchQuery)}</div>
                      {contactName && (
                        <div className="text-sm text-muted-foreground font-normal">
                          {highlightMatch(contactName, searchQuery)}
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={`${colors.bg} ${colors.text} border-0`}>
                      {investor.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {investor.relationship_owner}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {investor.partner_source || '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                    {formatCurrency(investor.est_value)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatPastDate(investor.last_action_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatFutureDate(investor.next_action_date)}
                  </TableCell>
                  <TableCell className="text-center">
                    {investor.stalled && (
                      <span className="text-orange-400" title="Pipeline stalled">
                        ⚠
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedInvestors.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No investors match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} investor{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the selected investors. They can be restored by an admin.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
