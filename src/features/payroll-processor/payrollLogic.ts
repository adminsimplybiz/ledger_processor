export interface ProcessedPayrollData {
  data: any[];
  success: boolean;
  message: string;
}

const cleanNumericValue = (value: any): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // If it's already a number, return it
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Convert to string and remove commas, spaces, and other non-numeric characters
  const str = String(value).trim();
  const cleaned = str.replace(/[^\d.-]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Define the 28 required output columns in exact order
const REQUIRED_OUTPUT_COLUMNS = [
  'Row Labels',
  'Sum of Basic',
  'Sum of Food Coupon',
  'Sum of Basic Arrears',
  'Sum of HRA',
  'Sum of HRA Arrears',
  'Sum of Statutory Bonus',
  'Sum of OTHERS',
  'Sum of Statutory Bonus Arrears',
  'Sum of Special Allowances',
  'Sum of Special Allowances Arrears',
  'Sum of LTA',
  'Sum of LTA Arrears',
  'Sum of Food Coupon Arrears',
  'Sum of Other Allowance',
  'Sum of Other Allowance Arrears',
  'Sum of BONUS',
  'Sum of INCENTIVE',
  'Sum of ARREARS',
  'Sum of VARIABLE PAY',
  'Sum of SHIFT ALLOWANCE',
  'Sum of VARIABLE PERFORMANCE PAY',
  'Sum of TDS',
  'Sum of Professional Tax',
  'Sum of Provident Fund',
  'Sum of Provident Fund Arrears',
  'Sum of OTHER RECOVERIES',
  'Sum of Mediclaim Insurance Recovery'
];

// Map output column names to source column names (without "Sum of" prefix)
const COLUMN_MAPPING: { [key: string]: string } = {
  'Row Labels': 'Cost Centre',
  'Sum of Basic': 'Basic',
  'Sum of Food Coupon': 'Food Coupon',
  'Sum of Basic Arrears': 'Basic Arrears',
  'Sum of HRA': 'HRA',
  'Sum of HRA Arrears': 'HRA Arrears',
  'Sum of Statutory Bonus': 'Statutory Bonus',
  'Sum of OTHERS': 'OTHERS',
  'Sum of Statutory Bonus Arrears': 'Statutory Bonus Arrears',
  'Sum of Special Allowances': 'Special Allowances',
  'Sum of Special Allowances Arrears': 'Special Allowances Arrears',
  'Sum of LTA': 'LTA',
  'Sum of LTA Arrears': 'LTA Arrears',
  'Sum of Food Coupon Arrears': 'Food Coupon Arrears',
  'Sum of Other Allowance': 'Other Allowance',
  'Sum of Other Allowance Arrears': 'Other Allowance Arrears',
  'Sum of BONUS': 'BONUS',
  'Sum of INCENTIVE': 'INCENTIVE',
  'Sum of ARREARS': 'ARREARS',
  'Sum of VARIABLE PAY': 'VARIABLE PAY',
  'Sum of SHIFT ALLOWANCE': 'SHIFT ALLOWANCE',
  'Sum of VARIABLE PERFORMANCE PAY': 'VARIABLE PERFORMANCE PAY',
  'Sum of TDS': 'TDS',
  'Sum of Professional Tax': 'Professional Tax',
  'Sum of Provident Fund': 'Provident Fund',
  'Sum of Provident Fund Arrears': 'Provident Fund Arrears',
  'Sum of OTHER RECOVERIES': 'OTHER RECOVERIES',
  'Sum of Mediclaim Insurance Recovery': 'Mediclaim Insurance Recovery'
};

export const processPayrollFile = async (
  file: File,
  sheetName?: string
): Promise<ProcessedPayrollData> => {
  // Lazy load xlsx library only when processing a file
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use specified sheet name if provided, otherwise use first sheet
        let actualSheetName: string;
        let worksheet;
        
        if (sheetName && workbook.SheetNames.includes(sheetName)) {
          actualSheetName = sheetName;
          worksheet = workbook.Sheets[sheetName];
        } else {
          // Use first sheet if no sheet name specified or sheet not found
          actualSheetName = workbook.SheetNames[0];
          worksheet = workbook.Sheets[actualSheetName];
        }

        // Convert to JSON with headers (first row as column names)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];

        if (jsonData.length === 0) {
          throw new Error('The sheet is empty');
        }

        // First row contains headers
        const headers = jsonData[0] as string[];
        
        // Find the index of "Cost Centre" column
        const costCentreIndex = headers.findIndex(
          (h: string) => h && h.toString().trim() === 'Cost Centre'
        );

        if (costCentreIndex === -1) {
          throw new Error(
            `"Cost Centre" column not found in the sheet. Available columns: ${headers.filter(h => h).join(', ')}`
          );
        }

        // Create a map of column name to index for quick lookup
        const columnIndexMap: { [key: string]: number } = {};
        headers.forEach((header, index) => {
          if (header) {
            columnIndexMap[header.toString().trim()] = index;
          }
        });

        // Group data by Cost Centre
        const groupedData: { [key: string]: any[][] } = {};
        
        // Process data rows (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const costCentre = row[costCentreIndex];
          if (costCentre === null || costCentre === undefined || costCentre === '') {
            continue; // Skip rows without Cost Centre
          }

          const costCentreKey = costCentre.toString().trim();
          if (!groupedData[costCentreKey]) {
            groupedData[costCentreKey] = [];
          }
          groupedData[costCentreKey].push(row);
        }

        // Process each group and create output rows
        const result: any[] = [];

        for (const costCentre in groupedData) {
          const rows = groupedData[costCentre];
          const outputRow: any = {
            'Row Labels': costCentre
          };

          // Process each required output column (skip "Row Labels")
          for (let i = 1; i < REQUIRED_OUTPUT_COLUMNS.length; i++) {
            const outputColumn = REQUIRED_OUTPUT_COLUMNS[i];
            const sourceColumn = COLUMN_MAPPING[outputColumn];
            
            let sum = 0;
            
            if (sourceColumn) {
              // Trim the source column name to match how it's stored in the map
              const trimmedSourceColumn = sourceColumn.trim();
              if (columnIndexMap.hasOwnProperty(trimmedSourceColumn)) {
                const sourceIndex = columnIndexMap[trimmedSourceColumn];
                
                // Sum all values in this column for this Cost Centre
                for (const row of rows) {
                  const value = row[sourceIndex];
                  sum += cleanNumericValue(value);
                }
              }
            }
            // If column is missing, sum remains 0 (as required)

            outputRow[outputColumn] = sum;
          }

          result.push(outputRow);
        }

        // Ensure output has exactly 28 columns in the correct order
        const finalResult = result.map(row => {
          const orderedRow: any = {};
          REQUIRED_OUTPUT_COLUMNS.forEach(col => {
            orderedRow[col] = row[col] !== undefined ? row[col] : 0;
          });
          return orderedRow;
        });

        // Add Grand Total row
        const grandTotalRow: any = {
          'Row Labels': 'Grand Total'
        };

        // Sum all numeric columns across all cost centres
        for (let i = 1; i < REQUIRED_OUTPUT_COLUMNS.length; i++) {
          const column = REQUIRED_OUTPUT_COLUMNS[i];
          let total = 0;
          
          for (const row of finalResult) {
            total += cleanNumericValue(row[column]);
          }
          
          grandTotalRow[column] = total;
        }

        // Add grand total row to the result
        finalResult.push(grandTotalRow);

        resolve({
          data: finalResult,
          success: true,
          message: `Successfully processed ${finalResult.length - 1} cost centres from sheet "${actualSheetName}" (including Grand Total)`,
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

