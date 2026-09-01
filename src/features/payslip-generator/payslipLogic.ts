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

const parseDynamicEarnings = (
  row: unknown[],
  headers: string[],
  fieldToIndex: Record<string, number>,
  startField: string,
  endField: string,
): Array<{ label: string; value: number }> => {
  const startIdx = fieldToIndex[startField];
  const endIdx = fieldToIndex[endField];
  if (startIdx === undefined || endIdx === undefined || startIdx >= endIdx) return [];

  const rows: Array<{ label: string; value: number }> = [];
  for (let i = startIdx; i < endIdx; i++) {
    const label = headers[i]?.trim();
    if (!label) continue;
    rows.push({ label, value: cleanNum(row[i]) });
  }
  return rows;
};

const earningsHeaderIndices = (
  headers: string[],
  fieldToIndex: Record<string, number>,
  startField: string,
  endField: string,
): Set<number> => {
  const startIdx = fieldToIndex[startField];
  const endIdx = fieldToIndex[endField];
  if (startIdx === undefined || endIdx === undefined || startIdx >= endIdx) return new Set();
  return new Set(Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i));
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
  extraHeaders?: string[];
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

  // Detect headers present in the sheet but not mapped in company config
  const isIgnoredHeader = (header: string) => {
    const normalized = header.trim().toLowerCase();
    return [
      /^s\.?\s*no\.?$/i,
      /^serial\s*(no|number)$/i,
      /^remarks?$/i,
      /^remark$/i,
      /^where\s+to\s+add$/i,
    ].some((regex) => regex.test(normalized));
  };

  const mappedHeaders = Object.values(config.columnMap)
    .flatMap((h) => Array.isArray(h) ? h : [h])
    .map((h) => String(h ?? '').trim().toLowerCase());

  // Build field -> column index
  const fieldToIndex: Record<string, number> = {};
  for (const [field, excelHeader] of Object.entries(config.columnMap)) {
    const candidates = Array.isArray(excelHeader) ? excelHeader : [excelHeader];
    for (const rawHeader of candidates) {
      const want = String(rawHeader).trim().toLowerCase();
      const idx = headers.findIndex((h) => h.trim().toLowerCase() === want);
      if (idx >= 0) {
        fieldToIndex[field] = idx;
        break;
      }
    }
  }

  const dynamicEarningsIndices = config.dynamicEarnings
    ? earningsHeaderIndices(
        headers,
        fieldToIndex,
        config.earningsStartField ?? 'basic',
        config.earningsEndField ?? 'grossEarning',
      )
    : new Set<number>();
  const extraHeaders = headers
    .map((h, idx) => ({ h: String(h ?? '').trim(), idx }))
    .filter(({ h, idx }) => h && !mappedHeaders.includes(h.toLowerCase()) && !isIgnoredHeader(h) && !dynamicEarningsIndices.has(idx))
    .map(({ h }) => h);

  const get = (row: unknown[], field: string): unknown => {
    const i = fieldToIndex[field];
    return i >= 0 ? row[i] : undefined;
  };

  const getStringIfPresent = (row: unknown[], field: string): string | undefined => {
    const value = get(row, field);
    return value === undefined || value === null || String(value).trim() === '' ? undefined : String(value).trim();
  };

  const getNumberIfPresent = (row: unknown[], field: string): number | undefined => {
    const idx = fieldToIndex[field];
    if (idx === undefined) return undefined;
    const value = row[idx];
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    return cleanNum(value);
  };

  const result: PayslipData[] = [];

  for (let r = config.headerRowIndex + 1; r < raw.length; r++) {
    const row = raw[r] as unknown[];
    const name = getStringIfPresent(row, 'employeeName');
    if (!name) continue;

    const basic = getNumberIfPresent(row, 'basic');
    const hra = getNumberIfPresent(row, 'hra');
    const conveyance = getNumberIfPresent(row, 'conveyance');
    const medicalAllowance = getNumberIfPresent(row, 'medicalAllowance');
    const childrenAllowance = getNumberIfPresent(row, 'childrenAllowance');
    const lta = getNumberIfPresent(row, 'lta');
    const specialAllowance = getNumberIfPresent(row, 'specialAllowance');
    const arrears = getNumberIfPresent(row, 'arrears');
    const otherPayments = getNumberIfPresent(row, 'otherPayments');
    const otherAllowances = getNumberIfPresent(row, 'otherAllowances');
    const statutoryBonus = getNumberIfPresent(row, 'statutoryBonus');
    const telephoneAllowance = getNumberIfPresent(row, 'telephoneAllowance');
    const transportAllowance = getNumberIfPresent(row, 'transportAllowance');
    const arrearsSalary = getNumberIfPresent(row, 'arrearsSalary');
    const pfEmployer = getNumberIfPresent(row, 'pfEmployer');
    const pfEmployee = getNumberIfPresent(row, 'pfEmployee');
    const esi = getNumberIfPresent(row, 'esi');
    const professionalTax = getNumberIfPresent(row, 'professionalTax');
    const tds = getNumberIfPresent(row, 'tds');
    const totalDeductions = getNumberIfPresent(row, 'totalDeductions');
    const netPay = getNumberIfPresent(row, 'netPay');
    const grossEarningRaw = getNumberIfPresent(row, 'grossEarning');
    const totalEarningsRaw = getNumberIfPresent(row, 'totalEarnings');

    const earningsRows = config.dynamicEarnings
      ? parseDynamicEarnings(
          row,
          headers,
          fieldToIndex,
          config.earningsStartField ?? 'basic',
          config.earningsEndField ?? 'grossEarning',
        )
      : undefined;
    const earningsFromRows = earningsRows?.reduce((sum, item) => sum + item.value, 0);

    const grossEarning = grossEarningRaw ?? earningsFromRows ?? ((basic ?? 0) + (hra ?? 0) + (conveyance ?? 0) + (medicalAllowance ?? 0) + (childrenAllowance ?? 0) + (lta ?? 0) + (specialAllowance ?? 0) + (arrears ?? 0) + (otherPayments ?? 0) + (otherAllowances ?? 0) + (statutoryBonus ?? 0) + (telephoneAllowance ?? 0) + (transportAllowance ?? 0) + (arrearsSalary ?? 0));
    const totalEarnings = totalEarningsRaw ?? ((grossEarning ?? 0) + (pfEmployer ?? 0));
    const computedNetPay = totalEarnings - (totalDeductions ?? 0);

    result.push({
      employeeName: name,
      designation: getStringIfPresent(row, 'designation') ?? '',
      empId: getStringIfPresent(row, 'empId') ?? '',
      location: getStringIfPresent(row, 'location') ?? '',
      dateOfJoining: formatExcelDate(get(row, 'dateOfJoining')),
      effectiveDays: getStringIfPresent(row, 'effectiveDays') ?? '',
      daysInMonth: getStringIfPresent(row, 'daysInMonth') ?? '',
      lop: getStringIfPresent(row, 'lop') ?? '',
      bankName: getStringIfPresent(row, 'bankName') ?? '',
      bankAccount: getStringIfPresent(row, 'bankAccount') ?? '',
      ifscCode: (getStringIfPresent(row, 'ifscCode') ?? '').replace(/\r\n/g, ''),
      pfUan: getStringIfPresent(row, 'pfUan') ?? '',
      panNo: getStringIfPresent(row, 'panNo') ?? '',
      esiNo: fieldToIndex['esiNo'] >= 0 ? getStringIfPresent(row, 'esiNo') : undefined,
      monthLabel: monthFromSheetName(targetSheet) || targetSheet,
      basic,
      hra,
      conveyance,
      medicalAllowance,
      childrenAllowance,
      statutoryBonus,
      lta,
      specialAllowance,
      telephoneAllowance,
      transportAllowance,
      arrearsSalary,
      arrears,
      otherPayments,
      otherAllowances,
      earningsRows,
      grossEarning,
      pfEmployer,
      esi,
      totalEarnings,
      pfEmployee,
      professionalTax,
      tds,
      totalDeductions,
      netPay: netPay ?? computedNetPay,
      companyName: config.companyName,
      companyAddress: config.companyAddress,
      extraRaw: extraHeaders.reduce((acc: Record<string, number>, h) => {
        const idx = headers.findIndex(x => x.trim().toLowerCase() === h.trim().toLowerCase());
        if (idx >= 0) acc[h] = cleanNum(row[idx]);
        return acc;
      }, {}),
    });
  }

  return {
    data: result,
    monthLabel: monthFromSheetName(targetSheet) || targetSheet,
    sheetName: targetSheet,
    extraHeaders: extraHeaders,
  };
}
