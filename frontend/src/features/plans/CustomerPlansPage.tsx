import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Check, Clock3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency, multiplyDecimals } from '@/lib/decimal';
import type { BillingFrequency, SubscriptionPlan } from '@/types';

type FrequencyFilter = 'all' | BillingFrequency;

export function CustomerPlansPage() {
  const { currentUser, customers, plans, createQuotation, settings } = useSubscription();
  const [frequency, setFrequency] = useState<FrequencyFilter>('all');
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
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

  const handleRequest = (plan: SubscriptionPlan) => {
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
            Compare clear pricing, choose the tools your team needs, and request a tailored quotation in a few clicks.
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
                onClick={() => handleRequest(plan)}
                disabled={requestedPlan === plan.id}
                className="mt-7 h-11 w-full rounded-xl bg-[#123d32] text-white hover:bg-[#1b5143]"
              >
                {requestedPlan === plan.id ? 'Request sent' : 'Request this plan'}
                {requestedPlan !== plan.id && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="mt-2 text-center text-[11px] text-text-tertiary">No payment is collected when you request a quote.</p>
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
    </div>
  );
}
