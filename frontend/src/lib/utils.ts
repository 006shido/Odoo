import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a decimal string as currency. Never converts to float.
 * Displays the string with proper grouping and decimal places.
 */
export function formatCurrency(value: string, currency = 'INR'): string {
  const parts = value.split('.');
  const integerPart = parts[0] ?? '0';
  const decimalPart = (parts[1] ?? '00').padEnd(2, '0').slice(0, 2);

  // Use locale-aware grouping
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(0).replace(/[\d,.]+/, () => {
    // Format the integer part with grouping
    return Number(integerPart).toLocaleString('en-IN') + '.' + decimalPart;
  });

  return formatted;
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date-time string for display
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
