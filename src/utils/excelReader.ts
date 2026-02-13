/**
 * Read Excel files using ExcelJS (replaces vulnerable xlsx/SheetJS).
 * Returns sheet names and worksheet data as array of rows.
 */
import ExcelJS from 'exceljs';

export async function loadWorkbookFromBuffer(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

export function getSheetNames(workbook: ExcelJS.Workbook): string[] {
  return workbook.worksheets.map((ws) => ws.name);
}

/**
 * Get worksheet by name or first sheet.
 */
export function getWorksheet(workbook: ExcelJS.Workbook, sheetName?: string): ExcelJS.Worksheet {
  if (sheetName) {
    const ws = workbook.getWorksheet(sheetName);
    if (ws) return ws;
  }
  const first = workbook.worksheets[0];
  if (!first) throw new Error('Workbook has no worksheets');
  return first;
}

/**
 * Read worksheet as array of rows (same shape as XLSX sheet_to_json with header: 1).
 * Each row is an array of cell values; empty cells are ''.
 */
export function getSheetRows(worksheet: ExcelJS.Worksheet): unknown[][] {
  const rows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row, _rowNumber) => {
    const vals = (row.values as unknown[]) || [];
    // ExcelJS row.values is 1-based: [undefined, colA, colB, ...]
    const rowData = vals.slice(1).map((v) => (v === undefined || v === null ? '' : v));
    rows.push(rowData);
  });
  return rows;
}

/**
 * Load an Excel file (from File) and return workbook.
 */
export async function loadWorkbookFromFile(file: File): Promise<ExcelJS.Workbook> {
  const buffer = await file.arrayBuffer();
  return loadWorkbookFromBuffer(buffer);
}
