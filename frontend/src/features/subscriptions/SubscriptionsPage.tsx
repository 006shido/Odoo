import { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  Play,
  Pause,
  RotateCcw,
  History,
  X,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { Subscription, SubscriptionStatus } from '@/types';

export function SubscriptionsPage() {
  const {
    subscriptions,
    settings,
    pauseSubscription,
    resumeSubscription,
    renewSubscription,
    closeSubscription,
  } = useSubscription();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch =
        s.number.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        s.plan_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const handleConfirmPause = () => {
    if (!selectedSub) return;
    pauseSubscription(selectedSub.id, pauseReason || 'Requested temporary pause');
    setIsPauseModalOpen(false);
    setPauseReason('');
    setSelectedSub(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Subscription Contracts
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Active recurring agreements, lifecycle transitions, and scheduled billing dates.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions by contract #, client, or plan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="apple-segmented-container">
          {(['all', 'active', 'paused', 'draft', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn('apple-segmented-item capitalize', statusFilter === st && 'active')}
            >
              {st} ({st === 'all' ? subscriptions.length : subscriptions.filter((s) => s.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/70 border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-6 py-3.5">Contract #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Plan & Frequency</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Next Billing</th>
                <th className="px-6 py-3.5">Recurring Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    <Zap className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                    No subscription contracts found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedSub(sub)}
                    className="hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {sub.number}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-primary">{sub.customer_name}</p>
                      <p className="text-xs text-text-secondary">{sub.customer_email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-text-primary">{sub.plan_name}</p>
                      <span className="text-xs text-text-secondary capitalize">
                        {sub.frequency} cycle
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-text-secondary">
                      {sub.next_billing_date || '—'}
                    </td>

                    <td className="px-6 py-4 font-bold text-text-primary">
                      {formatCurrency(sub.total_recurring, settings.currency_symbol)}
                    </td>

                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {sub.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSub(sub);
                              setIsPauseModalOpen(true);
                            }}
                            className="h-8 text-xs rounded-xl"
                            title="Pause Subscription"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        )}

                        {sub.status === 'paused' && (
                          <Button
                            size="sm"
                            onClick={() => resumeSubscription(sub.id)}
                            className="h-8 text-xs rounded-xl shadow-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSub(sub)}
                          className="h-8 text-xs rounded-xl"
                        >
                          Details
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

      {/* Subscription Detail Modal */}
      {selectedSub && !isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedSub(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-border/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-text-primary">{selectedSub.number}</h3>
                  <StatusBadge status={selectedSub.status} />
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Client: {selectedSub.customer_name} • Start date: {selectedSub.start_date}
                </p>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Terms Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Billing Interval</span>
                <span className="text-sm font-bold text-text-primary capitalize">{selectedSub.frequency}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Next Billing</span>
                <span className="text-sm font-bold text-accent">{selectedSub.next_billing_date}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60">
                <span className="text-[11px] font-medium text-text-tertiary block">Recurring Value</span>
                <span className="text-sm font-bold text-text-primary">
                  {formatCurrency(selectedSub.total_recurring, settings.currency_symbol)}
                </span>
              </div>
            </div>

            {/* Items Snapshot Table */}
            <div className="border border-border/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/70 border-b border-border/80 font-semibold text-text-secondary">
                  <tr>
                    <th className="p-3">Contract Line Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedSub.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-3 font-medium text-text-primary">{i.product_name}</td>
                      <td className="p-3 text-center text-text-secondary">{i.quantity}</td>
                      <td className="p-3 text-right text-text-secondary">
                        {formatCurrency(i.unit_price, settings.currency_symbol)}
                      </td>
                      <td className="p-3 text-right font-semibold text-text-primary">
                        {formatCurrency(i.amount, settings.currency_symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Event Audit Trail */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Lifecycle Audit Trail ({selectedSub.events.length})
              </h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedSub.events.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-surface-secondary/40 border border-border/60 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-text-primary uppercase tracking-wider">
                        {ev.event_type}
                      </span>
                      <span className="text-text-tertiary">
                        {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-text-secondary mt-1">{ev.notes}</p>
                    <span className="text-[10px] text-text-tertiary mt-0.5 block">Actor: {ev.actor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Operations Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <div className="flex items-center gap-2">
                {selectedSub.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPauseModalOpen(true)}
                      className="rounded-xl"
                    >
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Pause Billing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        renewSubscription(selectedSub.id);
                        setSelectedSub(null);
                      }}
                      className="rounded-xl"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Advance Cycle
                    </Button>
                  </>
                )}

                {selectedSub.status === 'paused' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      resumeSubscription(selectedSub.id);
                      setSelectedSub(null);
                    }}
                    className="rounded-xl shadow-xs"
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Resume Subscription
                  </Button>
                )}

                {selectedSub.status !== 'closed' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      closeSubscription(selectedSub.id);
                      setSelectedSub(null);
                    }}
                    className="rounded-xl"
                  >
                    Close Early
                  </Button>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => setSelectedSub(null)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pause Subscription Reason */}
      {isPauseModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPauseModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Pause Subscription</h3>
            <p className="text-xs text-text-secondary">
              Pausing suppresses automated recurring invoices until resumed. Upon resumption, a new full period starts from the resume date (BR-06).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Reason for Pause</label>
              <textarea
                rows={3}
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Customer requested temporary seasonal hold..."
                className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button variant="outline" size="sm" onClick={() => setIsPauseModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleConfirmPause} className="rounded-xl">
                Confirm Pause
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
