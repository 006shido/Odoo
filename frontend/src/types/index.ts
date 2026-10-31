/** Common API response wrapper for paginated lists */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** User roles */
export type UserRole = 'admin' | 'staff' | 'customer';

/** Common status types */
export type SubscriptionStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
export type DiscountType = 'fixed' | 'percentage';
export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'upi' | 'other';

/** Base entity with common fields */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/** Authenticated user profile */
export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  customer_id?: string;
  title?: string;
}

/** Billing Address */
export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/** Customer Profile */
export interface Customer extends BaseEntity {
  name: string;
  company_name: string;
  email: string;
  phone: string;
  billing_address: Address;
  tax_id: string;
  status: 'active' | 'lead' | 'archived';
  notes?: string;
  currency: string;
  portal_user_id?: string;
}

/** Product Variant */
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  /** Amount added to the product's base sales price. */
  price_modifier?: string;
  status: 'active' | 'archived';
  attributes?: Record<string, string>;
}

/** Product */
export interface Product extends BaseEntity {
  name: string;
  code: string;
  category: string;
  description: string;
  status: 'active' | 'archived';
  variants: ProductVariant[];
  default_price: string;
  product_type?: 'software' | 'addon' | 'service' | 'physical';
  sales_price?: string;
  cost_price?: string;
  tax_rate?: string;
  notes?: string;
}

/** Subscription Plan */
export interface SubscriptionPlan extends BaseEntity {
  name: string;
  code: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  frequency: BillingFrequency;
  price: string;
  setup_fee: string;
  minimum_quantity: number;
  status: 'active' | 'archived';
  allow_pause: boolean;
  auto_renew: boolean;
  description: string;
  features: string[];
  start_date?: string;
  end_date?: string;
  auto_close_on_expiry?: boolean;
  can_close_early?: boolean;
  can_renew?: boolean;
}

/** Discount */
export interface Discount extends BaseEntity {
  code: string;
  name: string;
  type: DiscountType;
  value: string; // percentage or a fixed amount in the workspace currency
  min_subtotal: string;
  usage_limit?: number;
  usage_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
  minimum_quantity?: number;
  scope?: 'product' | 'subscription';
  product_id?: string;
}

/** Quotation Item */
export interface QuotationItem {
  id: string;
  product_id: string;
  product_name: string;
  plan_id?: string;
  plan_name?: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

/** Quotation */
export interface Quotation extends BaseEntity {
  number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: QuotationStatus;
  items: QuotationItem[];
  discount_id?: string;
  discount_code?: string;
  discount_amount: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  payment_terms: string;
  issue_date: string;
  expiry_date: string;
  notes?: string;
  accepted_at?: string;
  accepted_by?: string;
  converted_subscription_id?: string;
}

/** Subscription Lifecycle Event */
export interface SubscriptionEvent {
  id: string;
  event_type: 'created' | 'activated' | 'paused' | 'resumed' | 'renewed' | 'closed' | 'expired' | 'billed';
  actor: string;
  timestamp: string;
  notes: string;
  metadata?: Record<string, unknown>;
}

/** Subscription Item snapshot */
export interface SubscriptionItem {
  id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

/** Subscription */
export interface Subscription extends BaseEntity {
  number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_id: string;
  plan_name: string;
  frequency: BillingFrequency;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string;
  next_billing_date: string;
  last_billing_date?: string;
  items: SubscriptionItem[];
  source_quotation_id?: string;
  source_quotation_number?: string;
  recurring_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_recurring: string;
  auto_renew: boolean;
  can_pause?: boolean;
  can_close_early?: boolean;
  can_renew?: boolean;
  discount_id?: string;
  discount_code?: string;
  discount_type?: DiscountType;
  discount_value?: string;
  discount_start_date?: string;
  discount_end_date?: string;
  discount_min_subtotal?: string;
  discount_minimum_quantity?: number;
  discount_scope?: 'product' | 'subscription';
  discount_product_id?: string;
  discount_usage_limit?: number;
  discount_usage_count?: number;
  pause_reason?: string;
  events: SubscriptionEvent[];
}

/** Invoice Item snapshot */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

/** Invoice */
export interface Invoice extends BaseEntity {
  number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subscription_id?: string;
  subscription_number?: string;
  billing_period_start: string;
  billing_period_end: string;
  status: InvoiceStatus;
  is_overdue: boolean;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  paid_amount: string;
  balance_due: string;
  notes?: string;
}

/** Payment Allocation to Invoice */
export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount: string;
  allocated_at: string;
}

/** Payment Record */
export interface Payment extends BaseEntity {
  number: string;
  customer_id: string;
  customer_name: string;
  amount: string;
  unallocated_amount: string;
  method: PaymentMethod;
  reference: string;
  received_date: string;
  status: 'completed' | 'refunded';
  notes?: string;
  allocations: PaymentAllocation[];
}

/** Billing Run Record */
export interface BillingRun {
  id: string;
  run_date: string;
  processed_at: string;
  subscriptions_checked: number;
  invoices_created: number;
  invoices_skipped: number;
  errors_count: number;
  status: 'completed' | 'partial' | 'failed';
  log: string[];
}

/** Workspace Settings */
export interface WorkspaceSettings {
  company_name: string;
  legal_name: string;
  contact_email: string;
  phone: string;
  address: Address;
  tax_id: string;
  currency: string;
  currency_symbol: string;
  billing_timezone: string;
  default_tax_rate: string;
  default_payment_terms: string;
  quotation_prefix: string;
  invoice_prefix: string;
  subscription_prefix: string;
  payment_prefix: string;
}

/** Notification Item */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

/** Audit Log Item */
export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details: string;
}
