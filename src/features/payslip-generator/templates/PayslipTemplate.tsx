export const formatNum = (n?: number): string => {
  if (n === undefined || n === null) return '';
  // Round to nearest integer: 0.50+ rounds up, <0.50 rounds down
  const rounded = Math.round(n);
  if (rounded === 0) return '0';
  return rounded.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
};
