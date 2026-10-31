import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Building, Check, CheckCircle2, ChevronDown, CreditCard, Clock3, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { addDecimals, calculatePercentage, formatCurrency, multiplyDecimals } from '@/lib/decimal';
import { cn } from '@/lib/utils';
import type { BillingFrequency, PaymentMethod, SubscriptionPlan } from '@/types';

type FrequencyFilter = 'all' | BillingFrequency;

function isFinderModule(row: number, column: number, originRow: number, originColumn: number) {
  const localRow = row - originRow;
  const localColumn = column - originColumn;
  if (localRow < 0 || localRow > 6 || localColumn < 0 || localColumn > 6) return null;
  const outer = localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6;
  const center = localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4;
  return outer || center;
}

function MockUpiQr() {
  const modules: Array<{ row: number; column: number }> = [];
  for (let row = 0; row < 25; row += 1) {
    for (let column = 0; column < 25; column += 1) {
      const finder = isFinderModule(row, column, 0, 0)
        ?? isFinderModule(row, column, 0, 18)
        ?? isFinderModule(row, column, 18, 0);
      const inFinderZone = (row < 8 && column < 8) || (row < 8 && column > 16) || (row > 16 && column < 8);
      const filled = finder ?? (!inFinderZone && ((row * 11 + column * 7 + row * column) % 13 < 6));
      if (filled) modules.push({ row, column });
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4">
      <svg role="img" aria-label="Decorative mock UPI QR code, not scannable" viewBox="0 0 25 25" className="h-40 w-40 rounded-lg" shapeRendering="crispEdges">
        <rect width="25" height="25" fill="white" />
        {modules.map(({ row, column }) => <rect key={`${row}-${column}`} x={column} y={row} width="1" height="1" fill="#123d32" />)}
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Mock UPI QR</span>
      <span className="text-center text-[10px] text-text-tertiary">Preview only · not scannable</span>
    </div>
  );
}

export function CustomerPlansPage() {
  const { currentUser, customers, plans, createQuotation, purchasePlan, settings } = useSubscription();
  const [frequency, setFrequency] = useState<FrequencyFilter>('all');
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('demo@brightloop');
  const [bankName, setBankName] = useState('State Bank of India');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ subscriptionNumber: string; invoiceNumber: string; paymentReference: string; total: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const customer = customers.find((item) =>
    (currentUser.customer_id && item.id === currentUser.customer_id) ||
    item.email.toLowerCase() === currentUser.email.toLowerCase(),
  );

  const availablePlans = useMemo(() => plans.filter((plan) =>
    plan.status === 'active' &&
    (!plan.start_date || plan.start_date <= today) &&
    (!plan.end_date || plan.end_date >= today) &&
    (frequency === 'all' || plan.frequency === frequency),
  ), [plans, frequency, today]);

  const handleRequestQuote = (plan: SubscriptionPlan) => {
    if (!customer) {
      const subject = encodeURIComponent(`Plan enquiry: ${plan.name}`);
      const body = encodeURIComponent(`Hello Brightloop team,\n\nI’m interested in the ${plan.name} plan (${formatCurrency(plan.price, settings.currency_symbol)} / ${plan.frequency}). Please contact me with next steps.\n\n${currentUser.email}`);
      window.location.href = `mailto:${settings.contact_email}?subject=${subject}&body=${body}`;
      return;
    }

    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 14);
      createQuotation({
        customer_id: customer.id,
        items: [{ product_id: plan.product_id, plan_id: plan.id, quantity: plan.minimum_quantity, unit_price: plan.price }],
        payment_terms: settings.default_payment_terms,
        expiry_date: expiry.toISOString().slice(0, 10),
        notes: `Customer requested the ${plan.name} plan from the plan catalogue.`,
      });
      setRequestedPlan(plan.id);
      setNotice(`Your request for ${plan.name} is ready. Our team will send a quotation to ${customer.email}.`);
    } catch {
      setNotice('We couldn’t submit that request just now. Please contact our team and we’ll help you get started.');
    }
  };

  const checkoutQuantity = Math.max(1, checkoutPlan?.minimum_quantity || 1);
  const checkoutSubtotal = checkoutPlan
    ? addDecimals(multiplyDecimals(checkoutPlan.price, checkoutQuantity), checkoutPlan.setup_fee || '0.00')
    : '0.00';
  const checkoutTax = calculatePercentage(checkoutSubtotal, settings.default_tax_rate);
  const checkoutTotal = addDecimals(checkoutSubtotal, checkoutTax);
  const paymentOptions = [
    { method: 'upi' as const, label: 'UPI', hint: 'GPay, PhonePe, BHIM', Icon: Smartphone },
    { method: 'card' as const, label: 'Cards', hint: 'Credit or debit', Icon: CreditCard },
    { method: 'bank_transfer' as const, label: 'Net banking', hint: 'Choose your bank', Icon: Building },
  ];

  const handleCheckout = () => {
    if (!checkoutPlan || !customer || isProcessing) return;
    if (paymentMethod === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
      setCheckoutError('Enter a demo UPI ID such as demo@brightloop.');
      return;
    }
    if (paymentMethod === 'card') {
      const digits = cardDetails.number.replace(/\D/g, '');
      const [monthText] = cardDetails.expiry.split('/');
      const month = Number(monthText);
      if (!cardDetails.name.trim() || digits.length !== 16 || month < 1 || month > 12 || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry) || !/^\d{3,4}$/.test(cardDetails.cvv)) {
        setCheckoutError('Enter the sample card details shown below to continue.');
        return;
      }
    }
    setIsProcessing(true);
    setCheckoutError('');
    const reference = `BL-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-8)}`;
    window.setTimeout(() => {
      const result = purchasePlan({
        customer_id: customer.id,
        plan_id: checkoutPlan.id,
        method: paymentMethod,
        reference,
      });
      setIsProcessing(false);
      if (result.error || !result.subscription || !result.invoice || !result.payment) {
        setCheckoutError(result.error || 'We couldn’t complete this demo payment. Please try again.');
        return;
      }
      setCheckoutResult({
        subscriptionNumber: result.subscription.number,
        invoiceNumber: result.invoice.number,
        paymentReference: result.payment.reference,
        total: result.payment.amount,
      });
      setNotice(`${checkoutPlan.name} is active. Your payment was simulated successfully.`);
    }, 900);
  };

  const closeCheckout = () => {
    if (isProcessing) return;
    setCheckoutPlan(null);
    setCheckoutResult(null);
    setCheckoutError('');
    setPaymentMethod('upi');
    setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
    setUpiId('demo@brightloop');
    setBankName('State Bank of India');
  };

  const frequencies: Array<{ value: FrequencyFilter; label: string }> = [
    { value: 'all', label: 'All plans' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-[28px] bg-[#123d32] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 border border-white/15 bg-white/10 text-emerald-100 hover:bg-white/10">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Plans for your business
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find your Brightloop plan</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
            Compare clear pricing, choose the tools your team needs, and activate your plan with a quick checkout.
          </p>
        </div>
        <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-emerald-50/80">
          <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-emerald-300" /> Transparent recurring pricing</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-emerald-300" /> Flexible billing cycles</span>
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-text-primary">Choose a plan</h3>
          <p className="mt-1 text-sm text-text-secondary">Every plan includes recurring billing and a clear renewal schedule.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-border bg-surface p-1 shadow-xs" aria-label="Filter plans by billing cycle">
          {frequencies.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFrequency(item.value)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${frequency === item.value ? 'bg-[#123d32] text-white shadow-sm' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

      {availablePlans.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {availablePlans.map((plan) => {
            const minimumRecurring = multiplyDecimals(plan.price, plan.minimum_quantity || 1);
            return (
            <article key={plan.id} className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">{plan.product_name}</p>
                <h4 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">{plan.name}</h4>
                <p className="mt-2 min-h-10 text-sm leading-5 text-text-secondary">{plan.description || 'A flexible subscription designed to help your team grow.'}</p>

                <div className="mt-6 flex items-end gap-1.5 border-b border-border pb-5">
                  <span className="text-4xl font-semibold tracking-tight text-text-primary">{formatCurrency(minimumRecurring, settings.currency_symbol)}</span>
                  <span className="pb-1 text-sm text-text-secondary">/ {plan.frequency === 'yearly' ? 'year' : plan.frequency === 'monthly' ? 'month' : plan.frequency}</span>
                </div>
                {plan.minimum_quantity > 1 && <p className="mt-2 text-xs text-text-secondary">{formatCurrency(plan.price, settings.currency_symbol)} per unit · minimum {plan.minimum_quantity} units</p>}
                {plan.setup_fee !== '0.00' && <p className="mt-3 text-xs text-text-secondary">One-time setup: {formatCurrency(plan.setup_fee, settings.currency_symbol)}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.auto_renew && <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">Renews automatically</Badge>}
                  {plan.allow_pause && <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">Pause available</Badge>}
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Included</p>
                  {(plan.features || []).map((feature, index) => (
                    <div key={`${plan.id}-${index}`} className="flex items-start gap-2.5 text-sm text-text-primary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setPaymentMethod('upi');
                  setCheckoutResult(null);
                  setCheckoutError('');
                  setCheckoutPlan(plan);
                }}
                className="mt-7 h-11 w-full rounded-xl bg-[#123d32] text-white hover:bg-[#1b5143]"
              >
                Subscribe & pay
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => handleRequestQuote(plan)}
                disabled={requestedPlan === plan.id}
                className="mt-2 w-full text-center text-[11px] text-text-tertiary hover:text-emerald-800 hover:underline disabled:no-underline"
              >
                {requestedPlan === plan.id ? 'Quote request sent' : 'Prefer a quote? Request one'}
              </button>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <h4 className="font-semibold text-text-primary">No plans for this billing cycle yet</h4>
          <p className="mt-1 text-sm text-text-secondary">Try another billing cycle or contact our team for help.</p>
          <button type="button" onClick={() => setFrequency('all')} className="mt-4 text-sm font-medium text-emerald-800 hover:underline">View all plans</button>
        </div>
      )}

      <p className="text-center text-xs text-text-tertiary">Need help choosing? <a className="font-medium text-emerald-800 hover:underline" href={`mailto:${settings.contact_email}`}>Talk to our team</a></p>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close checkout" className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCheckout} />
          <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="relative z-10 max-h-[92dvh] w-full max-w-lg space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6 animate-in zoom-in-95 duration-150">
            {checkoutResult ? (
              <div className="py-3 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></div>
                <h3 id="checkout-title" className="text-xl font-bold text-text-primary">Payment successful</h3>
                <p className="mt-1 text-sm text-text-secondary">Your {checkoutPlan.name} subscription is now active.</p>
                <p className="mt-5 text-3xl font-extrabold text-text-primary">{formatCurrency(checkoutResult.total, settings.currency_symbol)}</p>
                <div className="mx-auto mt-5 max-w-sm rounded-xl bg-surface-secondary p-3 text-left text-xs">
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Subscription</span><span className="font-semibold text-text-primary">{checkoutResult.subscriptionNumber}</span></div>
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Invoice</span><span className="font-semibold text-text-primary">{checkoutResult.invoiceNumber} · Paid</span></div>
                  <div className="flex justify-between gap-3 py-1.5"><span className="text-text-secondary">Payment reference</span><span className="font-mono text-text-primary">{checkoutResult.paymentReference}</span></div>
                </div>
                <p className="mt-3 text-[11px] text-text-tertiary">Demo payment only. No real money was charged.</p>
                <Button onClick={closeCheckout} className="mt-5 w-full rounded-xl bg-[#123d32] text-white hover:bg-[#1b5143]">Done</Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 id="checkout-title" className="text-lg font-bold text-text-primary">Checkout · {checkoutPlan.name}</h3>
                  <p className="mt-1 text-xs text-text-secondary">Review your first payment and select how you’d like to pay.</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface-secondary p-4 text-sm">
                  <div className="flex justify-between py-1"><span className="text-text-secondary">{checkoutPlan.name} · {checkoutPlan.frequency}</span><span>{formatCurrency(multiplyDecimals(checkoutPlan.price, checkoutQuantity), settings.currency_symbol)}</span></div>
                  {checkoutPlan.setup_fee !== '0.00' && <div className="flex justify-between py-1"><span className="text-text-secondary">One-time setup</span><span>{formatCurrency(checkoutPlan.setup_fee, settings.currency_symbol)}</span></div>}
                  <div className="flex justify-between py-1"><span className="text-text-secondary">Tax ({settings.default_tax_rate}%)</span><span>{formatCurrency(checkoutTax, settings.currency_symbol)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-border pt-3 font-bold text-text-primary"><span>Pay now</span><span>{formatCurrency(checkoutTotal, settings.currency_symbol)}</span></div>
                </div>
                <fieldset className="space-y-2" disabled={isProcessing}>
                  <legend className="mb-2 text-xs font-semibold text-text-primary">Choose payment method</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {paymentOptions.map(({ method, label, hint, Icon }) => (
                      <button key={method} type="button" aria-pressed={paymentMethod === method} onClick={() => setPaymentMethod(method)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition-all sm:flex-col sm:items-start sm:gap-2', paymentMethod === method ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent' : 'border-border bg-surface text-text-secondary hover:border-border-strong')}>
                        <Icon className="h-5 w-5 shrink-0" />
                        <span><span className="block text-xs font-semibold">{label}</span><span className="mt-0.5 block text-[10px] opacity-75">{hint}</span></span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                {paymentMethod === 'upi' && (
                  <div className="grid gap-4 rounded-xl border border-border bg-surface-secondary/50 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    <MockUpiQr />
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Pay with UPI</h4>
                        <p className="mt-1 text-xs leading-5 text-text-secondary">A real checkout would use a scannable QR. This sample is decorative; enter a demo UPI ID and press Pay to simulate approval.</p>
                      </div>
                      <label className="block text-xs font-medium text-text-secondary" htmlFor="checkout-upi-id">UPI ID</label>
                      <input id="checkout-upi-id" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="name@bank" autoComplete="off" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 rounded-xl border border-border bg-surface-secondary/50 p-4">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Card details</h4>
                      <p className="mt-1 text-[11px] text-text-secondary">Demo checkout only. Don’t enter real card credentials; these fields are not sent or saved.</p>
                    </div>
                    <label className="block space-y-1 text-xs font-medium text-text-secondary">Name on card
                      <input value={cardDetails.name} onChange={(event) => setCardDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Name as printed on card" autoComplete="off" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent" />
                    </label>
                    <label className="block space-y-1 text-xs font-medium text-text-secondary">Card number
                      <input inputMode="numeric" maxLength={19} value={cardDetails.number} onChange={(event) => setCardDetails((current) => ({ ...current, number: event.target.value.replace(/[^\d ]/g, '') }))} placeholder="Enter card number" autoComplete="off" className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block space-y-1 text-xs font-medium text-text-secondary">Expiry
                        <input inputMode="numeric" maxLength={5} placeholder="MM/YY" value={cardDetails.expiry} onChange={(event) => setCardDetails((current) => ({ ...current, expiry: event.target.value }))} autoComplete="off" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent" />
                      </label>
                      <label className="block space-y-1 text-xs font-medium text-text-secondary">CVV
                        <input inputMode="numeric" maxLength={4} value={cardDetails.cvv} onChange={(event) => setCardDetails((current) => ({ ...current, cvv: event.target.value.replace(/\D/g, '') }))} placeholder="CVV" autoComplete="off" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent" />
                      </label>
                    </div>
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-2 rounded-xl border border-border bg-surface-secondary/50 p-4">
                    <label htmlFor="checkout-bank" className="block text-xs font-medium text-text-secondary">Select your bank</label>
                    <div className="relative">
                      <select id="checkout-bank" value={bankName} onChange={(event) => setBankName(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-10 text-sm text-text-primary shadow-xs outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20">
                        <option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option>
                      </select>
                      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    </div>
                    <p className="text-[11px] text-text-secondary">You’ll see a simulated bank authorization after you continue.</p>
                  </div>
                )}
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Hackathon demo mode: payment, invoice, and subscription are simulated. No real payment details or money are used.</span></div>
                {checkoutError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{checkoutError}</p>}
                {isProcessing && <p role="status" className="text-center text-xs font-medium text-accent">Authorizing simulated payment…</p>}
                <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-border/80 bg-surface px-5 pb-2 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <Button variant="outline" size="sm" onClick={closeCheckout} disabled={isProcessing} className="rounded-xl">Cancel</Button>
                  <Button size="sm" onClick={handleCheckout} disabled={isProcessing || !customer} className="rounded-xl bg-[#123d32] text-white hover:bg-[#1b5143]">{isProcessing ? 'Processing…' : `Pay ${formatCurrency(checkoutTotal, settings.currency_symbol)}`}</Button>
                </div>
                {!customer && <p className="text-right text-[11px] text-error">A linked customer account is required to subscribe.</p>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
