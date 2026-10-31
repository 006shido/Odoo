/**
 * Precision decimal arithmetic helper for financial calculations in Brightloop.
 * Avoids binary floating-point representation errors by working with cents/integers.
 */

/** Parse decimal string or number to integer cents */
export function toCents(amount: string | number): number {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  const clean = (amount || '0').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/** Convert integer cents back to formatted decimal string (e.g. "49.99") */
export function fromCents(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  const sign = isNegative ? '-' : '';
  return `${sign}${dollars}.${remainingCents.toString().padStart(2, '0')}`;
}

/** Add two monetary strings/numbers */
export function addDecimals(a: string | number, b: string | number): string {
  return fromCents(toCents(a) + toCents(b));
}

/** Subtract b from a */
export function subtractDecimals(a: string | number, b: string | number): string {
  return fromCents(toCents(a) - toCents(b));
}

/** Multiply decimal by quantity (integer or float) */
export function multiplyDecimals(amount: string | number, factor: number): string {
  const cents = toCents(amount);
  return fromCents(Math.round(cents * factor));
}

/** Compare two decimals: returns 1 if a > b, -1 if a < b, 0 if equal */
export function compareDecimals(a: string | number, b: string | number): number {
  const diff = toCents(a) - toCents(b);
  if (diff > 0) return 1;
  if (diff < 0) return -1;
  return 0;
}

/** Calculate percentage discount: discountAmount = subtotal * (rate / 100) */
export function calculatePercentage(amount: string | number, percentage: string | number): string {
  const amountCents = toCents(amount);
  const rate = parseFloat(percentage.toString()) || 0;
  const discountCents = Math.round((amountCents * rate) / 100);
  return fromCents(discountCents);
}

/** Format currency with symbol, e.g. "$1,250.00" */
export function formatCurrency(amount: string | number, symbol: string = '$'): string {
  const cents = toCents(amount);
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  
  const formattedDollars = dollars.toLocaleString('en-US');
  const formattedCents = remainingCents.toString().padStart(2, '0');
  const sign = isNegative ? '-' : '';
  
  return `${sign}${symbol}${formattedDollars}.${formattedCents}`;
}

/** Parse human input string to clean decimal string with max 2 digits */
export function normalizeDecimal(input: string): string {
  const clean = input.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return clean;
}
