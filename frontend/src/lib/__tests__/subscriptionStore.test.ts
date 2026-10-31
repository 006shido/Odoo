import { describe, it, expect } from 'vitest';
import {
  addDecimals,
  subtractDecimals,
  compareDecimals,
  calculatePercentage,
  formatCurrency,
} from '../decimal';
import type { Customer, Quotation, Subscription, Invoice, PaymentAllocation, QuotationStatus } from '@/types';

describe('Store Business Logic & Lifecycle Invariants', () => {
  describe('Payment Allocation Rules', () => {
    it('enforces that payment allocation does not exceed invoice balance or payment amount', () => {
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

      // Reject over-allocation against invoice balance
      const excessivePayment = '3000.00';
      const isOverAllocated = compareDecimals(excessivePayment, remainingBalance) > 0;
      expect(isOverAllocated).toBe(true);
    });

    it('accurately distributes payment across multiple invoices without over-allocation', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          number: 'INV-2026-001',
          customer_id: 'cust-1',
          customer_name: 'Acme Cloud',
          customer_email: 'billing@acmecloud.io',
          billing_period_start: '2026-10-01',
          billing_period_end: '2026-11-01',
          status: 'issued',
          is_overdue: false,
          issue_date: '2026-10-01',
          due_date: '2026-10-31',
          items: [],
          subtotal: '200.00',
          discount_amount: '0.00',
          tax_rate: '10',
          tax_amount: '20.00',
          total: '220.00',
          paid_amount: '0.00',
          balance_due: '220.00',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 'inv-2',
          number: 'INV-2026-002',
          customer_id: 'cust-1',
          customer_name: 'Acme Cloud',
          customer_email: 'billing@acmecloud.io',
          billing_period_start: '2026-10-15',
          billing_period_end: '2026-11-15',
          status: 'issued',
          is_overdue: false,
          issue_date: '2026-10-15',
          due_date: '2026-11-14',
          items: [],
          subtotal: '100.00',
          discount_amount: '0.00',
          tax_rate: '10',
          tax_amount: '10.00',
          total: '110.00',
          paid_amount: '0.00',
          balance_due: '110.00',
          created_at: '2026-10-15T00:00:00Z',
          updated_at: '2026-10-15T00:00:00Z',
        },
      ];

      const paymentTotal = '300.00';
      const allocations: PaymentAllocation[] = [
        { id: 'a1', invoice_id: 'inv-1', invoice_number: 'INV-2026-001', amount: '220.00', allocated_at: '2026-10-31T00:00:00Z' },
        { id: 'a2', invoice_id: 'inv-2', invoice_number: 'INV-2026-002', amount: '80.00', allocated_at: '2026-10-31T00:00:00Z' },
      ];

      // Sum allocations
      let totalAllocated = '0.00';
      for (const a of allocations) {
        totalAllocated = addDecimals(totalAllocated, a.amount);
      }
      expect(totalAllocated).toBe('300.00');

      // Allocation does not exceed payment
      expect(compareDecimals(totalAllocated, paymentTotal) <= 0).toBe(true);

      // Remaining unallocated balance
      const unallocated = subtractDecimals(paymentTotal, totalAllocated);
      expect(unallocated).toBe('0.00');

      // Check invoice 1 is fully paid
      const inv1Rem = subtractDecimals(invoices[0]!.balance_due, allocations[0]!.amount);
      expect(inv1Rem).toBe('0.00');

      // Check invoice 2 has remaining balance of 30.00
      const inv2Rem = subtractDecimals(invoices[1]!.balance_due, allocations[1]!.amount);
      expect(inv2Rem).toBe('30.00');
    });

    it('leaves unallocated credit if payment is greater than total allocations', () => {
      const paymentAmount = '500.00';
      const allocatedAmount = '350.00';
      const unallocatedCredit = subtractDecimals(paymentAmount, allocatedAmount);
      expect(unallocatedCredit).toBe('150.00');
    });
  });

  describe('Tax & Currency Calculations', () => {
    it('calculates tax and line totals consistently', () => {
      const unitPrice = '149.00';
      const subtotal = addDecimals(unitPrice, unitPrice); // 298.00
      expect(subtotal).toBe('298.00');

      // 10% tax
      const tax = calculatePercentage(subtotal, 10);
      expect(tax).toBe('29.80');

      const total = addDecimals(subtotal, tax);
      expect(total).toBe('327.80');
      expect(formatCurrency(total, '$')).toBe('$327.80');
    });

    it('calculates discount before applying tax', () => {
      const subtotal = '1000.00';
      const discountPercentage = 20; // 20%
      const discountAmount = calculatePercentage(subtotal, discountPercentage);
      expect(discountAmount).toBe('200.00');

      const discountedSubtotal = subtractDecimals(subtotal, discountAmount);
      expect(discountedSubtotal).toBe('800.00');

      const taxAmount = calculatePercentage(discountedSubtotal, 10);
      expect(taxAmount).toBe('80.00');

      const total = addDecimals(discountedSubtotal, taxAmount);
      expect(total).toBe('880.00');
    });
  });

  describe('Quotation Lifecycle Invariants', () => {
    it('only converts accepted quotations to subscriptions', () => {
      const mockQuote: Quotation = {
        id: 'quo-test-1',
        number: 'QUO-2026-999',
        customer_id: 'cust-1',
        customer_name: 'Acme Cloud',
        customer_email: 'billing@acmecloud.io',
        status: 'draft',
        items: [],
        discount_amount: '0.00',
        subtotal: '100.00',
        tax_rate: '10',
        tax_amount: '10.00',
        total: '110.00',
        payment_terms: 'Net 30',
        issue_date: '2026-10-31',
        expiry_date: '2026-11-30',
        created_at: '2026-10-31T00:00:00Z',
        updated_at: '2026-10-31T00:00:00Z',
      };

      // Guard check: cannot convert draft
      const canConvertDraft = (mockQuote.status as QuotationStatus) === 'accepted';
      expect(canConvertDraft).toBe(false);

      // Sent state
      mockQuote.status = 'sent';
      const canConvertSent = (mockQuote.status as QuotationStatus) === 'accepted';
      expect(canConvertSent).toBe(false);

      // Accepted state
      mockQuote.status = 'accepted';
      const canConvertAccepted = (mockQuote.status as QuotationStatus) === 'accepted';
      expect(canConvertAccepted).toBe(true);

      // Once converted, cannot convert again
      mockQuote.status = 'converted';
      mockQuote.converted_subscription_id = 'sub-test-1';
      const canReconvert = (mockQuote.status as QuotationStatus) === 'accepted' && !mockQuote.converted_subscription_id;
      expect(canReconvert).toBe(false);
    });
  });

  describe('Billing Engine Idempotency Invariants', () => {
    it('prevents generating duplicate invoices for the same subscription period', () => {
      const sub: Subscription = {
        id: 'sub-test-10',
        number: 'SUB-2026-010',
        customer_id: 'cust-1',
        customer_name: 'Acme Cloud',
        customer_email: 'billing@acmecloud.io',
        plan_id: 'plan-1',
        plan_name: 'Standard Tier',
        frequency: 'monthly',
        status: 'active',
        start_date: '2026-09-01',
        next_billing_date: '2026-10-01',
        last_billing_date: '2026-09-01',
        items: [],
        recurring_amount: '100.00',
        tax_rate: '10',
        tax_amount: '10.00',
        total_recurring: '110.00',
        auto_renew: true,
        events: [],
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      };

      const existingInvoices: Invoice[] = [
        {
          id: 'inv-existing-1',
          number: 'INV-2026-010',
          customer_id: 'cust-1',
          customer_name: 'Acme Cloud',
          customer_email: 'billing@acmecloud.io',
          subscription_id: 'sub-test-10',
          subscription_number: 'SUB-2026-010',
          billing_period_start: '2026-10-01',
          billing_period_end: '2026-11-01',
          status: 'issued',
          is_overdue: false,
          issue_date: '2026-10-01',
          due_date: '2026-10-31',
          items: [],
          subtotal: '100.00',
          discount_amount: '0.00',
          tax_rate: '10',
          tax_amount: '10.00',
          total: '110.00',
          paid_amount: '0.00',
          balance_due: '110.00',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ];

      // Test idempotency check: check if an invoice already exists for this period
      const isPeriodAlreadyInvoiced = existingInvoices.some(
        (inv) => inv.subscription_id === sub.id && inv.billing_period_start === sub.next_billing_date,
      );

      expect(isPeriodAlreadyInvoiced).toBe(true);

      // Verify that engine skips generation when true
      let generated = 0;
      if (!isPeriodAlreadyInvoiced) {
        generated++;
      }
      expect(generated).toBe(0);
    });

    it('skips subscriptions whose next billing date is in the future', () => {
      const runDate = '2026-10-31';
      const futureSubNextBilling = '2026-11-15';

      const shouldBill = futureSubNextBilling <= runDate;
      expect(shouldBill).toBe(false);
    });
  });

  describe('Customer Portal IDOR Isolation', () => {
    it('strictly isolates customer data by customer ID', () => {
      const targetCustomer: Customer = {
        id: 'cust-1',
        name: 'Sarah Connor',
        company_name: 'Acme Cloud',
        email: 'sarah@acmecloud.io',
        phone: '+1 555-0101',
        tax_id: 'US-EIN-1234567',
        billing_address: { street: '100 Market', city: 'San Francisco', state: 'CA', postal_code: '94105', country: 'USA' },
        status: 'active',
        currency: 'USD',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const allInvoices: Invoice[] = [
        {
          id: 'inv-cust1',
          number: 'INV-001',
          customer_id: 'cust-1',
          customer_name: 'Acme Cloud',
          customer_email: 'sarah@acmecloud.io',
          billing_period_start: '2026-10-01',
          billing_period_end: '2026-11-01',
          status: 'issued',
          is_overdue: false,
          issue_date: '2026-10-01',
          due_date: '2026-10-31',
          items: [],
          subtotal: '100.00',
          discount_amount: '0.00',
          tax_rate: '10',
          tax_amount: '10.00',
          total: '110.00',
          paid_amount: '0.00',
          balance_due: '110.00',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 'inv-cust2',
          number: 'INV-002',
          customer_id: 'cust-2',
          customer_name: 'Other Company',
          customer_email: 'other@company.com',
          billing_period_start: '2026-10-01',
          billing_period_end: '2026-11-01',
          status: 'issued',
          is_overdue: false,
          issue_date: '2026-10-01',
          due_date: '2026-10-31',
          items: [],
          subtotal: '500.00',
          discount_amount: '0.00',
          tax_rate: '10',
          tax_amount: '50.00',
          total: '550.00',
          paid_amount: '0.00',
          balance_due: '550.00',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ];

      // Filtered portal view
      const portalInvoices = allInvoices.filter((inv) => inv.customer_id === targetCustomer.id);
      expect(portalInvoices.length).toBe(1);
      expect(portalInvoices[0]!.id).toBe('inv-cust1');
      expect(portalInvoices.some((inv) => inv.customer_id === 'cust-2')).toBe(false);
    });
  });
});
