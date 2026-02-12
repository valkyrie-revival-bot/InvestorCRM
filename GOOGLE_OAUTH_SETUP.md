# Google OAuth Setup for Supabase

## Part 1: Google Cloud Console

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com

2. **Create or Select a Project:**
   - Click the project dropdown at the top
   - Create a new project or select existing one
   - Name it: "Prytaneum Valkyrie CRM" (or similar)

3. **Configure OAuth Consent Screen:**
   - Go to: APIs & Services → OAuth consent screen
   - Select "Internal" (for Google Workspace only - team access only)
   - Fill in:
     - App name: Prytaneum Valkyrie Investor CRM
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Save and Continue"
   - Skip scopes (Supabase handles this)
   - Click "Save and Continue"

4. **Create OAuth 2.0 Client ID:**
   - Go to: APIs & Services → Credentials
   - Click "+ CREATE CREDENTIALS" → OAuth client ID
   - Application type: Web application
   - Name: Prytaneum CRM - Supabase Auth
   - **Authorized redirect URIs** - Add this EXACT URL:
     ```
     https://yafhsopwagozbymqyhhs.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **COPY the Client ID and Client Secret** (you'll need these next)

## Part 2: Supabase Dashboard

1. **Go to your Supabase Project:**
   https://supabase.com/dashboard/project/yafhsopwagozbymqyhhs

2. **Enable Google Provider:**
   - Go to: Authentication → Providers
   - Find "Google" and click to expand
   - Toggle "Enable Sign in with Google" to ON
   - Paste your Google OAuth Client ID
   - Paste your Google OAuth Client Secret
   - Click "Save"

## Part 3: Test

1. Go back to http://localhost:3000
2. Click "Sign in with Google"
3. Should now show Google's sign-in screen (not an error!)
4. Sign in with your Google Workspace account
5. Should redirect back to /dashboard

---

You're on this step now → **Complete Part 1 first (Google Cloud Console)**
