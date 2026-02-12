'use client';

/**
 * Pipeline view switcher component
 * Provides tab navigation between Table and Board views with shared search and filtering
 */

import { useState, useMemo, useTransition } from 'react';
import type { InvestorWithContacts } from '@/types/investors';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { InvestorListTable } from './investor-list-table';
import { InvestorKanbanBoard } from './investor-kanban-board';
import { Table2, KanbanSquare, Search, X, Loader2 } from 'lucide-react';

interface PipelineViewSwitcherProps {
  investors: InvestorWithContacts[];
}

// Format currency for summary
function formatCurrency(value: number): string {
  if (value === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value);
}

export function PipelineViewSwitcher({ investors }: PipelineViewSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterAllocatorType, setFilterAllocatorType] = useState('all');
  const [filterConviction, setFilterConviction] = useState('all');
  const [filterStalled, setFilterStalled] = useState('all');
  const [isPending, startTransition] = useTransition();

  // Get unique filter values
  const stages = useMemo(() => {
    const unique = Array.from(new Set(investors.map(inv => inv.stage).filter(Boolean)));
    return unique.sort();
  }, [investors]);

  const allocatorTypes = useMemo(() => {
    const unique = Array.from(
      new Set(investors.map(inv => inv.allocator_type).filter((t): t is string => Boolean(t)))
    );
    return unique.sort();
  }, [investors]);

  const convictions = useMemo(() => {
    const unique = Array.from(
      new Set(investors.map(inv => inv.internal_conviction).filter((c): c is string => Boolean(c)))
    );
    return unique.sort();
  }, [investors]);

  // Filter investors based on search and filters
  const filteredInvestors = useMemo(() => {
    let filtered = [...investors];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(investor => {
        // Search across firm_name, primary_contact name/email, strategy notes, key objections
        const firmMatch = investor.firm_name?.toLowerCase().includes(query);
        const contactNameMatch = investor.primary_contact?.name?.toLowerCase().includes(query);
        const contactEmailMatch = investor.primary_contact?.email?.toLowerCase().includes(query);
        const strategyMatch = investor.current_strategy_notes?.toLowerCase().includes(query);
        const objectionMatch = investor.key_objection_risk?.toLowerCase().includes(query);

        return firmMatch || contactNameMatch || contactEmailMatch || strategyMatch || objectionMatch;
      });
    }

    // Apply stage filter
    if (filterStage !== 'all') {
      filtered = filtered.filter(inv => inv.stage === filterStage);
    }

    // Apply allocator type filter
    if (filterAllocatorType !== 'all') {
      filtered = filtered.filter(inv => inv.allocator_type === filterAllocatorType);
    }

    // Apply conviction filter
    if (filterConviction !== 'all') {
      filtered = filtered.filter(inv => inv.internal_conviction === filterConviction);
    }

    // Apply stalled filter
    if (filterStalled === 'yes') {
      filtered = filtered.filter(inv => inv.stalled === true);
    } else if (filterStalled === 'no') {
      filtered = filtered.filter(inv => inv.stalled === false);
    }

    return filtered;
  }, [investors, searchQuery, filterStage, filterAllocatorType, filterConviction, filterStalled]);

  // Calculate total value of filtered investors
  const totalValue = useMemo(() => {
    return filteredInvestors.reduce((sum, inv) => sum + (inv.est_value || 0), 0);
  }, [filteredInvestors]);

  // Check if any filters are active
  const hasActiveFilters =
    filterStage !== 'all' ||
    filterAllocatorType !== 'all' ||
    filterConviction !== 'all' ||
    filterStalled !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStage('all');
    setFilterAllocatorType('all');
    setFilterConviction('all');
    setFilterStalled('all');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Use transition for non-blocking search
    startTransition(() => {
      // Filtering happens automatically via useMemo
    });
  };

  return (
    <Tabs defaultValue="table" className="space-y-4">
      {/* Tab navigation and search */}
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="table">
            <Table2 className="h-4 w-4 mr-2" />
            Table
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <KanbanSquare className="h-4 w-4 mr-2" />
            Board
          </TabsTrigger>
        </TabsList>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search firms, contacts, notes..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      {/* Filters and summary */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(stage => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterAllocatorType} onValueChange={setFilterAllocatorType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {allocatorTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterConviction} onValueChange={setFilterConviction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Convictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Convictions</SelectItem>
            {convictions.map(conviction => (
              <SelectItem key={conviction} value={conviction}>
                {conviction}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStalled} onValueChange={setFilterStalled}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stalled Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Stalled</SelectItem>
            <SelectItem value="no">Not Stalled</SelectItem>
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

        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="text-muted-foreground">
            {filteredInvestors.length} of {investors.length} investors
          </div>
          <div className="font-semibold text-foreground">
            Total: {formatCurrency(totalValue)}
          </div>
        </div>
      </div>

      {/* Tab contents */}
      <TabsContent value="table">
        <InvestorListTable investors={filteredInvestors} searchQuery={searchQuery} />
      </TabsContent>

      <TabsContent value="kanban" className="mt-0">
        <InvestorKanbanBoard investors={filteredInvestors} />
      </TabsContent>
    </Tabs>
  );
}
