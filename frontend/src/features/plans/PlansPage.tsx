import { useState } from 'react';
import {
  Plus,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BillingFrequency } from '@/types';
import { CustomerPlansPage } from '@/features/plans/CustomerPlansPage';
import { StaffPlansPage } from '@/features/plans/StaffPlansPage';

export function PlansPage() {
  const { currentUser } = useSubscription();
  if (currentUser.role === 'customer') return <CustomerPlansPage />;
  if (currentUser.role === 'staff') return <StaffPlansPage />;
  return <AdminPlansPage />;
}

function AdminPlansPage() {
  const { plans, products, createPlan, settings } = useSubscription();
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | BillingFrequency>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    product_id: products[0]?.id || '',
    frequency: 'monthly' as BillingFrequency,
    price: '149.00',
    setup_fee: '0.00',
    minimum_quantity: 1,
    allow_pause: true,
    auto_renew: true,
    start_date: '',
    end_date: '',
    auto_close_on_expiry: true,
    can_close_early: true,
    can_renew: true,
    description: '',
    featuresText: 'Full API access\nStandard SLA\nEmail support',
  });

  const filteredPlans = plans.filter((p) => {
    return frequencyFilter === 'all' || p.frequency === frequencyFilter;
  });

  const handleOpenCreate = () => {
    const nextNum = (plans.length + 1).toString().padStart(2, '0');
    setFormData({
      name: '',
      code: `PLAN-CORE-${nextNum}`,
      product_id: products[0]?.id || '',
      frequency: 'monthly',
      price: '149.00',
      setup_fee: '0.00',
      minimum_quantity: 1,
      allow_pause: true,
      auto_renew: true,
      start_date: '',
      end_date: '',
      auto_close_on_expiry: true,
      can_close_early: true,
      can_renew: true,
      description: '',
      featuresText: 'High performance throughput\nAutomated monthly invoicing\nRole-based access',
    });
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === formData.product_id);
    if (!product || !formData.name || !formData.code) return;

    const featuresList = formData.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    createPlan({
      name: formData.name,
      code: formData.code,
      product_id: product.id,
      product_name: product.name,
      frequency: formData.frequency,
      price: formData.price,
      setup_fee: formData.setup_fee,
      minimum_quantity: Number(formData.minimum_quantity) || 1,
      status: 'active',
      allow_pause: formData.allow_pause,
      auto_renew: formData.auto_renew,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      auto_close_on_expiry: formData.auto_close_on_expiry,
      can_close_early: formData.can_close_early,
      can_renew: formData.can_renew,
      description: formData.description,
      features: featuresList,
    });

    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Subscription Plans & Pricing
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Billing cycles, pricing tiers, and renewal rules.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Plan
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="apple-segmented-container">
          <button
            onClick={() => setFrequencyFilter('all')}
            className={cn('apple-segmented-item', frequencyFilter === 'all' && 'active')}
          >
            All Frequencies ({plans.length})
          </button>
          <button
            onClick={() => setFrequencyFilter('daily')}
            className={cn('apple-segmented-item', frequencyFilter === 'daily' && 'active')}
          >
            Daily ({plans.filter((p) => p.frequency === 'daily').length})
          </button>
          <button
            onClick={() => setFrequencyFilter('weekly')}
            className={cn('apple-segmented-item', frequencyFilter === 'weekly' && 'active')}
          >
            Weekly ({plans.filter((p) => p.frequency === 'weekly').length})
          </button>
          <button
            onClick={() => setFrequencyFilter('monthly')}
            className={cn('apple-segmented-item', frequencyFilter === 'monthly' && 'active')}
          >
            Monthly ({plans.filter((p) => p.frequency === 'monthly').length})
          </button>
          <button
            onClick={() => setFrequencyFilter('yearly')}
            className={cn('apple-segmented-item', frequencyFilter === 'yearly' && 'active')}
          >
            Yearly ({plans.filter((p) => p.frequency === 'yearly').length})
          </button>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const isAnnual = plan.frequency === 'yearly';

          return (
            <div
              key={plan.id}
              className={cn(
                'apple-card p-6 flex flex-col justify-between relative overflow-hidden transition-all',
                isAnnual && 'ring-1 ring-accent/30',
              )}
            >
              {isAnnual && (
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider">
                    Annual Value
                  </Badge>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {plan.product_name}
                </span>
                <h3 className="text-xl font-bold text-text-primary mt-1">{plan.name}</h3>
                <p className="text-xs text-text-secondary mt-1 min-h-[32px] line-clamp-2">
                  {plan.description || 'Flexible recurring operational subscription package.'}
                </p>

                {/* Price Display */}
                <div className="mt-5 pb-5 border-b border-border/70 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-text-primary">
                    {formatCurrency(plan.price, settings.currency_symbol)}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    /{plan.frequency}
                  </span>
                </div>

                {/* Metadata badges */}
                <div className="py-3.5 border-b border-border/70 flex flex-wrap gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-text-secondary">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Auto-renew: {plan.auto_renew ? 'Enabled' : 'Off'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-text-secondary">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    Pause: {plan.allow_pause ? 'Allowed' : 'Locked'}
                  </span>
                  {plan.setup_fee !== '0.00' && (
                    <span className="text-warning font-semibold">
                      Setup: {formatCurrency(plan.setup_fee, settings.currency_symbol)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border/70 py-3 text-[11px] text-text-secondary">
                  <span>Minimum seats: {plan.minimum_quantity}</span>
                  <span>Available: {plan.start_date || 'Now'} – {plan.end_date || 'No end date'}</span>
                  <span>Early close: {plan.can_close_early === false ? 'Not allowed' : 'Allowed'}</span>
                  <span>Closes at expiry: {plan.auto_close_on_expiry === false ? 'No' : 'Yes'}</span>
                </div>

                {/* Feature bullets */}
                <div className="pt-4 space-y-2.5">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Included Features
                  </span>
                  {plan.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-text-primary">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
                <code className="text-[11px] font-mono text-text-tertiary">{plan.code}</code>
                <Badge variant={plan.status === 'active' ? 'success' : 'outline'} className="capitalize">
                  {plan.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Plan */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Create Subscription Plan</h3>
            <p className="text-xs text-text-secondary mt-1">
              Assemble a recurring plan linked to a catalogue product with custom billing intervals.
            </p>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Associated Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Plan Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Plan Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Enterprise SLA Monthly"
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as BillingFrequency })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Recurring Price ($)</label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">One-time Setup Fee</label>
                  <input
                    type="text"
                    value={formData.setup_fee}
                    onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Minimum Quantity</label>
                  <input type="number" min="1" step="1" required value={formData.minimum_quantity} onChange={(e) => setFormData({ ...formData, minimum_quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Available From</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Available Until</label>
                  <input type="date" min={formData.start_date || undefined} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-border/70">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
                  <input
                    type="checkbox"
                    checked={formData.auto_renew}
                    onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                    className="rounded border-border text-accent focus:ring-accent h-4 w-4"
                  />
                  <span>Auto-renew by default</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
                  <input
                    type="checkbox"
                    checked={formData.allow_pause}
                    onChange={(e) => setFormData({ ...formData, allow_pause: e.target.checked })}
                    className="rounded border-border text-accent focus:ring-accent h-4 w-4"
                  />
                  <span>Allow customer pause</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
                  <input type="checkbox" checked={formData.can_renew} onChange={(e) => setFormData({ ...formData, can_renew: e.target.checked })} className="rounded border-border text-accent focus:ring-accent h-4 w-4" />
                  <span>Allow renewal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
                  <input type="checkbox" checked={formData.auto_close_on_expiry} onChange={(e) => setFormData({ ...formData, auto_close_on_expiry: e.target.checked })} className="rounded border-border text-accent focus:ring-accent h-4 w-4" />
                  <span>Close automatically at expiry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-primary">
                  <input type="checkbox" checked={formData.can_close_early} onChange={(e) => setFormData({ ...formData, can_close_early: e.target.checked })} className="rounded border-border text-accent focus:ring-accent h-4 w-4" />
                  <span>Allow early close</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">Plan Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Target market and commercial tier benefits..."
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-primary">
                  Included Features (One per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
