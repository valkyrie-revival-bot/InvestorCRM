import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SessionExpiryModal } from '@/components/auth/session-expiry-modal';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: redirect if no user (middleware should catch this)
  if (!user) {
    redirect('/login');
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-8">
              <h1 className="text-lg font-semibold">
                Prytaneum Partners / Valkyrie CRM
              </h1>
              <nav className="flex items-center gap-6">
                <a
                  href="/investors"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pipeline
                </a>
                <a
                  href="/settings/users"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="container mx-auto py-6 px-4">{children}</main>
      </div>
      <SessionExpiryModal />
    </AuthProvider>
  );
}
