import { useState } from 'react';
import {
  Percent,
  Plus,
  Search,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Discount, DiscountType } from '@/types';

export function DiscountsPage() {
  const { discounts, products, createDiscount, updateDiscount, settings } = useSubscription();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage' as DiscountType,
    value: '15',
    min_subtotal: '100.00',
    minimum_quantity: 1,
    scope: 'subscription' as 'subscription' | 'product',
    product_id: '',
    usage_limit: 100,
    start_date: new Date().toISOString().split('T')[0]!,
    end_date: '2026-12-31',
    status: 'active' as const,
  });

  const filteredDiscounts = discounts.filter((d) => {
    return (
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      type: 'percentage',
      value: '15',
      min_subtotal: '100.00',
      minimum_quantity: 1,
      scope: 'subscription',
      product_id: '',
      usage_limit: 100,
      start_date: new Date().toISOString().split('T')[0]!,
      end_date: '2026-12-31',
      status: 'active',
    });
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    await createDiscount({
      code: formData.code.toUpperCase().trim(),
      name: formData.name,
      type: formData.type,
      value: formData.value,
      min_subtotal: formData.min_subtotal,
      minimum_quantity: Math.max(1, Number(formData.minimum_quantity) || 1),
      scope: formData.scope,
      product_id: formData.scope === 'product' ? formData.product_id : undefined,
      usage_limit: Number(formData.usage_limit) || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
    });

    setIsCreateOpen(false);
  };

  const handleToggleStatus = async (discount: Discount) => {
    const nextStatus = discount.status === 'active' ? 'expired' : 'active';
    await updateDiscount(discount.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Discounts & Promotional Credits
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Percentage and fixed discounts for quotes and recurring invoices.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Discount
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or campaign name..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiscounts.map((disc) => {
          const usagePercent = disc.usage_limit
            ? Math.min(100, Math.round((disc.usage_count / disc.usage_limit) * 100))
            : 0;

          return (
            <div key={disc.id} className="apple-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent">
                    <Percent className="h-4 w-4" />
                  </div>
                  <Badge variant={disc.status === 'active' ? 'success' : 'outline'}>
                    {disc.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-text-primary tracking-wide">
                      {disc.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-text-secondary mt-1">{disc.name}</h3>
                </div>

                {/* Value Pill */}
                <div className="mt-4 p-3 rounded-xl bg-surface-secondary/70 border border-border/60 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Benefit:</span>
                  <span className="text-base font-bold text-accent">
                    {disc.type === 'percentage'
                      ? `${disc.value}% Off`
                      : `${formatCurrency(disc.value, settings.currency_symbol)} Off`}
                  </span>
                </div>

                {/* Usage progress */}
                {disc.usage_limit && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Redemption Progress</span>
                      <span>
                        <strong>{disc.usage_count}</strong> / {disc.usage_limit} used
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-text-secondary space-y-1">
                  <p>Min Spend: {formatCurrency(disc.min_subtotal, settings.currency_symbol)}</p>
                  <p>Minimum Quantity: {disc.minimum_quantity ?? 1}</p>
                  <p>Applies to: {disc.scope === 'product' && disc.product_id
                    ? products.find((product) => product.id === disc.product_id)?.name ?? 'Selected product'
                    : 'All eligible items'}</p>
                  <p>Valid: {disc.start_date} to {disc.end_date}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(disc)}
                  className="rounded-xl text-xs h-8"
                >
                  {disc.status === 'active' ? 'Expire Code' : 'Activate Code'}
                </Button>
                <span className="text-[11px] font-mono text-text-tertiary">BR-03: No Stacking</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Discount */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Create Discount Code</h3>
            <p className="text-xs text-text-secondary mt-1">
              Add a verified promotional incentive with spend limits and validity windows.
            </p>

            <form onSubmit={handleSubmitCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Discount Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. FLASH25"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono uppercase text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Q4 Growth Promo"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Minimum Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Applies To</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'subscription' | 'product' })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="subscription">All eligible items</option>
                    <option value="product">Specific product</option>
                  </select>
                </div>
              </div>
              {formData.scope === 'product' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Product</label>
                  <select
                    required
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Currency Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Value</label>
                  <input
                    type="text"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g. 20 or 50.00"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Minimum Subtotal ($)</label>
                  <input
                    type="text"
                    value={formData.min_subtotal}
                    onChange={(e) => setFormData({ ...formData, min_subtotal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Max Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/80">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  Save Discount
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
