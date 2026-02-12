/**
 * One-time Excel migration script
 * Imports existing investor data from PRYTANEUM LP CRM.xlsx into Supabase
 * Safe to run multiple times - checks for duplicates before inserting
 */

import * as XLSX from 'xlsx';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Convert Excel serial date to JavaScript Date
 * Excel dates are stored as serial numbers (days since 1900-01-01)
 */
function convertExcelDate(serialDate: number | string | null | undefined): string | null {
  if (serialDate === null || serialDate === undefined || serialDate === '') {
    return null;
  }

  // If already a string that looks like a date, validate and return
  if (typeof serialDate === 'string') {
    const dateStr = serialDate.trim();
    // Check if it's a valid date string (YYYY-MM-DD or similar)
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      // Validate year is reasonable (2000-2030)
      if (year >= 2000 && year <= 2030) {
        return parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    }
    return null;
  }

  // If it's a number, treat as Excel serial date
  if (typeof serialDate === 'number') {
    // Excel serial date: days since 1900-01-01 (minus 25569 to convert to Unix epoch)
    const date = new Date((serialDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();

    // Validate year is reasonable
    if (year >= 2000 && year <= 2030) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }

  return null;
}

/**
 * Parse boolean value from Excel
 */
function parseBoolean(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'yes' || normalized === 'true' || normalized === '1';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

/**
 * Normalize column names from Excel (handles variations)
 */
function normalizeColumnName(col: string): string {
  return col.trim().toLowerCase().replace(/\s+/g, '_').replace(/[\/\\]/g, '_');
}

/**
 * Get value from row with case-insensitive and variation-tolerant column matching
 */
function getColumnValue(
  row: any,
  possibleNames: string[]
): string | number | null | undefined {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return null;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Excel migration...\n');

  try {
    // Read Excel file
    const excelPath = path.resolve(process.cwd(), 'PRYTANEUM LP CRM.xlsx');
    console.log(`📖 Reading Excel file: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`   Found ${rows.length} rows\n`);

    if (rows.length === 0) {
      console.log('⚠️  No data to migrate');
      return;
    }

    // Track results
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const failures: Array<{ row: number; firm: string; error: string }> = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNum = i + 2; // Excel row number (accounting for header)

      try {
        // Extract firm name (required)
        const firmName = getColumnValue(row, [
          'Firm Name',
          'Firm',
          'firm_name',
          'firm',
        ]);

        if (!firmName || String(firmName).trim() === '') {
          console.log(`⏭️  Row ${rowNum}: Skipping - no firm name`);
          skipCount++;
          continue;
        }

        const firmNameStr = String(firmName).trim();

        // Check if investor already exists
        const { data: existing } = await supabase
          .from('investors')
          .select('id, firm_name')
          .eq('firm_name', firmNameStr)
          .single();

        if (existing) {
          console.log(`⏭️  Row ${rowNum}: "${firmNameStr}" - already exists`);
          skipCount++;
          continue;
        }

        // Extract other fields
        const stage =
          String(
            getColumnValue(row, ['Stage', 'stage']) || 'Initial Contact'
          ).trim();

        const relationshipOwner =
          String(
            getColumnValue(row, [
              'Relationship Owner',
              'Owner',
              'relationship_owner',
            ]) || 'Unassigned'
          ).trim();

        const partnerSource = getColumnValue(row, [
          'Partner / Source',
          'Partner/Source',
          'Partner',
          'Source',
          'partner_source',
        ]);

        const estValue = getColumnValue(row, [
          'Est. value',
          'Est Value',
          'Estimated Value',
          'est_value',
        ]);

        const entryDate = convertExcelDate(
          getColumnValue(row, ['Entry Date', 'entry_date'])
        );

        const lastActionDate = convertExcelDate(
          getColumnValue(row, ['Last Action Date', 'last_action_date'])
        );

        const stalled = parseBoolean(getColumnValue(row, ['Stalled', 'stalled']));

        const allocatorType = getColumnValue(row, [
          'Allocator Type',
          'allocator_type',
        ]);

        const internalConviction = getColumnValue(row, [
          'Internal Conviction',
          'internal_conviction',
        ]);

        const internalPriority = getColumnValue(row, [
          'Internal Priority',
          'internal_priority',
        ]);

        const investmentCommitteeTiming = getColumnValue(row, [
          'Investment Committee Timing',
          'investment_committee_timing',
        ]);

        const nextAction = getColumnValue(row, ['Next Action', 'next_action']);

        const nextActionDate = convertExcelDate(
          getColumnValue(row, ['Next Action Date', 'next_action_date'])
        );

        const currentStrategyNotes = getColumnValue(row, [
          'Current strategy notes',
          'current_strategy_notes',
        ]);

        const currentStrategyDate = convertExcelDate(
          getColumnValue(row, ['Current strategy date', 'current_strategy_date'])
        );

        const lastStrategyNotes = getColumnValue(row, [
          'Last strategy notes',
          'last_strategy_notes',
        ]);

        const lastStrategyDate = convertExcelDate(
          getColumnValue(row, ['Last strategy date', 'last_strategy_date'])
        );

        const keyObjectionRisk = getColumnValue(row, [
          'Key Objection / Risk',
          'Key Objection',
          'key_objection_risk',
        ]);

        const primaryContactName = getColumnValue(row, [
          'Primary Contact',
          'Contact',
          'primary_contact',
        ]);

        // Insert investor
        const { data: investor, error: investorError } = await supabase
          .from('investors')
          .insert({
            firm_name: firmNameStr,
            stage,
            relationship_owner: relationshipOwner,
            partner_source: partnerSource ? String(partnerSource).trim() : null,
            est_value: estValue ? Number(estValue) : null,
            entry_date: entryDate,
            last_action_date: lastActionDate,
            stalled,
            allocator_type: allocatorType ? String(allocatorType).trim() : null,
            internal_conviction: internalConviction
              ? String(internalConviction).trim()
              : null,
            internal_priority: internalPriority
              ? String(internalPriority).trim()
              : null,
            investment_committee_timing: investmentCommitteeTiming
              ? String(investmentCommitteeTiming).trim()
              : null,
            next_action: nextAction ? String(nextAction).trim() : null,
            next_action_date: nextActionDate,
            current_strategy_notes: currentStrategyNotes
              ? String(currentStrategyNotes).trim()
              : null,
            current_strategy_date: currentStrategyDate,
            last_strategy_notes: lastStrategyNotes
              ? String(lastStrategyNotes).trim()
              : null,
            last_strategy_date: lastStrategyDate,
            key_objection_risk: keyObjectionRisk
              ? String(keyObjectionRisk).trim()
              : null,
          })
          .select()
          .single();

        if (investorError || !investor) {
          throw new Error(
            investorError?.message || 'Failed to insert investor'
          );
        }

        // Create primary contact if name is provided
        if (primaryContactName && String(primaryContactName).trim() !== '') {
          const { error: contactError } = await supabase.from('contacts').insert({
            investor_id: investor.id,
            name: String(primaryContactName).trim(),
            is_primary: true,
          });

          if (contactError) {
            console.log(
              `   ⚠️  Warning: Failed to create contact for "${firmNameStr}": ${contactError.message}`
            );
          }
        }

        console.log(`✅ Row ${rowNum}: "${firmNameStr}" - imported successfully`);
        successCount++;
      } catch (error) {
        const firmName = String(
          getColumnValue(row, ['Firm Name', 'Firm', 'firm_name', 'firm']) ||
            'Unknown'
        );
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';

        failures.push({
          row: rowNum,
          firm: firmName,
          error: errorMsg,
        });

        console.log(`❌ Row ${rowNum}: "${firmName}" - failed: ${errorMsg}`);
        failCount++;
      }
    }

    // Summary
    console.log('\n📊 Migration Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successful imports: ${successCount}`);
    console.log(`⏭️  Skipped (duplicates or missing data): ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📋 Total rows processed: ${rows.length}`);

    if (failures.length > 0) {
      console.log('\n❌ Failures:');
      failures.forEach((f) => {
        console.log(`   Row ${f.row} - "${f.firm}": ${f.error}`);
      });
    }

    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run migration
migrate();
