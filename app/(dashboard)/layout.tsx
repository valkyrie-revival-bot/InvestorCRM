import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SessionExpiryModal } from '@/components/auth/session-expiry-modal';
import { DashboardChatWrapper } from '@/components/ai/dashboard-chat-wrapper';
import { getAuthenticatedUser } from '@/lib/auth/test-mode';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check auth (supports E2E test mode)
  const { user } = await getAuthenticatedUser(supabase);

  // Belt-and-suspenders: redirect if no user (middleware should catch this)
  if (!user) {
    redirect('/login');
  }

  return (
    <AuthProvider>
      <DashboardChatWrapper userEmail={user.email || ''}>
        {children}
      </DashboardChatWrapper>
      <SessionExpiryModal />
    </AuthProvider>
  );
}
