import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }

    // Validate next parameter to prevent open redirect vulnerability
    const redirectTo = next.startsWith('/') ? next : '/';
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  }

  // No code present - redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_failed', requestUrl.origin)
  );
}
