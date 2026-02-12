/**
 * LinkedIn CSV parser
 * Handles LinkedIn's CSV export format including "Notes:" preamble lines
 * Part of Phase 04.5 (Contact Intelligence)
 */

import Papa from 'papaparse';

// Header mapping: LinkedIn CSV header -> our schema field name
const HEADER_MAP: Record<string, string> = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'URL': 'linkedin_url',
  'Email Address': 'email',
  'Company': 'company',
  'Position': 'position',
  'Connected On': 'connected_on',
};

/**
 * Parse a LinkedIn CSV export file
 *
 * LinkedIn CSVs have a non-standard format with 2-3 lines of "Notes:" preamble before the headers:
 * - Line 1: "Notes:"
 * - Line 2: "When exporting your connection data..." (quoted string)
 * - Line 3: empty line (sometimes)
 * - Line 4: "First Name,Last Name,URL,Email Address,Company,Position,Connected On"
 * - Data rows follow
 *
 * This function:
 * 1. Scans for the actual header line (starts with "First Name,")
 * 2. Parses from the header line onward using PapaParse
 * 3. Transforms headers to snake_case to match our Zod schema
 *
 * @param csvText Raw CSV file contents as a string
 * @returns Parsed data with validation errors
 */
export function parseLinkedInCSV(csvText: string): {
  data: Record<string, string>[];
  errors: Papa.ParseError[];
  totalRows: number;
} {
  // Find the header line (skip LinkedIn "Notes:" preamble)
  const lines = csvText.split('\n');
  let headerLineIndex = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].startsWith('First Name,')) {
      headerLineIndex = i;
      break;
    }
  }

  // Rejoin from header line onward
  const cleanCSV = lines.slice(headerLineIndex).join('\n');

  const result = Papa.parse<Record<string, string>>(cleanCSV, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => {
      return HEADER_MAP[header.trim()] || header.toLowerCase().replace(/ /g, '_');
    },
  });

  return {
    data: result.data,
    errors: result.errors,
    totalRows: result.data.length,
  };
}
