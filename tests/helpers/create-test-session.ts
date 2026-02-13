/**
 * Create a test session for Playwright tests
 * Uses Supabase admin API to create a temporary test user and session
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestSession {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}

/**
 * Create or get existing test user session
 */
export async function createTestSession(): Promise<TestSession | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Try to create or get test user
  const testEmail = 'playwright-test@example.com';
  const testPassword = 'playwright-test-password-123';

  try {
    // Try to create user (will fail if already exists, which is fine)
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (signUpError && signUpError.message && !signUpError.message.includes('already') && !signUpError.message.includes('exists')) {
      console.error('Error creating test user:', signUpError);
      return null;
    }

    // Sign in to get fresh tokens (whether user was just created or already existed)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      return null;
    }

    if (!signInData.session) {
      console.error('No session returned from sign in');
      return null;
    }

    return {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      user_id: signInData.user.id,
      email: testEmail,
    };
  } catch (error) {
    console.error('Error in createTestSession:', error);
    return null;
  }
}

/**
 * Save session to Playwright auth storage format
 */
export async function saveSessionForPlaywright(session: TestSession, outputPath: string) {
  // Create Playwright storage state format
  const storageState = {
    cookies: [
      {
        name: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
        value: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: session.user_id,
            email: session.email,
          },
        }),
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [
      {
        origin: 'http://localhost:3003',
        localStorage: [
          {
            name: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
            value: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              expires_in: 3600,
              token_type: 'bearer',
              user: {
                id: session.user_id,
                email: session.email,
              },
            }),
          },
        ],
      },
    ],
  };

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(storageState, null, 2));
  console.log(`✅ Test session saved to ${outputPath}`);
}

/**
 * Main function to set up test authentication
 */
async function main() {
  console.log('Creating test session...');

  const session = await createTestSession();
  if (!session) {
    console.error('❌ Failed to create test session');
    process.exit(1);
  }

  console.log('✅ Test session created');
  console.log('User ID:', session.user_id);
  console.log('Email:', session.email);

  // Save to Playwright auth file
  const authFile = path.join(__dirname, '../.auth/user.json');
  await saveSessionForPlaywright(session, authFile);

  console.log('');
  console.log('✅ Authentication setup complete!');
  console.log('You can now run Playwright tests with authenticated session.');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
