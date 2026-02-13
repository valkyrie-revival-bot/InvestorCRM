'use client';

/**
 * RealtimeInvestorWrapper
 * Client wrapper that connects real-time hooks to pipeline views
 * Wraps Server Component data with real-time subscription
 */

import { useRealtimeInvestors } from '@/lib/hooks/use-realtime-investors';
import { PipelineViewSwitcher } from './pipeline-view-switcher';
import { ConnectionStatusIndicator } from './connection-status-indicator';
import type { InvestorWithContacts } from '@/types/investors';

interface RealtimeInvestorWrapperProps {
  initialInvestors: InvestorWithContacts[];
}

export function RealtimeInvestorWrapper({ initialInvestors }: RealtimeInvestorWrapperProps) {
  const { investors, connectionStatus } = useRealtimeInvestors(initialInvestors);

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex justify-end">
        <ConnectionStatusIndicator status={connectionStatus} />
      </div>

      {/* Pipeline view with real-time data */}
      <PipelineViewSwitcher investors={investors} />
    </div>
  );
}
