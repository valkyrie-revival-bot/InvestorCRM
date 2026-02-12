/**
 * Fuzzy company name matching engine
 * Uses Fuse.js to match LinkedIn contact companies against investor firm names
 * Part of Phase 04.5 (Contact Intelligence) - Warm introduction network
 */

import Fuse from 'fuse.js';
import { normalizeCompanyName } from '@/lib/csv/company-normalizer';

/**
 * Result of a company name match
 */
export interface CompanyMatch {
  investor_id: string;
  firm_name: string;
  similarity_score: number; // 0-1 where 1 is perfect match
}

/**
 * Internal investor entry with normalized name
 */
interface InvestorEntry {
  id: string;
  firm_name: string;
  normalized: string;
}

/**
 * Create a company matcher from a list of investors
 *
 * @param investors Array of investors with id and firm_name
 * @returns Matcher object with findMatches method
 */
export function createCompanyMatcher(investors: Array<{ id: string; firm_name: string }>) {
  // Normalize all investor firm names
  const entries: InvestorEntry[] = investors.map(inv => ({
    id: inv.id,
    firm_name: inv.firm_name,
    normalized: normalizeCompanyName(inv.firm_name),
  }));

  // Configure Fuse.js for fuzzy matching on normalized names
  const fuse = new Fuse(entries, {
    keys: ['normalized'],
    threshold: 0.3,         // 0.0 = perfect match, 1.0 = match anything
    distance: 100,
    includeScore: true,
    minMatchCharLength: 3,
    ignoreLocation: true,
  });

  return {
    /**
     * Find matching investors for a given company name
     *
     * @param companyName Company name to match (e.g., from LinkedIn contact)
     * @returns Array of matches sorted by similarity score (descending)
     */
    findMatches(companyName: string): CompanyMatch[] {
      const normalized = normalizeCompanyName(companyName);

      // Skip empty or very short names
      if (!normalized || normalized.length < 3) return [];

      const results = fuse.search(normalized);

      // Filter to good matches (score < 0.3) and transform results
      return results
        .filter(r => r.score !== undefined && r.score < 0.3)
        .map(r => ({
          investor_id: r.item.id,
          firm_name: r.item.firm_name,
          similarity_score: 1 - (r.score ?? 1), // Convert to 0-1 where 1 is best
        }));
    },
  };
}
