/**
 * Task data exporter
 * Supports CSV and Excel export for task tracking
 */

import { Workbook } from 'exceljs';
import type { TaskWithInvestor } from '@/types/tasks';

export interface TaskExportFilters {
  status?: string;
  priority?: string;
  investor_id?: string;
  overdue?: boolean;
  due_soon?: boolean;
  date_from?: string;
  date_to?: string;
}

/**
 * Export tasks to CSV format
 */
export function exportTasksToCSV(
  tasks: TaskWithInvestor[],
  filters?: TaskExportFilters
): string {
  if (tasks.length === 0) {
    return 'title,description,investor,status,priority,due_date,created_at,completed_at\n';
  }

  const headers = [
    'title',
    'description',
    'investor',
    'investor_stage',
    'status',
    'priority',
    'due_date',
    'created_at',
    'completed_at',
    'created_by',
    'completed_by',
  ];

  const rows = tasks.map((task) => {
    return [
      escapeCSV(task.title),
      escapeCSV(task.description || ''),
      escapeCSV(task.investor?.firm_name || ''),
      escapeCSV(task.investor?.stage || ''),
      task.status,
      task.priority,
      task.due_date || '',
      task.created_at.split('T')[0],
      task.completed_at ? task.completed_at.split('T')[0] : '',
      task.created_by || '',
      task.completed_by || '',
    ].join(',');
  });

  return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Export tasks to Excel format with rich formatting
 */
export async function exportTasksToExcel(
  tasks: TaskWithInvestor[],
  filters?: TaskExportFilters
): Promise<Uint8Array> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Add title row
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Task List Export';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 25;

  // Add filter info
  if (filters) {
    let filterRow = 2;
    const filterTexts: string[] = [];
    if (filters.status && filters.status !== 'all') filterTexts.push(`Status: ${filters.status}`);
    if (filters.priority && filters.priority !== 'all') filterTexts.push(`Priority: ${filters.priority}`);
    if (filters.overdue) filterTexts.push('Overdue only');
    if (filters.due_soon) filterTexts.push('Due soon');

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
    'Title',
    'Description',
    'Investor',
    'Stage',
    'Status',
    'Priority',
    'Due Date',
    'Days Until Due',
    'Created',
    'Completed',
    'Created By',
  ];

  // Style headers
  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' },
  };
  headerRowObj.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 35 }, // Title
    { width: 45 }, // Description
    { width: 30 }, // Investor
    { width: 20 }, // Stage
    { width: 12 }, // Status
    { width: 10 }, // Priority
    { width: 12 }, // Due Date
    { width: 12 }, // Days Until Due
    { width: 12 }, // Created
    { width: 12 }, // Completed
    { width: 25 }, // Created By
  ];

  // Add data rows
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach((task, idx) => {
    const row = worksheet.getRow(headerRow + 1 + idx);

    // Calculate days until due
    let daysUntilDue = '';
    let isOverdue = false;
    if (task.due_date && task.status === 'pending') {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilDue = diffDays.toString();
      isOverdue = diffDays < 0;
    }

    row.values = [
      task.title,
      task.description || '',
      task.investor?.firm_name || '',
      task.investor?.stage || '',
      task.status,
      task.priority,
      task.due_date || '',
      daysUntilDue,
      task.created_at.split('T')[0],
      task.completed_at ? task.completed_at.split('T')[0] : '',
      task.created_by || '',
    ];

    // Alternate row colors
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }

    // Highlight overdue tasks
    if (isOverdue) {
      row.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' },
      };
      row.getCell(7).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.getCell(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' },
      };
      row.getCell(8).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    // Color code by priority
    const priorityCell = row.getCell(6);
    switch (task.priority) {
      case 'high':
        priorityCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        break;
      case 'medium':
        priorityCell.font = { color: { argb: 'FFFF9900' } };
        break;
      case 'low':
        priorityCell.font = { color: { argb: 'FF808080' } };
        break;
    }

    // Color code by status
    const statusCell = row.getCell(5);
    if (task.status === 'completed') {
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
