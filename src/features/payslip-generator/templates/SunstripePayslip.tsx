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

export const SunstripePayslip: React.FC<Props> = ({ data }) => {
  // Build earnings array from PayslipData
  const earnings = [
    { label: "BASIC", full: formatNum(data.basic), actual: formatNum(data.basic) },
    { label: "HRA", full: formatNum(data.hra), actual: formatNum(data.hra) },
    { label: "Conveyance", full: formatNum(data.conveyance ?? 0), actual: formatNum(data.conveyance ?? 0) },
    { label: "Medical Allowance", full: formatNum(data.medicalAllowance ?? 0), actual: formatNum(data.medicalAllowance ?? 0) },
    { label: "Children Education Allowance", full: formatNum(data.childrenAllowance ?? 0), actual: formatNum(data.childrenAllowance ?? 0) },
    { label: "Leave Travel Allowance", full: formatNum(data.lta), actual: formatNum(data.lta) },
    { label: "Special Allowance", full: formatNum(data.specialAllowance ?? 0), actual: formatNum(data.specialAllowance ?? 0) },
  ];

  // Build deductions array
  const deductions = [
    { label: "PROF TAX", amount: formatNum(data.professionalTax) },
    { label: "Employer PF", amount: "-" },
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
        /* THE EXACT PAYSLIP CSS FROM REFERENCE */
        .payslip-a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 10mm 15mm;
          box-sizing: border-box;
          font-family: Arial, sans-serif !important;
          color: #000;
          position: relative;
        }

        .header-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          margin-bottom: 5px;
          position: relative;
        }
        
        .logo-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .logo-area img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }
        
        .logo-text {
          font-size: 18px;
          font-weight: bold;
          color: #d62d20;
          font-family: Arial, sans-serif;
        }

        .company-details {
          text-align: center;
          width: 100%;
        }

        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin: 10px 0 5px 0;
          text-transform: uppercase;
        }

        .company-address {
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
          color: #000;
          white-space: pre-line;
        }

        .payslip-title {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          margin: 10px 0 8px 0;
        }

        .main-box {
          border: 2px solid #000;
          margin-top: 8px;
          box-sizing: border-box;
        }

        .info-section {
          display: flex;
          border-bottom: 1px solid #000;
          box-sizing: border-box;
        }
        .info-col {
          padding: 10px;
          width: 50%;
        }
        .left-col {
          border-right: 1px solid #000;
        }
        .info-row {
          display: flex;
          margin-bottom: 3px;
          font-size: 12px;
        }
        .info-row .label {
          width: 140px;
          display: inline-block;
        }
        .info-row .value {
          flex: 1;
        }

        .financial-table {
          width: 100%;
          font-size: 12px;
          box-sizing: border-box;
          table-layout: fixed;
          border-collapse: collapse;
        }
        .financial-table th, .financial-table td {
          padding: 10px 12px !important;
          vertical-align: middle !important;
          line-height: 1.2;
          box-sizing: border-box;
          border: none;
        }
        .financial-table th {
          border-bottom: 1px solid #000;
          font-weight: normal;
        }
        .financial-table .col-earn-label { width: 40%; text-align: left; }
        .financial-table .col-earn-val { width: 10%; text-align: right; }
        .financial-table .col-earn-val.center { text-align: center; }
        .financial-table .col-ded-label { width: 30%; text-align: left; border-left: 1px solid #000; }
        .financial-table .col-ded-val { width: 10%; text-align: right; }
        .financial-table .col-ded-val.center { text-align: center; }
        .gross-row td { border-top: 1px solid #000; border-bottom: 1px solid #000; }
        .bold { font-weight: bold; }
        .total-earn-row td { border-top: 1px solid #000; }
        
        .net-pay-row {
          border-top: 1px solid #000;
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          font-weight: bold;
          font-size: 13px;
        }
        .net-words {
          padding: 4px 10px 10px 10px;
          font-style: italic;
          font-size: 12px;
        }
        
        .footer-note {
          font-size: 10px;
          color: #666;
          margin-top: 8px;
        }
      `}</style>

      <div className="payslip-a4">
        {/* HEADER SECTION (Outside Border) */}
        <div className="header-container">
          <div className="logo-area">
            <img src={PAYSLIP_LOGOS.sunstripe} alt="SunStripe" />
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

        {/* MAIN BORDERED BOX */}
        <div className="main-box">
          {/* EMPLOYEE INFO GRID */}
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
              <InfoRow label="Bank A/C No:" value={data.bankAccount} />
              <InfoRow label="IFSC Code:" value={data.ifscCode} />
              <InfoRow label="PF UAN:" value={data.pfUan || 'NA'} />
              <InfoRow label="PAN No:" value={data.panNo} />
              <InfoRow label="LOP:" value={data.lop || '0'} />
            </div>
          </div>

          {/* FINANCIAL TABLE */}
          <table className="financial-table">
            <colgroup>
              <col className="col-earn-label" />
              <col className="col-earn-val" />
              <col className="col-earn-val" />
              <col className="col-ded-label" />
              <col className="col-ded-val" />
            </colgroup>
            <thead>
              <tr>
                <th className="col-earn-label">Earnings</th>
                <th className="col-earn-val center">Full</th>
                <th className="col-earn-val center">Actual</th>
                <th className="col-ded-label">Deductions</th>
                <th className="col-ded-val center">Actual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="col-earn-label">{row.earning.label}</td>
                  <td className="col-earn-val">{row.earning.full}</td>
                  <td className="col-earn-val">{row.earning.actual}</td>
                  <td className="col-ded-label">{row.deduction.label}</td>
                  <td className="col-ded-val">{row.deduction.amount}</td>
                </tr>
              ))}

              <tr className="gross-row">
                <td className="col-earn-label bold">Gross</td>
                <td className="col-earn-val bold">{formatNum(data.grossEarning)}</td>
                <td className="col-earn-val bold">{formatNum(data.grossEarning)}</td>
                <td className="col-ded-label bold">Total Deductions</td>
                <td className="col-ded-val bold">{formatNum(data.totalDeductions)}</td>
              </tr>

              {employerComponents.map((comp, i) => (
                <tr key={i}>
                  <td className="col-earn-label">{comp.label}</td>
                  <td className="col-earn-val">{comp.full}</td>
                  <td className="col-earn-val">{comp.actual}</td>
                  <td className="col-ded-label"></td>
                  <td className="col-ded-val"></td>
                </tr>
              ))}
              <tr className="total-earn-row">
                <td className="col-earn-label bold">Total Earnings</td>
                <td className="col-earn-val bold">{formatNum(data.totalEarnings)}</td>
                <td className="col-earn-val bold">{formatNum(data.totalEarnings)}</td>
                <td className="col-ded-label"></td>
                <td className="col-ded-val"></td>
              </tr>
            </tbody>
          </table>

          <div className="net-pay-row">
            <div className="net-text">
              Net Pay for the month ( Total Earnings - Total Deductions):
            </div>
            <div className="net-val">
              {formatNum(data.netPay)}
            </div>
          </div>
          <div className="net-words">
            ({numberToWords(Math.round(data.netPay))})
          </div>
        </div>
        
        <div className="footer-note">This is a system generated payslip and does not require signature</div>
      </div>
    </>
  );
};
