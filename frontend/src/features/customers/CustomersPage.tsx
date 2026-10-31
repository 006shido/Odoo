import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  FileText,
  Zap,
  X,
  CreditCard,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';

export function CustomersPage() {
  const {
    customers,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    subscriptions,
    invoices,
    quotations,
    payments,
    settings,
    switchCustomerUser,
  } = useSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'lead' | 'archived'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    tax_id: '',
    status: 'active' as Customer['status'],
    notes: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'United States',
      tax_id: '',
      status: 'active',
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      company_name: customer.company_name,
      email: customer.email,
      phone: customer.phone,
      street: customer.billing_address?.street || '',
      city: customer.billing_address?.city || '',
      state: customer.billing_address?.state || '',
      postal_code: customer.billing_address?.postal_code || '',
      country: customer.billing_address?.country || 'United States',
      tax_id: customer.tax_id || '',
      status: customer.status,
      notes: customer.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.email) return;

    createCustomer({
      name: formData.name || formData.company_name,
      company_name: formData.company_name,
      email: formData.email,
      phone: formData.phone,
      billing_address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
      },
      tax_id: formData.tax_id,
      status: formData.status,
      currency: settings.currency,
      notes: formData.notes,
    });
    setIsCreateOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    updateCustomer(selectedCustomer.id, {
      name: formData.name,
      company_name: formData.company_name,
      email: formData.email,
      phone: formData.phone,
      billing_address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
      },
      tax_id: formData.tax_id,
      status: formData.status,
      notes: formData.notes,
    });
    setIsEditOpen(false);
    setSelectedCustomer(null);
  };

  // Details data for selected customer
  const customerSubs = useMemo(() => {
    if (!selectedCustomer) return [];
    return subscriptions.filter((s) => s.customer_id === selectedCustomer.id);
  }, [subscriptions, selectedCustomer]);

  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return invoices.filter((i) => i.customer_id === selectedCustomer.id);
  }, [invoices, selectedCustomer]);

  const customerQuotes = useMemo(() => {
    if (!selectedCustomer) return [];
    return quotations.filter((q) => q.customer_id === selectedCustomer.id);
  }, [quotations, selectedCustomer]);

  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return payments.filter((p) => p.customer_id === selectedCustomer.id);
  }, [payments, selectedCustomer]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Customer Accounts</h2>
          <p className="text-sm text-text-secondary mt-1">
            Maintain customer records, billing addresses, tax identifiers, and commercial histories.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, contact, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn('apple-segmented-item', statusFilter === 'all' && 'active')}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={cn('apple-segmented-item', statusFilter === 'active' && 'active')}
          >
            Active ({customers.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('lead')}
            className={cn('apple-segmented-item', statusFilter === 'lead' && 'active')}
          >
            Leads ({customers.filter((c) => c.status === 'lead').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={cn('apple-segmented-item', statusFilter === 'archived' && 'active')}
          >
            Archived ({customers.filter((c) => c.status === 'archived').length})
          </button>
        </div>
      </div>

      {/* Customers Table / Grid */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-6 py-3.5">Company & Contact</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Subscriptions</th>
                <th className="px-6 py-3.5">Tax Identifier</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    <Users className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const activeSubCount = subscriptions.filter(
                    (s) => s.customer_id === c.id && s.status === 'active',
                  ).length;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent font-semibold text-xs flex items-center justify-center shrink-0">
                            {c.company_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                              {c.company_name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {c.name} • {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            c.status === 'active'
                              ? 'success'
                              : c.status === 'lead'
                              ? 'warning'
                              : 'outline'
                          }
                          className="capitalize"
                        >
                          {c.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-xs text-text-secondary">
                        {c.billing_address?.city}, {c.billing_address?.state || c.billing_address?.country}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary">
                          <Zap className="h-3.5 w-3.5 text-accent" />
                          {activeSubCount} Active
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                        {c.tax_id || '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(c)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <ExternalLink className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="relative w-full max-w-3xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {selectedCustomer.company_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-text-primary">
                      {selectedCustomer.company_name}
                    </h3>
                    <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'warning'}>
                      {selectedCustomer.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Account ID: {selectedCustomer.id} • Registered:{' '}
                    {selectedCustomer.created_at.split('T')[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="rounded-xl"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-secondary/50 border border-border/60 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
                  Contact Information
                </p>
                <p className="text-text-secondary flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-text-tertiary" /> {selectedCustomer.name}
                </p>
                <p className="text-text-secondary flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-text-tertiary" /> {selectedCustomer.email}
                </p>
                <p className="text-text-secondary flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-text-tertiary" /> {selectedCustomer.phone || '—'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
                  Billing Address & Tax
                </p>
                <p className="text-text-secondary flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-text-tertiary" />{' '}
                  {selectedCustomer.billing_address?.street}, {selectedCustomer.billing_address?.city},{' '}
                  {selectedCustomer.billing_address?.state} {selectedCustomer.billing_address?.postal_code}
                </p>
                <p className="text-text-secondary">
                  Tax / VAT ID: <code className="font-mono text-text-primary">{selectedCustomer.tax_id || 'N/A'}</code>
                </p>
                <p className="text-text-secondary">
                  Currency: <strong>{selectedCustomer.currency || settings.currency}</strong>
                </p>
              </div>
            </div>

            {/* Subscriptions Tab */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Subscriptions ({customerSubs.length})
              </h4>
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60">
                {customerSubs.length === 0 ? (
                  <p className="p-4 text-xs text-text-secondary text-center">No subscriptions found</p>
                ) : (
                  customerSubs.map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text-primary">{s.plan_name}</p>
                        <p className="text-text-secondary">{s.number} • Next billing: {s.next_billing_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary">
                          {formatCurrency(s.total_recurring, settings.currency_symbol)}/{s.frequency}
                        </p>
                        <StatusBadge status={s.status} className="mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices Tab */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Invoices ({customerInvoices.length})
              </h4>
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60">
                {customerInvoices.length === 0 ? (
                  <p className="p-4 text-xs text-text-secondary text-center">No invoices generated yet</p>
                ) : (
                  customerInvoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text-primary">{inv.number}</p>
                        <p className="text-text-secondary">Due: {inv.due_date} • Issued: {inv.issue_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary">
                          {formatCurrency(inv.total, settings.currency_symbol)}
                        </p>
                        <StatusBadge status={inv.status} className="mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quotations Tab */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Commercial Quotations ({customerQuotes.length})
              </h4>
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60">
                {customerQuotes.length === 0 ? (
                  <p className="p-4 text-xs text-text-secondary text-center">No quotations generated yet</p>
                ) : (
                  customerQuotes.map((q) => (
                    <div key={q.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text-primary">{q.number}</p>
                        <p className="text-text-secondary">Issued: {q.issue_date} • Expires: {q.expiry_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary">
                          {formatCurrency(q.total, settings.currency_symbol)}
                        </p>
                        <StatusBadge status={q.status} className="mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payments & Receipts Tab */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-success" />
                Payments & Receipts ({customerPayments.length})
              </h4>
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60">
                {customerPayments.length === 0 ? (
                  <p className="p-4 text-xs text-text-secondary text-center">No payment transactions recorded</p>
                ) : (
                  customerPayments.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text-primary">{p.number}</p>
                        <p className="text-text-secondary">{p.method.toUpperCase()} • Ref: {p.reference || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          +{formatCurrency(p.amount, settings.currency_symbol)}
                        </p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">{p.received_date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  switchCustomerUser(selectedCustomer.id);
                  setSelectedCustomer(null);
                }}
                className="rounded-xl"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Simulate Portal View as this Customer
              </Button>

              <Button
                size="sm"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Customer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Create Customer Account</h3>
            <p className="text-xs text-text-secondary mt-1">
              Add a new commercial profile with verified billing details.
            </p>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Acme Cloud Corp"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Primary Contact</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@acme.com"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (415) 555-0192"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="100 Tech Blvd, Suite 200"
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="San Francisco"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">State / Prov</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="94107"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Tax / VAT ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="US-EIN-9481928"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="active">Active</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer */}
      {isEditOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Edit Customer Account</h3>
            <p className="text-xs text-text-secondary mt-1">
              Update billing details for {selectedCustomer.company_name}.
            </p>

            <form onSubmit={handleSubmitEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Primary Contact</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    archiveCustomer(selectedCustomer.id);
                    setIsEditOpen(false);
                    setSelectedCustomer(null);
                  }}
                  className="rounded-xl"
                >
                  Archive Account
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                    Update Profile
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
