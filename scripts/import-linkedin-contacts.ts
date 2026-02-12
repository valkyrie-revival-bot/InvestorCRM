#!/usr/bin/env tsx

/**
 * Import LinkedIn CSV files directly into database
 * Bypasses RLS using admin client
 * Handles validation errors gracefully
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parseLinkedInCSV } from '../lib/csv/parser';
import { normalizeCompanyName } from '../lib/csv/company-normalizer';
import { linkedInContactRowSchema } from '../lib/validations/linkedin-schema';
import type { LinkedInContactInsert } from '../types/linkedin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const CSV_FILES = [
  { path: 'Morino LinkedIn Connections.csv', teamMember: 'Morino' },
  { path: "Todd's LinkedIn Connections.csv", teamMember: 'Todd' },
  { path: "Jeff's LinkedIn Connections.csv", teamMember: 'Jeff' },
  { path: 'Jackson LinkedIn Connections.csv', teamMember: 'Jackson' },
];

async function importCSV(filePath: string, teamMember: string) {
  console.log(`\n📂 Importing ${filePath}...`);

  // Read and parse CSV
  const csvText = readFileSync(filePath, 'utf-8');
  const { data: rows, totalRows } = parseLinkedInCSV(csvText);

  console.log(`   Found ${totalRows} rows`);

  // Validate rows (skip invalid ones)
  const contacts: LinkedInContactInsert[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const result = linkedInContactRowSchema.safeParse(rows[i]);

    if (result.success) {
      const data = result.data;
      contacts.push({
        first_name: data.first_name,
        last_name: data.last_name,
        linkedin_url: data.linkedin_url,
        email: data.email,
        company: data.company,
        position: data.position,
        connected_on: data.connected_on,
        team_member_name: teamMember,
        normalized_company: data.company ? normalizeCompanyName(data.company) : null,
      });
    } else {
      // Skip invalid rows but track them
      const firstError = result.error.issues[0];
      errors.push({
        row: i + 1,
        message: `${firstError.path.join('.')}: ${firstError.message}`,
      });
    }
  }

  console.log(`   ✓ Validated ${contacts.length} contacts`);
  if (errors.length > 0) {
    console.log(`   ⚠ Skipped ${errors.length} invalid rows`);
  }

  // Fetch existing contacts for this team member to filter duplicates
  console.log(`   Checking for existing contacts...`);
  const { data: existingContacts } = await supabase
    .from('linkedin_contacts')
    .select('linkedin_url')
    .eq('team_member_name', teamMember);

  const existingUrls = new Set(
    (existingContacts || [])
      .map(c => c.linkedin_url)
      .filter((url): url is string => url !== null)
  );

  // Filter out existing contacts
  const newContacts = contacts.filter(c => !c.linkedin_url || !existingUrls.has(c.linkedin_url));
  const skipped = contacts.length - newContacts.length;

  if (skipped > 0) {
    console.log(`   ⚠ ${skipped} contacts already exist (skipping)`);
  }

  if (newContacts.length === 0) {
    console.log(`   ✓ All contacts already imported`);
    return { imported: 0, skipped, errors: errors.length };
  }

  console.log(`   Importing ${newContacts.length} new contacts...`);

  // Batch insert (500 at a time)
  const BATCH_SIZE = 500;
  let imported = 0;

  for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
    const batch = newContacts.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('linkedin_contacts')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`   ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
    } else {
      imported += data?.length || 0;
      process.stdout.write(`   Progress: ${Math.min(i + BATCH_SIZE, newContacts.length)}/${newContacts.length}\r`);
    }
  }

  console.log(`\n   ✓ Imported ${imported} contacts (${skipped} duplicates skipped)`);

  return { imported, skipped, errors: errors.length };
}

async function detectRelationships() {
  console.log('\n🔗 Detecting relationships...');

  // Fetch all investors
  const { data: investors } = await supabase
    .from('investors')
    .select('id, firm_name')
    .is('deleted_at', null);

  if (!investors || investors.length === 0) {
    console.log('   ⚠ No investors found');
    return 0;
  }

  console.log(`   Found ${investors.length} investors`);

  // Fetch all LinkedIn contacts
  const { data: contacts } = await supabase
    .from('linkedin_contacts')
    .select('*');

  if (!contacts || contacts.length === 0) {
    console.log('   ⚠ No LinkedIn contacts found');
    return 0;
  }

  console.log(`   Found ${contacts.length} LinkedIn contacts`);

  // Import relationship detection logic
  const { detectRelationships: detect } = await import('../lib/matching/relationship-detector');

  const relationships = detect(contacts, investors);

  console.log(`   Found ${relationships.length} potential relationships`);

  if (relationships.length === 0) {
    return 0;
  }

  // Clear existing auto-detected relationships
  await supabase
    .from('investor_relationships')
    .delete()
    .eq('detected_via', 'company_match');

  // Insert new relationships (batch) - simple insert, database will handle uniqueness
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < relationships.length; i += BATCH_SIZE) {
    const batch = relationships.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('investor_relationships')
      .insert(batch)
      .select('id');

    if (error) {
      // Ignore unique constraint violations (23505) - these are expected
      if (error.code !== '23505') {
        console.error(`   ✗ Batch failed:`, error.message);
      }
    } else {
      inserted += data?.length || 0;
    }
  }

  console.log(`   ✓ Stored ${inserted} relationships`);

  return inserted;
}

async function main() {
  console.log('🚀 LinkedIn Contact Import Script\n');
  console.log('═══════════════════════════════════════\n');

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Import each CSV file
  for (const { path, teamMember } of CSV_FILES) {
    try {
      const result = await importCSV(path, teamMember);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    } catch (error) {
      console.error(`   ✗ Failed to import ${path}:`, error);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('\n📊 Import Summary:\n');
  console.log(`   Total imported:  ${totalImported.toLocaleString()}`);
  console.log(`   Total skipped:   ${totalSkipped.toLocaleString()}`);
  console.log(`   Total errors:    ${totalErrors.toLocaleString()}`);

  // Detect relationships
  const relationshipsDetected = await detectRelationships();

  console.log('\n═══════════════════════════════════════');
  console.log('\n✅ Import Complete!\n');
  console.log(`   ${totalImported.toLocaleString()} contacts imported`);
  console.log(`   ${relationshipsDetected.toLocaleString()} relationships detected`);
  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
