'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { PresenceState } from '@/types/realtime';

interface UsePresenceReturn {
  onlineUsers: PresenceState[];
  updatePresence: (update: {
    viewing_record_id?: string | null;
    editing_field?: string | null;
  }) => Promise<void>;
}

/**
 * Presence tracking hook for collaborative awareness
 * Tracks which users are viewing/editing which investor records
 *
 * @param recordId - Optional investor ID to filter presence to (shows only users viewing this record)
 * @returns onlineUsers array and updatePresence function
 */
export function usePresence(recordId?: string): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      console.log('[usePresence] No authenticated user, skipping presence tracking');
      return;
    }

    console.log('[usePresence] Setting up presence channel for recordId:', recordId);

    const channel = supabase.channel('crm-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        console.log('[usePresence] Presence synced:', presenceState);

        // Flatten presence state values (each key can have multiple states)
        // presenceState is { [key: string]: Array<PresenceState & { presence_ref: string }> }
        const allUsers = Object.values(presenceState)
          .flat()
          .map((state) => {
            // Extract our PresenceState fields from the Supabase presence object
            const { user_id, username, viewing_record_id, editing_field, online_at } = state as any;
            return { user_id, username, viewing_record_id, editing_field, online_at } as PresenceState;
          })
          .filter((state): state is PresenceState => {
            // Ensure we have required fields
            return !!state.user_id && !!state.username;
          });

        // Filter to only users viewing the current recordId (if provided)
        const filteredUsers = recordId
          ? allUsers.filter((u) => u.viewing_record_id === recordId)
          : allUsers;

        setOnlineUsers(filteredUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[usePresence] User(s) joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[usePresence] User(s) left:', leftPresences);
      })
      .subscribe(async (status) => {
        console.log('[usePresence] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          // Track initial presence
          const username = user.email?.split('@')[0] || 'Unknown';
          await channel.track({
            user_id: user.id,
            username,
            viewing_record_id: recordId || null,
            editing_field: null,
            online_at: new Date().toISOString(),
          });
          console.log('[usePresence] Initial presence tracked for user:', username);
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('[usePresence] Cleaning up presence channel');
      supabase.removeChannel(channel);
    };
  }, [user, recordId, supabase]);

  /**
   * Update presence state (e.g., when user starts/stops editing a field)
   */
  const updatePresence = async (update: {
    viewing_record_id?: string | null;
    editing_field?: string | null;
  }) => {
    if (!user) {
      console.warn('[usePresence] Cannot update presence - no authenticated user');
      return;
    }

    const channel = supabase.getChannels().find((ch) => ch.topic === 'crm-presence');
    if (!channel) {
      console.warn('[usePresence] Presence channel not found');
      return;
    }

    const username = user.email?.split('@')[0] || 'Unknown';
    await channel.track({
      user_id: user.id,
      username,
      viewing_record_id: update.viewing_record_id ?? recordId ?? null,
      editing_field: update.editing_field ?? null,
      online_at: new Date().toISOString(),
    });

    console.log('[usePresence] Presence updated:', update);
  };

  return {
    onlineUsers,
    updatePresence,
  };
}
