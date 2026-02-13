export interface ProcessedPayrollData {
  data: any[];
  success: boolean;
  message: string;
}

// Static mapping: Row Labels (Cost Centre) -> Cost Centre As Per Books
const COST_CENTRE_AS_PER_BOOKS_MAP: { [key: string]: string } = {
  'Admin': 'Facilities',
  'AI/ML Delivery': 'AL/MI Delivery',
  'Cloud': 'Cloud Solutions',
  'Corporate': 'Corporate',
  'Cyber Security': 'Cyber Security',
  'Data & Insights': 'Data Engeering',
  'Executive Management': 'Corporate',
  'Finance': 'Finance',
  'HR': 'HR',
  'Internal IT': 'IT Hyderabad',
  'Product Engeering': 'Product Engeering',
  'Product Engineering': 'Product Engeering',
  'Quality Engineering': 'Quality Engineering',
  'Sales': 'Sales',
  'Staffing': 'Eknazar',
  'Talent Acquisition': 'Talent Acquisation'
};

// Static mapping: Row Labels (Cost Centre) -> Direct/Indirect
const DIRECT_INDIRECT_MAP: { [key: string]: string } = {
  'Admin': 'Indirect',
  'AI/ML Delivery': 'Direct',
  'Cloud': 'Direct',
  'Corporate': 'Indirect',
  'Cyber Security': 'Direct',
  'Data & Insights': 'Direct',
  'Executive Management': 'Indirect',
  'Finance': 'Indirect',
  'HR': 'Indirect',
  'Internal IT': 'Indirect',
  'Product Engeering': 'Direct',
  'Product Engineering': 'Direct',
  'Quality Engineering': 'Direct',
  'Sales': 'Indirect',
  'Staffing': 'Indirect',
  'Talent Acquisition': 'Indirect'
};

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

// Define the 30 required output columns in exact order
const REQUIRED_OUTPUT_COLUMNS = [
  'Row Labels',
  'Cost Centre As Per Books',
  'Direct/Indirect',
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
  const { loadWorkbookFromFile, getSheetNames, getWorksheet, getSheetRows } = await import('../../utils/excelReader');
  const workbook = await loadWorkbookFromFile(file);
  const names = getSheetNames(workbook);
  const actualSheetName = sheetName && names.includes(sheetName) ? sheetName : names[0];
  const worksheet = getWorksheet(workbook, actualSheetName);
  const jsonData = getSheetRows(worksheet) as any[][];

  if (jsonData.length === 0) {
    throw new Error('The sheet is empty');
  }

  const headers = jsonData[0] as string[];
        
  const costCentreIndex = headers.findIndex(
    (h: string) => h && h.toString().trim() === 'Cost Centre'
  );

  if (costCentreIndex === -1) {
    throw new Error(
      `"Cost Centre" column not found in the sheet. Available columns: ${headers.filter(h => h).join(', ')}`
    );
  }

  const columnIndexMap: { [key: string]: number } = {};
  headers.forEach((header, index) => {
    if (header) {
      columnIndexMap[header.toString().trim()] = index;
    }
  });

  const groupedData: { [key: string]: any[][] } = {};
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const costCentre = row[costCentreIndex];
    if (costCentre === null || costCentre === undefined || costCentre === '') {
      continue;
    }

    const costCentreKey = costCentre.toString().trim();
    if (!groupedData[costCentreKey]) {
      groupedData[costCentreKey] = [];
    }
    groupedData[costCentreKey].push(row);
  }

  const result: any[] = [];
  for (const costCentre in groupedData) {
    const rows = groupedData[costCentre];
    const outputRow: any = {
      'Row Labels': costCentre
    };
    outputRow['Cost Centre As Per Books'] = COST_CENTRE_AS_PER_BOOKS_MAP[costCentre] || costCentre;
    outputRow['Direct/Indirect'] = DIRECT_INDIRECT_MAP[costCentre] || '';

    for (let i = 3; i < REQUIRED_OUTPUT_COLUMNS.length; i++) {
      const outputColumn = REQUIRED_OUTPUT_COLUMNS[i];
      const sourceColumn = COLUMN_MAPPING[outputColumn];
      let sum = 0;
      if (sourceColumn) {
        const trimmedSourceColumn = sourceColumn.trim();
        if (columnIndexMap.hasOwnProperty(trimmedSourceColumn)) {
          const sourceIndex = columnIndexMap[trimmedSourceColumn];
          for (const row of rows) {
            sum += cleanNumericValue(row[sourceIndex]);
          }
        }
      }
      outputRow[outputColumn] = sum;
    }
    result.push(outputRow);
  }

  const finalResult = result.map(row => {
    const orderedRow: any = {};
    REQUIRED_OUTPUT_COLUMNS.forEach(col => {
      if (col === 'Row Labels' || col === 'Cost Centre As Per Books' || col === 'Direct/Indirect') {
        orderedRow[col] = row[col] !== undefined ? row[col] : '';
      } else {
        orderedRow[col] = row[col] !== undefined ? row[col] : 0;
      }
    });
    return orderedRow;
  });

  const grandTotalRow: any = {
    'Row Labels': 'Grand Total',
    'Cost Centre As Per Books': '',
    'Direct/Indirect': ''
  };
  for (let i = 3; i < REQUIRED_OUTPUT_COLUMNS.length; i++) {
    const column = REQUIRED_OUTPUT_COLUMNS[i];
    let total = 0;
    for (const row of finalResult) {
      total += cleanNumericValue(row[column]);
    }
    grandTotalRow[column] = total;
  }
  finalResult.push(grandTotalRow);

  return {
    data: finalResult,
    success: true,
    message: `Successfully processed ${finalResult.length - 1} cost centres from sheet "${actualSheetName}" (including Grand Total)`,
  };
};

