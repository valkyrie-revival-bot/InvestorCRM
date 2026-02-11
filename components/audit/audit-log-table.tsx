'use client';

import { useState } from 'react';
import { AuditLogEntry } from '@/types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AuditLogTableProps {
  entries: AuditLogEntry[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  // Extract unique event types and actions for filters
  const eventTypes = Array.from(new Set(entries.map((e) => e.eventType)));
  const actions = Array.from(new Set(entries.map((e) => e.action)));

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchTerm === '' ||
      entry.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resourceType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEventType =
      eventTypeFilter === 'all' || entry.eventType === eventTypeFilter;

    const matchesAction =
      actionFilter === 'all' || entry.action === actionFilter;

    return matchesSearch && matchesEventType && matchesAction;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filteredEntries.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(timestamp));
  };

  const toggleRowExpansion = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by user, event type, action, or resource..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All Event Types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="all">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-400">
        Showing {paginatedEntries.length} of {filteredEntries.length} entries
        {searchTerm || eventTypeFilter !== 'all' || actionFilter !== 'all'
          ? ` (filtered from ${entries.length} total)`
          : ''}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="h-12 w-12 text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-zinc-400">No audit log entries found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-zinc-900/50">
                  <TableCell className="font-mono text-xs">
                    {formatTimestamp(entry.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.userEmail || (
                      <span className="text-zinc-500">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.action === 'delete' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.resourceType && (
                      <div>
                        <span className="text-zinc-400">
                          {entry.resourceType}
                        </span>
                        {entry.resourceId && (
                          <span className="text-zinc-600 ml-1 font-mono text-xs">
                            #{entry.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {(entry.oldData || entry.newData || entry.metadata) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(entry.id)}
                        className="text-xs"
                      >
                        {expandedRow === entry.id ? 'Hide' : 'Show'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expanded details */}
      {expandedRow !== null && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          {paginatedEntries
            .filter((e) => e.id === expandedRow)
            .map((entry) => (
              <div key={entry.id} className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-100">
                  Entry Details
                </h4>
                {entry.oldData && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Old Data:</p>
                    <pre className="text-xs bg-zinc-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(entry.oldData, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.newData && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">New Data:</p>
                    <pre className="text-xs bg-zinc-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(entry.newData, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.metadata && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Metadata:</p>
                    <pre className="text-xs bg-zinc-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.ipAddress && (
                  <div>
                    <p className="text-xs text-zinc-400">
                      IP Address: {entry.ipAddress}
                    </p>
                  </div>
                )}
                {entry.userAgent && (
                  <div>
                    <p className="text-xs text-zinc-400">
                      User Agent: {entry.userAgent}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
