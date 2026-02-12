/**
 * Investor connections tab component
 * Displays warm introduction paths for an investor
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { ConnectionCard } from './connection-card';
import type { IntroPath } from '@/types/linkedin';

interface InvestorConnectionsTabProps {
  connections: IntroPath[];
}

export function InvestorConnectionsTab({ connections }: InvestorConnectionsTabProps) {
  // Empty state
  if (connections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No connections found yet. Import LinkedIn contacts to discover warm
          introduction paths.
        </p>
      </div>
    );
  }

  // Calculate strength distribution
  const strongCount = connections.filter(c => c.strength_label === 'strong').length;
  const mediumCount = connections.filter(c => c.strength_label === 'medium').length;
  const weakCount = connections.filter(c => c.strength_label === 'weak').length;

  return (
    <div className="space-y-4">
      {/* Header with summary stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">
          Warm Introductions ({connections.length})
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-green-400">{strongCount} strong</span>
          <span className="text-yellow-400">{mediumCount} medium</span>
          <span className="text-gray-400">{weakCount} weak</span>
        </div>
      </div>

      {/* Connection cards */}
      <div className="space-y-3">
        {connections.map(connection => (
          <ConnectionCard
            key={connection.linkedin_contact_id}
            introPath={connection}
          />
        ))}
      </div>
    </div>
  );
}
