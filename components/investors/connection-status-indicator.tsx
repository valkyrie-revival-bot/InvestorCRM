'use client';

/**
 * ConnectionStatusIndicator
 * Displays real-time connection status with color-coded dot and label
 */

import type { ConnectionStatus } from '@/types/realtime';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
}

export function ConnectionStatusIndicator({ status }: ConnectionStatusIndicatorProps) {
  const statusConfig = {
    connected: {
      dot: 'bg-emerald-500',
      text: 'Live',
      label: 'text-emerald-400',
    },
    connecting: {
      dot: 'bg-yellow-500 animate-pulse',
      text: 'Connecting...',
      label: 'text-yellow-400',
    },
    error: {
      dot: 'bg-red-500',
      text: 'Offline',
      label: 'text-red-400',
    },
    closed: {
      dot: 'bg-zinc-500',
      text: 'Disconnected',
      label: 'text-zinc-400',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-xs font-medium', config.label)}>
        {config.text}
      </span>
    </div>
  );
}
