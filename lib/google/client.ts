/**
 * Google OAuth2 client factory
 * Creates authenticated OAuth2Client instances for Google API calls
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createAdminClient } from '@/lib/supabase/server';
import { GOOGLE_SCOPES } from './scopes';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/google-oauth/callback';

/**
 * Creates authenticated OAuth2 client for a user
 * Loads refresh token from database (service role access), sets up auto-refresh
 *
 * @param userId - User UUID
 * @returns Authenticated OAuth2Client
 * @throws Error if user has not authorized Google Workspace access
 */
export async function createGoogleClient(userId: string): Promise<OAuth2Client> {
  const supabase = createAdminClient();

  // Load user's refresh token from secure storage (service role only)
  const { data: tokenData, error } = await supabase
    .from('google_oauth_tokens')
    .select('refresh_token, access_token, token_expiry, scopes')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData?.refresh_token) {
    throw new Error('User has not authorized Google Workspace access');
  }

  // Create OAuth2 client with stored refresh token
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: tokenData.refresh_token,
    access_token: tokenData.access_token || undefined,
    expiry_date: tokenData.token_expiry ? new Date(tokenData.token_expiry).getTime() : undefined,
  });

  // Listen for token refresh events to store updated tokens
  oauth2Client.on('tokens', async (tokens) => {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Store new refresh token (only provided on first auth or revocation)
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    // Store updated access token and expiry
    if (tokens.access_token) {
      updateData.access_token = tokens.access_token;
    }
    if (tokens.expiry_date) {
      updateData.token_expiry = new Date(tokens.expiry_date).toISOString();
    }

    await supabase
      .from('google_oauth_tokens')
      .update(updateData)
      .eq('user_id', userId);
  });

  return oauth2Client;
}

/**
 * Generates Google OAuth2 authorization URL
 *
 * @param redirectUrl - URL to redirect to after OAuth completion (stored in state)
 * @returns Authorization URL for user to visit
 */
export function getGoogleAuthUrl(redirectUrl?: string): string {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  const state = redirectUrl ? JSON.stringify({ redirectUrl }) : undefined;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: [...GOOGLE_SCOPES], // Convert readonly array to mutable
    prompt: 'consent', // Force consent screen to ensure refresh token
    state,
  });
}

/**
 * Checks if user has authorized Google Workspace access
 *
 * @param userId - User UUID
 * @returns True if user has stored refresh token
 */
export async function hasGoogleTokens(userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}
