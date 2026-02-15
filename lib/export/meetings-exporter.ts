/**
 * Meeting data exporter
 * Supports CSV and Excel export for meeting intelligence
 */

import { Workbook } from 'exceljs';
import type { MeetingWithDetails } from '@/types/meetings';

export interface MeetingExportFilters {
  investor_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Export meetings to CSV format
 */
export function exportMeetingsToCSV(
  meetings: MeetingWithDetails[],
  filters?: MeetingExportFilters
): string {
  if (meetings.length === 0) {
    return 'meeting_title,investor,meeting_date,duration_minutes,status,summary,sentiment,key_topics\n';
  }

  const headers = [
    'meeting_title',
    'investor',
    'investor_stage',
    'meeting_date',
    'duration_minutes',
    'status',
    'summary',
    'sentiment',
    'key_topics',
    'action_items_count',
    'objections_count',
  ];

  const rows = meetings.map((meeting) => {
    const transcript = meeting.transcript;
    return [
      escapeCSV(meeting.meeting_title),
      escapeCSV(meeting.investor?.firm_name || ''),
      escapeCSV(meeting.investor?.stage || ''),
      meeting.meeting_date.split('T')[0],
      meeting.duration_minutes || '',
      meeting.status,
      escapeCSV(transcript?.summary || ''),
      transcript?.sentiment || '',
      transcript?.key_topics ? escapeCSV(transcript.key_topics.join('; ')) : '',
      transcript?.action_items?.length || 0,
      transcript?.objections?.length || 0,
    ].join(',');
  });

  return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Export meetings to Excel format with rich formatting
 */
export async function exportMeetingsToExcel(
  meetings: MeetingWithDetails[],
  filters?: MeetingExportFilters
): Promise<Uint8Array> {
  const workbook = new Workbook();

  // Main meetings worksheet
  const worksheet = workbook.addWorksheet('Meetings');

  // Add title row
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Meeting Intelligence Export';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 25;

  // Add filter info
  if (filters) {
    let filterRow = 2;
    const filterTexts: string[] = [];
    if (filters.status) filterTexts.push(`Status: ${filters.status}`);
    if (filters.date_from) filterTexts.push(`From: ${filters.date_from}`);
    if (filters.date_to) filterTexts.push(`To: ${filters.date_to}`);

    if (filterTexts.length > 0) {
      worksheet.mergeCells(`A${filterRow}:K${filterRow}`);
      const filterCell = worksheet.getCell(`A${filterRow}`);
      filterCell.value = `Filters: ${filterTexts.join(' | ')}`;
      filterCell.font = { italic: true, size: 10 };
    }
  }

  // Add export timestamp
  const timestampRow = 3;
  worksheet.mergeCells(`A${timestampRow}:K${timestampRow}`);
  const timestampCell = worksheet.getCell(`A${timestampRow}`);
  timestampCell.value = `Exported: ${new Date().toLocaleString()}`;
  timestampCell.font = { italic: true, size: 9 };

  // Add headers
  const headerRow = 5;
  worksheet.getRow(headerRow).values = [
    'Meeting Title',
    'Investor',
    'Stage',
    'Date',
    'Duration (min)',
    'Status',
    'Summary',
    'Sentiment',
    'Key Topics',
    'Action Items',
    'Objections',
  ];

  // Style headers
  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF5B9BD5' },
  };
  headerRowObj.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 35 }, // Meeting Title
    { width: 30 }, // Investor
    { width: 20 }, // Stage
    { width: 12 }, // Date
    { width: 12 }, // Duration
    { width: 12 }, // Status
    { width: 50 }, // Summary
    { width: 12 }, // Sentiment
    { width: 40 }, // Key Topics
    { width: 10 }, // Action Items
    { width: 10 }, // Objections
  ];

  // Add data rows
  meetings.forEach((meeting, idx) => {
    const transcript = meeting.transcript;
    const row = worksheet.getRow(headerRow + 1 + idx);

    row.values = [
      meeting.meeting_title,
      meeting.investor?.firm_name || '',
      meeting.investor?.stage || '',
      meeting.meeting_date.split('T')[0],
      meeting.duration_minutes || '',
      meeting.status,
      transcript?.summary || '',
      transcript?.sentiment || '',
      transcript?.key_topics ? transcript.key_topics.join(', ') : '',
      transcript?.action_items?.length || 0,
      transcript?.objections?.length || 0,
    ];

    // Alternate row colors
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }

    // Color code by sentiment
    if (transcript?.sentiment) {
      const sentimentCell = row.getCell(8);
      switch (transcript.sentiment) {
        case 'positive':
          sentimentCell.font = { color: { argb: 'FF00B050' }, bold: true };
          break;
        case 'negative':
          sentimentCell.font = { color: { argb: 'FFFF0000' }, bold: true };
          break;
        case 'neutral':
          sentimentCell.font = { color: { argb: 'FF808080' } };
          break;
      }
    }

    // Highlight pending/failed status
    const statusCell = row.getCell(6);
    if (meeting.status === 'failed') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' },
      };
      statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (meeting.status === 'completed') {
      statusCell.font = { color: { argb: 'FF00B050' }, bold: true };
    }
  });

  // Add autofilter
  worksheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: 11 },
  };

  // Freeze header rows
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: headerRow }
  ];

  // Add action items worksheet if there are any meetings with action items
  const meetingsWithActions = meetings.filter(m => m.transcript?.action_items && m.transcript.action_items.length > 0);
  if (meetingsWithActions.length > 0) {
    const actionsSheet = workbook.addWorksheet('Action Items');

    actionsSheet.getRow(1).values = ['Meeting', 'Investor', 'Date', 'Action Item', 'Assignee', 'Due Date', 'Priority'];
    const actionsHeader = actionsSheet.getRow(1);
    actionsHeader.font = { bold: true };
    actionsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' },
    };

    actionsSheet.columns = [
      { width: 35 }, // Meeting
      { width: 30 }, // Investor
      { width: 12 }, // Date
      { width: 50 }, // Action Item
      { width: 25 }, // Assignee
      { width: 12 }, // Due Date
      { width: 10 }, // Priority
    ];

    let rowIdx = 2;
    meetingsWithActions.forEach((meeting) => {
      meeting.transcript?.action_items?.forEach((item) => {
        const row = actionsSheet.getRow(rowIdx);
        row.values = [
          meeting.meeting_title,
          meeting.investor?.firm_name || '',
          meeting.meeting_date.split('T')[0],
          item.description,
          item.assignee || '',
          item.due_date || '',
          item.priority || '',
        ];

        if (item.priority === 'high') {
          row.getCell(7).font = { color: { argb: 'FFFF0000' }, bold: true };
        }

        rowIdx++;
      });
    });
  }

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
