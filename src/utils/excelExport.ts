import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string = 'export'
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data with column headers
  const worksheetData: any[][] = [
    columns.map(col => col.header), // Header row
    ...data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Handle nested objects/arrays
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      })
    )
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map(col => ({
    wch: col.width || Math.max(col.header.length, 15)
  }));
  worksheet['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

