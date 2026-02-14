'use client';

/**
 * MeetingIntelligenceDashboard component
 * Lists all meetings with filtering and quick actions
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Plus, Loader2, Search, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { getMeetings, getMeetingStats } from '@/app/actions/meetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MeetingIntelligenceCard } from './meeting-intelligence-card';
import { UploadRecordingModal } from './upload-recording-modal';
import type { MeetingWithDetails, MeetingStats } from '@/types/meetings';

// ============================================================================
// TYPES
// ============================================================================

interface MeetingIntelligenceDashboardProps {
  investorId?: string; // If provided, show only meetings for this investor
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MeetingIntelligenceDashboard({
  investorId,
}: MeetingIntelligenceDashboardProps) {
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load meetings
  useEffect(() => {
    loadMeetings();
    loadStats();
  }, [investorId, statusFilter]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const result = await getMeetings({
        investor_id: investorId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setMeetings(result.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getMeetingStats();
      if (result.error) {
        console.error('Failed to load stats:', result.error);
      } else {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Filter meetings by search query
  const filteredMeetings = meetings.filter((meeting) => {
    const query = searchQuery.toLowerCase();
    return (
      meeting.meeting_title.toLowerCase().includes(query) ||
      meeting.investor?.firm_name?.toLowerCase().includes(query) ||
      meeting.transcript?.summary?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && !investorId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.this_month} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Analyzed and processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting recording upload
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_duration_minutes || '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                Minutes per meeting
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">No meetings found</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Schedule a meeting to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="space-y-2">
              <div className="flex items-center justify-between">
                {!investorId && meeting.investor && (
                  <div>
                    <p className="text-sm font-medium">
                      {meeting.investor.firm_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {meeting.investor.stage}
                    </Badge>
                  </div>
                )}
                {meeting.status === 'pending' && (
                  <UploadRecordingModal
                    meetingId={meeting.id}
                    meetingTitle={meeting.meeting_title}
                  />
                )}
              </div>
              <MeetingIntelligenceCard meeting={meeting} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
