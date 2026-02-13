/**
 * Unified payslip data shape consumed by all company templates.
 * Fields are optional - each company uses what it has.
 */
export interface PayslipData {
  // Header
  employeeName: string;
  designation: string;
  empId: string;
  location: string;
  dateOfJoining: string;
  effectiveDays: string;
  daysInMonth: string;
  lop: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  pfUan: string;
  panNo: string;
  esiNo?: string;
  monthLabel: string;

  // Earnings (all numeric as number)
  basic: number;
  hra: number;
  conveyance?: number;
  medicalAllowance?: number;
  childrenAllowance?: number;
  statutoryBonus?: number;
  lta: number;
  specialAllowance?: number;
  telephoneAllowance?: number;
  transportAllowance?: number;
  arrearsSalary?: number;
  arrears?: number;
  otherPayments?: number;
  otherAllowances?: number;
  grossEarning: number;
  pfEmployer: number;
  totalEarnings: number;

  // Deductions
  pfEmployee: number;
  professionalTax: number;
  tds: number;
  totalDeductions: number;
  netPay: number;

  // Meta
  companyName: string;
  companyAddress: string;
}
