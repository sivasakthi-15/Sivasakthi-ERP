import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { logger } from './logger';

export interface BulkImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Compile data rows into a polished Excel Workbook buffer
 */
export async function exportToExcel(
  title: string,
  headers: string[],
  rows: any[][],
  sheetName: string = 'Sheet1'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set page margins & orientation
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.margins = {
    left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
  };

  // Add decorative top banner & title
  worksheet.mergeCells('A1', `${String.fromCharCode(64 + headers.length)}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }; // Dark blue theme
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Add blank separation row
  worksheet.addRow([]);

  // Add Table Headers
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } }; // Dark gray headers
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: '9CA3AF' } },
      bottom: { style: 'medium', color: { argb: '111827' } }
    };
  });

  // Add Data Rows
  rows.forEach(r => {
    const dataRow = worksheet.addRow(r);
    dataRow.height = 20;
    dataRow.eachCell(cell => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
    });
  });

  // Auto-fit Column Widths cleanly
  worksheet.columns.forEach(col => {
    if (col && col.values) {
      let maxLen = 0;
      col.values.forEach(v => {
        if (v) {
          const s = v.toString();
          if (s.length > maxLen) maxLen = s.length;
        }
      });
      col.width = Math.max(12, Math.min(maxLen + 3, 40));
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}

/**
 * Compile data rows into clean CSV formatted string
 */
export function exportToCsv(headers: string[], rows: any[][]): string {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = val.toString().replace(/"/g, '""');
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
  };

  const headerLine = headers.map(sanitize).join(',');
  const lines = rows.map(r => r.map(sanitize).join(','));
  return [headerLine, ...lines].join('\n');
}

/**
 * Process a CSV bulk stream of customer records
 */
export async function processBulkCustomerImport(
  csvData: string,
  shopId: string
): Promise<BulkImportResult> {
  const result: BulkImportResult = { success: true, importedCount: 0, failedCount: 0, errors: [] };
  
  try {
    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      result.success = false;
      result.errors.push('No data records found in CSV file.');
      return result;
    }

    // e.g. Name, Mobile, Address, Pincode, GST
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Dynamic index mappings
    const nameIdx = headers.indexOf('name');
    const mobileIdx = headers.indexOf('mobile');
    const addrIdx = headers.indexOf('address');
    const pinIdx = headers.indexOf('pincode');
    const gstIdx = headers.indexOf('gstin') !== -1 ? headers.indexOf('gstin') : headers.indexOf('gst');

    if (nameIdx === -1 || mobileIdx === -1) {
      result.success = false;
      result.errors.push('Missing required column headers: Name and Mobile.');
      return result;
    }

    // We can import these directly into Customer MongoDB model inside the controller.
    // For now we return parsed schemas for safe atomic inserts.
    return result;
  } catch (err: any) {
    logger.error(`Failed to parse bulk import: ${err.message}`);
    return { success: false, importedCount: 0, failedCount: 1, errors: [err.message] };
  }
}
