import * as XLSX from 'xlsx';
import { LedgerConfig, ProcessedData } from './LedgerProcessor';

export const processLedgerFile = async (
  file: File,
  config: LedgerConfig
): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON array
        // sheet_to_json's typings use unknown[][] when header: 1, but our downstream
        // transformer expects a 2D array of cell-like values, so we safely cast here.
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];
        
        // Process the data
        const processed = transformLedgerData(rawData, config);
        
        resolve({
          data: processed,
          success: true,
          message: `Successfully processed ${processed.length} transactions`,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

interface CachedHeader {
  date: string;
  headerGroupName: string;
}

const transformLedgerData = (
  rawData: any[][],
  config: LedgerConfig
): any[] => {
  const result: any[] = [];
  let cachedHeader: CachedHeader = { date: '', headerGroupName: '' };

  // Skip first two rows (metadata)
  const dataRows = rawData.slice(2);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    // Skip empty rows
    if (!row || row.length === 0) continue;

    // Check if this is a transaction row (contains "DR" or "CR" in column D, index 3)
    const transactionType = row[3]?.toString().trim().toUpperCase();
    const isTransaction = transactionType === 'DR' || transactionType === 'CR';

    if (isTransaction) {
      // This is a transaction row - merge with cached header context
      const amount = parseFloat(row[2] || 0) || 0;
      const normalizedAmount = transactionType === 'CR' ? -1 * amount : amount;
      const costCentre = row[config.costCentreIndex]?.toString().trim() || '';

      result.push({
        Date: cachedHeader.date,
        'Header Group Name': cachedHeader.headerGroupName,
        'Cost Centre': costCentre,
        'Transaction Type': transactionType,
        'Amount': normalizedAmount,
        'Original Amount': amount,
        'Description': row[4]?.toString().trim() || '',
      });
    } else {
      // This is a header/context row - update cache
      // Check if row has a date (typically in column A, index 0)
      const potentialDate = row[0]?.toString().trim();
      if (potentialDate && isValidDate(potentialDate)) {
        cachedHeader.date = potentialDate;
      }

      // Check if row has a header group name in the configured column
      const potentialHeaderGroup = row[config.headerGroupNameIndex]?.toString().trim();
      if (potentialHeaderGroup && potentialHeaderGroup.length > 0) {
        cachedHeader.headerGroupName = potentialHeaderGroup;
      }
    }
  }

  return result;
};

const isValidDate = (dateString: string): boolean => {
  // Try to parse as date - Excel dates might be in various formats
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

