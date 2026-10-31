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
}
