'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/lib/supabase/client';
import { AppRole, JWTPayload } from '@/types/auth';

interface UseRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Extract role from current session
    const extractRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const payload = jwtDecode<JWTPayload>(session.access_token);
          // Default to 'member' if no role claim found
          setRole(payload.user_role ?? 'member');
        } catch (error) {
          console.error('Failed to decode JWT:', error);
          setRole('member');
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    };

    extractRole();

    // Subscribe to auth state changes to update role when token refreshes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.access_token) {
        try {
          const payload = jwtDecode<JWTPayload>(currentSession.access_token);
          setRole(payload.user_role ?? 'member');
        } catch (error) {
          console.error('Failed to decode JWT:', error);
          setRole('member');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
  };
}
