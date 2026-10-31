import { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Building,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Invoice, PaymentMethod } from '@/types';

function paymentMethodLabel(method: PaymentMethod) {
  if (method === 'upi') return 'UPI';
  if (method === 'card') return 'Credit or debit card';
  if (method === 'bank_transfer') return 'Net banking';
  return method.replace('_', ' ');
}

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
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentError, setPaymentError] = useState('');
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
    setPayMethod('upi');
    setPaymentReference('');
    setPaymentError('');
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!payingInvoice || isProcessing) return;
    setIsProcessing(true);
    setPaymentError('');
    const reference = `BL-${payMethod.toUpperCase()}-${Date.now().toString().slice(-8)}`;

    setTimeout(() => {
      const result = recordPayment({
        customer_id: activeCustomer.id,
        amount: payingInvoice.balance_due,
        method: payMethod,
        reference,
        received_date: new Date().toISOString().split('T')[0]!,
        notes: `Simulated online payment via ${paymentMethodLabel(payMethod)} in Customer Portal.`,
        allocations: [{ invoice_id: payingInvoice.id, amount: payingInvoice.balance_due }],
      });

      setIsProcessing(false);
      if (result.error) {
        setPaymentError(result.error);
        return;
      }
      setPaymentReference(reference);
    }, 600);
  };

  const closePaymentModal = () => {
    if (isProcessing) return;
    setIsPayModalOpen(false);
    setPayingInvoice(null);
    setPaymentReference('');
    setPaymentError('');
  };

  const paymentOptions = [
    { method: 'upi' as const, label: 'UPI', hint: 'GPay, PhonePe, BHIM', Icon: Smartphone },
    { method: 'card' as const, label: 'Cards', hint: 'Credit or debit', Icon: CreditCard },
    { method: 'bank_transfer' as const, label: 'Net banking', hint: 'Choose your bank', Icon: Building },
  ];

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
                        {paymentMethodLabel(p.method)}
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closePaymentModal} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150 space-y-5">
            {paymentReference ? (
              <div className="py-3 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Payment successful</h3>
                <p className="mt-1 text-sm text-text-secondary">Invoice {payingInvoice.number} is now paid.</p>
                <p className="mt-5 text-3xl font-extrabold text-text-primary">
                  {formatCurrency(payingInvoice.balance_due, settings.currency_symbol)}
                </p>
                <div className="mx-auto mt-5 max-w-sm rounded-xl bg-surface-secondary p-3 text-left text-xs">
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Method</span><span className="font-semibold text-text-primary">{paymentMethodLabel(payMethod)}</span></div>
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Reference</span><span className="font-mono text-text-primary">{paymentReference}</span></div>
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Status</span><span className="font-semibold text-emerald-700">Simulated · Successful</span></div>
                </div>
                <p className="mt-3 text-[11px] text-text-tertiary">This is a demo transaction. No real money was charged.</p>
                <Button onClick={closePaymentModal} className="mt-5 w-full rounded-xl">Done</Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Pay Invoice {payingInvoice.number}</h3>
                  <p className="mt-1 text-xs text-text-secondary">Choose a payment method to simulate your payment securely.</p>
                </div>

                <div className="rounded-xl border border-border/70 bg-surface-secondary p-4 text-center">
                  <span className="text-xs text-text-secondary">Amount due</span>
                  <div className="mt-1 text-3xl font-extrabold text-text-primary">
                    {formatCurrency(payingInvoice.balance_due, settings.currency_symbol)}
                  </div>
                </div>

                <fieldset className="space-y-2" disabled={isProcessing}>
                  <legend className="mb-2 text-xs font-semibold text-text-primary">Payment method</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {paymentOptions.map(({ method, label, hint, Icon }) => (
                      <button
                        key={method}
                        type="button"
                        aria-pressed={payMethod === method}
                        onClick={() => setPayMethod(method)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3 text-left transition-all sm:flex-col sm:items-start sm:gap-2',
                          payMethod === method
                            ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent'
                            : 'border-border bg-surface text-text-secondary hover:border-border-strong',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span><span className="block text-xs font-semibold">{label}</span><span className="mt-0.5 block text-[10px] opacity-75">{hint}</span></span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-900">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Hackathon demo mode: this creates a simulated payment record and updates the invoice. No real payment details or money are used.</span>
                </div>

                {paymentError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{paymentError}</p>}
                {isProcessing && <p role="status" className="text-center text-xs font-medium text-accent">Authorizing simulated {paymentMethodLabel(payMethod)} payment…</p>}

                <div className="flex items-center justify-end gap-2 border-t border-border/80 pt-3">
                  <Button variant="outline" size="sm" onClick={closePaymentModal} disabled={isProcessing} className="rounded-xl">Cancel</Button>
                  <Button size="sm" onClick={handleConfirmPayment} disabled={isProcessing} className="rounded-xl shadow-xs">
                    {isProcessing ? 'Processing…' : `Pay ${formatCurrency(payingInvoice.balance_due, settings.currency_symbol)}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
