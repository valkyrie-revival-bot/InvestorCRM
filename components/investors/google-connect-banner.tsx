'use client';

/**
 * GoogleConnectBanner component
 * Prompts user to connect their Google account to enable Workspace integrations
 */

import { Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleConnectBannerProps {
  authUrl: string;
}

export function GoogleConnectBanner({ authUrl }: GoogleConnectBannerProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-4 flex items-center gap-3 mb-4">
      <Cloud className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm">
          Connect your Google account to link documents, log emails, and schedule meetings
        </p>
      </div>
      <Button asChild size="sm" variant="default">
        <a href={authUrl}>Connect Google Account</a>
      </Button>
    </div>
  );
}
