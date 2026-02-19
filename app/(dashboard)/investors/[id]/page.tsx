/**
 * Investor detail page
 * Server component that fetches investor data and renders detail view
 * Next.js 16: params is a Promise that must be awaited
 */

import { getInvestor, getActivities } from '@/app/actions/investors';
import { getInvestorConnections } from '@/app/actions/linkedin';
import { getDriveLinks } from '@/app/actions/google/drive-actions';
import { getEmailLogs } from '@/app/actions/google/gmail-actions';
import { getCalendarEvents } from '@/app/actions/google/calendar-actions';
import { getMeetings } from '@/app/actions/meetings';
import { hasGoogleTokens, getGoogleAuthUrl } from '@/lib/google/client';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import { InvestorFormSections } from '@/components/investors/investor-form-sections';
import { ContactList } from '@/components/investors/contact-list';
import { DeleteConfirmation } from '@/components/investors/delete-confirmation';
import { InvestorActivityTimeline } from '@/components/investors/investor-activity-timeline';
import { InvestorConnectionsTab } from '@/components/investors/investor-connections-tab';
import { QuickAddActivityModal } from '@/components/investors/quick-add-activity-modal';
import { GoogleWorkspaceSection } from '@/components/investors/google-workspace-section';
import { InvestorDetailRealtime } from '@/components/investors/investor-detail-realtime';
import { NetworkGraphModal } from '@/components/investors/network-graph-modal';
import { MeetingIntelligenceDashboard } from '@/components/meetings/meeting-intelligence-dashboard';
import { InvestorNewsSection } from '@/components/investors/investor-news-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

interface InvestorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestorDetailPage({
  params,
}: InvestorDetailPageProps) {
  // Next.js 16: params is a Promise, must await it
  const { id } = await params;

  // Fetch investor data
  const result = await getInvestor(id);

  // Handle not found
  if (result.error || !result.data) {
    notFound();
  }

  const investor = result.data;

  // Fetch activities for timeline
  const activitiesResult = await getActivities(id);
  const activities = activitiesResult.data || [];

  // Fetch LinkedIn connections
  const connectionsResult = await getInvestorConnections(id);
  const connections = connectionsResult.data || [];

  // Get current user and check Google Workspace connection status
  const user = await getCurrentUser();
  const googleConnected = user ? await hasGoogleTokens(user.id) : false;
  const googleAuthUrl = getGoogleAuthUrl(`/investors/${id}`);

  // Fetch Google Workspace data (only if connected)
  const [driveLinksResult, emailLogsResult, calendarEventsResult] = googleConnected
    ? await Promise.all([getDriveLinks(id), getEmailLogs(id), getCalendarEvents(id)])
    : [{ data: [] }, { data: [] }, { data: [] }];

  // Fetch meetings for this investor
  const meetingsResult = await getMeetings({ investor_id: id });
  const meetings = meetingsResult.data || [];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/investors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {investor.firm_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Investor Details
            </p>
          </div>
        </div>

        {/* Delete button with confirmation */}
        <DeleteConfirmation investorId={investor.id} firmName={investor.firm_name} />
      </div>

      {/* Wrap content with real-time presence tracking */}
      <InvestorDetailRealtime investorId={id} userId={user?.id || ''}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left column: Form sections + Contacts */}
          <div className="space-y-6">
            <InvestorFormSections investor={investor} />

            {/* Contacts Section */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Contacts</h2>
              <ContactList
                contacts={investor.contacts}
                investorId={investor.id}
              />
            </div>
          </div>

          {/* Right column: LinkedIn + Google + Meetings + Activity */}
          <div className="space-y-6">
            {/* LinkedIn Connections */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  LinkedIn Connections
                  {connections.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({connections.length})
                    </span>
                  )}
                </h2>
                {connections.length > 0 && (
                  <NetworkGraphModal
                    investorId={investor.id}
                    investorName={investor.firm_name}
                    connections={connections}
                  />
                )}
              </div>
              <InvestorConnectionsTab connections={connections} />
            </div>

            {/* News & Intelligence */}
            <InvestorNewsSection firmName={investor.firm_name} />

            {/* Google Workspace */}
            <GoogleWorkspaceSection
              investorId={investor.id}
              investorName={investor.firm_name}
              hasGoogleTokens={googleConnected}
              googleAuthUrl={googleAuthUrl}
              driveLinks={('data' in driveLinksResult ? driveLinksResult.data : []) || []}
              emailLogs={('data' in emailLogsResult ? emailLogsResult.data : []) || []}
              calendarEvents={('data' in calendarEventsResult ? calendarEventsResult.data : []) || []}
            />

            {/* Meeting Intelligence */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                Meeting Intelligence
                {meetings.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({meetings.length})
                  </span>
                )}
              </h2>
              <MeetingIntelligenceDashboard investorId={investor.id} />
            </div>

            {/* Activity Timeline */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Activity History</h2>
                <QuickAddActivityModal
                  investorId={investor.id}
                  currentNextAction={investor.next_action}
                  currentNextActionDate={investor.next_action_date}
                />
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <InvestorActivityTimeline activities={activities} />
              )}
            </div>
          </div>
        </div>
      </InvestorDetailRealtime>
    </div>
  );
}
