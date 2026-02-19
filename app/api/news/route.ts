/**
 * News API proxy route
 * Fetches recent news articles for an investor firm
 * Proxies NewsAPI to keep API key server-side
 */

import { getAuthenticatedUser } from '@/lib/auth/test-mode';
import { getSupabaseClient } from '@/lib/supabase/dynamic';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 2) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'News API not configured' }, { status: 503 });
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'SalesTracker/1.0' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('NewsAPI error:', response.status, text);
      return Response.json(
        { error: `NewsAPI error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return only the fields we need
    const articles = (data.articles || []).map((a: any) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || 'Unknown',
    }));

    return Response.json({ articles });
  } catch (error) {
    console.error('News route error:', error);
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
