/**
 * Activities/interactions data exporter
 * Supports CSV and Excel export for activity history
 */

import { Workbook } from 'exceljs';
import type { Activity } from '@/types/investors';

export interface ActivityExportFilters {
  investor_id?: string;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
  created_by?: string;
}

export interface ActivityWithInvestor extends Activity {
  investor_firm_name?: string;
}

/**
 * Export activities to CSV format
 */
export function exportActivitiesToCSV(
  activities: ActivityWithInvestor[],
  filters?: ActivityExportFilters
): string {
  if (activities.length === 0) {
    return 'date,investor,activity_type,description,created_by\n';
  }

  const headers = [
    'date',
    'investor',
    'activity_type',
    'description',
    'created_by',
    'metadata',
  ];

  const rows = activities.map((activity) => {
    return [
      activity.created_at.split('T')[0], // Date only
      escapeCSV(activity.investor_firm_name || ''),
      activity.activity_type,
      escapeCSV(activity.description),
      activity.created_by || '',
      activity.metadata ? escapeCSV(JSON.stringify(activity.metadata)) : '',
    ].join(',');
  });

  return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Export activities to Excel format with rich formatting
 */
export async function exportActivitiesToExcel(
  activities: ActivityWithInvestor[],
  filters?: ActivityExportFilters
): Promise<Uint8Array> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Activities');

  // Add title row
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Activity History Export';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 25;

  // Add filter info
  if (filters) {
    let filterRow = 2;
    const filterTexts: string[] = [];
    if (filters.activity_type) filterTexts.push(`Type: ${filters.activity_type}`);
    if (filters.date_from) filterTexts.push(`From: ${filters.date_from}`);
    if (filters.date_to) filterTexts.push(`To: ${filters.date_to}`);

    if (filterTexts.length > 0) {
      worksheet.mergeCells(`A${filterRow}:F${filterRow}`);
      const filterCell = worksheet.getCell(`A${filterRow}`);
      filterCell.value = `Filters: ${filterTexts.join(' | ')}`;
      filterCell.font = { italic: true, size: 10 };
    }
  }

  // Add export timestamp
  const timestampRow = 3;
  worksheet.mergeCells(`A${timestampRow}:F${timestampRow}`);
  const timestampCell = worksheet.getCell(`A${timestampRow}`);
  timestampCell.value = `Exported: ${new Date().toLocaleString()}`;
  timestampCell.font = { italic: true, size: 9 };

  // Add headers
  const headerRow = 5;
  worksheet.getRow(headerRow).values = [
    'Date',
    'Time',
    'Investor',
    'Activity Type',
    'Description',
    'Created By',
  ];

  // Style headers
  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' },
  };
  headerRowObj.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 12 }, // Date
    { width: 10 }, // Time
    { width: 30 }, // Investor
    { width: 15 }, // Activity Type
    { width: 50 }, // Description
    { width: 25 }, // Created By
  ];

  // Add data rows
  activities.forEach((activity, idx) => {
    const datetime = new Date(activity.created_at);
    const row = worksheet.getRow(headerRow + 1 + idx);

    row.values = [
      datetime.toLocaleDateString(),
      datetime.toLocaleTimeString(),
      activity.investor_firm_name || '',
      activity.activity_type,
      activity.description,
      activity.created_by || '',
    ];

    // Alternate row colors
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }

    // Color code by activity type
    const typeCell = row.getCell(4);
    switch (activity.activity_type) {
      case 'stage_change':
        typeCell.font = { color: { argb: 'FF0070C0' }, bold: true };
        break;
      case 'meeting':
        typeCell.font = { color: { argb: 'FF00B050' }, bold: true };
        break;
      case 'email':
        typeCell.font = { color: { argb: 'FF7030A0' } };
        break;
      case 'call':
        typeCell.font = { color: { argb: 'FFFF6600' } };
        break;
    }
  });

  // Add autofilter
  worksheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: 6 },
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
