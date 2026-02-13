/** Shared styles for all payslip templates */
export const payslipStyles = `
  .payslip-container { font-family: Arial, sans-serif; font-size: 11px; max-width: 800px; margin: 0 auto; padding: 20px; }
  .payslip-header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .payslip-address { text-align: center; font-size: 10px; color: #333; margin-bottom: 16px; }
  .payslip-month { text-align: center; font-size: 12px; margin-bottom: 16px; }
  .payslip-section { display: flex; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; }
  .payslip-left { flex: 1; min-width: 200px; }
  .payslip-right { flex: 1; min-width: 200px; }
  .payslip-label { font-weight: bold; margin-right: 6px; }
  .payslip-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .payslip-table th, .payslip-table td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
  .payslip-table th { background: #f0f0f0; font-weight: bold; }
  .payslip-table .num { text-align: right; }
  .payslip-footer { margin-top: 16px; font-size: 10px; text-align: center; color: #555; }
  .payslip-net { font-weight: bold; margin-top: 12px; }
  .payslip-words { font-style: italic; margin-top: 4px; }
`;

export const formatNum = (n: number): string => {
  // Round to nearest integer: 0.50+ rounds up, <0.50 rounds down
  const rounded = Math.round(n);
  if (rounded === 0) return '0';
  return rounded.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
};
