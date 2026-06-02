/**
 * Currency formatting utilities for LKR (Sri Lankan Rupee)
 */

const CURRENCY_SYMBOL = '₨';
const CURRENCY_CODE = 'LKR';

/**
 * Format a number as LKR currency
 * @param amount - The amount to format
 * @param showCode - Whether to show the currency code (default: false)
 * @returns Formatted currency string (e.g., "₨12,450" or "12,450 LKR")
 */
export function formatCurrency(amount: number | null | undefined, showCode = false): string {
  if (amount === null || amount === undefined) {
    return showCode ? `0 ${CURRENCY_CODE}` : `${CURRENCY_SYMBOL}0`;
  }

  const formatted = amount.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return showCode ? `${formatted} ${CURRENCY_CODE}` : `${CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Format currency with trend indicator
 * @param amount - The amount to format
 * @param showCode - Whether to show the currency code (default: false)
 * @returns Formatted currency string with trend prefix
 */
export function formatCurrencyTrend(amount: number, showCode = false): string {
  const isPositive = amount >= 0;
  const sign = isPositive ? '+' : '';
  return `${sign}${formatCurrency(amount, showCode)}`;
}

export { CURRENCY_SYMBOL, CURRENCY_CODE };
