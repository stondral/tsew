/**
 * Format large numbers for display (e.g., 1000 → 1k, 1500000 → 1.5M)
 * Uses defensive programming with null/undefined checks
 */
export function formatNumber(num: number | null | undefined): string {
  // Defensive: handle null/undefined
  if (num == null || isNaN(num)) return '0';
  
  // Defensive: handle negative numbers
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  // Billions
  if (absNum >= 1_000_000_000) {
    return sign + (absNum / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  
  // Millions
  if (absNum >= 1_000_000) {
    return sign + (absNum / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  // Thousands
  if (absNum >= 1_000) {
    return sign + (absNum / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  
  // Less than 1000
  return sign + absNum.toString();
}

/**
 * Format number with commas for readability (e.g., 1000 → 1,000)
 * Fallback for when we want full precision
 */
export function formatNumberWithCommas(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '0';
  return num.toLocaleString();
}
