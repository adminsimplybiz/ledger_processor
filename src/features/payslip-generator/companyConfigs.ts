/**
 * Company configurations for Payslip Generator.
 * Each company has its own payroll column mapping and payslip template.
 * To add a new company: add config here + add template component.
 */

export type CompanyId = 'sunstripe' | 'valuestream' | 'vira';

export interface CompanyConfig {
  id: CompanyId;
  label: string;
  /** Zero-based row index where headers are (e.g. 4 for Sunstripe, 1 for Vira) */
  headerRowIndex: number;
  /** Name of sheet containing payroll (used when multiple sheets exist) */
  defaultSheetName: string;
  /** Maps logical field names to Excel column headers. Match is trim + case-insensitive. */
  columnMap: Record<string, string>;
  /** Company name for payslip header */
  companyName: string;
  /** Company address for payslip footer */
  companyAddress: string;
}

export const COMPANIES: CompanyConfig[] = [
  {
    id: 'sunstripe',
    label: 'Sunstripe',
    headerRowIndex: 4,
    defaultSheetName: 'January 2026',
    companyName: 'SUNSTRIPE ENERGY TECHNOLOGIES PRIVATE LIMITED',
    companyAddress: 'Level 16, H-Tower, Raheja Commerzone, Raidurg, Hyderabad, Shaikpet, Telangana, India, 500081',
    columnMap: {
      employeeName: 'Employee Name',
      designation: 'Designation',
      empId: 'Emp ID',
      location: 'Location',
      dateOfJoining: 'Date of Joining',
      effectiveDays: 'Effective Working Days',
      daysInMonth: 'Days in Month',
      bankName: 'Bank Name',
      bankAccount: 'Bank A/c No',
      ifscCode: 'IFSC Code',
      pfUan: 'PF UAN',
      panNo: 'PAN No',
      lop: 'LOP',
      basic: 'Basic',
      hra: 'HRA',
      conveyance: 'Conveyance',
      medicalAllowance: 'Medical  Allowance',
      childrenAllowance: 'Childeren Education Allowance',
      lta: 'LTA',
      specialAllowance: 'Spl. Allow',
      arrears: 'Arrears',
      otherPayments: 'Other Payments',
      grossEarning: 'Gross Earning',
      totalEarnings: 'Gross Earning',
      pfEmployee: 'PF',
      pfEmployer: 'PF',
      esi: 'ESI',
      professionalTax: 'PT',
      tds: 'TDS',
      salaryAdvanceRecovery: 'Salary Advance Recovery',
      otherDeduction: 'Other Deduction',
      totalDeductions: 'Gross Deduction',
      netPay: 'Net Pay',
    },
  },
  {
    id: 'valuestream',
    label: 'Value Stream',
    headerRowIndex: 1,
    defaultSheetName: 'Payregister',
    companyName: 'VALUESTREAM ANALYTICS PRIVATE LIMITED',
    companyAddress: 'FLAT NO 902 BLOCK A, HALLMARK VICINIA, Gachibowli, K.V.Rangareddy, Seri Lingampally, Telangana, India, 500032',
    columnMap: {
      employeeName: 'Employee Name',
      designation: 'Designation',
      empId: 'Emp ID',
      location: 'Location ',
      dateOfJoining: 'Date of Joining',
      effectiveDays: 'Effective working days',
      daysInMonth: 'Days in Month',
      bankName: 'Bank Name',
      bankAccount: 'Bank Account No',
      ifscCode: 'IFSC Code',
      pfUan: 'PF UAN',
      panNo: 'PAN No.',
      lop: 'LOP',
      basic: 'Basic',
      hra: 'HRA',
      childrenAllowance: 'Children Allowance',
      statutoryBonus: 'Statutory bonus',
      lta: 'Leave travel allowance',
      otherAllowances: 'Other allowances',
      grossEarning: 'Gross salary',
      totalEarnings: 'Total earnings',
      pfEmployer: 'PF Employer',
      pfEmployee: 'PF Employee',
      professionalTax: 'Professional Tax',
      tds: 'TDS',
      totalDeductions: 'Total deductions',
      netPay: 'Net pay for the Month',
    },
  },
  {
    id: 'vira',
    label: 'Vira',
    headerRowIndex: 1,
    defaultSheetName: 'Payroll',
    companyName: 'VIRA INSIGHT INDIA PRIVATE LIMITED',
    companyAddress: '1st Floor, Golden Heights, Plot No 9/1, Sector III, Madhapur, Hyderabad, Telangana - 500081',
    columnMap: {
      employeeName: 'Employee Name',
      designation: 'Designation',
      empId: 'Employee ID',
      location: 'Location',
      dateOfJoining: 'Date of Joining',
      effectiveDays: 'Effective Working Days',
      daysInMonth: 'Days in Month',
      bankName: 'Bank Name',
      bankAccount: 'Bank Account No',
      ifscCode: 'IFSC Code',
      pfUan: 'PF UAN',
      esiNo: 'EIS NO',
      panNo: 'PAN No.',
      lop: 'LOP',
      basic: 'Basic',
      hra: 'HRA',
      lta: 'Leave travel allowance',
      telephoneAllowance: 'Telephone allowance',
      transportAllowance: 'Transport Allowance',
      arrearsSalary: 'Arrers Salary',
      otherAllowances: 'Other allowances',
      grossEarning: 'Gross salary',
      totalEarnings: 'Total earnings',
      pfEmployer: 'PF Employer',
      pfEmployee: 'PF Employee',
      professionalTax: 'Professional tax',
      tds: 'TDS',
      totalDeductions: 'Total deductions',
      netPay: 'Net pay for the Month',
    },
  },
];

export function getCompanyConfig(id: CompanyId): CompanyConfig {
  const config = COMPANIES.find((c) => c.id === id);
  if (!config) throw new Error(`Unknown company: ${id}`);
  return config;
}
