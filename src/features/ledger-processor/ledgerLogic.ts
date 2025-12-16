import { LedgerConfig, ProcessedData } from './LedgerProcessor';

export const processLedgerFile = async (
  file: File,
  config: LedgerConfig
): Promise<ProcessedData> => {
  // Lazy load xlsx library only when processing a file
  const XLSX = await import('xlsx');
  
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
  date: string | number;
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
        'Date': formatDate(cachedHeader.date),
        'Header Group Name': cachedHeader.headerGroupName,
        'Cost Centre': costCentre,
        'Transaction Type': transactionType,
        'Amount': normalizedAmount,
        'Description': row[4]?.toString().trim() || '',
      });
    } else {
      // This is a header/context row - update cache
      // Check if row has a date (typically in column A, index 0)
      const potentialDate = row[0];
      if (potentialDate !== undefined && potentialDate !== null && potentialDate !== '') {
        // Accept both numeric (Excel serial) and string dates
        const dateValue = typeof potentialDate === 'number' ? potentialDate : potentialDate.toString().trim();
        if (dateValue && (typeof dateValue === 'number' || isValidDate(dateValue))) {
          cachedHeader.date = dateValue;
        }
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

const formatDate = (dateValue: string | number): string => {
  if (!dateValue) return '';
  
  // If it's already a string, check if it's in the expected format (D-MMM-YY or similar)
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    // If it looks like a date string (contains month abbreviation), use it as-is
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hasMonthAbbr = monthNames.some(month => trimmed.includes(month));
    if (hasMonthAbbr) {
      return trimmed; // Preserve the original format
    }
  }
  
  // Check if it's an Excel serial date (numeric)
  const numericValue = typeof dateValue === 'number' ? dateValue : parseFloat(dateValue.toString());
  
  if (!isNaN(numericValue) && numericValue > 0 && numericValue < 1000000) {
    // Excel serial date conversion (reasonable range check)
    // Excel epoch: January 1, 1900 (but incorrectly treats 1900 as leap year)
    // Subtract 2 to account for Excel's leap year bug and 0-indexing
    const excelEpoch = new Date(1900, 0, 1).getTime();
    const jsDate = new Date((numericValue - 2) * 86400000 + excelEpoch);
    
    // Format as D-MMM-YY (e.g., 3-Apr-25)
    const day = jsDate.getDate(); // No padding, single digit is fine
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[jsDate.getMonth()];
    const year = String(jsDate.getFullYear()).slice(-2); // Last 2 digits of year
    
    return `${day}-${month}-${year}`;
  }
  
  // If it's a string that can be parsed as a date, format it
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    }
  }
  
  // Return as-is if we can't parse it
  return dateValue.toString();
};

