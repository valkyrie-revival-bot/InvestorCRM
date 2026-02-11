'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SessionExpiryModal() {
  const [showModal, setShowModal] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Track if user was authenticated (first SIGNED_IN or INITIAL_SESSION with valid session)
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
        session
      ) {
        setWasAuthenticated(true);
      }

      // Show modal ONLY when user was authenticated AND now signed out
      // Do NOT show on TOKEN_REFRESHED events (Pitfall 7 from research)
      if (event === 'SIGNED_OUT' && wasAuthenticated) {
        setShowModal(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, wasAuthenticated]);

  const handleSignIn = () => {
    // Store current path for redirect after login
    if (pathname) {
      sessionStorage.setItem('returnPath', pathname);
    }
    router.push('/login');
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            Your session has expired. Please sign in again to continue where you
            left off.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={handleSignIn}>Sign In to Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
