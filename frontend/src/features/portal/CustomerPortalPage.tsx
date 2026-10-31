import { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/types';

export function CustomerPortalPage() {
  const {
    currentUser,
    customers,
    subscriptions,
    invoices,
    quotations,
    payments,
    settings,
    acceptQuotation,
    rejectQuotation,
    recordPayment,
    setSubscriptionAutoRenew,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<'subs' | 'invoices' | 'quotes' | 'payments' | 'profile'>('subs');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'bank_transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  // Active customer identity
  const activeCustomer = useMemo(() => {
    const linkedCustomer = customers.find((customer) =>
      (currentUser.customer_id && customer.id === currentUser.customer_id) ||
      customer.email.toLowerCase() === currentUser.email.toLowerCase(),
    );
    return linkedCustomer || {
      id: currentUser.customer_id || '',
      name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
      company_name: currentUser.title || '',
      email: currentUser.email,
      billing_address: { street: '', city: '', state: '', postal_code: '', country: '' },
      tax_id: '',
    };
  }, [currentUser, customers]);

  // STRICT IDOR ISOLATION: Filter ONLY this customer's records!
  const mySubscriptions = useMemo(() => {
    return subscriptions.filter((s) => s.customer_id === activeCustomer.id);
  }, [subscriptions, activeCustomer]);

  const myInvoices = useMemo(() => {
    return invoices.filter((i) => i.customer_id === activeCustomer.id);
  }, [invoices, activeCustomer]);

  const myQuotations = useMemo(() => {
    return quotations.filter((q) => q.customer_id === activeCustomer.id);
  }, [quotations, activeCustomer]);

  const myPayments = useMemo(() => {
    return payments.filter((p) => p.customer_id === activeCustomer.id);
  }, [payments, activeCustomer]);

  const handleSimulatePayment = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!payingInvoice) return;
    setIsProcessing(true);

    setTimeout(() => {
      recordPayment({
        customer_id: activeCustomer.id,
        amount: payingInvoice.balance_due,
        method: payMethod,
        reference: `PORTAL-PAY-${Date.now().toString().slice(-6)}`,
        received_date: new Date().toISOString().split('T')[0]!,
        notes: 'Online payment via Customer Self-Service Portal.',
        allocations: [{ invoice_id: payingInvoice.id, amount: payingInvoice.balance_due }],
      });

      setIsProcessing(false);
      setIsPayModalOpen(false);
      setPayingInvoice(null);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Signed-in customer */}
      <div className="p-4 rounded-2xl bg-surface border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent text-white font-bold flex items-center justify-center">
            {activeCustomer.company_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-text-primary">
                {activeCustomer.company_name}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Customer Portal
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Logged in as {activeCustomer.name} ({activeCustomer.email})
            </p>
          </div>
        </div>

      </div>

      {/* Segmented Tabs */}
      <div className="apple-segmented-container">
        <button
          onClick={() => setActiveTab('subs')}
          className={cn('apple-segmented-item', activeTab === 'subs' && 'active')}
        >
          My Subscriptions ({mySubscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn('apple-segmented-item', activeTab === 'invoices' && 'active')}
        >
          Invoices & Statements ({myInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={cn('apple-segmented-item', activeTab === 'quotes' && 'active')}
        >
          Quotations & Proposals ({myQuotations.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={cn('apple-segmented-item', activeTab === 'payments' && 'active')}
        >
          Payment History ({myPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={cn('apple-segmented-item', activeTab === 'profile' && 'active')}
        >
          Billing Profile
        </button>
      </div>

      {/* Tab 1: Subscriptions */}
      {activeTab === 'subs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Active Subscription Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubscriptions.length === 0 ? (
              <div className="col-span-2 apple-card p-8 text-center text-text-secondary text-sm">
                No subscriptions registered for this account.
              </div>
            ) : (
              mySubscriptions.map((sub) => (
                <div key={sub.id} className="apple-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                        {sub.number}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>

                    <h4 className="text-xl font-bold text-text-primary mt-2">{sub.plan_name}</h4>
                    <div className="mt-4 pb-4 border-b border-border/70 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-text-primary">
                        {formatCurrency(sub.total_recurring, settings.currency_symbol)}
                      </span>
                      <span className="text-xs text-text-secondary">/{sub.frequency}</span>
                    </div>

                    <div className="pt-3 space-y-1.5 text-xs text-text-secondary">
                      <p>Next Scheduled Renewal: <strong className="text-text-primary">{sub.next_billing_date}</strong></p>
                      <p>Service Started: {sub.start_date}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-success font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      {sub.status === 'active' ? 'Active Contract' : `Contract ${sub.status}`}
                    </span>
                    {sub.status === 'active' && sub.can_renew !== false ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setSubscriptionAutoRenew(sub.id, !sub.auto_renew)}
                      >
                        Auto-renew {sub.auto_renew ? 'on · turn off' : 'off · turn on'}
                      </Button>
                    ) : <span className="text-text-tertiary">Managed by Brightloop</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Invoices & Balances</h3>
          <div className="apple-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Billing Period</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Balance Due</th>
                  <th className="px-6 py-3.5 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary text-sm">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  myInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-secondary/30">
                      <td className="px-6 py-4 font-semibold text-text-primary">{inv.number}</td>
                      <td className="px-6 py-4 text-xs text-text-secondary">
                        {inv.billing_period_start} to {inv.billing_period_end}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        <span className={inv.balance_due !== '0.00' && inv.due_date < today ? 'text-error font-bold' : 'text-text-secondary'}>
                          {inv.due_date}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 font-bold text-text-primary">
                        {formatCurrency(inv.total, settings.currency_symbol)}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={inv.balance_due !== '0.00' ? 'text-error' : 'text-success'}>
                          {formatCurrency(inv.balance_due, settings.currency_symbol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.balance_due !== '0.00' && inv.status !== 'void' ? (
                          <Button
                            size="sm"
                            onClick={() => handleSimulatePayment(inv)}
                            className="rounded-xl text-xs shadow-xs"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                            Pay {formatCurrency(inv.balance_due, settings.currency_symbol)}
                          </Button>
                        ) : (
                          <span className="text-xs text-success font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Quotations */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Proposals & Quotations</h3>
          <div className="space-y-4">
            {myQuotations.length === 0 ? (
              <div className="apple-card p-8 text-center text-text-secondary text-sm">
                No quotations on file.
              </div>
            ) : (
              myQuotations.map((q) => (
                <div key={q.id} className="apple-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-text-primary">{q.number}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Valid until: {q.expiry_date} • Terms: {q.payment_terms}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Includes {q.items.length} line item(s): {q.items.map((i) => i.product_name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-text-tertiary">Total Amount</span>
                      <p className="text-xl font-extrabold text-text-primary">
                        {formatCurrency(q.total, settings.currency_symbol)}
                      </p>
                    </div>

                    {q.status === 'sent' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptQuotation(q.id, `${activeCustomer.name} (Client Portal)`)}
                          className="rounded-xl shadow-xs bg-success hover:bg-success/90 text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Accept Proposal
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectQuotation(q.id)}
                          className="rounded-xl"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Payment History</h3>
          <div className="apple-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-secondary text-sm">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  myPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-semibold text-text-primary">{p.number}</td>
                      <td className="px-6 py-4 text-xs text-text-secondary">{p.received_date}</td>
                      <td className="px-6 py-4 text-xs capitalize text-text-primary">
                        {p.method.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-text-tertiary">{p.reference}</td>
                      <td className="px-6 py-4 font-bold text-right text-success">
                        {formatCurrency(p.amount, settings.currency_symbol)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Profile */}
      {activeTab === 'profile' && (
        <div className="apple-card p-6 max-w-xl space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Company Billing Profile</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-text-secondary">Legal Entity Name</span>
              <span className="font-semibold text-text-primary">{activeCustomer.company_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-text-secondary">Primary Contact</span>
              <span className="font-semibold text-text-primary">{activeCustomer.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-text-secondary">Email</span>
              <span className="font-semibold text-text-primary">{activeCustomer.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-text-secondary">Billing Address</span>
              <span className="font-semibold text-text-primary text-right">
                {activeCustomer.billing_address?.street}, {activeCustomer.billing_address?.city},{' '}
                {activeCustomer.billing_address?.state} {activeCustomer.billing_address?.postal_code}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-text-secondary">Tax / VAT ID</span>
              <code className="font-mono text-text-primary">{activeCustomer.tax_id || 'Not on file'}</code>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Simulate Online Payment */}
      {isPayModalOpen && payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Pay Invoice {payingInvoice.number}</h3>
            <p className="text-xs text-text-secondary">
              Review amount and confirm instant payment simulation.
            </p>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border/70 text-center space-y-1">
              <span className="text-xs text-text-secondary">Outstanding Balance Due</span>
              <div className="text-3xl font-extrabold text-text-primary">
                {formatCurrency(payingInvoice.balance_due, settings.currency_symbol)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                    payMethod === 'card'
                      ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent'
                      : 'border-border bg-surface text-text-secondary',
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('bank_transfer')}
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                    payMethod === 'bank_transfer'
                      ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent'
                      : 'border-border bg-surface text-text-secondary',
                  )}
                >
                  <Building className="h-4 w-4" />
                  ACH / Wire
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="rounded-xl shadow-xs"
              >
                {isProcessing ? 'Authorizing...' : `Confirm & Pay ${formatCurrency(payingInvoice.balance_due, settings.currency_symbol)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
