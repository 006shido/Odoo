import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Customer, Product, SubscriptionPlan, Discount, Quotation, Subscription, Invoice, Payment, BillingRun, WorkspaceSettings, NotificationItem, AuditLogItem, AuthUser, UserRole } from '@/types';

export interface SubscriptionContextType {
  purchasePlan: (data: {customer_id: string; plan_id: string; method: Payment['method']; reference: string}) => Promise<{subscription?: Subscription; invoice?: Invoice; payment?: Payment; error?: string}>;
  metrics: {mrr: string; arr: string; revenue_months: Array<{month: string; invoiced: string; collected: string}>};
  isSignedIn: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  currentUser: AuthUser;
  allUsers: AuthUser[];
  setCurrentUser: (user: AuthUser) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  switchCustomerUser: (customerId: string) => Promise<void>;
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => Promise<void>;
  customers: Customer[];
  createCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  archiveCustomer: (id: string) => Promise<void>;
  products: Product[];
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  plans: SubscriptionPlan[];
  createPlan: (data: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<SubscriptionPlan>;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => Promise<void>;
  discounts: Discount[];
  createDiscount: (data: Omit<Discount, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => Promise<Discount>;
  updateDiscount: (id: string, data: Partial<Discount>) => Promise<void>;
  quotations: Quotation[];
  createQuotation: (data: {
    customer_id: string;
    items: Array<{ product_id: string; plan_id?: string; quantity: number; unit_price: string }>;
    discount_id?: string;
    payment_terms?: string;
    expiry_date: string;
    notes?: string;
  }) => Promise<Quotation>;
  sendQuotation: (id: string) => Promise<void>;
  acceptQuotation: (id: string, acceptedBy?: string) => Promise<void>;
  rejectQuotation: (id: string) => Promise<void>;
  convertQuotationToSubscription: (quotationId: string) => Promise<{ subscription: Subscription | null; error?: string }>;
  subscriptions: Subscription[];
  createSubscription: (data: {
    customer_id: string;
    plan_id: string;
    start_date: string;
    auto_renew?: boolean;
    source_quotation_id?: string;
  }) => Promise<Subscription>;
  activateSubscription: (id: string) => Promise<void>;
  pauseSubscription: (id: string, reason: string) => Promise<void>;
  resumeSubscription: (id: string) => Promise<void>;
  setSubscriptionAutoRenew: (id: string, enabled: boolean) => Promise<void>;
  closeSubscription: (id: string) => Promise<void>;
  invoices: Invoice[];
  billingRuns: BillingRun[];
  runBillingEngine: (targetDate?: string) => Promise<BillingRun>;
  issueInvoice: (id: string) => Promise<void>;
  voidInvoice: (id: string) => Promise<void>;
  payments: Payment[];
  recordPayment: (data: {
    customer_id: string;
    amount: string;
    method: Payment['method'];
    reference: string;
    received_date: string;
    notes?: string;
    allocations?: Array<{ invoice_id: string; amount: string }>;
  }) => Promise<{ payment: Payment; error?: string }>;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  auditLog: AuditLogItem[];
  resetToDefaults: () => Promise<void>;
}


type Snapshot = Pick<SubscriptionContextType, 'currentUser' | 'allUsers' | 'settings' | 'customers' | 'products' | 'plans' | 'discounts' | 'quotations' | 'subscriptions' | 'invoices' | 'payments' | 'billingRuns' | 'notifications' | 'auditLog' | 'metrics'>;
const blankSettings: WorkspaceSettings = {
 company_name: 'Brightloop', legal_name: 'Brightloop', contact_email: '', phone: '',
 address: {street: '', city: '', state: '', postal_code: '', country: ''}, tax_id: '',
 currency: 'USD', currency_symbol: '$', billing_timezone: 'UTC', default_tax_rate: '0.00',
 default_payment_terms: 'Net 15', quotation_prefix: 'QUO-', invoice_prefix: 'INV-', subscription_prefix: 'SUB-', payment_prefix: 'PAY-',
};
const empty: Snapshot = {
 metrics: {mrr: '0.00', arr: '0.00', revenue_months: []},
 currentUser: {id: '', email: '', first_name: '', last_name: '', role: 'customer', is_active: false},
 allUsers: [], settings: blankSettings, customers: [], products: [], plans: [], discounts: [], quotations: [],
 subscriptions: [], invoices: [], payments: [], billingRuns: [], notifications: [], auditLog: [],
};
const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function errorMessage(error: unknown): string {
 const data = (error as { data?: unknown })?.data;
 if (typeof data === 'string') return data;
 if (data) return JSON.stringify(data);
 return error instanceof Error ? error.message : 'The request failed. Please retry.';
}

export function SubscriptionProvider({children}: {children: React.ReactNode}) {
 const [state, setState] = useState<Snapshot>(empty);
 const [isSignedIn, setSignedIn] = useState(false);
 const [isLoading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const requestVersion = useRef(0);
 const mutationPending = useRef(false);
 const [isSaving, setSaving] = useState(false);
 const refresh = useCallback(async () => {
  if (mutationPending.current) return;
  const version = ++requestVersion.current;
  try {
   const session = await api.get<{authenticated: boolean}>('/auth/me/');
   if (!session.authenticated) { setState(empty); setSignedIn(false); return; }
   const result = await api.get<Snapshot>('/workspace/');
   if (version === requestVersion.current) { setState(result); setSignedIn(true); setError(''); }
  } catch (e) {
   if (version !== requestVersion.current) return;
   if ([401,403].includes((e as {status?: number}).status || 0)) { setState(empty); setSignedIn(false); }
   else { setError(errorMessage(e)); throw e; }
  } finally { if (version === requestVersion.current) setLoading(false); }
 }, []);
 useEffect(() => { void refresh().catch(() => {}); }, [refresh]);
 // Revalidate when returning to the app, so other team members' saves become visible.
 useEffect(() => {
  const onFocus = () => { void refresh().catch(() => {}); };
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
 }, [refresh]);
 const mutate = async (action: string, payload: unknown = {}) => {
  if (mutationPending.current) throw new Error('A save is already in progress.');
  mutationPending.current = true; setSaving(true); ++requestVersion.current;
  setError('');
  try {
   const result = await api.post<{id: string}>('/workspace/', {action, payload});
   const fresh = await api.get<Snapshot>('/workspace/');
   setState(fresh);
   return {id: result.id, fresh};
  } catch (e) { setError(errorMessage(e)); throw e; }
  finally { mutationPending.current = false; setSaving(false); }
 };
 useEffect(() => {
  const onRejected = (event: PromiseRejectionEvent) => { event.preventDefault(); setError(errorMessage(event.reason)); };
  window.addEventListener('unhandledrejection', onRejected);
  return () => window.removeEventListener('unhandledrejection', onRejected);
 }, []);
 const save = async (action: string, payload: unknown) => { await mutate(action, payload); };
 const unsupported = async () => {
  const e = new Error('Sign out and sign in with the actual account. Role switching and demo resets are unavailable for live data.');
  setError(e.message); throw e;
 };
 const value: SubscriptionContextType = {
  purchasePlan: async data => { const r=await mutate('purchasePlan',{data}); const sub=r.fresh.subscriptions.find(s=>s.id===r.id); const invoice=r.fresh.invoices.find(i=>i.subscription_id===r.id); const payment=r.fresh.payments.find(p=>p.allocations.some(a=>a.invoice_id===invoice?.id)); return {subscription:sub,invoice,payment}; },
  ...state, isSignedIn, isLoading, refresh,
  logout: async () => { await api.post('/auth/logout/'); ++requestVersion.current; setState(empty); setSignedIn(false); },
  setCurrentUser: async () => { setLoading(true); await refresh(); },
  switchRole: unsupported, switchCustomerUser: unsupported, resetToDefaults: unsupported,
  updateSettings: data => save('updateSettings', {data}),
  createCustomer: async data => { const r=await mutate('createCustomer',{data}); return r.fresh.customers.find(x=>x.id===r.id)!; },
  updateCustomer: (id,data) => save('updateCustomer',{id,data}),
  archiveCustomer: id => save('archiveCustomer',{id}),
  createProduct: async data => { const r=await mutate('createProduct',{data}); return r.fresh.products.find(x=>x.id===r.id)!; },
  updateProduct: (id,data) => save('updateProduct',{id,data}),
  createPlan: async data => { const r=await mutate('createPlan',{data}); return r.fresh.plans.find(x=>x.id===r.id)!; },
  updatePlan: (id,data) => save('updatePlan',{id,data}),
  createDiscount: async data => { const r=await mutate('createDiscount',{data}); return r.fresh.discounts.find(x=>x.id===r.id)!; },
  updateDiscount: (id,data) => save('updateDiscount',{id,data}),
  createQuotation: async data => { const r=await mutate('createQuotation',{data}); return r.fresh.quotations.find(x=>x.id===r.id)!; },
  sendQuotation: id => save('sendQuotation',{id}), acceptQuotation: id => save('acceptQuotation',{id}),
  rejectQuotation: id => save('rejectQuotation',{id}),
  convertQuotationToSubscription: async id => { const r=await mutate('convertQuotationToSubscription',{id}); return {subscription:r.fresh.subscriptions.find(x=>x.id===r.id) || null}; },
  createSubscription: async data => {const r=await mutate('createSubscription',{data}); return r.fresh.subscriptions.find(x=>x.id===r.id)!;},
  activateSubscription: id => save('activateSubscription',{id}),
  pauseSubscription: (id,reason) => save('pauseSubscription',{id,reason}),
  resumeSubscription: id => save('resumeSubscription',{id}),
  setSubscriptionAutoRenew: (id,enabled) => save('setSubscriptionAutoRenew',{id,enabled}),
  closeSubscription: id => save('closeSubscription',{id}),
  runBillingEngine: async targetDate => { const r=await mutate('runBillingEngine',{targetDate}); return r.fresh.billingRuns.find(x=>x.id===r.id)!; },
  issueInvoice: id => save('issueInvoice',{id}), voidInvoice: id => save('voidInvoice',{id}),
  recordPayment: async data => {const r=await mutate('recordPayment',{data}); return {payment:r.fresh.payments.find(x=>x.id===r.id)!};},
  markNotificationAsRead: async id => setState(s=>({...s,notifications:s.notifications.map(n=>n.id===id?{...n,read:true}:n)})),
  clearAllNotifications: async () => setState(s=>({...s,notifications:[]})),
 };
 return <SubscriptionContext.Provider value={value}>
  {error && <div role="alert" className="fixed left-4 right-4 top-4 z-[200] rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 shadow-lg">
   <span>{error}</span><button className="ml-4 underline" onClick={()=>setError('')}>Dismiss</button>
   <button className="ml-4 underline" onClick={()=>void refresh().catch(()=>{})}>Retry</button>
  </div>}
  {isSaving && <div role="status" aria-live="polite" className="fixed inset-0 z-[190] flex items-center justify-center bg-black/10 backdrop-blur-sm"><span className="rounded-xl bg-white p-5 text-sm text-zinc-900 shadow-lg">Saving changes…</span></div>}
  {children}
 </SubscriptionContext.Provider>;
}

export function useSubscription() {
 const context=useContext(SubscriptionContext);
 if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
 return context;
}
