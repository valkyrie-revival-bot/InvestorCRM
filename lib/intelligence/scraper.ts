'use server';

/**
 * Investor intelligence scraper
 * Uses Bright Data SERP API to gather company intelligence,
 * then passes raw results to Claude for structured extraction.
 */

import Anthropic from '@anthropic-ai/sdk';

const BRIGHT_DATA_API = 'https://api.brightdata.com/request';
const BRIGHT_DATA_ZONE = process.env.BRIGHT_DATA_ZONE || 'serp_api1';

export interface InvestmentRecord {
  name: string;
  type: string | null;
  amount: string | null;
  date: string | null;
  source_url: string | null;
}

export interface WebSnippet {
  title: string;
  description: string | null;
  url: string;
}

export interface ExtractedIntelligence {
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
  investments: InvestmentRecord[];
}

/**
 * Extract snippets from raw Google SERP HTML.
 * Parses result blocks to find title, URL, and description.
 */
function extractSnippetsFromHtml(html: string): WebSnippet[] {
  const snippets: WebSnippet[] = [];
  // Match result links — Google wraps organic results with /url?q=ACTUAL_URL
  const resultPattern = /<a[^>]+href="\/url\?q=(https?[^&"]+)[^"]*"[^>]*>.*?<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = resultPattern.exec(html)) !== null && snippets.length < 8) {
    const rawUrl = decodeURIComponent(match[1]).split('&')[0];
    const title = match[2].replace(/<[^>]+>/g, '').trim();

    // Skip Google-internal URLs
    if (!rawUrl || rawUrl.includes('google.com') || rawUrl.includes('googleadservices')) continue;

    // Grab a nearby description from a span after the title
    const afterTitle = match[3] ?? '';
    const descMatch = afterTitle.match(/<span[^>]*>([\s\S]{20,300}?)<\/span>/);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : null;

    if (title) snippets.push({ title, description, url: rawUrl });
  }

  return snippets;
}

/**
 * Call Bright Data SERP API for a single query.
 * Returns top organic results as snippets.
 * Handles both parsed JSON response (organic[]) and raw HTML response.
 */
async function callSerpApi(query: string, apiKey: string): Promise<WebSnippet[]> {
  try {
    const response = await fetch(BRIGHT_DATA_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: BRIGHT_DATA_ZONE,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us&num=10`,
        format: 'raw',
      }),
    });

    if (!response.ok) {
      console.error(`SERP API error for query "${query}": ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Parsed JSON format: { organic: [{title, link, description}...] }
    if (Array.isArray(data?.organic)) {
      return (data.organic as any[]).slice(0, 8).map((r: any) => ({
        title: r.title ?? '',
        description: r.description ?? r.snippet ?? null,
        url: r.link ?? r.url ?? '',
      }));
    }

    // Raw HTML format: { status_code, headers, body: "<!doctype html>..." }
    const html: string = data?.body ?? (typeof data === 'string' ? data : '');
    if (html) return extractSnippetsFromHtml(html);

    return [];
  } catch (err) {
    console.error(`SERP API fetch error for "${query}":`, err);
    return [];
  }
}

/**
 * Format SERP snippets into a plain-text block for Claude extraction.
 */
function formatSnippets(label: string, snippets: WebSnippet[]): string {
  if (snippets.length === 0) return '';
  const lines = snippets.map(
    (s, i) => `  [${i + 1}] ${s.title}\n      ${s.description ?? 'no description'}\n      ${s.url}`
  );
  return `--- ${label} ---\n${lines.join('\n')}`;
}

/**
 * Use Claude to extract structured intelligence from raw SERP text.
 */
async function extractWithClaude(
  firmName: string,
  serpText: string
): Promise<ExtractedIntelligence> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are extracting structured intelligence about an investment firm from Google search result snippets.

Firm: "${firmName}"

Search Results:
${serpText}

Extract the following as valid JSON. Only include values you can confidently extract from the results above. Use null for missing fields. Do not invent data.

{
  "linkedin_url": "full linkedin.com/company/... URL if found, or null",
  "crunchbase_url": "full crunchbase.com/organization/... URL if found, or null",
  "website": "firm's main website URL if found, or null",
  "about": "2-4 sentence description of the firm and what they do",
  "investment_thesis": "their stated investment focus, strategy, or mandate (1-3 sentences)",
  "aum_estimate": "AUM, fund size, or capital under management if mentioned (e.g. '$2B AUM'), or null",
  "industries": ["list", "of", "industry", "sectors", "they", "invest", "in"],
  "headquarters": "City, Country or City, State if found, or null",
  "employee_count": "approximate headcount if mentioned, or null",
  "founded": "founding year if mentioned, or null",
  "company_size": "e.g. '51-200 employees' if mentioned, or null",
  "logo_url": null,
  "investments": [
    {
      "name": "portfolio company name",
      "type": "investment type e.g. Series A, seed, LP investment, acquisition",
      "amount": "dollar amount if mentioned, or null",
      "date": "year or date if mentioned, or null",
      "source_url": "URL of the result mentioning this investment, or null"
    }
  ]
}

Return only the JSON object, no explanation. Extract up to 20 investments.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]) as ExtractedIntelligence;
  } catch {
    console.error('Failed to parse Claude extraction response:', text);
    return {
      linkedin_url: null,
      crunchbase_url: null,
      website: null,
      about: null,
      investment_thesis: null,
      aum_estimate: null,
      industries: [],
      headquarters: null,
      employee_count: null,
      founded: null,
      company_size: null,
      logo_url: null,
      investments: [],
    };
  }
}

/**
 * Main entry point: scrape intelligence for an investor firm.
 * Fires 5 SERP queries in parallel, extracts structured data with Claude.
 */
export async function scrapeInvestorIntelligence(firmName: string): Promise<{
  intelligence: ExtractedIntelligence;
  web_snippets: WebSnippet[];
  error?: string;
}> {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;

  if (!apiKey) {
    return {
      intelligence: emptyIntelligence(),
      web_snippets: [],
      error: 'BRIGHT_DATA_API_KEY not configured',
    };
  }

  // Five targeted queries fired in parallel
  const queries = [
    `"${firmName}" investment firm fund`,
    `"${firmName}" portfolio companies investments`,
    `"${firmName}" AUM "fund size" "assets under management"`,
    `site:linkedin.com/company "${firmName}"`,
    `site:crunchbase.com "${firmName}" investments funding`,
  ];

  const results = await Promise.all(queries.map(q => callSerpApi(q, apiKey)));

  // Flatten and deduplicate snippets by URL
  const seen = new Set<string>();
  const allSnippets: WebSnippet[] = [];
  for (const batch of results) {
    for (const snippet of batch) {
      if (snippet.url && !seen.has(snippet.url)) {
        seen.add(snippet.url);
        allSnippets.push(snippet);
      }
    }
  }

  if (allSnippets.length === 0) {
    return {
      intelligence: emptyIntelligence(),
      web_snippets: [],
      error: 'No SERP results returned',
    };
  }

  // Format for Claude
  const serpText = [
    formatSnippets('Overview & Fund Info', results[0]),
    formatSnippets('Portfolio & Investments', results[1]),
    formatSnippets('AUM & Fund Size', results[2]),
    formatSnippets('LinkedIn Profile', results[3]),
    formatSnippets('Crunchbase Profile', results[4]),
  ]
    .filter(Boolean)
    .join('\n\n');

  const intelligence = await extractWithClaude(firmName, serpText);

  return { intelligence, web_snippets: allSnippets };
}

function emptyIntelligence(): ExtractedIntelligence {
  return {
    linkedin_url: null,
    crunchbase_url: null,
    website: null,
    about: null,
    investment_thesis: null,
    aum_estimate: null,
    industries: [],
    headquarters: null,
    employee_count: null,
    founded: null,
    company_size: null,
    logo_url: null,
    investments: [],
  };
}
