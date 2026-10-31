import React, { useEffect, useState } from 'react';
import { Layers, Plus, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Plan modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [price, setPrice] = useState('999.00');
  const [minQty, setMinQty] = useState('1');
  const [canPause, setCanPause] = useState(true);
  const [canCloseEarly, setCanCloseEarly] = useState(true);
  const [canRenew, setCanRenew] = useState(true);
  const [autoClose, setAutoClose] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    api.get<any>('/plans/plans/')
      .then((res) => {
        const results = res.results || res;
        setPlans(results);
      })
      .catch(() => {
        setPlans([
          {
            id: '1',
            name: 'Business Professional Monthly',
            code: 'PLAN-MONTHLY-BIZ',
            billing_frequency: 'monthly',
            price: '999.00',
            minimum_quantity: 1,
            auto_close_on_expiry: false,
            can_close_early: true,
            can_pause: true,
            can_renew: true,
          },
          {
            id: '2',
            name: 'Enterprise Yearly Contract',
            code: 'PLAN-YEARLY-ENT',
            billing_frequency: 'yearly',
            price: '9999.00',
            minimum_quantity: 5,
            auto_close_on_expiry: true,
            can_close_early: true,
            can_pause: false,
            can_renew: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      await api.post('/plans/plans/', {
        name,
        code: code || `PLAN-${Date.now().toString().slice(-4)}`,
        billing_frequency: frequency,
        price,
        minimum_quantity: Number(minQty) || 1,
        can_pause: canPause,
        can_close_early: canCloseEarly,
        can_renew: canRenew,
        auto_close_on_expiry: autoClose,
      });
      setCreateModalOpen(false);
      fetchPlans();
    } catch {
      setCreateModalOpen(false);
      fetchPlans();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Configure pricing, billing intervals (daily, weekly, monthly, yearly), and lifecycle rules plan by plan."
        actions={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </Button>
        }
      />

      {loading ? (
        <LoadingState rows={3} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className="shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs uppercase font-medium">
                    {p.billing_frequency}
                  </Badge>
                  <span className="text-xs text-text-tertiary">{p.code}</span>
                </div>
                <CardTitle className="text-lg mt-2 text-text-primary">{p.name}</CardTitle>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-text-tertiary"> / {p.billing_frequency}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-3 border-t border-border">
                <p className="text-xs text-text-secondary">
                  Minimum quantity requirement: <b>{p.minimum_quantity} seat(s)</b>
                </p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Can be paused:</span>
                    {p.can_pause ? (
                      <span className="text-success flex items-center gap-1 font-medium"><Check className="h-3.5 w-3.5" /> Yes</span>
                    ) : (
                      <span className="text-text-tertiary flex items-center gap-1"><X className="h-3.5 w-3.5" /> No</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Can be terminated early:</span>
                    {p.can_close_early ? (
                      <span className="text-success flex items-center gap-1 font-medium"><Check className="h-3.5 w-3.5" /> Yes</span>
                    ) : (
                      <span className="text-text-tertiary flex items-center gap-1"><X className="h-3.5 w-3.5" /> No</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Renewal allowed:</span>
                    {p.can_renew ? (
                      <span className="text-success flex items-center gap-1 font-medium"><Check className="h-3.5 w-3.5" /> Yes</span>
                    ) : (
                      <span className="text-text-tertiary flex items-center gap-1"><X className="h-3.5 w-3.5" /> No</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Auto-close on period end:</span>
                    {p.auto_close_on_expiry ? (
                      <span className="text-warning flex items-center gap-1 font-medium">Auto-close</span>
                    ) : (
                      <span className="text-text-secondary">Continuous</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Set pricing rate, billing frequency, and operational lifecycle rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Plan Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starter Plan" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Billing Frequency</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Price (₹)</label>
                <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <label className="font-semibold text-text-primary block">Plan Rules (Admin decided):</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canPause} onChange={(e) => setCanPause(e.target.checked)} />
                <span>Allow pausing and resuming subscription</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canCloseEarly} onChange={(e) => setCanCloseEarly(e.target.checked)} />
                <span>Allow closing early before scheduled expiry</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canRenew} onChange={(e) => setCanRenew(e.target.checked)} />
                <span>Allow contract renewal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} />
                <span>Auto-close on expiration</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} disabled={!name}>Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

