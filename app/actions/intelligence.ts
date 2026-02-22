'use server';

/**
 * Server actions for investor intelligence
 * Handles triggering scrapes and fetching stored intelligence data
 */

import { createClient } from '@/lib/supabase/server';
import { scrapeInvestorIntelligence } from '@/lib/intelligence/scraper';

export interface InvestorIntelligenceRow {
  id: string;
  investor_id: string;
  linkedin_url: string | null;
  crunchbase_url: string | null;
  website: string | null;
  about: string | null;
  investment_thesis: string | null;
  aum_estimate: string | null;
  industries: string[];
  headquarters: string | null;
  employee_count: string | null;
  founded: string | null;
  company_size: string | null;
  logo_url: string | null;
  investments: Array<{
    name: string;
    type: string | null;
    amount: string | null;
    date: string | null;
    source_url: string | null;
  }>;
  web_snippets: Array<{ title: string; description: string | null; url: string }>;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error_message: string | null;
  scraped_at: string | null;
}

/**
 * Fetch stored intelligence for an investor.
 * Returns null if no row exists yet.
 */
export async function getInvestorIntelligence(
  investorId: string
): Promise<{ data: InvestorIntelligenceRow | null; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('investor_intelligence')
      .select('*')
      .eq('investor_id', investorId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data: data as InvestorIntelligenceRow | null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch intelligence' };
  }
}

/**
 * Trigger a fresh intelligence scrape for an investor.
 * Sets status to 'processing', runs the scrape, then stores results.
 * Designed to be called fire-and-forget from createInvestor or the API route.
 */
export async function triggerIntelligenceScrape(
  investorId: string,
  firmName: string
): Promise<void> {
  const supabase = await createClient();

  // Mark as processing (upsert so it works for new and existing records)
  await supabase.from('investor_intelligence').upsert(
    { investor_id: investorId, status: 'processing' },
    { onConflict: 'investor_id' }
  );

  try {
    const { intelligence, web_snippets, error: scrapeError } = await scrapeInvestorIntelligence(firmName);

    if (scrapeError) {
      await supabase.from('investor_intelligence').upsert(
        { investor_id: investorId, status: 'error', error_message: scrapeError },
        { onConflict: 'investor_id' }
      );
      return;
    }

    await supabase.from('investor_intelligence').upsert(
      {
        investor_id: investorId,
        linkedin_url: intelligence.linkedin_url,
        crunchbase_url: intelligence.crunchbase_url,
        website: intelligence.website,
        about: intelligence.about,
        investment_thesis: intelligence.investment_thesis,
        aum_estimate: intelligence.aum_estimate,
        industries: intelligence.industries,
        headquarters: intelligence.headquarters,
        employee_count: intelligence.employee_count,
        founded: intelligence.founded,
        company_size: intelligence.company_size,
        logo_url: intelligence.logo_url,
        investments: intelligence.investments,
        web_snippets,
        status: 'complete',
        error_message: null,
        scraped_at: new Date().toISOString(),
      },
      { onConflict: 'investor_id' }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scrape failed';
    await supabase.from('investor_intelligence').upsert(
      { investor_id: investorId, status: 'error', error_message: msg },
      { onConflict: 'investor_id' }
    );
  }
}
