import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionProvider, useSubscription } from '../store/subscriptionStore';
import { api } from '../api';

vi.mock('../api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const user = { id: 'server-user', email: 'owner@example.test', first_name: 'Owner', last_name: '', role: 'admin', is_active: true };
const state = (customers: unknown[] = []) => ({ metrics: {mrr:'0.00',arr:'0.00',revenue_months:[]}, currentUser: user, allUsers: [user], settings: {}, customers,
 products: [], plans: [], discounts: [], quotations: [], subscriptions: [], invoices: [], payments: [], billingRuns: [], notifications: [], auditLog: [] });

function Probe() {
 const store = useSubscription();
 return <><span>{store.isLoading ? 'Loading' : store.isSignedIn ? store.currentUser.email : 'Signed out'}</span>
  <span>Customers: {store.customers.length}</span>
  <button onClick={() => void store.createCustomer({ name: 'Saved', company_name: 'Saved', email: 'saved@example.test', phone: '', billing_address: { street: '', city: '', state: '', postal_code: '', country: '' }, tax_id: '', status: 'active', currency: 'USD' }).catch(() => {})}>Save</button>
 </>;
}

afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); });

describe('Server-backed workspace', () => {
 it('ignores old demo sessions and starts signed out when Django says so', async () => {
  localStorage.setItem('brightloop_session', 'active');
  vi.mocked(api.get).mockResolvedValue({ authenticated: false });
  render(<SubscriptionProvider><Probe /></SubscriptionProvider>);
  expect(await screen.findByText('Signed out')).toBeInTheDocument();
  expect(screen.getByText('Customers: 0')).toBeInTheDocument();
 });

 it('updates records only after the server confirms and reloads from the server on remount', async () => {
  let saved = false;
  vi.mocked(api.get).mockImplementation(async endpoint => (endpoint === '/auth/me/' ? { authenticated: true } : state(saved ? [{ id: 'database-id', name: 'Saved' }] : [])) as never);
  vi.mocked(api.post).mockImplementation(async () => { saved = true; return { id: 'database-id' } as never; });
  const view = render(<SubscriptionProvider><Probe /></SubscriptionProvider>);
  await screen.findByText('owner@example.test');
  fireEvent.click(screen.getByText('Save'));
  await screen.findByText('Customers: 1');
  expect(api.post).toHaveBeenCalledWith('/workspace/', expect.objectContaining({ action: 'createCustomer' }));
  expect(localStorage.getItem('brightloop_v2_customers')).toBeNull();
  view.unmount();
  render(<SubscriptionProvider><Probe /></SubscriptionProvider>);
  expect(await screen.findByText('Customers: 1')).toBeInTheDocument();
 });

 it('shows a rejected save and never invents a successful record', async () => {
  vi.mocked(api.get).mockImplementation(async endpoint => (endpoint === '/auth/me/' ? { authenticated: true } : state()) as never);
  vi.mocked(api.post).mockRejectedValue({ data: { email: ['Already registered'] } });
  render(<SubscriptionProvider><Probe /></SubscriptionProvider>);
  await screen.findByText('owner@example.test');
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Already registered'));
  expect(screen.getByText('Customers: 0')).toBeInTheDocument();
 });
});
