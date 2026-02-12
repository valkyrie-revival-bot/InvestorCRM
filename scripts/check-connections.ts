#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  const { data, error } = await supabase
    .from('investor_relationships')
    .select(`
      path_strength,
      relationship_type,
      path_description,
      investors!inner(id, firm_name),
      linkedin_contacts!inner(id, full_name, company, position, team_member_name, linkedin_url)
    `)
    .order('path_strength', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No relationships found.');
    return;
  }

  console.log(`\n🔗 Found ${data.length} warm introduction paths:\n`);
  console.log('═'.repeat(120));

  for (const rel of data) {
    const investor = rel.investors as any;
    const contact = rel.linkedin_contacts as any;

    const strengthLabel =
      rel.path_strength >= 0.7 ? '🟢 Strong' :
      rel.path_strength >= 0.4 ? '🟡 Medium' : '⚪ Weak';

    console.log(`\n${strengthLabel} (${rel.path_strength.toFixed(2)}) - ${rel.relationship_type}`);
    console.log(`  Investor:  ${investor.firm_name}`);
    console.log(`  Contact:   ${contact.full_name} (${contact.position || 'N/A'})`);
    console.log(`  Company:   ${contact.company || 'N/A'}`);
    console.log(`  Via:       ${contact.team_member_name}`);
    console.log(`  LinkedIn:  ${contact.linkedin_url || 'N/A'}`);
    console.log(`  Path:      ${rel.path_description || 'N/A'}`);
  }

  console.log('\n' + '═'.repeat(120));
  console.log(`\nTotal: ${data.length} relationships`);
  console.log('\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
