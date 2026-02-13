'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { InvestorWithContacts } from '@/types/investors';
import type { RealtimePayload, ConnectionStatus } from '@/types/realtime';

interface UseRealtimeInvestorsReturn {
  investors: InvestorWithContacts[];
  connectionStatus: ConnectionStatus;
}

/**
 * Real-time subscription hook for investor list updates
 * Subscribes to postgres_changes on the investors table and maintains local state
 *
 * @param initialInvestors - Server-fetched initial data (from Server Component)
 * @returns investors array and connection status
 */
export function useRealtimeInvestors(
  initialInvestors: InvestorWithContacts[]
): UseRealtimeInvestorsReturn {
  const [investors, setInvestors] = useState<InvestorWithContacts[]>(initialInvestors);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const supabase = createClient();

  // Sync when parent re-fetches (e.g., after filter change)
  useEffect(() => {
    setInvestors(initialInvestors);
  }, [initialInvestors]);

  useEffect(() => {
    console.log('[useRealtimeInvestors] Setting up subscription...');

    const channel = supabase
      .channel('investors-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'investors',
        },
        (payload) => {
          console.log('[useRealtimeInvestors] Received event:', payload.eventType, payload);

          const realtimePayload = payload as unknown as RealtimePayload<InvestorWithContacts>;

          if (realtimePayload.eventType === 'INSERT') {
            // Prepend new investor (contacts/primary_contact not included in subscription)
            const newInvestor: InvestorWithContacts = {
              ...realtimePayload.new,
              contacts: [],
              primary_contact: null,
            };
            setInvestors((current) => [newInvestor, ...current]);
          } else if (realtimePayload.eventType === 'UPDATE') {
            // Handle soft deletes: UPDATE with deleted_at set should remove from list
            if (realtimePayload.new.deleted_at) {
              console.log('[useRealtimeInvestors] Soft delete detected, removing investor');
              setInvestors((current) => current.filter((inv) => inv.id !== realtimePayload.new.id));
            } else {
              // Update existing investor, preserve contacts/primary_contact from local state
              setInvestors((current) =>
                current.map((inv) => {
                  if (inv.id === realtimePayload.new.id) {
                    return {
                      ...realtimePayload.new,
                      contacts: inv.contacts, // Preserve existing contacts
                      primary_contact: inv.primary_contact, // Preserve existing primary contact
                    };
                  }
                  return inv;
                })
              );
            }
          } else if (realtimePayload.eventType === 'DELETE') {
            // Remove investor from list
            setInvestors((current) => current.filter((inv) => inv.id !== realtimePayload.old.id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[useRealtimeInvestors] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeInvestors] Channel error:', err);
          setConnectionStatus('error');
        } else if (status === 'TIMED_OUT') {
          console.error('[useRealtimeInvestors] Subscription timed out');
          setConnectionStatus('error');
        } else if (status === 'CLOSED') {
          console.log('[useRealtimeInvestors] Channel closed');
          setConnectionStatus('closed');
        }
      });

    // Cleanup function
    return () => {
      console.log('[useRealtimeInvestors] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return {
    investors,
    connectionStatus,
  };
}
