import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency, addDecimals } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import type { BillingRun } from '@/types';

export function ControlTowerPage() {
  const navigate = useNavigate();
  const {
    subscriptions,
    invoices,
    settings,
    runBillingEngine,
    billingRuns,
    resumeSubscription,
    setSubscriptionAutoRenew,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<'all' | 'renewals' | 'overdue' | 'paused' | 'billing'>('all');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedRunDate, setSelectedRunDate] = useState(new Date().toISOString().split('T')[0]!);
  const [latestBillingResult, setLatestBillingResult] = useState<BillingRun | null>(null);
  const [isRunningEngine, setIsRunningEngine] = useState(false);

  // Overdue Invoices
  const overdueInvoices = invoices.filter(
    (inv) => inv.status !== 'void' && inv.status !== 'paid' && (inv.is_overdue || inv.due_date < new Date().toISOString().slice(0, 10)),
  );

  // Paused Subscriptions
  const pausedSubscriptions = subscriptions.filter((s) => s.status === 'paused');

  // Subscriptions with upcoming renewals (next 14 days)
  const upcomingRenewals = subscriptions.filter(
    (s) => s.status === 'active' && s.next_billing_date && s.next_billing_date <= new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );

  // Total overdue balance
  const totalOverdueBalance = overdueInvoices.reduce((acc, i) => addDecimals(acc, i.balance_due), '0.00');

  const handleExecuteBilling = async () => {
    setIsRunningEngine(true);
    try {
      const result = await runBillingEngine(selectedRunDate);
      setLatestBillingResult(result);
    } catch { /* The shared request banner shows the server error. */ }
    finally { setIsRunningEngine(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-warning-light text-warning">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">
              Subscription Control Tower
            </h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Track renewals due soon, paused subscriptions, overdue invoices, and automated billing runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsBillingModalOpen(true)}
            className="rounded-xl shadow-xs"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Run Billing Engine
          </Button>
        </div>
      </div>

      {/* Operational Cockpit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('overdue')}
          className={cn(
            'apple-card p-5 cursor-pointer transition-all',
            activeTab === 'overdue' && 'ring-2 ring-accent',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Overdue Invoices
            </span>
            <span className="p-2 rounded-xl bg-error-light text-error">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-error">
              {formatCurrency(totalOverdueBalance, settings.currency_symbol)}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {overdueInvoices.length} account(s) past payment terms
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('renewals')}
          className={cn(
            'apple-card p-5 cursor-pointer transition-all',
            activeTab === 'renewals' && 'ring-2 ring-accent',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Renewals Due (14d)
            </span>
            <span className="p-2 rounded-xl bg-accent/10 text-accent">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary">
              {upcomingRenewals.length}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Active subscriptions scheduled soon
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('paused')}
          className={cn(
            'apple-card p-5 cursor-pointer transition-all',
            activeTab === 'paused' && 'ring-2 ring-accent',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Paused Subscriptions
            </span>
            <span className="p-2 rounded-xl bg-warning-light text-warning">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary">
              {pausedSubscriptions.length}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Billing temporarily suppressed
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('billing')}
          className={cn(
            'apple-card p-5 cursor-pointer transition-all',
            activeTab === 'billing' && 'ring-2 ring-accent',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Billing Engine Health
            </span>
            <span className="p-2 rounded-xl bg-success-light text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-success">
              {billingRuns.length > 0 ? 'Operational' : 'Ready'}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {billingRuns.length} recorded run(s)
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="apple-segmented-container">
          <button
            onClick={() => setActiveTab('all')}
            className={cn('apple-segmented-item', activeTab === 'all' && 'active')}
          >
            All Items ({overdueInvoices.length + pausedSubscriptions.length + upcomingRenewals.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={cn('apple-segmented-item', activeTab === 'overdue' && 'active')}
          >
            Overdue Invoices ({overdueInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={cn('apple-segmented-item', activeTab === 'renewals' && 'active')}
          >
            Upcoming Renewals ({upcomingRenewals.length})
          </button>
          <button
            onClick={() => setActiveTab('paused')}
            className={cn('apple-segmented-item', activeTab === 'paused' && 'active')}
          >
            Paused Subscriptions ({pausedSubscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={cn('apple-segmented-item', activeTab === 'billing' && 'active')}
          >
            Billing Runs ({billingRuns.length})
          </button>
        </div>
      </div>

      {/* Main Content Sections based on Tab */}
      <div className="space-y-6">
        {/* Section: Overdue Invoices */}
        {(activeTab === 'all' || activeTab === 'overdue') && (
          <div className="apple-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-error" />
                  Overdue Accounts Queue
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Invoices where payment due date has elapsed and positive balance remains
                </p>
              </div>
              <Badge variant="error">{overdueInvoices.length} Overdue</Badge>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {overdueInvoices.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
                  No overdue invoices. All accounts are up to date!
                </div>
              ) : (
                overdueInvoices.map((inv) => (
                  <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">
                          {inv.customer_name}
                        </span>
                        <StatusBadge status="overdue" />
                        <span className="text-xs text-text-tertiary">#{inv.number}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Due date: <span className="text-error font-medium">{inv.due_date}</span> • Term: Net 30
                      </p>
                      {inv.notes && (
                        <p className="text-[11px] text-text-tertiary italic">"{inv.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-text-tertiary">Balance Due</span>
                        <p className="text-base font-bold text-error">
                          {formatCurrency(inv.balance_due, settings.currency_symbol)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/payments')}
                        className="rounded-xl shadow-xs"
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        Collect Payment
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section: Upcoming Renewals */}
        {(activeTab === 'all' || activeTab === 'renewals') && (
          <div className="apple-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Scheduled Renewals & Invoicing
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Subscriptions due for recurring invoice generation
                </p>
              </div>
              <Badge variant="outline">{upcomingRenewals.length} Due Soon</Badge>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {upcomingRenewals.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  No upcoming renewals in the immediate window.
                </div>
              ) : (
                upcomingRenewals.map((sub) => (
                  <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">
                          {sub.customer_name}
                        </span>
                        <StatusBadge status={sub.status} />
                        <span className="text-xs text-text-tertiary">{sub.number}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Plan: {sub.plan_name} • Frequency: {sub.frequency}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-text-tertiary">Next Billing Date</span>
                        <p className="text-sm font-semibold text-text-primary">
                          {sub.next_billing_date}
                        </p>
                      </div>
                      {!sub.auto_renew && sub.can_renew !== false && <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => await setSubscriptionAutoRenew(sub.id, true)}
                        className="rounded-xl"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Enable auto-renew
                      </Button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section: Paused Subscriptions */}
        {(activeTab === 'all' || activeTab === 'paused') && (
          <div className="apple-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Paused Accounts & Retention
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Subscriptions with temporary hold; recurring invoices are suppressed per BR-06
                </p>
              </div>
              <Badge variant="warning">{pausedSubscriptions.length} Paused</Badge>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {pausedSubscriptions.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  No paused subscriptions.
                </div>
              ) : (
                pausedSubscriptions.map((sub) => (
                  <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">
                          {sub.customer_name}
                        </span>
                        <StatusBadge status="paused" />
                        <span className="text-xs text-text-tertiary">{sub.number}</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Plan: {sub.plan_name} • Paused on: {sub.updated_at.split('T')[0]}
                      </p>
                      {sub.pause_reason && (
                        <p className="text-[11px] text-text-tertiary italic">
                          Reason: {sub.pause_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-text-tertiary">Recurring Value</span>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(sub.total_recurring, settings.currency_symbol)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => await resumeSubscription(sub.id)}
                        className="rounded-xl shadow-xs"
                      >
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Resume Subscription
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section: Billing Runs Audit */}
        {(activeTab === 'all' || activeTab === 'billing') && (
          <div className="apple-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Scheduled Billing Run History
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Automated recurring generation audit logs and idempotency tracking
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBillingModalOpen(true)}
                className="rounded-xl"
              >
                Trigger Billing Run
              </Button>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {billingRuns.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm">
                  No automated runs triggered yet in this session. Click "Trigger Billing Run" to execute one!
                </div>
              ) : (
                billingRuns.map((run) => (
                  <div key={run.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          Billing Run for {run.run_date}
                        </span>
                        <Badge variant={run.status === 'completed' ? 'success' : 'warning'}>
                          {run.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {new Date(run.processed_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>Checked: <strong>{run.subscriptions_checked}</strong></span>
                      <span>Created: <strong>{run.invoices_created}</strong></span>
                      <span>Skipped (Idempotent): <strong>{run.invoices_skipped}</strong></span>
                      <span>Errors: <strong>{run.errors_count}</strong></span>
                    </div>

                    {run.log.length > 0 && (
                      <div className="p-3 rounded-xl bg-surface-secondary text-[11px] font-mono text-text-secondary space-y-1 overflow-x-auto max-h-36">
                        {run.log.map((line, i) => (
                          <p key={i} className="truncate">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Run Recurring Billing Engine */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsBillingModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border z-10 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-text-primary">Execute Recurring Billing Engine</h3>
            <p className="text-xs text-text-secondary mt-1">
              Simulate or execute the daily recurring billing job. Inspects active subscriptions, calculates period boundaries, and produces idempotent invoices without duplicate billing.
            </p>

            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-text-primary block">
                Target Processing Business Date
              </label>
              <input
                type="date"
                value={selectedRunDate}
                onChange={(e) => setSelectedRunDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-[11px] text-text-tertiary">
                Subscriptions with <code>next_billing_date &lt;= {selectedRunDate}</code> will be evaluated.
              </p>
            </div>

            {latestBillingResult && (
              <div className="mt-4 p-4 rounded-xl bg-surface-secondary border border-border/80 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>Run Completed!</span>
                  <Badge variant="success">Success</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Checked</span>
                    <span className="text-sm font-bold">{latestBillingResult.subscriptions_checked}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Created</span>
                    <span className="text-sm font-bold text-success">{latestBillingResult.invoices_created}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface">
                    <span className="text-[10px] text-text-tertiary block">Skipped</span>
                    <span className="text-sm font-bold text-text-secondary">{latestBillingResult.invoices_skipped}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBillingModalOpen(false);
                  setLatestBillingResult(null);
                }}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteBilling}
                disabled={isRunningEngine}
                className="rounded-xl shadow-xs"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isRunningEngine && 'animate-spin')} />
                {isRunningEngine ? 'Processing Subscriptions...' : 'Execute Run'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
