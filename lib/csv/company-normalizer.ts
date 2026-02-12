/**
 * Company name normalization for fuzzy matching
 * Used to match LinkedIn contacts with investor firm names
 * Part of Phase 04.5 (Contact Intelligence)
 */

/**
 * Normalize a company name for fuzzy matching
 *
 * Transformations:
 * 1. Lowercase and trim
 * 2. Remove legal entity suffixes (inc, corp, llc, ltd, etc.)
 * 3. Remove trailing punctuation left after suffix removal
 * 4. Remove internal punctuation but keep spaces
 * 5. Normalize whitespace
 *
 * Examples:
 * - "Microsoft Corporation" → "microsoft"
 * - "Sequoia Capital Management LLC" → "sequoia"
 * - "Goldman Sachs Group, Inc." → "goldman sachs"
 * - "Andreessen Horowitz" → "andreessen horowitz"
 *
 * @param name Company name to normalize
 * @returns Normalized company name (lowercase, no legal suffixes, no punctuation)
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common legal entity suffixes (with optional trailing period)
    .replace(/\b(inc|incorporated|corp|corporation|llc|llp|ltd|limited|co|company|pllc|lp|plc|group|partners|holdings|capital|management|advisors|advisory)\b\.?\s*$/gi, '')
    // Remove trailing punctuation left after suffix removal
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '')
    // Remove internal punctuation but keep spaces
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
