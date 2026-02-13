/**
 * Parses payroll Excel and maps rows to PayslipData per company config.
 */
import type { CompanyId } from './companyConfigs';
import { getCompanyConfig } from './companyConfigs';
import type { PayslipData } from './types';

const cleanNum = (v: unknown): number => {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const s = String(v).replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const formatExcelDate = (v: unknown): string => {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && v > 0 && v < 1000000) {
    const d = new Date((v - 2) * 86400000 + new Date(1900, 0, 1).getTime());
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${months[d.getMonth()]}-${year}`;
  }
  return String(v);
};

/** Derive month label from sheet name, e.g. "January 2026" -> "Jan 2026" */
const monthFromSheetName = (name: string): string => {
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const m = name.match(new RegExp(`(${fullMonths.join('|')})\\s*'?(\\d{2,4})`, 'i'));
  if (m) {
    const short = m[1].slice(0, 3);
    const year = m[2].length === 2 ? m[2] : m[2].slice(-2);
    return `${short} ${year}`;
  }
  return name;
};

export interface ParseResult {
  data: PayslipData[];
  monthLabel: string;
  sheetName: string;
}

export async function parsePayrollExcel(
  file: File,
  companyId: CompanyId,
  sheetName?: string
): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const config = getCompanyConfig(companyId);

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

  const targetSheet = sheetName && wb.SheetNames.includes(sheetName)
    ? sheetName
    : config.defaultSheetName && wb.SheetNames.includes(config.defaultSheetName)
      ? config.defaultSheetName
      : wb.SheetNames[0];

  const ws = wb.Sheets[targetSheet];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  const headerRow = raw[config.headerRowIndex] as unknown[];
  const headers = headerRow.map((h) => String(h ?? '').trim());

  // Build field -> column index
  const fieldToIndex: Record<string, number> = {};
  for (const [field, excelHeader] of Object.entries(config.columnMap)) {
    const want = String(excelHeader).trim().toLowerCase();
    const idx = headers.findIndex((h) => h.trim().toLowerCase() === want);
    if (idx >= 0) fieldToIndex[field] = idx;
  }

  const get = (row: unknown[], field: string): unknown => {
    const i = fieldToIndex[field];
    return i >= 0 ? row[i] : undefined;
  };

  const result: PayslipData[] = [];

  for (let r = config.headerRowIndex + 1; r < raw.length; r++) {
    const row = raw[r] as unknown[];
    const name = String(get(row, 'employeeName') ?? '').trim();
    if (!name) continue;

    const basic = cleanNum(get(row, 'basic'));
    const hra = cleanNum(get(row, 'hra'));
    const grossEarning = cleanNum(get(row, 'grossEarning')) || (basic + hra + cleanNum(get(row, 'conveyance')) + cleanNum(get(row, 'medicalAllowance')) + cleanNum(get(row, 'childrenAllowance')) + cleanNum(get(row, 'lta')) + cleanNum(get(row, 'specialAllowance')) + cleanNum(get(row, 'arrears')) + cleanNum(get(row, 'otherPayments')) + cleanNum(get(row, 'otherAllowances')) + cleanNum(get(row, 'statutoryBonus')) + cleanNum(get(row, 'telephoneAllowance')) + cleanNum(get(row, 'transportAllowance')) + cleanNum(get(row, 'arrearsSalary')));

    const pfEmployer = cleanNum(get(row, 'pfEmployer'));
    const totalEarnings = cleanNum(get(row, 'totalEarnings')) || grossEarning + pfEmployer;
    const totalDeductions = cleanNum(get(row, 'totalDeductions'));
    const netPay = cleanNum(get(row, 'netPay')) || totalEarnings - totalDeductions;

    result.push({
      employeeName: name,
      designation: String(get(row, 'designation') ?? '').trim(),
      empId: String(get(row, 'empId') ?? '').trim(),
      location: String(get(row, 'location') ?? '').trim(),
      dateOfJoining: formatExcelDate(get(row, 'dateOfJoining')),
      effectiveDays: String(get(row, 'effectiveDays') ?? '').trim(),
      daysInMonth: String(get(row, 'daysInMonth') ?? '').trim(),
      lop: String(get(row, 'lop') ?? '').trim(),
      bankName: String(get(row, 'bankName') ?? '').trim(),
      bankAccount: String(get(row, 'bankAccount') ?? '').trim(),
      ifscCode: String(get(row, 'ifscCode') ?? '').trim().replace(/\r\n/g, ''),
      pfUan: String(get(row, 'pfUan') ?? '').trim(),
      panNo: String(get(row, 'panNo') ?? '').trim(),
      esiNo: fieldToIndex['esiNo'] >= 0 ? String(get(row, 'esiNo') ?? '').trim() : undefined,
      monthLabel: monthFromSheetName(targetSheet) || targetSheet,
      basic,
      hra,
      conveyance: cleanNum(get(row, 'conveyance')) || undefined,
      medicalAllowance: cleanNum(get(row, 'medicalAllowance')) || undefined,
      childrenAllowance: cleanNum(get(row, 'childrenAllowance')) || undefined,
      statutoryBonus: cleanNum(get(row, 'statutoryBonus')) || undefined,
      lta: cleanNum(get(row, 'lta')),
      specialAllowance: cleanNum(get(row, 'specialAllowance')) || undefined,
      telephoneAllowance: cleanNum(get(row, 'telephoneAllowance')) || undefined,
      transportAllowance: cleanNum(get(row, 'transportAllowance')) || undefined,
      arrearsSalary: cleanNum(get(row, 'arrearsSalary')) || undefined,
      arrears: cleanNum(get(row, 'arrears')) || undefined,
      otherPayments: cleanNum(get(row, 'otherPayments')) || undefined,
      otherAllowances: cleanNum(get(row, 'otherAllowances')) || undefined,
      grossEarning,
      pfEmployer,
      totalEarnings,
      pfEmployee: cleanNum(get(row, 'pfEmployee')),
      professionalTax: cleanNum(get(row, 'professionalTax')),
      tds: cleanNum(get(row, 'tds')),
      totalDeductions,
      netPay,
      companyName: config.companyName,
      companyAddress: config.companyAddress,
    });
  }

  return {
    data: result,
    monthLabel: monthFromSheetName(targetSheet) || targetSheet,
    sheetName: targetSheet,
  };
}
