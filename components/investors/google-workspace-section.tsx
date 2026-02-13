'use client';

/**
 * GoogleWorkspaceSection component
 * Tabbed interface for Google Workspace integrations: Drive, Gmail, Calendar
 */

import { useState } from 'react';
import { FileText, Mail, Calendar, ExternalLink } from 'lucide-react';
import { DriveLink, EmailLog, CalendarEvent } from '@/types/google';
import { GoogleConnectBanner } from './google-connect-banner';
import { DriveFilePicker } from './drive-file-picker';
import { LinkedDocuments } from './linked-documents';
import { EmailLogger } from './email-logger';
import { MeetingScheduler } from './meeting-scheduler';

interface GoogleWorkspaceSectionProps {
  investorId: string;
  investorName: string;
  hasGoogleTokens: boolean;
  googleAuthUrl: string;
  driveLinks: DriveLink[];
  emailLogs: EmailLog[];
  calendarEvents: CalendarEvent[];
}

type TabId = 'documents' | 'emails' | 'meetings';

export function GoogleWorkspaceSection({
  investorId,
  investorName,
  hasGoogleTokens,
  googleAuthUrl,
  driveLinks,
  emailLogs,
  calendarEvents,
}: GoogleWorkspaceSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('documents');

  /**
   * Format timestamp as relative time
   */
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Format date range for calendar events
   */
  const formatDateRange = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${dateStr} · ${startTimeStr} - ${endTimeStr}`;
  };

  /**
   * Extract email from "Name <email@domain.com>" format
   */
  const extractEmail = (emailString: string): string => {
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  };

  /**
   * Truncate text to max length
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  /**
   * Check if meeting is in the past
   */
  const isPastMeeting = (startTime: string): boolean => {
    return new Date(startTime) < new Date();
  };

  const tabs = [
    { id: 'documents' as TabId, label: 'Documents', icon: FileText, count: driveLinks.length },
    { id: 'emails' as TabId, label: 'Emails', icon: Mail, count: emailLogs.length },
    { id: 'meetings' as TabId, label: 'Meetings', icon: Calendar, count: calendarEvents.length },
  ];

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* Section Header */}
      <h2 className="text-lg font-semibold mb-4">Google Workspace</h2>

      {/* Connection Banner */}
      {!hasGoogleTokens && (
        <GoogleConnectBanner authUrl={googleAuthUrl} />
      )}

      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Link Google Drive documents to this investor
              </p>
              <DriveFilePicker
                investorId={investorId}
                disabled={!hasGoogleTokens}
              />
            </div>
            <LinkedDocuments links={driveLinks} investorId={investorId} />
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Search and log Gmail emails related to this investor
              </p>
              <EmailLogger
                investorId={investorId}
                investorName={investorName}
                disabled={!hasGoogleTokens}
              />
            </div>

            {/* Email List */}
            {emailLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No emails logged yet
              </div>
            ) : (
              <div className="space-y-2">
                {emailLogs.map((email) => (
                  <div
                    key={email.id}
                    className="flex flex-col gap-1 rounded-lg border bg-card/50 p-3 hover:bg-card transition-colors"
                  >
                    <p className="font-semibold text-sm">
                      {email.subject || '(No Subject)'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From: {truncateText(extractEmail(email.from_address), 40)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(email.sent_date)}
                    </p>
                    {email.snippet && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {truncateText(email.snippet, 100)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Schedule Google Calendar meetings with this investor
              </p>
              <MeetingScheduler
                investorId={investorId}
                investorName={investorName}
                disabled={!hasGoogleTokens}
              />
            </div>

            {/* Meetings List */}
            {calendarEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No meetings scheduled yet
              </div>
            ) : (
              <div className="space-y-2">
                {calendarEvents.map((event) => {
                  const isPast = isPastMeeting(event.start_time);

                  return (
                    <div
                      key={event.id}
                      className={`flex flex-col gap-1 rounded-lg border bg-card/50 p-3 hover:bg-card transition-colors ${
                        isPast ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm flex-1">
                          {event.summary}
                        </p>
                        {event.event_url && (
                          <a
                            href={event.event_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(event.start_time, event.end_time)}
                      </p>
                      {event.attendees && event.attendees.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
