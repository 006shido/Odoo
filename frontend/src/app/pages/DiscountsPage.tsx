import React, { useEffect, useState } from 'react';
import { Tag, Plus, CheckCircle, Percent, Coins } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/loading-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Discount modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('10.00');
  const [scope, setScope] = useState('subscription');
  const [minSpend, setMinSpend] = useState('2000.00');
  const [usageLimit, setUsageLimit] = useState('50');

  const fetchDiscounts = () => {
    setLoading(true);
    api.get<any>('/discounts/discounts/')
      .then((res) => {
        const results = res.results || res;
        setDiscounts(results);
      })
      .catch(() => {
        setDiscounts([
          {
            id: '1',
            name: 'Volume Seat Discount 10%',
            code: 'VOLUME10',
            discount_type: 'percentage',
            value: '10.00',
            scope: 'subscription',
            minimum_purchase_amount: '2000.00',
            minimum_quantity: 1,
            usage_limit: 50,
            times_used: 1,
            is_active: true,
          },
          {
            id: '2',
            name: 'Special Promo Flat ₹500',
            code: 'PROMO500',
            discount_type: 'fixed',
            value: '500.00',
            scope: 'subscription',
            minimum_purchase_amount: '3000.00',
            minimum_quantity: 1,
            usage_limit: 100,
            times_used: 0,
            is_active: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async () => {
    try {
      await api.post('/discounts/discounts/', {
        name,
        code: code.toUpperCase() || `DISC-${Date.now().toString().slice(-4)}`,
        discount_type: type,
        value,
        scope,
        minimum_purchase_amount: minSpend,
        usage_limit: Number(usageLimit) || 100,
      });
      setCreateModalOpen(false);
      fetchDiscounts();
    } catch {
      setCreateModalOpen(false);
      fetchDiscounts();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discount Rules"
        description="Admin-controlled pricing incentives automatically applied to eligible quotations and recurring invoices."
        actions={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Create Discount</span>
          </Button>
        }
      />

      <Card className="shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <LoadingState rows={3} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-secondary/50 text-xs font-medium text-text-secondary uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Rule Name</th>
                    <th className="px-6 py-3 text-left">Code</th>
                    <th className="px-6 py-3 text-left">Discount Value</th>
                    <th className="px-6 py-3 text-left">Scope</th>
                    <th className="px-6 py-3 text-left">Min Purchase</th>
                    <th className="px-6 py-3 text-center">Usage Tracking</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-text-primary">{d.name}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold">
                          {d.code}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-accent">
                        {d.discount_type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary capitalize">
                        {d.scope === 'subscription' ? 'Whole Subscription' : 'Specific Product'}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        ₹{Number(d.minimum_purchase_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="text-xs font-medium text-text-primary">
                          {d.times_used} / {d.usage_limit} used
                        </span>
                        <div className="w-24 bg-surface-secondary h-1.5 rounded-full mx-auto mt-1 overflow-hidden border border-border">
                          <div
                            className="bg-accent h-full"
                            style={{ width: `${Math.min(100, (d.times_used / d.usage_limit) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge variant={d.is_active ? 'success' : 'outline'}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Discount Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Discount Rule</DialogTitle>
            <DialogDescription>
              Configure percentage or fixed discount with automatic eligibility criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Discount Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Volume Discount" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Coupon Code</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VOLUME10" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Type</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Value ({type === 'percentage' ? '%' : '₹'})
                </label>
                <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Min Spend (₹)</label>
                <Input type="number" step="0.01" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Usage Limit</label>
              <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="100" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDiscount} disabled={!name}>Save Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

