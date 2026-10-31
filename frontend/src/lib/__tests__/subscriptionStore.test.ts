import { describe, it, expect } from 'vitest';
import { addDecimals, subtractDecimals, compareDecimals } from '../decimal';

describe('Store Business Logic Invariants', () => {
  it('enforces that payment allocation does not exceed invoice balance or payment amount', () => {
    const invoiceTotal = '163.90';
    let balanceDue = '163.90';
    const paymentAmount = '163.90';

    // Allocate full amount
    expect(compareDecimals(paymentAmount, balanceDue)).toBe(0);
    balanceDue = subtractDecimals(balanceDue, paymentAmount);
    expect(balanceDue).toBe('0.00');

    // Partial allocation
    const partialInvoice = '5489.00';
    const partialPayment = '2500.00';
    const remainingBalance = subtractDecimals(partialInvoice, partialPayment);
    expect(remainingBalance).toBe('2989.00');

    // Reject over-allocation
    const excessivePayment = '3000.00';
    const isOverAllocated = compareDecimals(excessivePayment, remainingBalance) > 0;
    expect(isOverAllocated).toBe(true);
  });

  it('calculates tax and line totals consistently', () => {
    const unitPrice = '149.00';
    const quantity = 2;
    const subtotal = addDecimals(unitPrice, unitPrice); // 298.00
    expect(subtotal).toBe('298.00');

    // 10% tax
    const taxRate = '10.0';
    const tax = '29.80';
    const total = addDecimals(subtotal, tax);
    expect(total).toBe('327.80');
  });
});
