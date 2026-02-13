'use client';

/**
 * InvestorDetailRealtime
 * Wraps detail page content with presence tracking
 * Shows which users are currently viewing/editing this investor record
 */

import { usePresence } from '@/lib/hooks/use-presence';
import { PresenceAvatars } from './presence-avatars';

interface InvestorDetailRealtimeProps {
  investorId: string;
  userId: string;
  children: React.ReactNode;
}

export function InvestorDetailRealtime({
  investorId,
  userId,
  children,
}: InvestorDetailRealtimeProps) {
  const { onlineUsers } = usePresence(investorId);

  return (
    <div className="space-y-4">
      {/* Presence avatars - only shows if other users are viewing */}
      <PresenceAvatars users={onlineUsers} currentUserId={userId} />

      {/* Detail page content */}
      {children}
    </div>
  );
}
