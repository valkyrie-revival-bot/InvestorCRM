/**
 * Check if there are investors in the database
 * If not, create a test investor for E2E tests
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Checking for investors in database...');

  // Query investors
  const { data: investors, error } = await supabase
    .from('investors')
    .select('id, firm_name')
    .limit(5);

  if (error) {
    console.error('Error querying investors:', error);
    process.exit(1);
  }

  if (!investors || investors.length === 0) {
    console.log('No investors found. Creating test investor...');

    // Create a test investor
    const { data: newInvestor, error: createError } = await supabase
      .from('investors')
      .insert({
        firm_name: 'Test Investor for E2E Tests',
        stage: 'target',
        thesis: 'Test investor for Playwright E2E tests',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating test investor:', createError);
      process.exit(1);
    }

    console.log('✅ Created test investor:');
    console.log(`   ID: ${newInvestor.id}`);
    console.log(`   Name: ${newInvestor.firm_name}`);
    console.log('');
    console.log(`Test URL: http://localhost:3003/investors/${newInvestor.id}`);
  } else {
    console.log(`✅ Found ${investors.length} investor(s) in database:`);
    investors.forEach((inv, idx) => {
      console.log(`   ${idx + 1}. ${inv.firm_name} (ID: ${inv.id})`);
    });
    console.log('');
    console.log(`First investor URL: http://localhost:3003/investors/${investors[0].id}`);
  }
}

main().catch(console.error);
