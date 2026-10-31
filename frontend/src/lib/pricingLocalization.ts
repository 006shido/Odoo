import type {
  Customer,
  Discount,
  Invoice,
  Payment,
  Product,
  Quotation,
  Subscription,
  SubscriptionPlan,
  WorkspaceSettings,
} from '@/types';
import {
  addDecimals,
  calculatePercentage,
  multiplyDecimals,
  subtractDecimals,
} from '@/lib/decimal';

const oldPlanPrices: Record<string, number> = {
  'plan-1': 49,
  'plan-2': 149,
  'plan-3': 4990,
  'plan-4': 199,
  'plan-5': 299,
  'plan-6': 2490,
};

export const inrPlanPrices: Record<string, string> = {
  'plan-1': '499.00',
  'plan-2': '999.00',
  'plan-3': '19999.00',
  'plan-4': '699.00',
  'plan-5': '1499.00',
  'plan-6': '9999.00',
};

const productPrices: Record<string, { base: string; variants: Record<string, string> }> = {
  'prod-1': { base: '999.00', variants: { 'var-1a': '499.00', 'var-1b': '999.00', 'var-1c': '1999.00' } },
  'prod-2': { base: '699.00', variants: { 'var-2a': '399.00', 'var-2b': '699.00' } },
  'prod-3': { base: '1499.00', variants: { 'var-3a': '1499.00', 'var-3b': '2999.00' } },
  'prod-4': { base: '999.00', variants: { 'var-4a': '499.00', 'var-4b': '9999.00' } },
};

export interface PricingWorkspace {
  settings: WorkspaceSettings;
  customers: Customer[];
  products: Product[];
  plans: SubscriptionPlan[];
  discounts: Discount[];
  quotations: Quotation[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
}

function factorForPlan(planId?: string): number {
  if (!planId || !oldPlanPrices[planId] || !inrPlanPrices[planId]) return 60;
  return Number(inrPlanPrices[planId]) / oldPlanPrices[planId]!;
}

function localizedAmount(amount: string, planId?: string): string {
  return multiplyDecimals(amount, factorForPlan(planId));
}

function localizeProducts(products: Product[]): Product[] {
  return products.map((product) => {
    const pricing = productPrices[product.id];
    if (!pricing) {
      return {
        ...product,
        default_price: localizedAmount(product.default_price),
        sales_price: product.sales_price ? localizedAmount(product.sales_price) : undefined,
        cost_price: product.cost_price ? localizedAmount(product.cost_price) : undefined,
        variants: product.variants.map((variant) => ({ ...variant, price: localizedAmount(variant.price) })),
      };
    }
    return {
      ...product,
      default_price: pricing.base,
      sales_price: pricing.base,
      cost_price: product.cost_price ? localizedAmount(product.cost_price, 'plan-1') : undefined,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: pricing.variants[variant.id] ?? localizedAmount(variant.price, 'plan-1'),
      })),
    };
  });
}

function localizePlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return plans.map((plan) => ({
    ...plan,
    price: inrPlanPrices[plan.id] ?? localizedAmount(plan.price),
    setup_fee: plan.id === 'plan-3' ? '1999.00' : localizedAmount(plan.setup_fee, plan.id),
  }));
}

function localizeDiscounts(discounts: Discount[]): Discount[] {
  return discounts.map((discount) => {
    if (discount.id === 'disc-2') {
      return { ...discount, name: 'Annual Enterprise Credit ₹1,999', value: '1999.00', min_subtotal: '9999.00' };
    }
    const minSubtotal = discount.id === 'disc-1' ? '499.00' : discount.id === 'disc-3' ? '299.00' : localizedAmount(discount.min_subtotal);
    return { ...discount, min_subtotal: minSubtotal };
  });
}

function localizeQuotations(quotations: Quotation[], discounts: Discount[]): Quotation[] {
  return quotations.map((quote) => {
    const items = quote.items.map((item) => {
      const unitPrice = inrPlanPrices[item.plan_id ?? ''] ?? localizedAmount(item.unit_price, item.plan_id);
      return { ...item, unit_price: unitPrice, amount: multiplyDecimals(unitPrice, item.quantity) };
    });
    const subtotal = items.reduce((sum, item) => addDecimals(sum, item.amount), '0.00');
    const discount = discounts.find((item) => item.id === quote.discount_id);
    const discountAmount = discount?.type === 'percentage'
      ? calculatePercentage(subtotal, discount.value)
      : discount?.type === 'fixed'
        ? discount.value
        : (quote.discount_amount === '0.00' ? '0.00' : localizedAmount(quote.discount_amount, quote.items[0]?.plan_id));
    const discountedSubtotal = subtractDecimals(subtotal, discountAmount);
    const taxAmount = calculatePercentage(discountedSubtotal, quote.tax_rate);
    return {
      ...quote,
      items,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total: addDecimals(discountedSubtotal, taxAmount),
    };
  });
}

function localizeSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.map((subscription) => {
    const items = subscription.items.map((item) => {
      const unitPrice = inrPlanPrices[subscription.plan_id] ?? localizedAmount(item.unit_price, subscription.plan_id);
      return { ...item, unit_price: unitPrice, amount: multiplyDecimals(unitPrice, item.quantity) };
    });
    const recurringAmount = items.reduce((sum, item) => addDecimals(sum, item.amount), '0.00');
    const taxAmount = calculatePercentage(recurringAmount, subscription.tax_rate);
    return {
      ...subscription,
      items,
      recurring_amount: recurringAmount,
      tax_amount: taxAmount,
      total_recurring: addDecimals(recurringAmount, taxAmount),
      discount_value: subscription.discount_id === 'disc-2' ? '1999.00' : subscription.discount_value,
    };
  });
}

function localizeInvoices(invoices: Invoice[], subscriptions: Subscription[]): { invoices: Invoice[]; ratios: Map<string, number> } {
  const ratios = new Map<string, number>();
  const localized = invoices.map((invoice) => {
    const subscription = subscriptions.find((item) => item.id === invoice.subscription_id);
    const planId = subscription?.plan_id;
    const items = invoice.items.map((item) => {
      const unitPrice = planId && inrPlanPrices[planId]
        ? inrPlanPrices[planId]
        : localizedAmount(item.unit_price, planId);
      return { ...item, unit_price: unitPrice, amount: multiplyDecimals(unitPrice, item.quantity) };
    });
    const subtotal = items.reduce((sum, item) => addDecimals(sum, item.amount), '0.00');
    const ratio = Number(invoice.subtotal) > 0 ? Number(subtotal) / Number(invoice.subtotal) : factorForPlan(planId);
    ratios.set(invoice.id, ratio);
    const discountAmount = multiplyDecimals(invoice.discount_amount, ratio);
    const discountedSubtotal = subtractDecimals(subtotal, discountAmount);
    const taxAmount = calculatePercentage(discountedSubtotal, invoice.tax_rate);
    const total = addDecimals(discountedSubtotal, taxAmount);
    const paidAmount = invoice.status === 'paid' ? total : multiplyDecimals(invoice.paid_amount, ratio);
    return {
      ...invoice,
      items,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
      paid_amount: paidAmount,
      balance_due: subtractDecimals(total, paidAmount),
      notes: invoice.id === 'inv-2'
        ? 'Initial bank transfer received as partial payment. Remaining balance due on Nov 10.'
        : invoice.notes?.replace(/\$/g, '₹'),
    };
  });
  return { invoices: localized, ratios };
}

export function localizeWorkspaceToInr(workspace: PricingWorkspace): PricingWorkspace {
  const settings = {
    ...workspace.settings,
    currency: 'INR',
    currency_symbol: '₹',
    billing_timezone: 'Asia/Kolkata (UTC+5:30)',
  };
  const customers = workspace.customers.map((customer) => ({ ...customer, currency: 'INR' }));
  const products = localizeProducts(workspace.products);
  const plans = localizePlans(workspace.plans);
  const discounts = localizeDiscounts(workspace.discounts);
  const quotations = localizeQuotations(workspace.quotations, discounts);
  const subscriptions = localizeSubscriptions(workspace.subscriptions);
  const { invoices, ratios } = localizeInvoices(workspace.invoices, subscriptions);
  const payments = workspace.payments.map((payment) => {
    const allocations = payment.allocations.map((allocation) => ({
      ...allocation,
      amount: multiplyDecimals(allocation.amount, ratios.get(allocation.invoice_id) ?? 60),
    }));
    const allocated = allocations.reduce((sum, allocation) => addDecimals(sum, allocation.amount), '0.00');
    const oldAllocated = payment.allocations.reduce((sum, allocation) => addDecimals(sum, allocation.amount), '0.00');
    const unallocatedFactor = oldAllocated !== '0.00' ? Number(allocated) / Number(oldAllocated) : 60;
    const unallocated = multiplyDecimals(payment.unallocated_amount, unallocatedFactor);
    return {
      ...payment,
      allocations,
      unallocated_amount: unallocated,
      amount: addDecimals(allocated, unallocated),
    };
  });
  return { settings, customers, products, plans, discounts, quotations, subscriptions, invoices, payments };
}
