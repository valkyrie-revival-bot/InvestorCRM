'use client';

/**
 * PresenceAvatars
 * Displays avatars for users currently viewing/editing the current record
 * Excludes the current user (don't show yourself)
 */

import type { PresenceState } from '@/types/realtime';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';

interface PresenceAvatarsProps {
  users: PresenceState[];
  currentUserId?: string;
}

/**
 * Generate deterministic color based on user_id hash
 * Returns one of 6 Tailwind color classes
 */
function getUserColor(userId: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get first letter of username for avatar
 */
function getInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

export function PresenceAvatars({ users, currentUserId }: PresenceAvatarsProps) {
  // Filter out current user
  const otherUsers = users.filter((u) => u.user_id !== currentUserId);

  // If no other users, render nothing
  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Currently viewing:</span>
        <div className="flex -space-x-2">
          {otherUsers.map((user) => {
            const bgColor = getUserColor(user.user_id);
            const initial = getInitial(user.username);
            const isEditing = !!user.editing_field;
            const tooltipText = isEditing
              ? `${user.username} (Editing ${user.editing_field})`
              : `${user.username} (Viewing)`;

            return (
              <Tooltip key={user.user_id}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${bgColor} text-white text-sm font-medium border-2 border-background transition-opacity hover:opacity-90 cursor-default`}
                  >
                    {initial}
                    {isEditing && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background flex items-center justify-center">
                        <Pencil className="h-2.5 w-2.5 text-primary" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
