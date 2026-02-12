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
  // Get investors that have LinkedIn connections
  const { data, error } = await supabase
    .from('investor_relationships')
    .select(`
      investors!inner(id, firm_name)
    `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No relationships found.');
    return;
  }

  // Get unique investors
  const investorMap = new Map();
  for (const rel of data) {
    const investor = rel.investors as any;
    if (!investorMap.has(investor.id)) {
      investorMap.set(investor.id, investor.firm_name);
    }
  }

  console.log('\n🔗 Investors with LinkedIn Connections:\n');
  console.log('Click these URLs to view connections:\n');

  for (const [id, firmName] of investorMap.entries()) {
    console.log(`${firmName}:`);
    console.log(`  http://localhost:3003/investors/${id}\n`);
  }

  console.log(`Total: ${investorMap.size} investors with connections\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
