/**
 * Investor data exporter
 * Supports CSV and Excel export with streaming for large datasets
 */

import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import type { InvestorWithContacts } from '@/types/investors';

export interface ExportFilters {
  stage?: string;
  relationship_owner?: string;
  allocator_type?: string;
  date_from?: string;
  date_to?: string;
  stalled?: boolean;
}

/**
 * Export investors to CSV format
 */
export function exportInvestorsToCSV(
  investors: InvestorWithContacts[],
  filters?: ExportFilters
): string {
  if (investors.length === 0) {
    return 'firm_name,stage,relationship_owner,allocator_type,est_value,entry_date,last_action_date,stalled,primary_contact_name,primary_contact_email,next_action,next_action_date\n';
  }

  const headers = [
    'firm_name',
    'stage',
    'relationship_owner',
    'allocator_type',
    'est_value',
    'entry_date',
    'stage_entry_date',
    'last_action_date',
    'stalled',
    'primary_contact_name',
    'primary_contact_email',
    'primary_contact_title',
    'next_action',
    'next_action_date',
    'internal_conviction',
    'internal_priority',
    'investment_committee_timing',
    'key_objection_risk',
    'current_strategy_notes',
    'partner_source',
  ];

  const rows = investors.map((inv) => {
    const primaryContact = inv.primary_contact;
    return [
      escapeCSV(inv.firm_name),
      escapeCSV(inv.stage),
      escapeCSV(inv.relationship_owner),
      escapeCSV(inv.allocator_type || ''),
      inv.est_value || '',
      inv.entry_date || '',
      inv.stage_entry_date || '',
      inv.last_action_date || '',
      inv.stalled ? 'Yes' : 'No',
      escapeCSV(primaryContact?.name || ''),
      escapeCSV(primaryContact?.email || ''),
      escapeCSV(primaryContact?.title || ''),
      escapeCSV(inv.next_action || ''),
      inv.next_action_date || '',
      escapeCSV(inv.internal_conviction || ''),
      escapeCSV(inv.internal_priority || ''),
      escapeCSV(inv.investment_committee_timing || ''),
      escapeCSV(inv.key_objection_risk || ''),
      escapeCSV(inv.current_strategy_notes || ''),
      escapeCSV(inv.partner_source || ''),
    ].join(',');
  });

  return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Export investors to Excel format with rich formatting
 */
export async function exportInvestorsToExcel(
  investors: InvestorWithContacts[],
  filters?: ExportFilters
): Promise<Uint8Array> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Investors');

  // Add title row with filters
  worksheet.mergeCells('A1:T1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Investor Pipeline Export';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 25;

  // Add filter info
  if (filters) {
    let filterRow = 2;
    const filterTexts: string[] = [];
    if (filters.stage) filterTexts.push(`Stage: ${filters.stage}`);
    if (filters.relationship_owner) filterTexts.push(`Owner: ${filters.relationship_owner}`);
    if (filters.date_from) filterTexts.push(`From: ${filters.date_from}`);
    if (filters.date_to) filterTexts.push(`To: ${filters.date_to}`);

    if (filterTexts.length > 0) {
      worksheet.mergeCells(`A${filterRow}:T${filterRow}`);
      const filterCell = worksheet.getCell(`A${filterRow}`);
      filterCell.value = `Filters: ${filterTexts.join(' | ')}`;
      filterCell.font = { italic: true, size: 10 };
      filterRow++;
    }
  }

  // Add export timestamp
  const timestampRow = filters ? 3 : 2;
  worksheet.mergeCells(`A${timestampRow}:T${timestampRow}`);
  const timestampCell = worksheet.getCell(`A${timestampRow}`);
  timestampCell.value = `Exported: ${new Date().toLocaleString()}`;
  timestampCell.font = { italic: true, size: 9 };

  // Add headers
  const headerRow = timestampRow + 2;
  worksheet.getRow(headerRow).values = [
    'Firm Name',
    'Stage',
    'Owner',
    'Allocator Type',
    'Est. Value',
    'Entry Date',
    'Stage Entry Date',
    'Last Action',
    'Stalled',
    'Primary Contact',
    'Contact Email',
    'Contact Title',
    'Next Action',
    'Next Action Date',
    'Internal Conviction',
    'Internal Priority',
    'IC Timing',
    'Key Objection',
    'Strategy Notes',
    'Partner Source',
  ];

  // Style headers
  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRowObj.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 30 }, // Firm Name
    { width: 20 }, // Stage
    { width: 20 }, // Owner
    { width: 18 }, // Allocator Type
    { width: 12 }, // Est. Value
    { width: 12 }, // Entry Date
    { width: 15 }, // Stage Entry Date
    { width: 12 }, // Last Action
    { width: 10 }, // Stalled
    { width: 25 }, // Primary Contact
    { width: 30 }, // Contact Email
    { width: 20 }, // Contact Title
    { width: 30 }, // Next Action
    { width: 15 }, // Next Action Date
    { width: 15 }, // Internal Conviction
    { width: 15 }, // Internal Priority
    { width: 20 }, // IC Timing
    { width: 30 }, // Key Objection
    { width: 40 }, // Strategy Notes
    { width: 20 }, // Partner Source
  ];

  // Add data rows
  investors.forEach((inv, idx) => {
    const primaryContact = inv.primary_contact;
    const row = worksheet.getRow(headerRow + 1 + idx);

    row.values = [
      inv.firm_name,
      inv.stage,
      inv.relationship_owner,
      inv.allocator_type || '',
      inv.est_value || '',
      inv.entry_date || '',
      inv.stage_entry_date || '',
      inv.last_action_date || '',
      inv.stalled ? 'Yes' : 'No',
      primaryContact?.name || '',
      primaryContact?.email || '',
      primaryContact?.title || '',
      inv.next_action || '',
      inv.next_action_date || '',
      inv.internal_conviction || '',
      inv.internal_priority || '',
      inv.investment_committee_timing || '',
      inv.key_objection_risk || '',
      inv.current_strategy_notes || '',
      inv.partner_source || '',
    ];

    // Alternate row colors
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }

    // Highlight stalled investors
    if (inv.stalled) {
      row.getCell(9).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
      row.getCell(9).font = { bold: true, color: { argb: 'FFCC0000' } };
    }
  });

  // Add autofilter
  worksheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: 20 },
  };

  // Freeze header rows
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: headerRow }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/**
 * Escape CSV values containing special characters
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
