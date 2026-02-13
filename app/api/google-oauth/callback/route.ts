/**
 * Google OAuth callback handler
 * Exchanges authorization code for tokens and stores refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { GOOGLE_SCOPES } from '@/lib/google/scopes';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/google-oauth/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL('/investors?error=google_auth_failed', process.env.NEXT_PUBLIC_URL!)
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(
      new URL('/investors?error=google_auth_failed', process.env.NEXT_PUBLIC_URL!)
    );
  }

  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.redirect(
        new URL('/login?next=/investors', process.env.NEXT_PUBLIC_URL!)
      );
    }

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Store refresh token in database (service role only)
    const adminClient = createAdminClient();
    const { error: tokenError } = await adminClient
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        refresh_token: tokens.refresh_token!,
        access_token: tokens.access_token,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        scopes: GOOGLE_SCOPES,
        updated_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Failed to store Google tokens:', tokenError);
      return NextResponse.redirect(
        new URL('/investors?error=google_auth_failed', process.env.NEXT_PUBLIC_URL!)
      );
    }

    // Parse state parameter for redirect URL
    let redirectUrl = '/investors';
    if (stateParam) {
      try {
        const state = JSON.parse(stateParam);
        if (state.redirectUrl) {
          redirectUrl = state.redirectUrl;
        }
      } catch (e) {
        console.error('Failed to parse state parameter:', e);
      }
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`${redirectUrl}?google_connected=true`, process.env.NEXT_PUBLIC_URL!)
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/investors?error=google_auth_failed', process.env.NEXT_PUBLIC_URL!)
    );
  }
}
