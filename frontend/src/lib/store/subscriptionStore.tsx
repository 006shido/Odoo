import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Customer,
  Product,
  SubscriptionPlan,
  Discount,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  PaymentAllocation,
  BillingRun,
  WorkspaceSettings,
  NotificationItem,
  AuditLogItem,
  AuthUser,
  UserRole,
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
} from '@/lib/decimal';

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
  currency: 'USD',
  currency_symbol: '$',
  billing_timezone: 'America/New_York (UTC-5)',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    name: 'Annual Enterprise Credit $500',
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
    next_billing_date: '2026-11-05', // In 5 days!
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
    notes: 'Initial wire transfer received for $2,500. Remainder due on Nov 10.',
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
    due_date: '2026-10-01', // Overdue!
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
    message: 'Invoice INV-2026-003 ($218.90) for Horizon Robotics is overdue by 30 days.',
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
    details: 'Customer accepted quotation QUO-2026-003 ($163.90)',
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

// Context Type definition
export interface SubscriptionContextType {
  // Current user & role state
  currentUser: AuthUser;
  allUsers: AuthUser[];
  setCurrentUser: (user: AuthUser) => void;
  switchRole: (role: UserRole) => void;
  switchCustomerUser: (customerId: string) => void;

  // Workspace Settings
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;

  // Customers
  customers: Customer[];
  createCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  archiveCustomer: (id: string) => void;

  // Products
  products: Product[];
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // Plans
  plans: SubscriptionPlan[];
  createPlan: (data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => SubscriptionPlan;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => void;

  // Discounts
  discounts: Discount[];
  createDiscount: (data: Omit<Discount, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Discount;
  updateDiscount: (id: string, data: Partial<Discount>) => void;

  // Quotations
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

  // Subscriptions
  subscriptions: Subscription[];
  createSubscription: (data: {
    customer_id: string;
    plan_id: string;
    start_date: string;
    auto_renew?: boolean;
    source_quotation_id?: string;
  }) => Subscription;
  activateSubscription: (id: string) => void;
  pauseSubscription: (id: string, reason: string) => void;
  resumeSubscription: (id: string) => void;
  renewSubscription: (id: string) => void;
  closeSubscription: (id: string) => void;

  // Invoices & Recurring Billing Engine
  invoices: Invoice[];
  billingRuns: BillingRun[];
  runBillingEngine: (targetDate?: string) => BillingRun;
  issueInvoice: (id: string) => void;
  voidInvoice: (id: string) => void;

  // Payments & Allocation
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

  // Notifications & Audit Log
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  auditLog: AuditLogItem[];

  // Demo helper
  resetToDefaults: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const STORAGE_KEY_PREFIX = 'brightloop_v2_';

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
  const [currentUser, setCurrentUserState] = useState<AuthUser>(() =>
    loadFromStorage<AuthUser>('currentUser', initialUsers[0]!),
  );
  const [allUsers] = useState<AuthUser[]>(initialUsers);
  const [settings, setSettingsState] = useState<WorkspaceSettings>(() =>
    loadFromStorage<WorkspaceSettings>('settings', initialSettings),
  );
  const [customers, setCustomersState] = useState<Customer[]>(() =>
    loadFromStorage<Customer[]>('customers', initialCustomers),
  );
  const [products, setProductsState] = useState<Product[]>(() =>
    loadFromStorage<Product[]>('products', initialProducts),
  );
  const [plans, setPlansState] = useState<SubscriptionPlan[]>(() =>
    loadFromStorage<SubscriptionPlan[]>('plans', initialPlans),
  );
  const [discounts, setDiscountsState] = useState<Discount[]>(() =>
    loadFromStorage<Discount[]>('discounts', initialDiscounts),
  );
  const [quotations, setQuotationsState] = useState<Quotation[]>(() =>
    loadFromStorage<Quotation[]>('quotations', initialQuotations),
  );
  const [subscriptions, setSubscriptionsState] = useState<Subscription[]>(() =>
    loadFromStorage<Subscription[]>('subscriptions', initialSubscriptions),
  );
  const [invoices, setInvoicesState] = useState<Invoice[]>(() =>
    loadFromStorage<Invoice[]>('invoices', initialInvoices),
  );
  const [payments, setPaymentsState] = useState<Payment[]>(() =>
    loadFromStorage<Payment[]>('payments', initialPayments),
  );
  const [billingRuns, setBillingRunsState] = useState<BillingRun[]>(() =>
    loadFromStorage<BillingRun[]>('billingRuns', []),
  );
  const [notifications, setNotificationsState] = useState<NotificationItem[]>(() =>
    loadFromStorage<NotificationItem[]>('notifications', initialNotifications),
  );
  const [auditLog, setAuditLogState] = useState<AuditLogItem[]>(() =>
    loadFromStorage<AuditLogItem[]>('auditLog', initialAuditLog),
  );

  // Sync to localStorage
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

  // Log an audit event
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

  // Add a toast notification
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

  // Role switching
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

  // Settings
  const updateSettings = (newSettings: Partial<WorkspaceSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('UPDATE_SETTINGS', 'WORKSPACE', 'settings', 'Workspace settings updated');
    addNotification('Settings Saved', 'Workspace configuration updated successfully.', 'success');
  };

  // Customers CRUD
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

  // Products CRUD
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

  // Plans CRUD
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

  // Discounts CRUD
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

  // Quotations
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

    // Discount calculation
    let discountAmount = '0.00';
    let discountCode: string | undefined;
    if (data.discount_id) {
      const disc = discounts.find((d) => d.id === data.discount_id);
      if (disc && disc.status === 'active') {
        discountCode = disc.code;
        if (disc.type === 'percentage') {
          discountAmount = calculatePercentage(subtotal, disc.value);
        } else {
          discountAmount = disc.value;
        }
      }
    }

    // Base subtotal after discount
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
    setQuotationsState((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'sent', updated_at: new Date().toISOString() } : q)),
    );
    const quote = quotations.find((q) => q.id === id);
    addAuditLog('SEND_QUOTATION', 'QUOTATION', id, `Sent quotation ${quote?.number} to customer`);
    addNotification('Quotation Sent', `Quotation ${quote?.number} sent to ${quote?.customer_email}`, 'info', '/quotations');
  };

  const acceptQuotation = (id: string, acceptedBy?: string) => {
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
    const quote = quotations.find((q) => q.id === id);
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

  // Convert Quotation to Subscription (Strictly idempotent)
  const convertQuotationToSubscription = (quotationId: string): { subscription: Subscription | null; error?: string } => {
    const quote = quotations.find((q) => q.id === quotationId);
    if (!quote) return { subscription: null, error: 'Quotation not found' };

    if (quote.status === 'converted' && quote.converted_subscription_id) {
      return { subscription: null, error: `Quotation is already converted to subscription #${quote.converted_subscription_id}` };
    }

    if (quote.status !== 'accepted') {
      return { subscription: null, error: 'Only accepted quotations can be converted to subscriptions.' };
    }

    const nextSubNum = (subscriptions.length + 1).toString().padStart(3, '0');
    const subNumber = `${settings.subscription_prefix}2026-${nextSubNum}`;
    const today = new Date().toISOString().split('T')[0]!;

    // Calculate next billing date: +1 month by default
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextBillingDate = nextDate.toISOString().split('T')[0]!;

    // Build subscription line items snapshot
    const subItems: SubscriptionItem[] = quote.items.map((qi, idx) => ({
      id: `sitem-${Date.now()}-${idx}`,
      product_name: qi.product_name,
      quantity: qi.quantity,
      unit_price: qi.unit_price,
      amount: qi.amount,
    }));

    // Find main plan from quote items or fallback
    const matchedPlan = plans.find((p) => p.id === quote.items[0]?.plan_id) || plans[0]!;

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
      auto_renew: true,
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

    // Mark quotation as converted
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

    // Save subscription
    setSubscriptionsState((prev) => [newSub, ...prev]);

    // Also automatically generate the first invoice for this subscription!
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

  // Subscriptions Lifecycle
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

    const nextSubNum = (subscriptions.length + 1).toString().padStart(3, '0');
    const subNumber = `${settings.subscription_prefix}2026-${nextSubNum}`;

    const startDate = new Date(data.start_date);
    const nextDate = new Date(startDate);
    if (plan.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (plan.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (plan.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    const taxAmount = calculatePercentage(plan.price, settings.default_tax_rate);
    const totalRecurring = addDecimals(plan.price, taxAmount);

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
      next_billing_date: nextDate.toISOString().split('T')[0]!,
      last_billing_date: data.start_date,
      source_quotation_id: data.source_quotation_id,
      items: [
        {
          id: `sitem-${Date.now()}`,
          product_name: `${plan.product_name} - ${plan.name}`,
          quantity: 1,
          unit_price: plan.price,
          amount: plan.price,
        },
      ],
      recurring_amount: plan.price,
      tax_rate: settings.default_tax_rate,
      tax_amount: taxAmount,
      total_recurring: totalRecurring,
      auto_renew: data.auto_renew ?? true,
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
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        // Resume begins a new full period from today
        const today = new Date().toISOString().split('T')[0]!;
        const nextDate = new Date();
        if (s.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (s.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (s.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        else nextDate.setMonth(nextDate.getMonth() + 1);

        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'resumed',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Resumed from pause. Next billing date set to ${nextDate.toISOString().split('T')[0]}`,
        };
        return {
          ...s,
          status: 'active',
          pause_reason: undefined,
          last_billing_date: today,
          next_billing_date: nextDate.toISOString().split('T')[0]!,
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addAuditLog('RESUME_SUBSCRIPTION', 'SUBSCRIPTION', id, 'Resumed subscription from paused state');
    addNotification('Subscription Resumed', 'Subscription is active. Next billing cycle set.', 'success');
  };

  const renewSubscription = (id: string) => {
    setSubscriptionsState((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const currentNext = new Date(s.next_billing_date);
        if (s.frequency === 'yearly') currentNext.setFullYear(currentNext.getFullYear() + 1);
        else currentNext.setMonth(currentNext.getMonth() + 1);

        const newEvent: SubscriptionEvent = {
          id: `ev-${Date.now()}`,
          event_type: 'renewed',
          actor: `${currentUser.first_name} ${currentUser.last_name}`,
          timestamp: new Date().toISOString(),
          notes: `Manually renewed. Extended to ${currentNext.toISOString().split('T')[0]}`,
        };
        return {
          ...s,
          next_billing_date: currentNext.toISOString().split('T')[0]!,
          events: [newEvent, ...s.events],
          updated_at: new Date().toISOString(),
        };
      }),
    );
    addAuditLog('RENEW_SUBSCRIPTION', 'SUBSCRIPTION', id, 'Manually renewed subscription cycle');
    addNotification('Subscription Renewed', 'Billing cycle advanced successfully.', 'success');
  };

  const closeSubscription = (id: string) => {
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

  // Recurring Billing Engine
  const runBillingEngine = (targetDate?: string): BillingRun => {
    const runDate = targetDate || new Date().toISOString().split('T')[0]!;
    const log: string[] = [];
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;

    log.push(`[${new Date().toISOString()}] Billing run initialized for target date: ${runDate}`);

    const newInvoices: Invoice[] = [];
    const updatedSubscriptions: Subscription[] = subscriptions.map((sub) => {
      // Only process Active subscriptions
      if (sub.status !== 'active') {
        return sub;
      }

      processed++;

      // Check if due: next_billing_date <= runDate
      if (sub.next_billing_date > runDate) {
        log.push(`[SKIP] Subscription ${sub.number} (${sub.customer_name}): next billing date ${sub.next_billing_date} is in the future.`);
        skipped++;
        return sub;
      }

      // Calculate period boundaries
      const periodStart = sub.next_billing_date;
      const periodEndDateObj = new Date(periodStart);
      if (sub.frequency === 'daily') periodEndDateObj.setDate(periodEndDateObj.getDate() + 1);
      else if (sub.frequency === 'weekly') periodEndDateObj.setDate(periodEndDateObj.getDate() + 7);
      else if (sub.frequency === 'yearly') periodEndDateObj.setFullYear(periodEndDateObj.getFullYear() + 1);
      else periodEndDateObj.setMonth(periodEndDateObj.getMonth() + 1);
      const periodEnd = periodEndDateObj.toISOString().split('T')[0]!;

      // Idempotency check: Does an invoice already exist for this subscription + periodStart?
      const alreadyInvoiced = invoices.some(
        (inv) => inv.subscription_id === sub.id && inv.billing_period_start === periodStart,
      );

      if (alreadyInvoiced) {
        log.push(`[IDEMPOTENT SKIP] Subscription ${sub.number} already has an invoice for period ${periodStart} - ${periodEnd}.`);
        skipped++;
        return sub;
      }

      // Generate Invoice
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
        discount_amount: '0.00',
        tax_rate: sub.tax_rate,
        tax_amount: sub.tax_amount,
        total: sub.total_recurring,
        paid_amount: '0.00',
        balance_due: sub.total_recurring,
        notes: `Automated recurring invoice generated for ${sub.frequency} cycle.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      newInvoices.push(newInv);
      created++;
      log.push(`[SUCCESS] Generated Invoice ${invoiceNumber} ($${sub.total_recurring}) for ${sub.customer_name} (${sub.number}).`);

      // Advance subscription next_billing_date
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
        events: [billedEvent, ...sub.events],
        updated_at: new Date().toISOString(),
      };
    });

    if (newInvoices.length > 0) {
      setInvoicesState((prev) => [...newInvoices, ...prev]);
      setSubscriptionsState(updatedSubscriptions);
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

  // Record Payment and Allocate to Invoices
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

    // Validate allocation amounts
    let totalAllocated = '0.00';
    const cleanAllocations: PaymentAllocation[] = [];

    if (data.allocations && data.allocations.length > 0) {
      for (const item of data.allocations) {
        if (compareDecimals(item.amount, '0.00') <= 0) continue;
        const invoice = invoices.find((inv) => inv.id === item.invoice_id);
        if (!invoice) return { payment: {} as Payment, error: `Invoice ${item.invoice_id} not found` };

        // Verify allocation doesn't exceed invoice balance
        if (compareDecimals(item.amount, invoice.balance_due) > 0) {
          return {
            payment: {} as Payment,
            error: `Allocation amount ($${item.amount}) exceeds outstanding balance ($${invoice.balance_due}) on invoice ${invoice.number}`,
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

      // Verify allocation doesn't exceed total payment
      if (compareDecimals(totalAllocated, data.amount) > 0) {
        return {
          payment: {} as Payment,
          error: `Total allocation ($${totalAllocated}) cannot exceed payment amount ($${data.amount})`,
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

    // Apply allocations to invoices transactionally
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
      `Recorded payment ${paymentNumber} ($${data.amount}) for ${customer.company_name}. Allocated $${totalAllocated}`,
    );

    addNotification(
      'Payment Recorded',
      `Payment ${paymentNumber} for $${data.amount} recorded successfully.`,
      'success',
      '/payments',
    );

    return { payment: newPayment };
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = () => {
    setNotificationsState((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Reset to initial demo state
  const resetToDefaults = () => {
    setCurrentUserState(initialUsers[0]!);
    setSettingsState(initialSettings);
    setCustomersState(initialCustomers);
    setProductsState(initialProducts);
    setPlansState(initialPlans);
    setDiscountsState(initialDiscounts);
    setQuotationsState(initialQuotations);
    setSubscriptionsState(initialSubscriptions);
    setInvoicesState(initialInvoices);
    setPaymentsState(initialPayments);
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
        activateSubscription,
        pauseSubscription,
        resumeSubscription,
        renewSubscription,
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
