/**
 * Investor intelligence API route
 * GET  /api/investors/[id]/intelligence  → return current intelligence row
 * POST /api/investors/[id]/intelligence  → trigger a fresh scrape
 */

import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import { getSupabaseClient } from '@/lib/supabase/dynamic';
import { getInvestorIntelligence, triggerIntelligenceScrape } from '@/app/actions/intelligence';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseClient();
  const { user, error: authError } = await getAuthenticatedUser(supabase);
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await getInvestorIntelligence(id);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseClient();
  const { user, error: authError } = await getAuthenticatedUser(supabase);
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch firm name from investors table
  const { data: investor, error: invError } = await supabase
    .from('investors')
    .select('firm_name')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (invError || !investor) {
    return Response.json({ error: 'Investor not found' }, { status: 404 });
  }

  // Kick off scrape — runs asynchronously, returns 202 immediately
  // The scrape updates the DB when done; client polls GET to see completion
  triggerIntelligenceScrape(id, investor.firm_name).catch(err =>
    console.error('Intelligence scrape error:', err)
  );

  return Response.json({ status: 'processing' }, { status: 202 });
}
