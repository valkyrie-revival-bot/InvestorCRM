import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsPageClient } from './settings-page-client';

export const metadata = {
  title: 'Settings - Sales Tracking',
  description: 'Manage your preferences and settings',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Fetch user preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch messaging preferences
  const { data: messagingPreferences } = await supabase
    .from('user_messaging_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch Google OAuth status
  const { data: oauthTokens } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageClient
        user={user}
        initialPreferences={preferences}
        initialMessagingPreferences={messagingPreferences}
        googleConnected={!!oauthTokens && !oauthTokens.refresh_token_revoked}
        whatsappConnected={!!messagingPreferences?.whatsapp_verified}
      />
    </Suspense>
  );
}
