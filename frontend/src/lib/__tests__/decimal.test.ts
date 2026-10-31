import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  compareDecimals,
  calculatePercentage,
  formatCurrency,
} from '../decimal';

describe('Decimal Financial Calculations', () => {
  it('converts between cents and decimal strings precisely', () => {
    expect(toCents('19.99')).toBe(1999);
    expect(toCents('0.05')).toBe(5);
    expect(toCents(100.5)).toBe(10050);
    expect(fromCents(1999)).toBe('19.99');
    expect(fromCents(5)).toBe('0.05');
    expect(fromCents(0)).toBe('0.00');
  });

  it('adds decimal strings without floating-point errors (e.g. 0.1 + 0.2)', () => {
    expect(addDecimals('0.10', '0.20')).toBe('0.30');
    expect(addDecimals('19.99', '0.01')).toBe('20.00');
    expect(addDecimals('1250.50', '249.50')).toBe('1500.00');
  });

  it('subtracts decimal strings accurately', () => {
    expect(subtractDecimals('20.00', '0.01')).toBe('19.99');
    expect(subtractDecimals('100.00', '100.00')).toBe('0.00');
    expect(subtractDecimals('50.00', '75.00')).toBe('-25.00');
  });

  it('multiplies decimals by quantity', () => {
    expect(multiplyDecimals('49.99', 3)).toBe('149.97');
    expect(multiplyDecimals('10.00', 0)).toBe('0.00');
  });

  it('calculates percentage accurately with rounding to nearest cent', () => {
    expect(calculatePercentage('100.00', '10')).toBe('10.00');
    expect(calculatePercentage('99.99', '20')).toBe('20.00'); // 19.998 -> 20.00
    expect(calculatePercentage('33.33', '15')).toBe('5.00'); // 4.9995 -> 5.00
  });

  it('compares decimals accurately', () => {
    expect(compareDecimals('10.00', '5.00')).toBe(1);
    expect(compareDecimals('5.00', '10.00')).toBe(-1);
    expect(compareDecimals('10.00', '10.00')).toBe(0);
  });

  it('formats currency with symbol and thousands separators', () => {
    expect(formatCurrency('1250.50')).toBe('$1,250.50');
    expect(formatCurrency('0.00')).toBe('$0.00');
    expect(formatCurrency('5000000.00', '€')).toBe('€5,000,000.00');
    expect(formatCurrency('-25.00')).toBe('-$25.00');
  });
});
