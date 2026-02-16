'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const errorDetails = searchParams.get('details');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // If successful, browser redirects to Google - no need to setLoading(false)
    } catch (err) {
      setError('Failed to initiate sign-in');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-brand-primary/5">
      <Card className="w-[420px] border-brand-primary/20 shadow-lg shadow-brand-primary/5">
        <CardHeader className="space-y-4 text-center">
          {/* Logo Section */}
          <div className="flex items-center justify-center gap-6 mb-2">
            <Image
              src="/logos/prytaneum.png"
              alt="Prytaneum Partners"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
            <div className="h-12 w-px bg-border/50" />
            <Image
              src="/logos/valkyrie.png"
              alt="Valkyrie Revival Fund"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight leading-tight">
            Prytaneum Partners / Valkyrie Revival Fund
            <br />
            M&A Intelligence System
          </CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 pt-1">
            Powered by VALHROS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || authError) && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {authError === 'auth_failed'
                ? `Authentication failed. ${errorDetails || 'Please try again.'}`
                : error}
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            disabled={loading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Sign in with your Google Workspace account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
