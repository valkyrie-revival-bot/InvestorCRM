/**
 * Meetings page
 * View all meetings across all investors with AI-extracted insights
 */

import { MeetingIntelligenceDashboard } from '@/components/meetings/meeting-intelligence-dashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function MeetingsPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
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
              Meeting Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered insights from investor meetings
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Dashboard */}
      <MeetingIntelligenceDashboard />
    </div>
  );
}
