import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  Search,
  RefreshCw,
  Printer,
  CreditCard,
  X,
  Zap,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus, BillingRun } from '@/types';

export function InvoicesPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    invoices,
    settings,
    voidInvoice,
    runBillingEngine,
  } = useSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]!);
  const [billingResult, setBillingResult] = useState<BillingRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(search.toLowerCase());

      if (statusFilter === 'all') return matchSearch;
      if (statusFilter === 'overdue') {
        return matchSearch && (inv.is_overdue || (inv.status !== 'paid' && inv.status !== 'void' && inv.due_date < '2026-10-31'));
      }
      return matchSearch && inv.status === statusFilter;
    });
  }, [invoices, search, statusFilter]);

  const handleExecuteBilling = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runBillingEngine(targetDate);
      setBillingResult(result);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Invoices & Recurring Billing
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Invoices, recurring billing runs, and outstanding balances.
          </p>
        </div>

        <Button onClick={() => setIsBillingModalOpen(true)} className="rounded-xl shadow-xs">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Run Recurring Billing
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
            placeholder="Search invoices by invoice # or customer name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          {(['all', 'issued', 'partially_paid', 'paid', 'overdue', 'void'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn('apple-segmented-item capitalize', statusFilter === st && 'active')}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Billing Period</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Balance Due</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-secondary">
                    <FileText className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOverdue =
                    inv.status !== 'void' &&
                    inv.status !== 'paid' &&
                    (inv.is_overdue || inv.due_date < '2026-10-31');

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {inv.number}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-text-primary">{inv.customer_name}</p>
                        <p className="text-xs text-text-secondary">{inv.customer_email}</p>
                      </td>

                      <td className="px-6 py-4 text-xs text-text-secondary">
                        {inv.billing_period_start} to {inv.billing_period_end}
                      </td>

                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <StatusBadge status="overdue" />
                        ) : (
                          <StatusBadge status={inv.status} />
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium">
                        <span className={cn(isOverdue ? 'text-error font-bold' : 'text-text-secondary')}>
                          {inv.due_date}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-text-primary">
                        {formatCurrency(inv.total, settings.currency_symbol)}
                      </td>

                      <td className="px-6 py-4 font-bold">
                        <span className={inv.balance_due !== '0.00' ? 'text-error' : 'text-success'}>
                          {formatCurrency(inv.balance_due, settings.currency_symbol)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balance_due !== '0.00' && inv.status !== 'void' && (
                            currentUser.role === 'customer' && (
                              <Button
                                size="sm"
                                onClick={() => navigate('/portal')}
                                className="h-8 text-xs rounded-xl shadow-xs"
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                            )
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsPdfModalOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Print / View Invoice"
                          >
                            <Printer className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && !isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-text-primary">{selectedInvoice.number}</h3>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Billed to {selectedInvoice.customer_name} • Issued {selectedInvoice.issue_date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="rounded-xl"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print / Preview
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Balances Status */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Total Invoiced</span>
                <span className="text-sm font-bold text-text-primary">
                  {formatCurrency(selectedInvoice.total, settings.currency_symbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Paid to Date</span>
                <span className="text-sm font-bold text-success">
                  {formatCurrency(selectedInvoice.paid_amount, settings.currency_symbol)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Balance Due</span>
                <span className="text-sm font-bold text-error">
                  {formatCurrency(selectedInvoice.balance_due, settings.currency_symbol)}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-border/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/70 border-b border-border/80 font-semibold text-text-secondary">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-medium text-text-primary">{item.description}</td>
                      <td className="p-3 text-center text-text-secondary">{item.quantity}</td>
                      <td className="p-3 text-right text-text-secondary">
                        {formatCurrency(item.unit_price, settings.currency_symbol)}
                      </td>
                      <td className="p-3 text-right font-semibold text-text-primary">
                        {formatCurrency(item.amount, settings.currency_symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Breakdown */}
            <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedInvoice.subtotal, settings.currency_symbol)}</span>
              </div>
              {selectedInvoice.discount_amount !== '0.00' && (
                <div className="flex justify-between text-success">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedInvoice.discount_amount, settings.currency_symbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Tax ({selectedInvoice.tax_rate}%):</span>
                <span>{formatCurrency(selectedInvoice.tax_amount, settings.currency_symbol)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-border/80">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedInvoice.total, settings.currency_symbol)}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border/80">
              <div className="flex items-center gap-2">
                {selectedInvoice.balance_due !== '0.00' && selectedInvoice.status !== 'void' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(null);
                      navigate('/payments');
                    }}
                    className="rounded-xl shadow-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    Record Payment
                  </Button>
                )}

                {selectedInvoice.status !== 'void' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      voidInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    className="rounded-xl"
                  >
                    Void Invoice
                  </Button>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(null)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice PDF Modal */}
      {isPdfModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPdfModalOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white text-zinc-900 p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Official Tax Invoice
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => window.print()} className="rounded-xl">
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Document
                </Button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Invoice Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-2">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">{settings.company_name}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{settings.legal_name}</p>
                <p className="text-xs text-zinc-500">{settings.address?.street}, {settings.address?.city}, {settings.address?.state}</p>
                <p className="text-xs text-zinc-500">Tax ID: {settings.tax_id}</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-blue-600 uppercase tracking-widest block">
                  INVOICE
                </span>
                <p className="font-mono text-sm font-bold text-zinc-800 mt-1">{selectedInvoice.number}</p>
                <p className="text-xs text-zinc-500 mt-1">Issue Date: {selectedInvoice.issue_date}</p>
                <p className="text-xs text-red-600 font-semibold">Due Date: {selectedInvoice.due_date}</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-8 p-4 rounded-xl bg-zinc-50 border border-zinc-200 grid grid-cols-2 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  BILLED TO:
                </span>
                <p className="font-bold text-sm text-zinc-900">{selectedInvoice.customer_name}</p>
                <p className="text-zinc-600">{selectedInvoice.customer_email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  BILLING PERIOD:
                </span>
                <p className="font-bold text-zinc-900">
                  {selectedInvoice.billing_period_start} — {selectedInvoice.billing_period_end}
                </p>
                <p className="text-zinc-600">Contract Ref: {selectedInvoice.subscription_number || 'Direct'}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="mt-8 border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {selectedInvoice.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3 font-medium text-zinc-800">{i.description}</td>
                      <td className="p-3 text-center text-zinc-600">{i.quantity}</td>
                      <td className="p-3 text-right text-zinc-600">{formatCurrency(i.unit_price)}</td>
                      <td className="p-3 text-right font-semibold text-zinc-900">{formatCurrency(i.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Outstanding */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Tax ({selectedInvoice.tax_rate}%):</span>
                  <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-300">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-red-600 pt-1 border-t border-zinc-200">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(selectedInvoice.balance_due)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Run Recurring Billing Engine */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBillingModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Run Recurring Billing Engine</h3>
            <p className="text-xs text-text-secondary">
              Scans all active subscriptions, calculates billing periods, and produces idempotent recurring invoices with audit logging.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Processing Business Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {billingResult && (
              <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>Execution Outcome:</span>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Checked</span>
                    <span className="text-sm font-bold">{billingResult.subscriptions_checked}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Created</span>
                    <span className="text-sm font-bold text-success">{billingResult.invoices_created}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Skipped</span>
                    <span className="text-sm font-bold text-text-secondary">{billingResult.invoices_skipped}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBillingModalOpen(false);
                  setBillingResult(null);
                }}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteBilling}
                disabled={isRunning}
                className="rounded-xl shadow-xs"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isRunning && 'animate-spin')} />
                {isRunning ? 'Processing...' : 'Run Billing Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
