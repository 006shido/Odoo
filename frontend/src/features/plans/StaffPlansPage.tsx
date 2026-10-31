import { useMemo, useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import type { BillingFrequency } from '@/types';

export function StaffPlansPage() {
  const navigate = useNavigate();
  const { plans, settings } = useSubscription();
  const [frequency, setFrequency] = useState<'all' | BillingFrequency>('all');
  const today = new Date().toISOString().slice(0, 10);
  const visiblePlans = useMemo(() => plans.filter((plan) =>
    plan.status === 'active' &&
    (!plan.start_date || plan.start_date <= today) &&
    (!plan.end_date || plan.end_date >= today) &&
    (frequency === 'all' || plan.frequency === frequency),
  ), [plans, frequency, today]);

  return (
    <div className="space-y-7 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Sales workspace</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">Available plans</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Compare active offerings and start a quotation with the right plan already selected.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFrequency(value)} className={`rounded-full border px-3.5 py-2 text-xs font-medium capitalize transition ${frequency === value ? 'border-accent bg-accent text-accent-text' : 'border-border bg-surface text-text-secondary hover:text-text-primary'}`}>
            {value === 'all' ? 'All billing cycles' : value}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-tertiary">{plan.product_name}</p>
              <h3 className="mt-2 text-lg font-semibold text-text-primary">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-text-secondary">{plan.description || 'Flexible recurring operational subscription package.'}</p>
              <p className="mt-5 border-y border-border py-4 text-3xl font-semibold tracking-tight">{formatCurrency(plan.price, settings.currency_symbol)}<span className="ml-1 text-xs font-normal text-text-secondary">/ {plan.frequency}</span></p>
              {plan.setup_fee !== '0.00' && <p className="mt-2 text-xs text-text-secondary">One-time setup: {formatCurrency(plan.setup_fee, settings.currency_symbol)}</p>}
              <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary"><ShieldCheck className="h-4 w-4 text-success" /> Auto-renew {plan.auto_renew ? 'enabled' : 'disabled'}</div>
              <div className="mt-5 space-y-2.5">
                {plan.features.map((feature) => <p key={feature} className="flex gap-2 text-sm text-text-primary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</p>)}
              </div>
            </div>
            <Button onClick={() => navigate(`/quotations?plan=${encodeURIComponent(plan.id)}`)} className="mt-6 rounded-xl">Create quotation <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </article>
        ))}
      </div>
      {!visiblePlans.length && <p className="rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-text-secondary">No active plans match this billing cycle.</p>}
    </div>
  );
}
