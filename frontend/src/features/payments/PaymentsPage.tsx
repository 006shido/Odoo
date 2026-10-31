import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import {
  formatCurrency,
  addDecimals,
  compareDecimals,
} from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Payment, PaymentMethod } from '@/types';

export function PaymentsPage() {
  const {
    payments,
    invoices,
    customers,
    settings,
    recordPayment,
  } = useSubscription();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Form State
  const [formCustomer, setFormCustomer] = useState(customers[0]?.id || '');
  const [formAmount, setFormAmount] = useState('163.90');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('card');
  const [formReference, setFormReference] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]!);
  const [formNotes, setFormNotes] = useState('');
  const [formAllocations, setFormAllocations] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Unpaid invoices for selected customer in form
  const customerUnpaidInvoices = useMemo(() => {
    return invoices.filter(
      (inv) => inv.customer_id === formCustomer && inv.status !== 'paid' && inv.status !== 'void',
    );
  }, [invoices, formCustomer]);

  // Total allocated in form
  const totalAllocatedInForm = useMemo(() => {
    let sum = '0.00';
    Object.values(formAllocations).forEach((amt) => {
      sum = addDecimals(sum, amt || '0.00');
    });
    return sum;
  }, [formAllocations]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.number.toLowerCase().includes(search.toLowerCase()) ||
        p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === 'all' || p.method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, search, methodFilter]);

  const handleOpenRecord = () => {
    const cust = customers[0];
    setFormCustomer(cust?.id || '');
    setFormAmount('100.00');
    setFormMethod('bank_transfer');
    setFormReference(`TXN-${Date.now().toString().slice(-6)}`);
    setFormDate(new Date().toISOString().split('T')[0]!);
    setFormNotes('');
    setFormAllocations({});
    setFormError('');
    setIsRecordOpen(true);
  };

  const handleAllocateFull = (invoiceId: string, balanceDue: string) => {
    setFormAllocations((prev) => ({
      ...prev,
      [invoiceId]: balanceDue,
    }));
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const allocList = Object.entries(formAllocations)
      .filter(([_, amt]) => compareDecimals(amt, '0.00') > 0)
      .map(([invoice_id, amount]) => ({ invoice_id, amount }));

    const res = await recordPayment({
      customer_id: formCustomer,
      amount: formAmount,
      method: formMethod,
      reference: formReference,
      received_date: formDate,
      notes: formNotes,
      allocations: allocList,
    });

    if (res.error) {
      setFormError(res.error);
    } else {
      setIsRecordOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Payments & Allocation
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Record payments, allocate them to invoices, and track balances.
          </p>
        </div>

        <Button onClick={handleOpenRecord} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Record Payment
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
            placeholder="Search payments by #, client, or reference..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          {['all', 'card', 'bank_transfer', 'cash', 'upi'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={cn('apple-segmented-item capitalize', methodFilter === m && 'active')}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-6 py-3.5">Payment #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Method & Reference</th>
                <th className="px-6 py-3.5">Date Received</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Allocated Invoices</th>
                <th className="px-6 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    <DollarSign className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedPayment(p);
                      setIsReceiptOpen(true);
                    }}
                    className="hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {p.number}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-primary">{p.customer_name}</p>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-text-primary capitalize block">
                        {p.method.replace('_', ' ')}
                      </span>
                      <span className="text-text-tertiary font-mono">{p.reference}</span>
                    </td>

                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {p.received_date}
                    </td>

                    <td className="px-6 py-4 font-bold text-success text-base">
                      {formatCurrency(p.amount, settings.currency_symbol)}
                    </td>

                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {p.allocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.allocations.map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-[10px] font-mono">
                              {a.invoice_number} ({formatCurrency(a.amount, settings.currency_symbol)})
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-tertiary italic">Unallocated</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(p);
                          setIsReceiptOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="View Receipt"
                      >
                        <Printer className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment & Allocate */}
      {isRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRecordOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Record Payment & Allocation</h3>
            <p className="text-xs text-text-secondary mt-1">
              Enter received funds and allocate to outstanding customer invoices (enforcing strict balance limits).
            </p>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-error-light text-error text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRecord} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Customer *</label>
                  <select
                    value={formCustomer}
                    onChange={(e) => {
                      setFormCustomer(e.target.value);
                      setFormAllocations({});
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Payment Amount ($) *</label>
                  <input
                    type="text"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Payment Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="bank_transfer">Bank Transfer / Wire</option>
                    <option value="card">Card (Recorded)</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / Instant</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Reference #</label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    placeholder="e.g. WIRE-89214"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Received Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Invoice Allocation Section */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Allocate to Outstanding Invoices
                  </label>
                  <span className="text-xs text-text-secondary">
                    Allocated:{' '}
                    <strong className={cn(compareDecimals(totalAllocatedInForm, formAmount) > 0 ? 'text-error' : 'text-success')}>
                      {formatCurrency(totalAllocatedInForm, settings.currency_symbol)}
                    </strong>{' '}
                    / {formatCurrency(formAmount, settings.currency_symbol)}
                  </span>
                </div>

                {customerUnpaidInvoices.length === 0 ? (
                  <p className="p-3 text-xs text-text-tertiary bg-surface-secondary rounded-xl text-center">
                    This customer has no unpaid invoices. Payment can be recorded without allocation.
                  </p>
                ) : (
                  <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60">
                    {customerUnpaidInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-semibold text-text-primary">{inv.number}</p>
                          <p className="text-text-secondary">
                            Balance Due: <strong>{formatCurrency(inv.balance_due, settings.currency_symbol)}</strong> (Total: {formatCurrency(inv.total, settings.currency_symbol)})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAllocateFull(inv.id, inv.balance_due)}
                            className="h-7 text-[11px] rounded-lg"
                          >
                            Pay Full
                          </Button>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={formAllocations[inv.id] || ''}
                            onChange={(e) =>
                              setFormAllocations({ ...formAllocations, [inv.id]: e.target.value })
                            }
                            className="w-24 px-2 py-1 rounded-lg border border-border text-xs text-right bg-surface text-text-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Internal Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Received confirmation via JPMorgan Chase wire portal."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRecordOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Payment Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {isReceiptOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsReceiptOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white text-zinc-900 p-8 shadow-2xl z-10 print:p-0 animate-in zoom-in-95 duration-150 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Official Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => window.print()} className="rounded-xl">
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
                <button
                  onClick={() => setIsReceiptOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Payment Verified</h3>
              <p className="text-xs text-zinc-500">Receipt Ref: {selectedPayment.number}</p>
              <div className="text-3xl font-black text-emerald-600 pt-2">
                {formatCurrency(selectedPayment.amount, settings.currency_symbol)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold">{selectedPayment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Method:</span>
                <span className="font-semibold capitalize">{selectedPayment.method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction Ref:</span>
                <span className="font-mono">{selectedPayment.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date Received:</span>
                <span>{selectedPayment.received_date}</span>
              </div>
            </div>

            {selectedPayment.allocations.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-zinc-700 block">Allocated Invoices:</span>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
                  {selectedPayment.allocations.map((a) => (
                    <div key={a.id} className="p-2.5 flex justify-between bg-zinc-50">
                      <span className="font-mono">{a.invoice_number}</span>
                      <span className="font-semibold">{formatCurrency(a.amount, settings.currency_symbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t border-zinc-200 text-[11px] text-zinc-400">
              <p>{settings.company_name} • {settings.legal_name}</p>
              <p>Thank you for your business.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
