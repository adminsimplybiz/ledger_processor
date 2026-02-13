/**
 * Converts number to Indian Rupees in words.
 * e.g. 173033 -> "Rupees One Lakh Seventy-Three Thousand Thirty-Three Only"
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Rupees Zero Only';
  if (isNaN(num) || num < 0) return '';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertChunk(n: number): string {
    if (n === 0) return '';
    let s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) s += '-' + ones[n];
      return s.trim();
    } else if (n >= 10) {
      return (s + teens[n - 10]).trim();
    }
    if (n > 0) s += ones[n] + ' ';
    return s.trim();
  }

  let n = Math.round(num);

  let words = 'Rupees ';

  if (n >= 10000000) {
    words += convertChunk(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    words += convertChunk(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    words += convertChunk(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    words += convertChunk(n);
  }

  words = words.trim() + ' Only';
  return words;
}
