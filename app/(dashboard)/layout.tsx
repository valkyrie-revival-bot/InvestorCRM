import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SessionExpiryModal } from '@/components/auth/session-expiry-modal';
import Image from 'next/image';

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
            <nav className="flex items-center gap-6">
              <a
                href="/investors"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pipeline
              </a>
              <a
                href="/linkedin/import"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="/settings/users"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/prytaneum.png"
                  alt="Prytaneum Partners"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
                <div className="h-6 w-px bg-border" />
                <Image
                  src="/logos/valkyrie.png"
                  alt="Valkyrie"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
              <div className="h-6 w-px bg-border ml-2" />
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
