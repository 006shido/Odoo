import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Customer,
  Product,
  SubscriptionPlan,
  Discount,
  Quotation,
  Subscription,
  SubscriptionEvent,
  Invoice,
  Payment,
  PaymentAllocation,
  BillingRun,
  WorkspaceSettings,
  NotificationItem,
  AuditLogItem,
  AuthUser,
  UserRole,
  BillingFrequency,
  QuotationItem,
  SubscriptionItem,
  InvoiceItem,
} from '@/types';
import {
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  calculatePercentage,
  compareDecimals,
  formatCurrency,
} from '@/lib/decimal';
import { localizeWorkspaceToInr, type PricingWorkspace } from '@/lib/pricingLocalization';

function addBillingInterval(value: string | Date, frequency: BillingFrequency): string {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00Z`);
  const originalDay = date.getUTCDate();

  if (frequency === 'daily') date.setUTCDate(date.getUTCDate() + 1);
  else if (frequency === 'weekly') date.setUTCDate(date.getUTCDate() + 7);
  else {
    const monthDelta = frequency === 'yearly' ? 12 : 1;
    const targetMonth = date.getUTCMonth() + monthDelta;
    date.setUTCDate(1);
    date.setUTCMonth(targetMonth);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(originalDay, lastDay));
  }

  return date.toISOString().slice(0, 10);
}

// Default initial workspace settings
const initialSettings: WorkspaceSettings = {
  company_name: 'Brightloop Technologies Inc.',
  legal_name: 'Brightloop Technologies Delaware C-Corp',
  contact_email: 'billing@brightloop.io',
  phone: '+1 (415) 800-2490',
  address: {
    street: '100 Infinite Loop, Suite 400',
    city: 'Cupertino',
    state: 'CA',
    postal_code: '95014',
    country: 'United States',
  },
  tax_id: 'US-EIN-88491028',
  currency: 'INR',
  currency_symbol: '₹',
  billing_timezone: 'Asia/Kolkata (UTC+5:30)',
  default_tax_rate: '10.0',
  default_payment_terms: 'Net 30',
  quotation_prefix: 'QUO-',
  invoice_prefix: 'INV-',
  subscription_prefix: 'SUB-',
  payment_prefix: 'PAY-',
};

// Default initial users
const initialUsers: AuthUser[] = [
  {
    id: 'user-admin',
    email: 'alex.mercer@brightloop.io',
    first_name: 'Alex',
    last_name: 'Mercer',
    role: 'admin',
    is_active: true,
    title: 'Operations Director',
  },
  {
    id: 'user-staff',
    email: 'taylor.reed@brightloop.io',
    first_name: 'Taylor',
    last_name: 'Reed',
    role: 'staff',
    is_active: true,
    title: 'Subscription Specialist',
  },
  {
    id: 'user-cust',
    email: 'sarah@acmecloud.io',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    role: 'customer',
    is_active: true,
    customer_id: 'cust-1',
    title: 'VP of Engineering',
  },
];

// Initial realistic customers
const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Sarah Jenkins',
    company_name: 'Acme Cloud Dynamics',
    email: 'sarah@acmecloud.io',
    phone: '+1 (415) 555-0192',
    billing_address: {
      street: '742 Evergreen Terrace, Suite 300',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94107',
      country: 'United States',
    },
    tax_id: 'US-EIN-9481928',
    status: 'active',
    currency: 'INR',
    portal_user_id: 'user-cust',
    notes: 'Enterprise account with dedicated account manager. Billed via ACH or Card.',
    created_at: '2026-08-15T09:30:00Z',
    updated_at: '2026-10-15T14:20:00Z',
  },
  {
    id: 'cust-2',
    name: 'Marcus Vance',
    company_name: 'Starlight AI Systems',
    email: 'marcus@starlight.ai',
    phone: '+1 (206) 555-0143',
    billing_address: {
      street: '400 Broad Street, Floor 12',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98109',
      country: 'United States',
    },
    tax_id: 'US-EIN-8392019',
    status: 'active',
    currency: 'INR',
    notes: 'High-growth AI laboratory running cluster models.',
    created_at: '2026-07-10T11:15:00Z',
    updated_at: '2026-10-20T10:00:00Z',
  },
  {
    id: 'cust-3',
    name: 'Elena Rostova',
    company_name: 'Horizon Robotics',
    email: 'elena@horizon-robotics.com',
    phone: '+1 (617) 555-0188',
    billing_address: {
      street: '100 Tech Square, Innovation Center',
      city: 'Cambridge',
      state: 'MA',
      postal_code: '02139',
      country: 'United States',
    },
    tax_id: 'US-EIN-4829102',
    status: 'active',
    currency: 'INR',
    notes: 'Requested seasonal pause on add-on analytics modules.',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-10-28T16:45:00Z',
  },
  {
    id: 'cust-4',
    name: 'David Chen',
    company_name: 'Apex Global Logistics',
    email: 'd.chen@apexglobal.com',
    phone: '+1 (312) 555-0177',
    billing_address: {
      street: '233 S Wacker Dr, Suite 5200',
      city: 'Chicago',
      state: 'IL',
      postal_code: '60606',
      country: 'United States',
    },
    tax_id: 'US-EIN-7382910',
    status: 'active',
    currency: 'INR',
    notes: 'Multi-regional logistics provider using API gateway tier.',
    created_at: '2026-09-05T14:30:00Z',
    updated_at: '2026-10-25T11:20:00Z',
  },
  {
    id: 'cust-5',
    name: 'Olivia Bennett',
    company_name: 'Vanguard Financial Analytics',
    email: 'olivia@vanguard-fa.com',
    phone: '+1 (212) 555-0165',
    billing_address: {
      street: '200 Park Avenue, 35th Floor',
      city: 'New York',
      state: 'NY',
      postal_code: '10166',
      country: 'United States',
    },
    tax_id: 'US-EIN-1928374',
    status: 'lead',
    currency: 'INR',
    notes: 'Quotation sent and accepted. Pending initial subscription activation.',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-30T17:10:00Z',
  },
];

// Initial realistic products
const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Brightloop Core Platform',
    code: 'PROD-CORE',
    category: 'Software',
    description: 'Enterprise subscription operations, billing automation, and lifecycle engine.',
    status: 'active',
    default_price: '149.00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    variants: [
      { id: 'var-1a', sku: 'CORE-STARTER', name: 'Starter Edition', price: '49.00', status: 'active' },
      { id: 'var-1b', sku: 'CORE-PRO', name: 'Professional Edition', price: '149.00', status: 'active' },
      { id: 'var-1c', sku: 'CORE-ENT', name: 'Enterprise Edition', price: '499.00', status: 'active' },
    ],
  },
  {
    id: 'prod-2',
    name: 'Advanced Analytics & Forecast Engine',
    code: 'PROD-ANALYTICS',
    category: 'Add-on',
    description: 'Real-time cohort retention, MRR breakdown, cash flow projections, and custom KPIs.',
    status: 'active',
    default_price: '199.00',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
    variants: [
      { id: 'var-2a', sku: 'ANALYTICS-STD', name: 'Standard Analytics', price: '79.00', status: 'active' },
      { id: 'var-2b', sku: 'ANALYTICS-PREM', name: 'Predictive Pro', price: '199.00', status: 'active' },
    ],
  },
  {
    id: 'prod-3',
    name: '24/7 Dedicated Support SLA',
    code: 'PROD-SLA',
    category: 'Support',
    description: 'Guaranteed 15-minute response SLA with assigned Technical Account Manager.',
    status: 'active',
    default_price: '299.00',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    variants: [
      { id: 'var-3a', sku: 'SLA-GOLD', name: 'Gold SLA (1 hr response)', price: '299.00', status: 'active' },
      { id: 'var-3b', sku: 'SLA-PLAT', name: 'Platinum SLA (15 min response)', price: '699.00', status: 'active' },
    ],
  },
  {
    id: 'prod-4',
    name: 'High-Throughput API Gateway',
    code: 'PROD-API',
    category: 'Add-on',
    description: 'Dedicated API cluster, 5,000 requests/sec burst limit, and real-time webhooks.',
    status: 'active',
    default_price: '99.00',
    created_at: '2026-04-10T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
    variants: [
      { id: 'var-4a', sku: 'API-TIER1', name: 'API Tier 1 (1k req/s)', price: '99.00', status: 'active' },
      { id: 'var-4b', sku: 'API-TIER2', name: 'API Tier 2 (5k req/s)', price: '249.00', status: 'active' },
    ],
  },
];

// Initial realistic subscription plans
const initialPlans: SubscriptionPlan[] = [
  {
    id: 'plan-1',
    name: 'Core Starter Monthly',
    code: 'PLAN-CORE-START-M',
    product_id: 'prod-1',
    product_name: 'Brightloop Core Platform',
    variant_id: 'var-1a',
    variant_name: 'Starter Edition',
    frequency: 'monthly',
    price: '49.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: true,
    auto_renew: true,
    description: 'Essential recurring billing for emerging teams.',
    features: ['Up to 100 active subscriptions', 'Standard invoices', 'Manual payment recording', 'Community support'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-2',
    name: 'Core Professional Monthly',
    code: 'PLAN-CORE-PRO-M',
    product_id: 'prod-1',
    product_name: 'Brightloop Core Platform',
    variant_id: 'var-1b',
    variant_name: 'Professional Edition',
    frequency: 'monthly',
    price: '149.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: true,
    auto_renew: true,
    description: 'Complete lifecycle and recurring operations for scaling companies.',
    features: ['Unlimited subscriptions', 'Automated recurring engine', 'Quotation to subscription flow', 'Priority support'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-3',
    name: 'Core Enterprise Annual',
    code: 'PLAN-CORE-ENT-Y',
    product_id: 'prod-1',
    product_name: 'Brightloop Core Platform',
    variant_id: 'var-1c',
    variant_name: 'Enterprise Edition',
    frequency: 'yearly',
    price: '4990.00',
    setup_fee: '500.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: true,
    auto_renew: true,
    description: 'Bespoke enterprise subscription governance and high volume support.',
    features: ['Enterprise volume scale', 'Dedicated account manager', 'Audit logging & compliance', 'Custom integrations'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-4',
    name: 'Analytics Suite Monthly',
    code: 'PLAN-ANALYTICS-M',
    product_id: 'prod-2',
    product_name: 'Advanced Analytics & Forecast Engine',
    variant_id: 'var-2b',
    variant_name: 'Predictive Pro',
    frequency: 'monthly',
    price: '199.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: true,
    auto_renew: true,
    description: 'Real-time MRR/ARR analytics and cohort intelligence.',
    features: ['Predictive churn signals', 'Cash flow forecasts', 'Export to CSV/JSON', 'Custom dashboards'],
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'plan-5',
    name: 'Dedicated 24/7 SLA Monthly',
    code: 'PLAN-SLA-GOLD-M',
    product_id: 'prod-3',
    product_name: '24/7 Dedicated Support SLA',
    variant_id: 'var-3a',
    variant_name: 'Gold SLA',
    frequency: 'monthly',
    price: '299.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: false,
    auto_renew: true,
    description: 'Mission-critical enterprise engineering support agreement.',
    features: ['1-hour critical response guarantee', 'Dedicated Slack channel', 'Weekly architecture review'],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'plan-6',
    name: 'API Enterprise Yearly',
    code: 'PLAN-API-Y',
    product_id: 'prod-4',
    product_name: 'High-Throughput API Gateway',
    variant_id: 'var-4b',
    variant_name: 'API Tier 2',
    frequency: 'yearly',
    price: '2490.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    status: 'active',
    allow_pause: true,
    auto_renew: true,
    description: 'High capacity endpoints and webhook dispatch for heavy pipelines.',
    features: ['5,000 req/sec rate limit', 'Guaranteed 99.99% uptime', 'Raw event streaming'],
    created_at: '2026-04-10T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
  },
];

// Initial realistic discounts
const initialDiscounts: Discount[] = [
  {
    id: 'disc-1',
    code: 'WELCOME20',
    name: 'New Client Onboarding 20%',
    type: 'percentage',
    value: '20',
    min_subtotal: '100.00',
    usage_limit: 100,
    usage_count: 14,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc-2',
    code: 'ANNUAL500',
    name: 'Annual Enterprise Credit ₹1,999',
    type: 'fixed',
    value: '500.00',
    min_subtotal: '2000.00',
    usage_limit: 50,
    usage_count: 8,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc-3',
    code: 'EARLYBIRD10',
    name: 'Early Adopter 10% Discount',
    type: 'percentage',
    value: '10',
    min_subtotal: '50.00',
    usage_limit: 500,
    usage_count: 142,
    start_date: '2026-01-01',
    end_date: '2026-11-30',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// Initial realistic quotations
const initialQuotations: Quotation[] = [
  {
    id: 'quo-1',
    number: 'QUO-2026-001',
    customer_id: 'cust-1',
    customer_name: 'Acme Cloud Dynamics',
    customer_email: 'sarah@acmecloud.io',
    status: 'converted',
    converted_subscription_id: 'sub-1',
    items: [
      {
        id: 'qitem-1',
        product_id: 'prod-1',
        product_name: 'Brightloop Core Platform - Professional Edition',
        plan_id: 'plan-2',
        plan_name: 'Core Professional Monthly',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    subtotal: '149.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total: '163.90',
    payment_terms: 'Net 30',
    issue_date: '2026-08-15',
    expiry_date: '2026-09-15',
    accepted_at: '2026-08-18T14:22:00Z',
    accepted_by: 'Sarah Jenkins (Client Authorized)',
    notes: 'Signed and converted into active recurring subscription.',
    created_at: '2026-08-15T09:30:00Z',
    updated_at: '2026-08-18T14:25:00Z',
  },
  {
    id: 'quo-2',
    number: 'QUO-2026-002',
    customer_id: 'cust-2',
    customer_name: 'Starlight AI Systems',
    customer_email: 'marcus@starlight.ai',
    status: 'converted',
    converted_subscription_id: 'sub-2',
    items: [
      {
        id: 'qitem-2',
        product_id: 'prod-1',
        product_name: 'Brightloop Core Platform - Enterprise Edition (Annual)',
        plan_id: 'plan-3',
        plan_name: 'Core Enterprise Annual',
        quantity: 1,
        unit_price: '4990.00',
        amount: '4990.00',
      },
    ],
    subtotal: '4990.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '499.00',
    total: '5489.00',
    payment_terms: 'Net 30',
    issue_date: '2026-07-10',
    expiry_date: '2026-08-10',
    accepted_at: '2026-07-12T10:15:00Z',
    accepted_by: 'Marcus Vance',
    created_at: '2026-07-10T11:15:00Z',
    updated_at: '2026-07-12T10:20:00Z',
  },
  {
    id: 'quo-3',
    number: 'QUO-2026-003',
    customer_id: 'cust-5',
    customer_name: 'Vanguard Financial Analytics',
    customer_email: 'olivia@vanguard-fa.com',
    status: 'accepted',
    items: [
      {
        id: 'qitem-3',
        product_id: 'prod-1',
        product_name: 'Brightloop Core Platform - Professional Edition',
        plan_id: 'plan-2',
        plan_name: 'Core Professional Monthly',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    subtotal: '149.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total: '163.90',
    payment_terms: 'Net 30',
    issue_date: '2026-10-25',
    expiry_date: '2026-11-25',
    accepted_at: '2026-10-28T16:00:00Z',
    accepted_by: 'Olivia Bennett',
    notes: 'Customer accepted online through customer portal. Ready for 1-click conversion!',
    created_at: '2026-10-25T10:00:00Z',
    updated_at: '2026-10-28T16:00:00Z',
  },
  {
    id: 'quo-4',
    number: 'QUO-2026-004',
    customer_id: 'cust-4',
    customer_name: 'Apex Global Logistics',
    customer_email: 'd.chen@apexglobal.com',
    status: 'sent',
    items: [
      {
        id: 'qitem-4a',
        product_id: 'prod-1',
        product_name: 'Brightloop Core Platform - Professional Edition',
        plan_id: 'plan-2',
        plan_name: 'Core Professional Monthly',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
      {
        id: 'qitem-4b',
        product_id: 'prod-2',
        product_name: 'Advanced Analytics & Forecast Engine - Predictive Pro',
        plan_id: 'plan-4',
        plan_name: 'Analytics Suite Monthly',
        quantity: 1,
        unit_price: '199.00',
        amount: '199.00',
      },
    ],
    discount_id: 'disc-1',
    discount_code: 'WELCOME20',
    discount_amount: '69.60',
    subtotal: '348.00',
    tax_rate: '10.0',
    tax_amount: '27.84',
    total: '306.24',
    payment_terms: 'Net 30',
    issue_date: '2026-10-29',
    expiry_date: '2026-11-29',
    notes: 'Multi-module package proposal with 20% promotional discount.',
    created_at: '2026-10-29T11:00:00Z',
    updated_at: '2026-10-29T11:30:00Z',
  },
  {
    id: 'quo-5',
    number: 'QUO-2026-005',
    customer_id: 'cust-3',
    customer_name: 'Horizon Robotics',
    customer_email: 'elena@horizon-robotics.com',
    status: 'draft',
    items: [
      {
        id: 'qitem-5',
        product_id: 'prod-3',
        product_name: '24/7 Dedicated Support SLA - Gold SLA',
        plan_id: 'plan-5',
        plan_name: 'Dedicated 24/7 SLA Monthly',
        quantity: 1,
        unit_price: '299.00',
        amount: '299.00',
      },
    ],
    subtotal: '299.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '29.90',
    total: '328.90',
    payment_terms: 'Net 30',
    issue_date: '2026-10-31',
    expiry_date: '2026-11-30',
    notes: 'Draft quotation for dedicated support add-on.',
    created_at: '2026-10-31T09:00:00Z',
    updated_at: '2026-10-31T09:00:00Z',
  },
];

// Initial realistic subscriptions
const initialSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    number: 'SUB-2026-001',
    customer_id: 'cust-1',
    customer_name: 'Acme Cloud Dynamics',
    customer_email: 'sarah@acmecloud.io',
    plan_id: 'plan-2',
    plan_name: 'Core Professional Monthly',
    frequency: 'monthly',
    status: 'active',
    start_date: '2026-08-18',
    next_billing_date: '2026-11-18',
    last_billing_date: '2026-10-18',
    source_quotation_id: 'quo-1',
    source_quotation_number: 'QUO-2026-001',
    items: [
      {
        id: 'sitem-1',
        product_name: 'Brightloop Core Platform - Professional Edition',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    recurring_amount: '149.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total_recurring: '163.90',
    auto_renew: true,
    events: [
      {
        id: 'ev-1',
        event_type: 'created',
        actor: 'Sarah Jenkins (Customer Accept)',
        timestamp: '2026-08-18T14:22:00Z',
        notes: 'Created from accepted quotation QUO-2026-001',
      },
      {
        id: 'ev-2',
        event_type: 'activated',
        actor: 'Taylor Reed (Staff)',
        timestamp: '2026-08-18T14:25:00Z',
        notes: 'Subscription activated and billing schedule initialized.',
      },
      {
        id: 'ev-3',
        event_type: 'billed',
        actor: 'System (Billing Engine)',
        timestamp: '2026-10-18T00:00:00Z',
        notes: 'Recurring invoice INV-2026-001 generated.',
      },
    ],
    created_at: '2026-08-18T14:22:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
  {
    id: 'sub-2',
    number: 'SUB-2026-002',
    customer_id: 'cust-2',
    customer_name: 'Starlight AI Systems',
    customer_email: 'marcus@starlight.ai',
    plan_id: 'plan-3',
    plan_name: 'Core Enterprise Annual',
    frequency: 'yearly',
    status: 'active',
    start_date: '2026-07-12',
    next_billing_date: '2027-07-12',
    last_billing_date: '2026-07-12',
    source_quotation_id: 'quo-2',
    source_quotation_number: 'QUO-2026-002',
    items: [
      {
        id: 'sitem-2',
        product_name: 'Brightloop Core Platform - Enterprise Edition (Annual)',
        quantity: 1,
        unit_price: '4990.00',
        amount: '4990.00',
      },
    ],
    recurring_amount: '4990.00',
    tax_rate: '10.0',
    tax_amount: '499.00',
    total_recurring: '5489.00',
    auto_renew: true,
    events: [
      {
        id: 'ev-4',
        event_type: 'created',
        actor: 'Marcus Vance',
        timestamp: '2026-07-12T10:15:00Z',
        notes: 'Created from accepted quotation QUO-2026-002',
      },
      {
        id: 'ev-5',
        event_type: 'activated',
        actor: 'Alex Mercer (Admin)',
        timestamp: '2026-07-12T10:20:00Z',
        notes: 'Enterprise account activated.',
      },
      {
        id: 'ev-6',
        event_type: 'billed',
        actor: 'System (Billing Engine)',
        timestamp: '2026-07-12T10:21:00Z',
        notes: 'Invoice INV-2026-002 generated.',
      },
    ],
    created_at: '2026-07-12T10:15:00Z',
    updated_at: '2026-07-12T10:21:00Z',
  },
  {
    id: 'sub-3',
    number: 'SUB-2026-003',
    customer_id: 'cust-3',
    customer_name: 'Horizon Robotics',
    customer_email: 'elena@horizon-robotics.com',
    plan_id: 'plan-4',
    plan_name: 'Analytics Suite Monthly',
    frequency: 'monthly',
    status: 'paused',
    start_date: '2026-06-01',
    next_billing_date: '2026-11-01',
    last_billing_date: '2026-09-01',
    pause_reason: 'Client undergoing internal hardware migration; requested temporary pause until Nov 15.',
    items: [
      {
        id: 'sitem-3',
        product_name: 'Advanced Analytics & Forecast Engine - Predictive Pro',
        quantity: 1,
        unit_price: '199.00',
        amount: '199.00',
      },
    ],
    recurring_amount: '199.00',
    tax_rate: '10.0',
    tax_amount: '19.90',
    total_recurring: '218.90',
    auto_renew: true,
    events: [
      {
        id: 'ev-7',
        event_type: 'activated',
        actor: 'Taylor Reed',
        timestamp: '2026-06-01T08:00:00Z',
        notes: 'Subscription activated.',
      },
      {
        id: 'ev-8',
        event_type: 'paused',
        actor: 'Taylor Reed (Staff)',
        timestamp: '2026-09-25T11:00:00Z',
        notes: 'Paused per customer email request (Hardware migration). Billing suppressed.',
      },
    ],
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-09-25T11:00:00Z',
  },
  {
    id: 'sub-4',
    number: 'SUB-2026-004',
    customer_id: 'cust-4',
    customer_name: 'Apex Global Logistics',
    customer_email: 'd.chen@apexglobal.com',
    plan_id: 'plan-2',
    plan_name: 'Core Professional Monthly',
    frequency: 'monthly',
    status: 'active',
    start_date: '2026-09-05',
    next_billing_date: '2026-11-05',
    last_billing_date: '2026-10-05',
    items: [
      {
        id: 'sitem-4',
        product_name: 'Brightloop Core Platform - Professional Edition',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    recurring_amount: '149.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total_recurring: '163.90',
    auto_renew: true,
    events: [
      {
        id: 'ev-9',
        event_type: 'activated',
        actor: 'Taylor Reed',
        timestamp: '2026-09-05T14:30:00Z',
        notes: 'Activated on Net 30 terms.',
      },
    ],
    created_at: '2026-09-05T14:30:00Z',
    updated_at: '2026-10-05T00:00:00Z',
  },
];

// Initial realistic invoices
const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    number: 'INV-2026-001',
    customer_id: 'cust-1',
    customer_name: 'Acme Cloud Dynamics',
    customer_email: 'sarah@acmecloud.io',
    subscription_id: 'sub-1',
    subscription_number: 'SUB-2026-001',
    billing_period_start: '2026-10-18',
    billing_period_end: '2026-11-17',
    status: 'paid',
    is_overdue: false,
    issue_date: '2026-10-18',
    due_date: '2026-11-17',
    items: [
      {
        id: 'iitem-1',
        description: 'Brightloop Core Platform - Professional Edition (Monthly Billing Period Oct 18 - Nov 17)',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    subtotal: '149.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total: '163.90',
    paid_amount: '163.90',
    balance_due: '0.00',
    created_at: '2026-10-18T00:00:00Z',
    updated_at: '2026-10-19T10:00:00Z',
  },
  {
    id: 'inv-2',
    number: 'INV-2026-002',
    customer_id: 'cust-2',
    customer_name: 'Starlight AI Systems',
    customer_email: 'marcus@starlight.ai',
    subscription_id: 'sub-2',
    subscription_number: 'SUB-2026-002',
    billing_period_start: '2026-07-12',
    billing_period_end: '2027-07-11',
    status: 'partially_paid',
    is_overdue: false,
    issue_date: '2026-10-10',
    due_date: '2026-11-10',
    items: [
      {
        id: 'iitem-2',
        description: 'Brightloop Core Platform - Enterprise Edition (Annual Recurring Contract)',
        quantity: 1,
        unit_price: '4990.00',
        amount: '4990.00',
      },
    ],
    subtotal: '4990.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '499.00',
    total: '5489.00',
    paid_amount: '2500.00',
    balance_due: '2989.00',
    notes: 'Initial bank transfer received as partial payment. Remaining balance due on Nov 10.',
    created_at: '2026-10-10T09:00:00Z',
    updated_at: '2026-10-15T15:30:00Z',
  },
  {
    id: 'inv-3',
    number: 'INV-2026-003',
    customer_id: 'cust-3',
    customer_name: 'Horizon Robotics',
    customer_email: 'elena@horizon-robotics.com',
    subscription_id: 'sub-3',
    subscription_number: 'SUB-2026-003',
    billing_period_start: '2026-09-01',
    billing_period_end: '2026-09-30',
    status: 'issued',
    is_overdue: true,
    issue_date: '2026-09-01',
    due_date: '2026-10-01',
    items: [
      {
        id: 'iitem-3',
        description: 'Advanced Analytics & Forecast Engine - Predictive Pro (September 2026)',
        quantity: 1,
        unit_price: '199.00',
        amount: '199.00',
      },
    ],
    subtotal: '199.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '19.90',
    total: '218.90',
    paid_amount: '0.00',
    balance_due: '218.90',
    notes: 'Reminder sent on Oct 15 and Oct 25. Flagged in Control Tower for follow-up.',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-10-25T11:00:00Z',
  },
  {
    id: 'inv-4',
    number: 'INV-2026-004',
    customer_id: 'cust-4',
    customer_name: 'Apex Global Logistics',
    customer_email: 'd.chen@apexglobal.com',
    subscription_id: 'sub-4',
    subscription_number: 'SUB-2026-004',
    billing_period_start: '2026-10-05',
    billing_period_end: '2026-11-04',
    status: 'issued',
    is_overdue: false,
    issue_date: '2026-10-05',
    due_date: '2026-11-04',
    items: [
      {
        id: 'iitem-4',
        description: 'Brightloop Core Platform - Professional Edition (Monthly Oct 05 - Nov 04)',
        quantity: 1,
        unit_price: '149.00',
        amount: '149.00',
      },
    ],
    subtotal: '149.00',
    discount_amount: '0.00',
    tax_rate: '10.0',
    tax_amount: '14.90',
    total: '163.90',
    paid_amount: '0.00',
    balance_due: '163.90',
    created_at: '2026-10-05T00:00:00Z',
    updated_at: '2026-10-05T00:00:00Z',
  },
];

// Initial realistic payments
const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    number: 'PAY-2026-001',
    customer_id: 'cust-1',
    customer_name: 'Acme Cloud Dynamics',
    amount: '163.90',
    unallocated_amount: '0.00',
    method: 'card',
    reference: 'TXN-APPLEPAY-98124',
    received_date: '2026-10-19',
    status: 'completed',
    notes: 'Paid via Corporate Card on invoice issuance.',
    allocations: [
      {
        id: 'alloc-1',
        invoice_id: 'inv-1',
        invoice_number: 'INV-2026-001',
        amount: '163.90',
        allocated_at: '2026-10-19T10:00:00Z',
      },
    ],
    created_at: '2026-10-19T10:00:00Z',
    updated_at: '2026-10-19T10:00:00Z',
  },
  {
    id: 'pay-2',
    number: 'PAY-2026-002',
    customer_id: 'cust-2',
    customer_name: 'Starlight AI Systems',
    amount: '2500.00',
    unallocated_amount: '0.00',
    method: 'bank_transfer',
    reference: 'WIRE-JPM-8492019',
    received_date: '2026-10-15',
    status: 'completed',
    notes: 'Wire transfer partial payment for annual license.',
    allocations: [
      {
        id: 'alloc-2',
        invoice_id: 'inv-2',
        invoice_number: 'INV-2026-002',
        amount: '2500.00',
        allocated_at: '2026-10-15T15:30:00Z',
      },
    ],
    created_at: '2026-10-15T15:30:00Z',
    updated_at: '2026-10-15T15:30:00Z',
  },
];

// Initial notifications
const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Quotation Accepted',
    message: 'Vanguard Financial Analytics accepted quotation QUO-2026-003.',
    type: 'success',
    timestamp: '2 hours ago',
    read: false,
    link: '/quotations',
  },
  {
    id: 'notif-2',
    title: 'Invoice Overdue Alert',
    message: 'Invoice INV-2026-003 (₹768.90) for Horizon Robotics is overdue by 30 days.',
    type: 'warning',
    timestamp: '5 hours ago',
    read: false,
    link: '/invoices',
  },
  {
    id: 'notif-3',
    title: 'Upcoming Renewal',
    message: 'Subscription SUB-2026-004 for Apex Global Logistics renews in 5 days.',
    type: 'info',
    timestamp: '1 day ago',
    read: true,
    link: '/subscriptions',
  },
];

// Initial audit log
const initialAuditLog: AuditLogItem[] = [
  {
    id: 'audit-1',
    actor: 'Alex Mercer (Admin)',
    action: 'USER_LOGIN',
    entity_type: 'AUTH',
    entity_id: 'user-admin',
    timestamp: '2026-10-31T09:00:00Z',
    details: 'Admin signed in from 192.168.1.100',
  },
  {
    id: 'audit-2',
    actor: 'Olivia Bennett (Customer)',
    action: 'ACCEPT_QUOTATION',
    entity_type: 'QUOTATION',
    entity_id: 'quo-3',
    timestamp: '2026-10-28T16:00:00Z',
    details: 'Customer accepted quotation QUO-2026-003 (₹1,098.90)',
  },
  {
    id: 'audit-3',
    actor: 'Taylor Reed (Staff)',
    action: 'PAUSE_SUBSCRIPTION',
    entity_type: 'SUBSCRIPTION',
    entity_id: 'sub-3',
    timestamp: '2026-09-25T11:00:00Z',
    details: 'Paused subscription SUB-2026-003 per customer request',
  },
];

const inrInitialWorkspace: PricingWorkspace = localizeWorkspaceToInr({
  settings: initialSettings,
  customers: initialCustomers,
  products: initialProducts,
  plans: initialPlans,
  discounts: initialDiscounts,
  quotations: initialQuotations,
  subscriptions: initialSubscriptions,
  invoices: initialInvoices,
  payments: initialPayments,
});

export interface SubscriptionContextType {
  currentUser: AuthUser;
  allUsers: AuthUser[];
  setCurrentUser: (user: AuthUser) => void;
  switchRole: (role: UserRole) => void;
  switchCustomerUser: (customerId: string) => void;
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
  customers: Customer[];
  createCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  archiveCustomer: (id: string) => void;
  products: Product[];
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  plans: SubscriptionPlan[];
  createPlan: (data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => SubscriptionPlan;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => void;
  discounts: Discount[];
  createDiscount: (data: Omit<Discount, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Discount;
  updateDiscount: (id: string, data: Partial<Discount>) => void;
  quotations: Quotation[];
  createQuotation: (data: {
    customer_id: string;
    items: Array<{ product_id: string; plan_id?: string; quantity: number; unit_price: string }>;
    discount_id?: string;
    payment_terms?: string;
    expiry_date: string;
    notes?: string;
  }) => Quotation;
  sendQuotation: (id: string) => void;
  acceptQuotation: (id: string, acceptedBy?: string) => void;
  rejectQuotation: (id: string) => void;
  convertQuotationToSubscription: (quotationId: string) => { subscription: Subscription | null; error?: string };
  subscriptions: Subscription[];
  createSubscription: (data: {
    customer_id: string;
    plan_id: string;
    start_date: string;
    auto_renew?: boolean;
    source_quotation_id?: string;
  }) => Subscription;
  purchasePlan: (data: {
    customer_id: string;
    plan_id: string;
    method: Payment['method'];
    reference: string;
  }) => { subscription: Subscription | null; invoice: Invoice | null; payment: Payment | null; error?: string };
  activateSubscription: (id: string) => void;
  pauseSubscription: (id: string, reason: string) => void;
  resumeSubscription: (id: string) => void;
  setSubscriptionAutoRenew: (id: string, enabled: boolean) => void;
  closeSubscription: (id: string) => void;
  invoices: Invoice[];
  billingRuns: BillingRun[];
  runBillingEngine: (targetDate?: string) => BillingRun;
  issueInvoice: (id: string) => void;
  voidInvoice: (id: string) => void;
  payments: Payment[];
  recordPayment: (data: {
    customer_id: string;
    amount: string;
    method: Payment['method'];
    reference: string;
    received_date: string;
    notes?: string;
    allocations?: Array<{ invoice_id: string; amount: string }>;
  }) => { payment: Payment; error?: string };
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  auditLog: AuditLogItem[];
  resetToDefaults: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const STORAGE_KEY_PREFIX = 'brightloop_v2_';
const INR_PRICING_VERSION_KEY = 'brightloop_inr_pricing_version';
const INR_PRICING_VERSION = '2';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [initialWorkspace] = useState<PricingWorkspace>(() => {
    const storedSettings = loadFromStorage<WorkspaceSettings | null>('settings', null);
    const pricingVersion = localStorage.getItem(INR_PRICING_VERSION_KEY);
    const hasLegacyCurrency = Boolean(storedSettings && storedSettings.currency !== 'INR');
    const needsPricingMigration = Boolean(storedSettings && pricingVersion !== INR_PRICING_VERSION);
    const storedWorkspace: PricingWorkspace = {
      settings: storedSettings ?? inrInitialWorkspace.settings,
      customers: loadFromStorage<Customer[]>('customers', hasLegacyCurrency ? initialCustomers : inrInitialWorkspace.customers),
      products: loadFromStorage<Product[]>('products', hasLegacyCurrency ? initialProducts : inrInitialWorkspace.products),
      plans: loadFromStorage<SubscriptionPlan[]>('plans', hasLegacyCurrency ? initialPlans : inrInitialWorkspace.plans),
      discounts: loadFromStorage<Discount[]>('discounts', hasLegacyCurrency ? initialDiscounts : inrInitialWorkspace.discounts),
      quotations: loadFromStorage<Quotation[]>('quotations', hasLegacyCurrency ? initialQuotations : inrInitialWorkspace.quotations),
      subscriptions: loadFromStorage<Subscription[]>('subscriptions', hasLegacyCurrency ? initialSubscriptions : inrInitialWorkspace.subscriptions),
      invoices: loadFromStorage<Invoice[]>('invoices', hasLegacyCurrency ? initialInvoices : inrInitialWorkspace.invoices),
      payments: loadFromStorage<Payment[]>('payments', hasLegacyCurrency ? initialPayments : inrInitialWorkspace.payments),
    };

    if (needsPricingMigration) {
      const localized = localizeWorkspaceToInr(storedWorkspace);
      Object.entries(localized).forEach(([key, value]) => saveToStorage(key, value));
      const notifications = loadFromStorage<NotificationItem[]>('notifications', initialNotifications).map((notification) => ({
        ...notification,
        message: notification.message.replace('($218.90)', '(₹768.90)'),
      }));
      const auditLog = loadFromStorage<AuditLogItem[]>('auditLog', initialAuditLog).map((entry) => ({
        ...entry,
        details: entry.details.replace('($163.90)', '(₹1,098.90)'),
      }));
      saveToStorage('notifications', notifications);
      saveToStorage('auditLog', auditLog);
      localStorage.setItem(INR_PRICING_VERSION_KEY, INR_PRICING_VERSION);
      return localized;
    }
    if (!storedSettings) localStorage.setItem(INR_PRICING_VERSION_KEY, INR_PRICING_VERSION);
    return storedWorkspace;
  });
  const [currentUser, setCurrentUserState] = useState<AuthUser>(() =>
    loadFromStorage<AuthUser>('currentUser', initialUsers[0]!),
  );
  const [allUsers] = useState<AuthUser[]>(initialUsers);
  const [settings, setSettingsState] = useState<WorkspaceSettings>(initialWorkspace.settings);
  const [customers, setCustomersState] = useState<Customer[]>(initialWorkspace.customers);
  const [products, setProductsState] = useState<Product[]>(initialWorkspace.products);
  const [plans, setPlansState] = useState<SubscriptionPlan[]>(initialWorkspace.plans);
  const [discounts, setDiscountsState] = useState<Discount[]>(initialWorkspace.discounts);
  const [quotations, setQuotationsState] = useState<Quotation[]>(initialWorkspace.quotations);
  const [subscriptions, setSubscriptionsState] = useState<Subscription[]>(initialWorkspace.subscriptions);
  const [invoices, setInvoicesState] = useState<Invoice[]>(initialWorkspace.invoices);
  const [payments, setPaymentsState] = useState<Payment[]>(initialWorkspace.payments);
  const [billingRuns, setBillingRunsState] = useState<BillingRun[]>(() =>
    loadFromStorage<BillingRun[]>('billingRuns', []),
  );
  const [notifications, setNotificationsState] = useState<NotificationItem[]>(() =>
    loadFromStorage<NotificationItem[]>('notifications', initialNotifications),
  );
  const [auditLog, setAuditLogState] = useState<AuditLogItem[]>(() =>
    loadFromStorage<AuditLogItem[]>('auditLog', initialAuditLog),
  );

  useEffect(() => saveToStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveToStorage('settings', settings), [settings]);
  useEffect(() => saveToStorage('customers', customers), [customers]);
  useEffect(() => saveToStorage('products', products), [products]);
  useEffect(() => saveToStorage('plans', plans), [plans]);
  useEffect(() => saveToStorage('discounts', discounts), [discounts]);
  useEffect(() => saveToStorage('quotations', quotations), [quotations]);
  useEffect(() => saveToStorage('subscriptions', subscriptions), [subscriptions]);
  useEffect(() => saveToStorage('invoices', invoices), [invoices]);
  useEffect(() => saveToStorage('payments', payments), [payments]);
  useEffect(() => saveToStorage('billingRuns', billingRuns), [billingRuns]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('auditLog', auditLog), [auditLog]);

  const addAuditLog = (action: string, entity_type: string, entity_id: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor: `${currentUser.first_name} ${currentUser.last_name} (${currentUser.role})`,
      action,
      entity_type,
      entity_id,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditLogState((prev) => [newLog, ...prev]);
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', link?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      read: false,
      link,
    };
    setNotificationsState((prev) => [newNotif, ...prev]);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = allUsers.find((u) => u.role === role) || {
      id: `user-${role}`,
      email: `${role}@brightloop.io`,
      first_name: role.toUpperCase(),
      last_name: 'User',
      role,
      is_active: true,
      customer_id: role === 'customer' ? 'cust-1' : undefined,
    };
    setCurrentUserState(targetUser);
    addAuditLog('SWITCH_ROLE', 'AUTH', targetUser.id, `Switched active perspective to ${role}`);
  };

  const switchCustomerUser = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const customerUser: AuthUser = {
      id: `user-cust-${customerId}`,
      email: customer.email,
      first_name: customer.name.split(' ')[0] || customer.name,
      last_name: customer.name.split(' ')[1] || '',
      role: 'customer',
      is_active: true,
      customer_id: customerId,
      title: customer.company_name,
    };
    setCurrentUserState(customerUser);
    addAuditLog('SWITCH_CUSTOMER', 'AUTH', customerId, `Switched customer portal to ${customer.company_name}`);
  };

  const updateSettings = (newSettings: Partial<WorkspaceSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('UPDATE_SETTINGS', 'WORKSPACE', 'settings', 'Workspace settings updated');
    addNotification('Settings Saved', 'Workspace configuration updated successfully.', 'success');
  };

  const createCustomer = (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer => {
    const id = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomersState((prev) => [newCust, ...prev]);
    addAuditLog('CREATE_CUSTOMER', 'CUSTOMER', id, `Created customer ${newCust.company_name}`);
    addNotification('Customer Created', `${newCust.company_name} has been added.`, 'success', '/customers');
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomersState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c)),
    );
    addAuditLog('UPDATE_CUSTOMER', 'CUSTOMER', id, `Updated customer profile`);
  };

  const archiveCustomer = (id: string) => {
    setCustomersState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'archived', updated_at: new Date().toISOString() } : c)),
    );
    addAuditLog('ARCHIVE_CUSTOMER', 'CUSTOMER', id, `Archived customer`);
    addNotification('Customer Archived', 'Customer status updated to archived.', 'info');
  };

  const createProduct = (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product => {
    const id = `prod-${Date.now()}`;
    const newProd: Product = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProductsState((prev) => [newProd, ...prev]);
    addAuditLog('CREATE_PRODUCT', 'PRODUCT', id, `Created product ${newProd.name}`);
    return newProd;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p)),
    );
    addAuditLog('UPDATE_PRODUCT', 'PRODUCT', id, 'Updated product catalogue entry');
  };

  const createPlan = (data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): SubscriptionPlan => {
    const id = `plan-${Date.now()}`;
    const newPlan: SubscriptionPlan = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPlansState((prev) => [newPlan, ...prev]);
    addAuditLog('CREATE_PLAN', 'PLAN', id, `Created subscription plan ${newPlan.name}`);
    addNotification('Plan Created', `Subscription plan ${newPlan.name} is now available.`, 'success', '/plans');
    return newPlan;
  };

  const updatePlan = (id: string, data: Partial<SubscriptionPlan>) => {
    setPlansState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p)),
    );
    addAuditLog('UPDATE_PLAN', 'PLAN', id, 'Updated plan pricing and terms');
  };

  const createDiscount = (data: Omit<Discount, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Discount => {
    const id = `disc-${Date.now()}`;
    const newDisc: Discount = {
      ...data,
      id,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDiscountsState((prev) => [newDisc, ...prev]);
    addAuditLog('CREATE_DISCOUNT', 'DISCOUNT', id, `Created discount code ${newDisc.code}`);
    addNotification('Discount Added', `Discount code ${newDisc.code} created.`, 'success', '/discounts');
    return newDisc;
  };

  const updateDiscount = (id: string, data: Partial<Discount>) => {
    setDiscountsState((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d)),
    );
  };

  const createQuotation = (data: {
    customer_id: string;
    items: Array<{ product_id: string; plan_id?: string; quantity: number; unit_price: string }>;
    discount_id?: string;
    payment_terms?: string;
    expiry_date: string;
    notes?: string;
  }): Quotation => {
    const customer = customers.find((c) => c.id === data.customer_id);
    if (!customer) throw new Error('Customer not found');
    const issueDate = new Date().toISOString().split('T')[0]!;
    if (!data.items.length || data.items.some((item) => item.quantity < 1 || compareDecimals(item.unit_price, '0.00') < 0)) {
      throw new Error('Add at least one valid line item with a positive quantity.');
    }
    if (data.expiry_date < issueDate) throw new Error('A quotation expiry date must be today or later.');
    for (const item of data.items) {
      if (!products.some((product) => product.id === item.product_id)) throw new Error('A selected product is no longer available.');
      if (item.plan_id) {
        const plan = plans.find((candidate) => candidate.id === item.plan_id);
        if (!plan || plan.product_id !== item.product_id || plan.status !== 'active') throw new Error('A selected plan is no longer available.');
        if ((plan.start_date && issueDate < plan.start_date) || (plan.end_date && issueDate > plan.end_date)) throw new Error(`${plan.name} is outside its availability dates.`);
        if (item.quantity < plan.minimum_quantity) throw new Error(`${plan.name} requires a minimum quantity of ${plan.minimum_quantity}.`);
      }
    }

    const nextNum = (quotations.length + 1).toString().padStart(3, '0');
    const quoteNumber = `${settings.quotation_prefix}2026-${nextNum}`;

    let subtotal = '0.00';
    const quoteItems: QuotationItem[] = data.items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.product_id);
      const plan = plans.find((p) => p.id === item.plan_id);
      const lineAmount = multiplyDecimals(item.unit_price, item.quantity);
      subtotal = addDecimals(subtotal, lineAmount);
      return {
        id: `qitem-${Date.now()}-${idx}`,
        product_id: item.product_id,
        product_name: plan ? `${prod?.name ?? 'Product'} - ${plan.name}` : prod?.name ?? 'Product Item',
        plan_id: item.plan_id,
        plan_name: plan?.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: lineAmount,
      };
    });

    let discountAmount = '0.00';
    let discountCode: string | undefined;
    if (data.discount_id) {
      const disc = discounts.find((d) => d.id === data.discount_id);
      if (!disc || disc.status !== 'active') throw new Error('This discount is no longer active.');
      const today = new Date().toISOString().split('T')[0]!;
      if ((disc.start_date && today < disc.start_date) || (disc.end_date && today > disc.end_date)) {
        throw new Error('This discount is outside its valid dates.');
      }
      if (disc.usage_limit && disc.usage_count >= disc.usage_limit) throw new Error('This discount has reached its usage limit.');
      if (disc.min_subtotal && compareDecimals(subtotal, disc.min_subtotal) < 0) {
        throw new Error(`This discount requires a minimum subtotal of ${formatCurrency(disc.min_subtotal, settings.currency_symbol)}.`);
      }
      const totalQuantity = quoteItems.reduce((sum, item) => sum + item.quantity, 0);
      if (disc.minimum_quantity && totalQuantity < disc.minimum_quantity) {
        throw new Error(`Add at least ${disc.minimum_quantity} items to use this discount.`);
      }
      const eligibleItems = disc.scope === 'product' && disc.product_id
        ? quoteItems.filter((item) => item.product_id === disc.product_id)
        : quoteItems;
      if (!eligibleItems.length) throw new Error('This discount does not apply to the selected products.');
      const discountBase = eligibleItems.reduce((sum, item) => addDecimals(sum, item.amount), '0.00');
      discountCode = disc.code;
      discountAmount = disc.type === 'percentage'
        ? calculatePercentage(discountBase, disc.value)
        : (compareDecimals(disc.value, discountBase) > 0 ? discountBase : disc.value);
      setDiscountsState((prev) => prev.map((item) => item.id === disc.id
        ? { ...item, usage_count: item.usage_count + 1 }
        : item));
    }

    const discountedSubtotal = compareDecimals(subtotal, discountAmount) > 0
      ? subtractDecimals(subtotal, discountAmount)
      : '0.00';

    const taxAmount = calculatePercentage(discountedSubtotal, settings.default_tax_rate);
    const total = addDecimals(discountedSubtotal, taxAmount);

    const newQuotation: Quotation = {
      id: `quo-${Date.now()}`,
      number: quoteNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      customer_email: customer.email,
      status: 'draft',
      items: quoteItems,
      discount_id: data.discount_id,
      discount_code: discountCode,
      discount_amount: discountAmount,
      subtotal,
      tax_rate: settings.default_tax_rate,
      tax_amount: taxAmount,
      total,
      payment_terms: data.payment_terms || settings.default_payment_terms,
      issue_date: new Date().toISOString().split('T')[0]!,
      expiry_date: data.expiry_date,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotationsState((prev) => [newQuotation, ...prev]);
    addAuditLog('CREATE_QUOTATION', 'QUOTATION', newQuotation.id, `Created quotation ${quoteNumber} for ${customer.company_name}`);
    addNotification('Quotation Created', `Quotation ${quoteNumber} prepared for ${customer.company_name}`, 'success', '/quotations');
    return newQuotation;
  };

  const sendQuotation = (id: string) => {
    const quote = quotations.find((item) => item.id === id);
    const today = new Date().toISOString().slice(0, 10);
    if (!quote || quote.status !== 'draft') return;
    if (quote.expiry_date < today) {
      addNotification('Quotation expired', `${quote.number} has expired. Update its expiry date before sending.`, 'error', '/quotations');
      return;
    }
    setQuotationsState((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'sent', updated_at: new Date().toISOString() } : q)),
    );
    addAuditLog('SEND_QUOTATION', 'QUOTATION', id, `Sent quotation ${quote?.number} to customer`);
    addNotification('Quotation Sent', `Quotation ${quote?.number} sent to ${quote?.customer_email}`, 'info', '/quotations');
  };

  const acceptQuotation = (id: string, acceptedBy?: string) => {
    const quote = quotations.find((item) => item.id === id);
    const today = new Date().toISOString().slice(0, 10);
    if (!quote || !['draft', 'sent'].includes(quote.status)) return;
    if (quote.expiry_date < today) {
      addNotification('Quotation expired', `${quote.number} is past its expiry date and can no longer be accepted.`, 'error', '/portal');
      return;
    }
    const actor = acceptedBy || `${currentUser.first_name} ${currentUser.last_name}`;
    setQuotationsState((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              accepted_by: actor,
              updated_at: new Date().toISOString(),
            }
          : q,
      ),
    );
    addAuditLog('ACCEPT_QUOTATION', 'QUOTATION', id, `Quotation ${quote?.number} accepted by ${actor}`);
    addNotification('Quotation Accepted', `${quote?.number} has been officially accepted! Ready to convert.`, 'success', '/quotations');
  };

  const rejectQuotation = (id: string) => {
    setQuotationsState((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'rejected', updated_at: new Date().toISOString() } : q)),
    );
    const quote = quotations.find((q) => q.id === id);
    addAuditLog('REJECT_QUOTATION', 'QUOTATION', id, `Quotation ${quote?.number} rejected`);
    addNotification('Quotation Rejected', `${quote?.number} marked as rejected.`, 'error', '/quotations');
  };

  const convertQuotationToSubscription = (quotationId: string): { subscription: Subscription | null; error?: string } => {
    const quote = quotations.find((q) => q.id === quotationId);
    if (!quote) return { subscription: null, error: 'Quotation not found' };

    if (quote.status === 'converted' && quote.converted_subscription_id) {
      return { subscription: null, error: `Quotation is already converted to subscription #${quote.converted_subscription_id}` };
    }

    if (quote.status !== 'accepted') {
      return { subscription: null, error: 'Only accepted quotations can be converted to subscriptions.' };
    }

    const matchedPlan = plans.find((p) => p.id === quote.items[0]?.plan_id);
    if (!matchedPlan) return { subscription: null, error: 'This quotation has no subscription plan to activate.' };

    const nextSubNum = (subscriptions.length + 1).toString().padStart(3, '0');
    const subNumber = `${settings.subscription_prefix}2026-${nextSubNum}`;
    const today = new Date().toISOString().split('T')[0]!;
    if (quote.expiry_date < today) return { subscription: null, error: 'This quotation has expired and cannot be converted.' };
    if (matchedPlan.status !== 'active' || (matchedPlan.start_date && today < matchedPlan.start_date) || (matchedPlan.end_date && today > matchedPlan.end_date)) {
      return { subscription: null, error: 'The plan in this quotation is no longer available.' };
    }
    const nextBillingDate = addBillingInterval(today, matchedPlan.frequency);

    const subItems: SubscriptionItem[] = quote.items.map((qi, idx) => ({
      id: `sitem-${Date.now()}-${idx}`,
      product_id: qi.product_id,
      product_name: qi.product_name,
      quantity: qi.quantity,
      unit_price: qi.unit_price,
      amount: qi.amount,
    }));

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      number: subNumber,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      plan_id: matchedPlan.id,
      plan_name: matchedPlan.name,
      frequency: matchedPlan.frequency,
      status: 'active',
      start_date: today,
      next_billing_date: nextBillingDate,
      last_billing_date: today,
      source_quotation_id: quote.id,
      source_quotation_number: quote.number,
      items: subItems,
      recurring_amount: quote.subtotal,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total_recurring: quote.total,
      auto_renew: matchedPlan.auto_renew,
      can_pause: matchedPlan.allow_pause,
      can_close_early: matchedPlan.can_close_early ?? true,
      can_renew: matchedPlan.can_renew ?? true,
      discount_id: quote.discount_id,
      discount_code: quote.discount_code,
      discount_type: discounts.find((d) => d.id === quote.discount_id)?.type,
      discount_value: discounts.find((d) => d.id === quote.discount_id)?.value,
      discount_start_date: discounts.find((d) => d.id === quote.discount_id)?.start_date,
      discount_end_date: discounts.find((d) => d.id === quote.discount_id)?.end_date,
      discount_min_subtotal: discounts.find((d) => d.id === quote.discount_id)?.min_subtotal,
      discount_minimum_quantity: discounts.find((d) => d.id === quote.discount_id)?.minimum_quantity,
      discount_scope: discounts.find((d) => d.id === quote.discount_id)?.scope,
      discount_product_id: discounts.find((d) => d.id === quote.discount_id)?.product_id,
      discount_usage_limit: discounts.find((d) => d.id === quote.discount_id)?.usage_limit,
      discount_usage_count: discounts.find((d) => d.id === quote.discount_id)?.usage_count,
      events: [
        {
          id: `ev-${Date.now()}-1`,
          event_type: 'created',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Converted from accepted quotation ${quote.number}`,
        },
        {
          id: `ev-${Date.now()}-2`,
          event_type: 'activated',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Subscription activated. First billing period starts ${today}`,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuotationsState((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              status: 'converted',
              converted_subscription_id: newSub.id,
              updated_at: new Date().toISOString(),
            }
          : q,
      ),
    );

    setSubscriptionsState((prev) => [newSub, ...prev]);

    const nextInvNum = (invoices.length + 1).toString().padStart(3, '0');
    const invoiceNumber = `${settings.invoice_prefix}2026-${nextInvNum}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const firstInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: invoiceNumber,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      subscription_id: newSub.id,
      subscription_number: subNumber,
      billing_period_start: today,
      billing_period_end: nextBillingDate,
      status: 'issued',
      is_overdue: false,
      issue_date: today,
      due_date: dueDate.toISOString().split('T')[0]!,
      items: quote.items.map((qi, idx) => ({
        id: `iitem-${Date.now()}-${idx}`,
        description: `${qi.product_name} (Initial Subscription Period ${today} - ${nextBillingDate})`,
        quantity: qi.quantity,
        unit_price: qi.unit_price,
        amount: qi.amount,
      })),
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total: quote.total,
      paid_amount: '0.00',
      balance_due: quote.total,
      notes: `Generated upon conversion of accepted quotation ${quote.number}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInvoicesState((prev) => [firstInvoice, ...prev]);

    addAuditLog(
      'CONVERT_QUOTATION',
      'QUOTATION',
      quotationId,
      `Converted quotation ${quote.number} into Subscription ${subNumber} and generated Invoice ${invoiceNumber}`,
    );

    addNotification(
      'Subscription Activated!',
      `Quotation ${quote.number} converted into ${subNumber}. Invoice ${invoiceNumber} created.`,
      'success',
      '/subscriptions',
    );

    return { subscription: newSub };
  };

  const createSubscription = (data: {
    customer_id: string;
    plan_id: string;
    start_date: string;
    auto_renew?: boolean;
    source_quotation_id?: string;
  }): Subscription => {
    const customer = customers.find((c) => c.id === data.customer_id);
    const plan = plans.find((p) => p.id === data.plan_id);
    if (!customer || !plan) throw new Error('Customer or Plan not found');
    if (plan.status !== 'active' || (plan.start_date && data.start_date < plan.start_date) || (plan.end_date && data.start_date > plan.end_date)) {
      throw new Error('The selected plan is not available on the subscription start date.');
    }

    const nextSubNum = (subscriptions.length + 1).toString().padStart(3, '0');
    const subNumber = `${settings.subscription_prefix}2026-${nextSubNum}`;

    const nextBillingDate = addBillingInterval(data.start_date, plan.frequency);

    const quantity = Math.max(1, plan.minimum_quantity || 1);
    const recurringAmount = multiplyDecimals(plan.price, quantity);
    const taxAmount = calculatePercentage(recurringAmount, settings.default_tax_rate);
    const totalRecurring = addDecimals(recurringAmount, taxAmount);

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      number: subNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      customer_email: customer.email,
      plan_id: plan.id,
      plan_name: plan.name,
      frequency: plan.frequency,
      status: 'active',
      start_date: data.start_date,
      next_billing_date: nextBillingDate,
      last_billing_date: data.start_date,
      source_quotation_id: data.source_quotation_id,
      items: [
        {
          id: `sitem-${Date.now()}`,
          product_id: plan.product_id,
          product_name: `${plan.product_name} - ${plan.name}`,
          quantity,
          unit_price: plan.price,
          amount: recurringAmount,
        },
      ],
      recurring_amount: recurringAmount,
      tax_rate: settings.default_tax_rate,
      tax_amount: taxAmount,
      total_recurring: totalRecurring,
      auto_renew: data.auto_renew ?? plan.auto_renew,
      can_pause: plan.allow_pause,
      can_close_early: plan.can_close_early ?? true,
      can_renew: plan.can_renew ?? true,
      events: [
        {
          id: `ev-${Date.now()}`,
          event_type: 'activated',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: 'Subscription created directly.',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSubscriptionsState((prev) => [newSub, ...prev]);
    addAuditLog('CREATE_SUBSCRIPTION', 'SUBSCRIPTION', newSub.id, `Created subscription ${subNumber}`);
    addNotification('Subscription Active', `${subNumber} for ${customer.company_name} is active.`, 'success', '/subscriptions');
    return newSub;
  };

  const purchasePlan = (data: {
    customer_id: string;
    plan_id: string;
    method: Payment['method'];
    reference: string;
  }): { subscription: Subscription | null; invoice: Invoice | null; payment: Payment | null; error?: string } => {
    const customer = customers.find((item) => item.id === data.customer_id);
    const plan = plans.find((item) => item.id === data.plan_id);
    const today = new Date().toISOString().slice(0, 10);
    if (!customer || !plan) return { subscription: null, invoice: null, payment: null, error: 'Customer or plan could not be found.' };
    if (plan.status !== 'active' || (plan.start_date && today < plan.start_date) || (plan.end_date && today > plan.end_date)) {
      return { subscription: null, invoice: null, payment: null, error: 'This plan is no longer available.' };
    }
    const product = products.find((item) => item.id === plan.product_id);
    if (!product) return { subscription: null, invoice: null, payment: null, error: 'The plan product could not be found.' };

    const timestamp = Date.now();
    const now = new Date().toISOString();
    const quantity = Math.max(1, plan.minimum_quantity || 1);
    const recurringAmount = multiplyDecimals(plan.price, quantity);
    const setupFee = plan.setup_fee || '0.00';
    const invoiceSubtotal = addDecimals(recurringAmount, setupFee);
    const invoiceTax = calculatePercentage(invoiceSubtotal, settings.default_tax_rate);
    const invoiceTotal = addDecimals(invoiceSubtotal, invoiceTax);
    const recurringTax = calculatePercentage(recurringAmount, settings.default_tax_rate);
    const totalRecurring = addDecimals(recurringAmount, recurringTax);
    const nextBillingDate = addBillingInterval(today, plan.frequency);
    const nextSubNum = (subscriptions.length + 1).toString().padStart(3, '0');
    const subscriptionNumber = `${settings.subscription_prefix}2026-${nextSubNum}`;
    const nextInvoiceNum = (invoices.length + 1).toString().padStart(3, '0');
    const invoiceNumber = `${settings.invoice_prefix}2026-${nextInvoiceNum}`;
    const nextPaymentNum = (payments.length + 1).toString().padStart(3, '0');
    const paymentNumber = `${settings.payment_prefix}2026-${nextPaymentNum}`;
    const invoiceId = `inv-${timestamp}`;
    const subscriptionId = `sub-${timestamp}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const subscriptionItems: SubscriptionItem[] = [{
      id: `sitem-${timestamp}`,
      product_id: plan.product_id,
      product_name: `${plan.product_name} - ${plan.name}`,
      quantity,
      unit_price: plan.price,
      amount: recurringAmount,
    }];
    const invoiceItems: InvoiceItem[] = [{
      id: `iitem-${timestamp}-1`,
      description: `${plan.name} (${plan.frequency} subscription)` ,
      quantity,
      unit_price: plan.price,
      amount: recurringAmount,
    }];
    if (compareDecimals(setupFee, '0.00') > 0) {
      invoiceItems.push({
        id: `iitem-${timestamp}-2`,
        description: `${plan.name} one-time setup fee`,
        quantity: 1,
        unit_price: setupFee,
        amount: setupFee,
      });
    }

    const subscription: Subscription = {
      id: subscriptionId,
      number: subscriptionNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      customer_email: customer.email,
      plan_id: plan.id,
      plan_name: plan.name,
      frequency: plan.frequency,
      status: 'active',
      start_date: today,
      next_billing_date: nextBillingDate,
      last_billing_date: today,
      items: subscriptionItems,
      recurring_amount: recurringAmount,
      tax_rate: settings.default_tax_rate,
      tax_amount: recurringTax,
      total_recurring: totalRecurring,
      auto_renew: plan.auto_renew,
      can_pause: plan.allow_pause,
      can_close_early: plan.can_close_early ?? true,
      can_renew: plan.can_renew ?? true,
      events: [{
        id: `ev-${timestamp}`,
        event_type: 'activated',
        actor: `${currentUser.first_name} ${currentUser.last_name}`,
        timestamp: now,
        notes: `Plan purchased through simulated ${data.method.replace('_', ' ')} checkout.`,
      }],
      created_at: now,
      updated_at: now,
    };
    const invoice: Invoice = {
      id: invoiceId,
      number: invoiceNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      customer_email: customer.email,
      subscription_id: subscriptionId,
      subscription_number: subscriptionNumber,
      billing_period_start: today,
      billing_period_end: nextBillingDate,
      status: 'paid',
      is_overdue: false,
      issue_date: today,
      due_date: dueDate.toISOString().slice(0, 10),
      items: invoiceItems,
      subtotal: invoiceSubtotal,
      discount_amount: '0.00',
      tax_rate: settings.default_tax_rate,
      tax_amount: invoiceTax,
      total: invoiceTotal,
      paid_amount: invoiceTotal,
      balance_due: '0.00',
      notes: `Paid at checkout using simulated ${data.method.replace('_', ' ')} payment.`,
      created_at: now,
      updated_at: now,
    };
    const allocation: PaymentAllocation = {
      id: `alloc-${timestamp}`,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      amount: invoiceTotal,
      allocated_at: now,
    };
    const payment: Payment = {
      id: `pay-${timestamp}`,
      number: paymentNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      amount: invoiceTotal,
      unallocated_amount: '0.00',
      method: data.method,
      reference: data.reference,
      received_date: today,
      status: 'completed',
      notes: 'Simulated payment completed during customer plan checkout. No real funds were collected.',
      allocations: [allocation],
      created_at: now,
      updated_at: now,
    };

    setSubscriptionsState((prev) => [subscription, ...prev]);
    setInvoicesState((prev) => [invoice, ...prev]);
    setPaymentsState((prev) => [payment, ...prev]);
    addAuditLog('PURCHASE_PLAN', 'SUBSCRIPTION', subscriptionId, `Purchased ${plan.name}; invoice ${invoiceNumber} paid by simulated ${data.method.replace('_', ' ')} payment.`);
    addNotification('Payment successful', `${plan.name} is active. Invoice ${invoiceNumber} is paid.`, 'success', '/portal');
    return { subscription, invoice, payment };
  };

  const activateSubscription = (id: string) => {
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'activated',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: 'Subscription activated.',
        };
        return {
          ...s,
          status: 'active',
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addNotification('Subscription Activated', 'Subscription is now active.', 'success');
  };

  const pauseSubscription = (id: string, reason: string) => {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription || subscription.status !== 'active' || subscription.can_pause === false) return;
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'paused',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Paused: ${reason}`,
        };
        return {
          ...s,
          status: 'paused',
          pause_reason: reason,
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addAuditLog('PAUSE_SUBSCRIPTION', 'SUBSCRIPTION', id, `Paused subscription: ${reason}`);
    addNotification('Subscription Paused', 'Recurring billing suspended.', 'warning', '/subscriptions');
  };

  const resumeSubscription = (id: string) => {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription || subscription.status !== 'paused') return;
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const today = new Date().toISOString().split('T')[0]!;
        const nextBillingDate = addBillingInterval(today, s.frequency);

        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'resumed',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Resumed from pause. Next billing date set to ${nextBillingDate}`,
        };
        return {
          ...s,
          status: 'active',
          pause_reason: undefined,
          last_billing_date: today,
          next_billing_date: nextBillingDate,
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addAuditLog('RESUME_SUBSCRIPTION', 'SUBSCRIPTION', id, 'Resumed subscription from paused state');
    addNotification('Subscription Resumed', 'Subscription is active. Next billing cycle set.', 'success');
  };

  const setSubscriptionAutoRenew = (id: string, enabled: boolean) => {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription || subscription.status !== 'active' || subscription.can_renew === false) return;
    const customer = customers.find((item) => item.id === subscription.customer_id);
    if (currentUser.role === 'customer' && customer?.email.toLowerCase() !== currentUser.email.toLowerCase()) return;

    setSubscriptionsState((prev) => prev.map((item) => item.id === id ? {
      ...item,
      auto_renew: enabled,
      events: [{
        id: `ev-${Date.now()}`,
        event_type: 'renewed',
        actor: `${currentUser.first_name} ${currentUser.last_name}`,
        timestamp: new Date().toISOString(),
        notes: enabled ? 'Automatic renewal enabled.' : 'Automatic renewal disabled; service remains active through the current period.',
      }, ...item.events],
      updated_at: new Date().toISOString(),
    } : item));
    addAuditLog(enabled ? 'ENABLE_AUTO_RENEW' : 'DISABLE_AUTO_RENEW', 'SUBSCRIPTION', id, `Automatic renewal ${enabled ? 'enabled' : 'disabled'}`);
    addNotification(enabled ? 'Auto-renew enabled' : 'Auto-renew disabled', enabled
      ? 'This subscription will renew on its next billing date.'
      : 'Your service remains active through the current billing period.', enabled ? 'success' : 'info');
  };

  const closeSubscription = (id: string) => {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription || subscription.status === 'closed' || subscription.can_close_early === false) return;
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'closed',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: 'Subscription closed early by authorized operator.',
        };
        return {
          ...s,
          status: 'closed',
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addAuditLog('CLOSE_SUBSCRIPTION', 'SUBSCRIPTION', id, 'Closed subscription early');
    addNotification('Subscription Closed', 'Subscription marked as closed.', 'info');
  };

  const runBillingEngine = (targetDate?: string): BillingRun => {
    const runDate = targetDate || new Date().toISOString().split('T')[0]!;
    const log: string[] = [];
    let processed = 0;
    let created = 0;
    let skipped = 0;
    const errors = 0;

    log.push(`[${new Date().toISOString()}] Billing run initialized for target date: ${runDate}`);

    const newInvoices: Invoice[] = [];
    const discountUsesThisRun = new Map<string, number>();
    const updatedSubscriptions: Subscription[] = subscriptions.map((sub) => {
      if (sub.status !== 'active') {
        return sub;
      }

      processed++;

      if (sub.next_billing_date > runDate) {
        log.push(`[SKIP] Subscription ${sub.number} (${sub.customer_name}): next billing date ${sub.next_billing_date} is in the future.`);
        skipped++;
        return sub;
      }

      if (!sub.auto_renew || sub.can_renew === false) {
        const expiredEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}-${newInvoices.length}`,
          event_type: 'expired',
          actor: 'System (Billing Engine)',
          timestamp: new Date().toISOString(),
          notes: 'Subscription reached its renewal date without renewal enabled.',
        };
        log.push(`[EXPIRED] Subscription ${sub.number} reached its renewal date without auto-renewal.`);
        skipped++;
        return { ...sub, status: 'expired', events: [expiredEvent, ...sub.events], updated_at: new Date().toISOString() };
      }

      const periodStart = sub.next_billing_date;
      const periodEnd = addBillingInterval(periodStart, sub.frequency);

      const alreadyInvoiced = invoices.some(
        (inv) => inv.subscription_id === sub.id && inv.billing_period_start === periodStart,
      );

      if (alreadyInvoiced) {
        log.push(`[IDEMPOTENT SKIP] Subscription ${sub.number} already has an invoice for period ${periodStart} - ${periodEnd}.`);
        skipped++;
        return sub;
      }

      const nextInvNum = (invoices.length + newInvoices.length + 1).toString().padStart(3, '0');
      const invoiceNumber = `${settings.invoice_prefix}2026-${nextInvNum}`;
      const dueDateObj = new Date(runDate);
      dueDateObj.setDate(dueDateObj.getDate() + 30);

      const invoiceItems: InvoiceItem[] = sub.items.map((item, idx) => ({
        id: `iitem-${Date.now()}-${newInvoices.length}-${idx}`,
        description: `${item.product_name} (${sub.frequency.toUpperCase()} recurring: ${periodStart} to ${periodEnd})`,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      const discount = sub.discount_id ? discounts.find((item) => item.id === sub.discount_id) : undefined;
      const matchingItems = sub.discount_scope === 'product' && sub.discount_product_id
        ? sub.items.filter((item) => item.product_id === sub.discount_product_id)
        : sub.items;
      const discountBase = matchingItems.reduce((sum, item) => addDecimals(sum, item.amount), '0.00');
      const quantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
      const runUsageCount = discount ? (discountUsesThisRun.get(discount.id) ?? 0) : 0;
      const totalUsageCount = discount ? discount.usage_count + runUsageCount : 0;
      const discountValid = Boolean(
        discount &&
        discount.status === 'active' &&
        (!sub.discount_start_date || runDate >= sub.discount_start_date) &&
        (!sub.discount_end_date || runDate <= sub.discount_end_date) &&
        (!sub.discount_usage_limit || totalUsageCount < sub.discount_usage_limit) &&
        (!sub.discount_min_subtotal || compareDecimals(sub.recurring_amount, sub.discount_min_subtotal) >= 0) &&
        (!sub.discount_minimum_quantity || quantity >= sub.discount_minimum_quantity) &&
        compareDecimals(discountBase, '0.00') > 0,
      );
      let discountAmount = '0.00';
      if (discountValid && sub.discount_type && sub.discount_value) {
        discountAmount = sub.discount_type === 'percentage'
          ? calculatePercentage(discountBase, sub.discount_value)
          : (compareDecimals(sub.discount_value, discountBase) > 0 ? discountBase : sub.discount_value);
        if (discount) discountUsesThisRun.set(discount.id, runUsageCount + 1);
      }
      const invoicedSubtotal = compareDecimals(sub.recurring_amount, discountAmount) > 0
        ? subtractDecimals(sub.recurring_amount, discountAmount)
        : '0.00';
      const invoicedTax = calculatePercentage(invoicedSubtotal, sub.tax_rate);
      const invoiceTotal = addDecimals(invoicedSubtotal, invoicedTax);

      const newInv: Invoice = {
        id: `inv-${Date.now()}-${newInvoices.length}`,
        number: invoiceNumber,
        customer_id: sub.customer_id,
        customer_name: sub.customer_name,
        customer_email: sub.customer_email,
        subscription_id: sub.id,
        subscription_number: sub.number,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        status: 'issued',
        is_overdue: false,
        issue_date: runDate,
        due_date: dueDateObj.toISOString().split('T')[0]!,
        items: invoiceItems,
        subtotal: sub.recurring_amount,
        discount_amount: discountAmount,
        tax_rate: sub.tax_rate,
        tax_amount: invoicedTax,
        total: invoiceTotal,
        paid_amount: '0.00',
        balance_due: invoiceTotal,
        notes: discountAmount !== '0.00'
          ? `Automated recurring invoice generated for ${sub.frequency} cycle. Discount ${sub.discount_code} applied.`
          : `Automated recurring invoice generated for ${sub.frequency} cycle.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      newInvoices.push(newInv);
      created++;
      log.push(`[SUCCESS] Generated Invoice ${invoiceNumber} (${formatCurrency(invoiceTotal, settings.currency_symbol)}) for ${sub.customer_name} (${sub.number}).`);

      const newNextBilling = periodEnd;
      const billedEvent: SubscriptionEvent = {
        id: `ev-${Date.now()}-${newInvoices.length}`,
        event_type: 'billed',
        actor: 'System (Billing Engine)',
        timestamp: new Date().toISOString(),
        notes: `Recurring invoice ${invoiceNumber} generated for period ${periodStart} - ${periodEnd}.`,
      };

      return {
        ...sub,
        last_billing_date: runDate,
        next_billing_date: newNextBilling,
        tax_amount: invoicedTax,
        total_recurring: invoiceTotal,
        discount_usage_count: (sub.discount_usage_count ?? 0) + (discountAmount !== '0.00' ? 1 : 0),
        events: [billedEvent, ...sub.events],
        updated_at: new Date().toISOString(),
      };
    });

    setSubscriptionsState(updatedSubscriptions);
    if (newInvoices.length > 0) {
      setInvoicesState((prev) => [...newInvoices, ...prev]);
      if (discountUsesThisRun.size) {
        setDiscountsState((prev) => prev.map((discount) => ({
          ...discount,
          usage_count: discount.usage_count + (discountUsesThisRun.get(discount.id) ?? 0),
        })));
      }
    }

    log.push(`[SUMMARY] Checked ${processed} active subscriptions. Created ${created} invoices. Skipped ${skipped}. Errors: ${errors}.`);

    const billingRun: BillingRun = {
      id: `run-${Date.now()}`,
      run_date: runDate,
      processed_at: new Date().toISOString(),
      subscriptions_checked: processed,
      invoices_created: created,
      invoices_skipped: skipped,
      errors_count: errors,
      status: errors === 0 ? 'completed' : 'partial',
      log,
    };

    setBillingRunsState((prev) => [billingRun, ...prev]);
    addAuditLog('BILLING_RUN', 'BILLING', billingRun.id, `Billing run completed. ${created} invoices created.`);
    addNotification(
      'Billing Engine Run Complete',
      `Processed ${processed} subscriptions: ${created} invoices generated, ${skipped} skipped.`,
      'success',
      '/invoices',
    );

    return billingRun;
  };

  const issueInvoice = (id: string) => {
    setInvoicesState((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'issued', updated_at: new Date().toISOString() } : inv)),
    );
    addNotification('Invoice Issued', 'Invoice marked as issued and sent to customer.', 'info');
  };

  const voidInvoice = (id: string) => {
    setInvoicesState((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'void', balance_due: '0.00', updated_at: new Date().toISOString() } : inv)),
    );
    addAuditLog('VOID_INVOICE', 'INVOICE', id, 'Voided invoice');
    addNotification('Invoice Voided', 'Invoice has been voided.', 'warning');
  };

  const recordPayment = (data: {
    customer_id: string;
    amount: string;
    method: Payment['method'];
    reference: string;
    received_date: string;
    notes?: string;
    allocations?: Array<{ invoice_id: string; amount: string }>;
  }): { payment: Payment; error?: string } => {
    const customer = customers.find((c) => c.id === data.customer_id);
    if (!customer) return { payment: {} as Payment, error: 'Customer not found' };

    let totalAllocated = '0.00';
    const cleanAllocations: PaymentAllocation[] = [];

    if (data.allocations && data.allocations.length > 0) {
      for (const item of data.allocations) {
        if (compareDecimals(item.amount, '0.00') <= 0) continue;
        const invoice = invoices.find((inv) => inv.id === item.invoice_id);
        if (!invoice) return { payment: {} as Payment, error: `Invoice ${item.invoice_id} not found` };

        if (compareDecimals(item.amount, invoice.balance_due) > 0) {
          return {
            payment: {} as Payment,
            error: `Allocation amount (${formatCurrency(item.amount, settings.currency_symbol)}) exceeds outstanding balance (${formatCurrency(invoice.balance_due, settings.currency_symbol)}) on invoice ${invoice.number}`,
          };
        }

        totalAllocated = addDecimals(totalAllocated, item.amount);
        cleanAllocations.push({
          id: `alloc-${Date.now()}-${cleanAllocations.length}`,
          invoice_id: invoice.id,
          invoice_number: invoice.number,
          amount: item.amount,
          allocated_at: new Date().toISOString(),
        });
      }

      if (compareDecimals(totalAllocated, data.amount) > 0) {
        return {
          payment: {} as Payment,
          error: `Total allocation (${formatCurrency(totalAllocated, settings.currency_symbol)}) cannot exceed payment amount (${formatCurrency(data.amount, settings.currency_symbol)})`,
        };
      }
    }

    const unallocatedAmount = subtractDecimals(data.amount, totalAllocated);
    const nextPayNum = (payments.length + 1).toString().padStart(3, '0');
    const paymentNumber = `${settings.payment_prefix}2026-${nextPayNum}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      number: paymentNumber,
      customer_id: customer.id,
      customer_name: customer.company_name,
      amount: data.amount,
      unallocated_amount: unallocatedAmount,
      method: data.method,
      reference: data.reference,
      received_date: data.received_date,
      status: 'completed',
      notes: data.notes,
      allocations: cleanAllocations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (cleanAllocations.length > 0) {
      setInvoicesState((prev) =>
        prev.map((inv) => {
          const matchAlloc = cleanAllocations.find((a) => a.invoice_id === inv.id);
          if (!matchAlloc) return inv;

          const newPaid = addDecimals(inv.paid_amount, matchAlloc.amount);
          const newBalance = subtractDecimals(inv.balance_due, matchAlloc.amount);
          const isFullyPaid = compareDecimals(newBalance, '0.00') <= 0;

          return {
            ...inv,
            paid_amount: newPaid,
            balance_due: isFullyPaid ? '0.00' : newBalance,
            status: isFullyPaid ? 'paid' : 'partially_paid',
            is_overdue: isFullyPaid ? false : inv.is_overdue,
            updated_at: new Date().toISOString(),
          };
        }),
      );
    }

    setPaymentsState((prev) => [newPayment, ...prev]);

    addAuditLog(
      'RECORD_PAYMENT',
      'PAYMENT',
      newPayment.id,
      `Recorded payment ${paymentNumber} (${formatCurrency(data.amount, settings.currency_symbol)}) for ${customer.company_name}. Allocated ${formatCurrency(totalAllocated, settings.currency_symbol)}`,
    );

    addNotification(
      'Payment Recorded',
      `Payment ${paymentNumber} for ${formatCurrency(data.amount, settings.currency_symbol)} recorded successfully.`,
      'success',
      '/payments',
    );

    return { payment: newPayment };
  };

  const markNotificationAsRead = (id: string) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = () => {
    setNotificationsState((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToDefaults = () => {
    setCurrentUserState(initialUsers[0]!);
    setSettingsState(inrInitialWorkspace.settings);
    setCustomersState(inrInitialWorkspace.customers);
    setProductsState(inrInitialWorkspace.products);
    setPlansState(inrInitialWorkspace.plans);
    setDiscountsState(inrInitialWorkspace.discounts);
    setQuotationsState(inrInitialWorkspace.quotations);
    setSubscriptionsState(inrInitialWorkspace.subscriptions);
    setInvoicesState(inrInitialWorkspace.invoices);
    setPaymentsState(inrInitialWorkspace.payments);
    setBillingRunsState([]);
    setNotificationsState(initialNotifications);
    setAuditLogState(initialAuditLog);

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Storage clear error', e);
    }

    addNotification('Demo State Reset', 'All records restored to fresh initial state.', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser: setCurrentUserState,
        switchRole,
        switchCustomerUser,
        settings,
        updateSettings,
        customers,
        createCustomer,
        updateCustomer,
        archiveCustomer,
        products,
        createProduct,
        updateProduct,
        plans,
        createPlan,
        updatePlan,
        discounts,
        createDiscount,
        updateDiscount,
        quotations,
        createQuotation,
        sendQuotation,
        acceptQuotation,
        rejectQuotation,
        convertQuotationToSubscription,
        subscriptions,
        createSubscription,
        purchasePlan,
        activateSubscription,
        pauseSubscription,
        resumeSubscription,
        setSubscriptionAutoRenew,
        closeSubscription,
        invoices,
        billingRuns,
        runBillingEngine,
        issueInvoice,
        voidInvoice,
        payments,
        recordPayment,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        auditLog,
        resetToDefaults,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
