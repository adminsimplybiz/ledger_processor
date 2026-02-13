import React from 'react';
import type { PayslipData } from '../types';
import { formatNum } from './PayslipTemplate';
import { numberToWords } from '../utils/numberToWords';
import { PAYSLIP_LOGOS } from '../payslipLogos';

interface Props {
  data: PayslipData;
}

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="info-row">
    <span className="label">{label}</span>
    <span className="value">{value}</span>
  </div>
);

export const ValueStreamPayslip: React.FC<Props> = ({ data }) => {
  // Build earnings array from PayslipData (Value Stream specific)
  const earnings = [
    { label: "BASIC", full: formatNum(data.basic), actual: formatNum(data.basic) },
    { label: "HRA", full: formatNum(data.hra), actual: formatNum(data.hra) },
    { label: "Children Allowance", full: formatNum(data.childrenAllowance ?? 0), actual: formatNum(data.childrenAllowance ?? 0) },
    { label: "Statutory Bonus", full: formatNum(data.statutoryBonus ?? 0), actual: formatNum(data.statutoryBonus ?? 0) },
    { label: "Leave Travel Allowance", full: formatNum(data.lta), actual: formatNum(data.lta) },
    { label: "Other allowances", full: formatNum(data.otherAllowances ?? 0), actual: formatNum(data.otherAllowances ?? 0) },
  ];

  // Build deductions array
  const deductions = [
    { label: "PROF TAX", amount: formatNum(data.professionalTax) },
    { label: "Employer PF", amount: formatNum(data.pfEmployer) },
    { label: "Employee PF", amount: formatNum(data.pfEmployee) },
    { label: "TDS", amount: formatNum(data.tds) },
  ];

  // Employer components
  const employerComponents = [
    { label: "Employer PF", full: formatNum(data.pfEmployer), actual: formatNum(data.pfEmployer) },
    { label: "Employer PF arrears", full: "", actual: "" },
    { label: "Employer ESI", full: "", actual: "" },
  ];

  // Pad rows so table looks balanced
  const maxRows = Math.max(earnings.length, deductions.length, 8);
  const rows = Array.from({ length: maxRows }).map((_, i) => ({
    earning: earnings[i] || { label: '', full: '', actual: '' },
    deduction: deductions[i] || { label: '', amount: '' }
  }));

  return (
    <>
      <style>{`
        .payslip-a4 { width: 210mm; min-height: 297mm; background: white; padding: 10mm 15mm; box-sizing: border-box; font-family: 'Times New Roman', Times, serif; color: #000; position: relative; }
        .header-container { display: flex; justify-content: center; align-items: flex-start; margin-bottom: 5px; position: relative; }
        .logo-area { position: absolute; left: 0; top: 0; width: 100px; height: 100px; display: flex; align-items: center; justify-content: flex-start; }
        .logo-area img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
        .company-details { text-align: center; width: 100%; }
        .company-name { font-size: 16px; font-weight: bold; margin: 10px 0 5px 0; text-transform: uppercase; }
        .company-address { font-size: 12px; line-height: 1.5; margin: 0; color: #000; white-space: pre-line; }
        .payslip-title { text-align: center; font-weight: bold; font-size: 13px; margin: 10px 0 8px 0; }
        .main-box { border: 2px solid #000; margin-top: 8px; }
        .info-section { display: flex; border-bottom: 1px solid #000; }
        .info-col { padding: 10px; width: 50%; }
        .left-col { border-right: 1px solid #000; }
        .info-row { display: flex; margin-bottom: 3px; font-size: 12px; }
        .info-row .label { width: 140px; display: inline-block; }
        .info-row .value { flex: 1; }
        .financial-table { width: 100%; font-size: 12px; }
        .table-header-row, .table-row { display: flex; }
        .table-header-row { border-bottom: 1px solid #000; background: white; }
        .col-earn-label { flex: 2; padding: 2px 5px; text-align: left; }
        .col-earn-val { flex: 1; padding: 2px 5px; text-align: right; }
        .col-ded-label { flex: 2; padding: 2px 5px; text-align: left; border-left: 1px solid #000; }
        .col-ded-val { flex: 1; padding: 2px 5px; text-align: right; }
        .th { font-weight: normal; }
        .gross-row { border-top: 1px solid #000; border-bottom: 1px solid #000; }
        .bold { font-weight: bold; }
        .employer-section { display: flex; }
        .employer-left { flex: 1; display: flex; flex-direction: column; }
        .employer-right { width: 43%; border-left: 1px solid #000; }
        .total-earn-row { border-top: 1px solid #000; }
        .net-pay-row { border-top: 1px solid #000; display: flex; justify-content: space-between; padding: 8px 10px; font-weight: bold; font-size: 13px; }
        .net-words { padding: 4px 10px 10px 10px; font-style: italic; font-size: 12px; }
        .footer-note { font-size: 10px; color: #666; margin-top: 8px; }
      `}</style>

      <div className="payslip-a4">
        <div className="header-container">
          <div className="logo-area">
            <img src={PAYSLIP_LOGOS.valuestream} alt="Value Stream Analytics" />
          </div>
          <div className="company-details">
            <h2 className="company-name">{data.companyName}</h2>
            <p className="company-address">
              {data.companyAddress.includes(',') 
                ? (() => {
                    const parts = data.companyAddress.split(',').map(p => p.trim());
                    const mid = Math.ceil(parts.length / 2);
                    const line1 = parts.slice(0, mid).join(', ');
                    const line2 = parts.slice(mid).join(', ');
                    return `${line1}\n${line2}`;
                  })()
                : data.companyAddress
              }
            </p>
          </div>
        </div>
        
        <div className="payslip-title">Payslip for {data.monthLabel}</div>

        <div className="main-box">
          <div className="info-section">
            <div className="info-col left-col">
              <InfoRow label="Name:" value={data.employeeName} />
              <InfoRow label="Designation:" value={data.designation} />
              <InfoRow label="Employee ID:" value={data.empId} />
              <InfoRow label="Location:" value={data.location} />
              <InfoRow label="Date of joining:" value={data.dateOfJoining} />
              <InfoRow label="Effective working days" value={data.effectiveDays} />
              <InfoRow label="Days in Month" value={data.daysInMonth} />
            </div>
            <div className="info-col right-col">
              <InfoRow label="Bank Name:" value={data.bankName} />
              <InfoRow label="Bank A/c No:" value={data.bankAccount} />
              <InfoRow label="IFSC Code:" value={data.ifscCode} />
              <InfoRow label="PF UAN:" value={data.pfUan || 'NA'} />
              <InfoRow label="ESI No:" value={data.esiNo || 'NA'} />
              <InfoRow label="PAN No:" value={data.panNo} />
              <InfoRow label="LOP:" value={data.lop || '0'} />
            </div>
          </div>

          <div className="financial-table">
            <div className="table-header-row">
              <div className="th col-earn-label">Earnings</div>
              <div className="th col-earn-val">Full</div>
              <div className="th col-earn-val">Actual</div>
              <div className="th col-ded-label">Deductions</div>
              <div className="th col-ded-val">Actual</div>
            </div>

            <div className="table-body">
              {rows.map((row, idx) => (
                <div className="table-row" key={idx}>
                  <div className="td col-earn-label">{row.earning.label}</div>
                  <div className="td col-earn-val">{row.earning.full}</div>
                  <div className="td col-earn-val">{row.earning.actual}</div>
                  <div className="td col-ded-label">{row.deduction.label}</div>
                  <div className="td col-ded-val">{row.deduction.amount}</div>
                </div>
              ))}

              <div className="table-row gross-row">
                <div className="td col-earn-label bold">Gross</div>
                <div className="td col-earn-val bold">{formatNum(data.grossEarning)}</div>
                <div className="td col-earn-val bold">{formatNum(data.grossEarning)}</div>
                <div className="td col-ded-label bold">Total Deductions</div>
                <div className="td col-ded-val bold">{formatNum(data.totalDeductions)}</div>
              </div>

              <div className="employer-section">
                <div className="employer-left">
                  {employerComponents.map((comp, i) => (
                    <div className="table-row" key={i}>
                      <div className="td col-earn-label">{comp.label}</div>
                      <div className="td col-earn-val">{comp.full}</div>
                      <div className="td col-earn-val">{comp.actual}</div>
                    </div>
                  ))}
                  <div className="table-row total-earn-row">
                    <div className="td col-earn-label bold">Total Earnings</div>
                    <div className="td col-earn-val bold">{formatNum(data.totalEarnings)}</div>
                    <div className="td col-earn-val bold">{formatNum(data.totalEarnings)}</div>
                  </div>
                </div>
                <div className="employer-right"></div>
              </div>
            </div>
            
            <div className="net-pay-row">
              <div className="net-text">Net Pay for the month ( Total Earnings - Total Deductions):</div>
              <div className="net-val">{formatNum(data.netPay)}</div>
            </div>
            <div className="net-words">({numberToWords(Math.round(data.netPay))})</div>
          </div>
        </div>
        
        <div className="footer-note">This is a system generated payslip and does not require signature</div>
      </div>
    </>
  );
};
