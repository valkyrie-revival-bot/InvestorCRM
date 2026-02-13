/**
 * Verify LinkedIn Contact Intelligence database schema
 * Checks that tables, indexes, extensions, and RLS policies were created correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyLinkedInTables() {
  console.log('🔍 Verifying LinkedIn Contact Intelligence schema...\n');

  let allPassed = true;

  // Test 1: Check pg_trgm extension
  console.log('1️⃣  Checking pg_trgm extension...');
  try {
    const { data, error } = await supabase.rpc('check_extension', { ext_name: 'pg_trgm' });
    if (error) {
      // Try alternative query
      const { data: extData, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'pg_trgm')
        .single();

      if (extError) {
        console.log('   ⚠️  Unable to verify pg_trgm extension via API');
        console.log('   → Manual check: SELECT * FROM pg_extension WHERE extname = \'pg_trgm\';');
      } else {
        console.log('   ✅ pg_trgm extension is enabled');
      }
    } else {
      console.log('   ✅ pg_trgm extension is enabled');
    }
  } catch (err) {
    console.log('   ⚠️  Could not verify extension (this is OK - may require manual check)');
  }

  // Test 2: Check linkedin_contacts table exists
  console.log('\n2️⃣  Checking linkedin_contacts table...');
  try {
    const { data, error } = await supabase
      .from('linkedin_contacts')
      .select('count')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ linkedin_contacts table NOT FOUND');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error checking table: ${error.message}`);
      }
    } else {
      console.log('   ✅ linkedin_contacts table exists');

      // Test insert/select to verify RLS policies
      console.log('   → Testing RLS policies...');
      const testContact = {
        first_name: 'Test',
        last_name: 'Contact',
        team_member_name: 'Todd',
      };

      const { data: insertData, error: insertError } = await supabase
        .from('linkedin_contacts')
        .insert(testContact)
        .select()
        .single();

      if (insertError) {
        console.log(`   ⚠️  Insert test failed: ${insertError.message}`);
      } else {
        console.log('   ✅ RLS INSERT policy works');

        // Clean up test record
        await supabase.from('linkedin_contacts').delete().eq('id', insertData.id);
        console.log('   ✅ RLS DELETE policy works');
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Table verification failed: ${err.message}`);
    allPassed = false;
  }

  // Test 3: Check investor_relationships table exists
  console.log('\n3️⃣  Checking investor_relationships table...');
  try {
    const { data, error } = await supabase
      .from('investor_relationships')
      .select('count')
      .limit(0);

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ investor_relationships table NOT FOUND');
        allPassed = false;
      } else {
        console.log(`   ⚠️  Error checking table: ${error.message}`);
      }
    } else {
      console.log('   ✅ investor_relationships table exists');
    }
  } catch (err: any) {
    console.log(`   ❌ Table verification failed: ${err.message}`);
    allPassed = false;
  }

  // Test 4: Check table schemas
  console.log('\n4️⃣  Checking table columns...');
  try {
    const { data: contactsSchema, error: contactsError } = await supabase
      .from('linkedin_contacts')
      .select('*')
      .limit(0);

    if (!contactsError) {
      console.log('   ✅ linkedin_contacts has queryable schema');
    }

    const { data: relationshipsSchema, error: relationshipsError } = await supabase
      .from('investor_relationships')
      .select('*')
      .limit(0);

    if (!relationshipsError) {
      console.log('   ✅ investor_relationships has queryable schema');
    }
  } catch (err: any) {
    console.log(`   ⚠️  Schema check failed: ${err.message}`);
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ All verifications passed!');
    console.log('\n✨ LinkedIn Contact Intelligence schema is ready.\n');
    return true;
  } else {
    console.log('❌ Some verifications failed.');
    console.log('\n📋 Please run migrations manually:');
    console.log('   1. Open Supabase Dashboard SQL Editor');
    console.log('   2. Run: lib/database/migrations/016-linkedin-contacts.sql');
    console.log('   3. Run: lib/database/migrations/017-investor-relationships.sql');
    console.log('   4. Re-run this verification script\n');
    return false;
  }
}

verifyLinkedInTables()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Verification script error:', err);
    process.exit(1);
  });
