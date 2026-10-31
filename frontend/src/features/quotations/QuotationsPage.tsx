import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  Zap,
  Printer,
  X,
  Trash2,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import {
  formatCurrency,
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  calculatePercentage,
  compareDecimals,
} from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Quotation, QuotationStatus } from '@/types';

export function QuotationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    quotations,
    customers,
    products,
    plans,
    discounts,
    settings,
    createQuotation,
    sendQuotation,
    acceptQuotation,
    rejectQuotation,
    convertQuotationToSubscription,
  } = useSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuotationStatus>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [builderError, setBuilderError] = useState('');

  // Builder state
  const [builderCustomer, setBuilderCustomer] = useState(customers[0]?.id || '');
  const [builderDiscount, setBuilderDiscount] = useState('');
  const [builderExpiry, setBuilderExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0]!;
  });
  const [builderTerms, setBuilderTerms] = useState('Net 30');
  const [builderNotes, setBuilderNotes] = useState('Commercial terms subject to standard Brightloop Master Services Agreement.');
  const [builderLines, setBuilderLines] = useState<
    Array<{ product_id: string; plan_id?: string; quantity: number; unit_price: string }>
  >([
    {
      product_id: products[0]?.id || '',
      plan_id: plans[0]?.id,
      quantity: 1,
      unit_price: plans[0]?.price || '999.00',
    },
  ]);

  const quoteSubtotal = builderLines.reduce(
    (sum, line) => addDecimals(sum, multiplyDecimals(line.unit_price, line.quantity)),
    '0.00',
  );
  const quoteQuantity = builderLines.reduce((sum, line) => sum + line.quantity, 0);
  const today = new Date().toISOString().slice(0, 10);
  const eligibleDiscounts = discounts.filter((discount) =>
    discount.status === 'active' &&
    (!discount.start_date || discount.start_date <= today) &&
    (!discount.end_date || discount.end_date >= today) &&
    (!discount.usage_limit || discount.usage_count < discount.usage_limit) &&
    (!discount.min_subtotal || compareDecimals(quoteSubtotal, discount.min_subtotal) >= 0) &&
    (!discount.minimum_quantity || quoteQuantity >= discount.minimum_quantity) &&
    (discount.scope !== 'product' || !discount.product_id || builderLines.some((line) => line.product_id === discount.product_id)),
  );

  useEffect(() => {
    const requestedPlanId = searchParams.get('plan');
    if (!requestedPlanId) return;

    const requestedPlan = plans.find((plan) => plan.id === requestedPlanId);
    if (requestedPlan) {
      setBuilderLines([{
        product_id: requestedPlan.product_id,
        plan_id: requestedPlan.id,
        quantity: requestedPlan.minimum_quantity,
        unit_price: requestedPlan.price,
      }]);
      setIsCreateOpen(true);
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('plan');
    setSearchParams(nextSearchParams, { replace: true });
  }, [plans, searchParams, setSearchParams]);

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      const matchSearch =
        q.number.toLowerCase().includes(search.toLowerCase()) ||
        q.customer_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, search, statusFilter]);

  // Real-time calculation for builder
  const builderTotals = useMemo(() => {
    let subtotal = '0.00';
    builderLines.forEach((line) => {
      const lineAmt = multiplyDecimals(line.unit_price, line.quantity);
      subtotal = addDecimals(subtotal, lineAmt);
    });

    let discountAmt = '0.00';
    if (builderDiscount) {
      const disc = discounts.find((d) => d.id === builderDiscount);
      if (disc) {
        const eligibleLines = disc.scope === 'product' && disc.product_id
          ? builderLines.filter((line) => line.product_id === disc.product_id)
          : builderLines;
        const discountBase = eligibleLines.reduce(
          (sum, line) => addDecimals(sum, multiplyDecimals(line.unit_price, line.quantity)),
          '0.00',
        );
        if (disc.type === 'percentage') {
          discountAmt = calculatePercentage(discountBase, disc.value);
        } else {
          discountAmt = compareDecimals(disc.value, discountBase) > 0 ? discountBase : disc.value;
        }
      }
    }

    const discountedSubtotal = compareDecimals(subtotal, discountAmt) > 0 ? subtractDecimals(subtotal, discountAmt) : '0.00';
    const taxAmt = calculatePercentage(discountedSubtotal, settings.default_tax_rate);
    const total = addDecimals(discountedSubtotal, taxAmt);

    return { subtotal, discountAmt, taxAmt, total };
  }, [builderLines, builderDiscount, discounts, settings.default_tax_rate]);

  const handleAddLine = () => {
    const defaultProd = products[0];
    const defaultPlan = plans.find((p) => p.product_id === defaultProd?.id) || plans[0];
    setBuilderLines((prev) => [
      ...prev,
      {
        product_id: defaultProd?.id || '',
        plan_id: defaultPlan?.id,
        quantity: 1,
        unit_price: defaultPlan?.price || '999.00',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setBuilderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    setBuilderLines((prev) => {
      const updated = [...prev];
      const cur = { ...updated[index]!, [field]: value };

      // If product changed, update plan
      if (field === 'product_id') {
        const matchingPlan = plans.find((p) => p.product_id === value);
        cur.plan_id = matchingPlan?.id;
        cur.unit_price = matchingPlan?.price || '999.00';
      } else if (field === 'plan_id') {
        const selectedPlan = plans.find((p) => p.id === value);
        if (selectedPlan) {
          cur.unit_price = selectedPlan.price;
        }
      }

      updated[index] = cur;
      return updated;
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderCustomer || builderLines.length === 0) return;
    setBuilderError('');
    try {
      createQuotation({
        customer_id: builderCustomer,
        items: builderLines,
        discount_id: builderDiscount || undefined,
        payment_terms: builderTerms,
        expiry_date: builderExpiry,
        notes: builderNotes,
      });
      setIsCreateOpen(false);
    } catch (error) {
      setBuilderError(error instanceof Error ? error.message : 'Could not create the quotation. Please review the details.');
    }
  };

  const handleConvert = (quote: Quotation) => {
    const res = convertQuotationToSubscription(quote.id);
    if (res.error) {
      alert(res.error);
    } else {
      setSelectedQuote(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Quotations & Proposals
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Draft quotes, send them for customer review, and convert accepted quotes to subscriptions.
          </p>
        </div>

        <Button onClick={() => { setBuilderError(''); setIsCreateOpen(true); }} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Quotation
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotations by quote # or customer name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          {(['all', 'draft', 'sent', 'accepted', 'converted', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn('apple-segmented-item capitalize', statusFilter === st && 'active')}
            >
              {st} ({st === 'all' ? quotations.length : quotations.filter((q) => q.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-6 py-3.5">Quotation #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Issued / Expiry</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    <FileText className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                    No quotations found. Click "Create Quotation" to draft one.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedQuote(q)}
                    className="hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {q.number}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-primary">{q.customer_name}</p>
                      <p className="text-xs text-text-secondary">{q.customer_email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={q.status} />
                    </td>

                    <td className="px-6 py-4 text-xs text-text-secondary">
                      <div>Issued: {q.issue_date}</div>
                      <div>Exp: {q.expiry_date}</div>
                    </td>

                    <td className="px-6 py-4 text-xs text-text-primary">
                      {q.items.length} line item(s)
                    </td>

                    <td className="px-6 py-4 font-bold text-text-primary">
                      {formatCurrency(q.total, settings.currency_symbol)}
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {q.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => handleConvert(q)}
                            className="h-8 text-xs rounded-xl shadow-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Convert
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedQuote(q);
                            setIsPdfModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Print / View PDF"
                        >
                          <Printer className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Detail Modal */}
      {selectedQuote && !isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedQuote(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-text-primary">{selectedQuote.number}</h3>
                  <StatusBadge status={selectedQuote.status} />
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Prepared for {selectedQuote.customer_name} • Issued {selectedQuote.issue_date}
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
                  onClick={() => setSelectedQuote(null)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/70 border-b border-border/80 font-semibold text-text-secondary">
                  <tr>
                    <th className="p-3">Product / Plan Line</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedQuote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-medium text-text-primary">{item.product_name}</td>
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

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedQuote.subtotal, settings.currency_symbol)}</span>
              </div>
              {selectedQuote.discount_amount !== '0.00' && (
                <div className="flex justify-between text-success">
                  <span>Discount ({selectedQuote.discount_code || 'Promo'})</span>
                  <span>-{formatCurrency(selectedQuote.discount_amount, settings.currency_symbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Tax ({selectedQuote.tax_rate}%)</span>
                <span>{formatCurrency(selectedQuote.tax_amount, settings.currency_symbol)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-border/80">
                <span>Grand Total</span>
                <span>{formatCurrency(selectedQuote.total, settings.currency_symbol)}</span>
              </div>
            </div>

            {/* Lifecycle Status & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80">
              <div className="flex items-center gap-2">
                {selectedQuote.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      sendQuotation(selectedQuote.id);
                      setSelectedQuote(null);
                    }}
                    className="rounded-xl"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send to Customer
                  </Button>
                )}

                {selectedQuote.status === 'sent' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        acceptQuotation(selectedQuote.id);
                        setSelectedQuote(null);
                      }}
                      className="rounded-xl shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Mark Accepted
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        rejectQuotation(selectedQuote.id);
                        setSelectedQuote(null);
                      }}
                      className="rounded-xl"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </>
                )}

                {selectedQuote.status === 'accepted' && (
                  <Button
                    size="sm"
                    onClick={() => handleConvert(selectedQuote)}
                    className="rounded-xl shadow-xs bg-success hover:bg-success/90 text-white"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Convert to Active Subscription & Invoice
                  </Button>
                )}

                {selectedQuote.status === 'converted' && (
                  <span className="text-xs text-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Converted to active subscription
                  </span>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => setSelectedQuote(null)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Apple-styled Printable PDF Preview Modal */}
      {isPdfModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPdfModalOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-2xl bg-white text-zinc-900 p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none animate-in zoom-in-95 duration-150">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Official Commercial Quotation Document
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

            {/* Document Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-2">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">{settings.company_name}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{settings.legal_name}</p>
                <p className="text-xs text-zinc-500">{settings.address?.street}, {settings.address?.city}, {settings.address?.state} {settings.address?.postal_code}</p>
                <p className="text-xs text-zinc-500">Tax ID: {settings.tax_id}</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-blue-600 uppercase tracking-widest block">
                  QUOTATION
                </span>
                <p className="font-mono text-sm font-bold text-zinc-800 mt-1">{selectedQuote.number}</p>
                <p className="text-xs text-zinc-500 mt-1">Date: {selectedQuote.issue_date}</p>
                <p className="text-xs text-zinc-500">Valid Until: {selectedQuote.expiry_date}</p>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-8 p-4 rounded-xl bg-zinc-50 border border-zinc-200 grid grid-cols-2 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  PREPARED FOR:
                </span>
                <p className="font-bold text-sm text-zinc-900">{selectedQuote.customer_name}</p>
                <p className="text-zinc-600">{selectedQuote.customer_email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  PAYMENT TERMS:
                </span>
                <p className="font-bold text-zinc-900">{selectedQuote.payment_terms}</p>
                <p className="text-zinc-600">Currency: {settings.currency}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="mt-8 border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {selectedQuote.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3 font-medium text-zinc-800">{i.product_name}</td>
                      <td className="p-3 text-center text-zinc-600">{i.quantity}</td>
                      <td className="p-3 text-right text-zinc-600">{formatCurrency(i.unit_price)}</td>
                      <td className="p-3 text-right font-semibold text-zinc-900">{formatCurrency(i.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                {selectedQuote.discount_amount !== '0.00' && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedQuote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Tax ({selectedQuote.tax_rate}%):</span>
                  <span>{formatCurrency(selectedQuote.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-300">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedQuote.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signature */}
            <div className="mt-12 pt-6 border-t border-zinc-200 grid grid-cols-2 gap-8 text-xs text-zinc-500">
              <div>
                <span className="font-bold text-zinc-700 block mb-1">Notes & Conditions:</span>
                <p>{selectedQuote.notes || 'This quote constitutes a formal offer. Once accepted, recurring billing terms apply.'}</p>
              </div>
              <div className="text-right">
                <div className="inline-block text-left">
                  <div className="h-10 border-b border-zinc-300 w-48 mb-1" />
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    Authorized Acceptance Signature
                  </span>
                  {selectedQuote.accepted_by && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      Accepted by: {selectedQuote.accepted_by}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Quotation Builder */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Create Quotation</h3>
            <p className="text-xs text-text-secondary mt-1">
              Select products, tier plans, and optional discounts with verified tax calculations.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Target Customer *</label>
                  <select
                    value={builderCustomer}
                    onChange={(e) => setBuilderCustomer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Promotional Discount</label>
                  <select
                    value={builderDiscount}
                    onChange={(e) => setBuilderDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">No Discount Applied</option>
                    {eligibleDiscounts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name} ({d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value, settings.currency_symbol)})
                      </option>
                    ))}
                  </select>
                  {builderDiscount && !eligibleDiscounts.some((discount) => discount.id === builderDiscount) && (
                    <p className="text-xs text-amber-700">This discount no longer meets the quote requirements. Choose another one or remove it.</p>
                  )}
                </div>
              </div>

              {/* Dynamic Line items */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Quotation Line Items ({builderLines.length})
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="rounded-xl text-xs h-7">
                    + Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {builderLines.map((line, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-secondary/50 border border-border/60 flex items-center gap-2">
                      <select
                        value={line.product_id}
                        onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={line.plan_id || ''}
                        onChange={(e) => handleLineChange(idx, 'plan_id', e.target.value)}
                        className="w-40 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary"
                      >
                        {plans
                          .filter((p) => p.product_id === line.product_id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(p.price, settings.currency_symbol)})
                            </option>
                          ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary text-center"
                      />

                      <input
                        type="text"
                        value={line.unit_price}
                        onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-border text-xs bg-surface text-text-primary text-right"
                      />

                      {builderLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Subtotal Card */}
              <div className="p-3.5 rounded-xl bg-surface-secondary/80 border border-border text-xs space-y-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(builderTotals.subtotal, settings.currency_symbol)}</span>
                </div>
                {builderTotals.discountAmt !== '0.00' && (
                  <div className="flex justify-between text-success">
                    <span>Discount:</span>
                    <span>-{formatCurrency(builderTotals.discountAmt, settings.currency_symbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span>Estimated Tax ({settings.default_tax_rate}%):</span>
                  <span>{formatCurrency(builderTotals.taxAmt, settings.currency_symbol)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-text-primary pt-1.5 border-t border-border">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(builderTotals.total, settings.currency_symbol)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Expiry Date</label>
                  <input
                    type="date"
                    value={builderExpiry}
                    onChange={(e) => setBuilderExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Payment Terms</label>
                  <input
                    type="text"
                    value={builderTerms}
                    onChange={(e) => setBuilderTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Notes & Commercial Terms</label>
                <textarea
                  rows={2}
                  value={builderNotes}
                  onChange={(e) => setBuilderNotes(e.target.value)}
                  placeholder="Terms and conditions, SLA references..."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                {builderError && <p role="alert" className="mr-auto text-xs font-medium text-red-600">{builderError}</p>}
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Draft Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

