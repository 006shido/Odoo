import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency, addDecimals } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ReportsPage() {
  const { subscriptions, invoices, payments, settings } = useSubscription();
  const [dateRange, setDateRange] = useState<'30d' | 'quarter' | 'ytd' | 'all'>('ytd');

  // Compute MRR & ARR
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const mrrAmount = useMemo(() => {
    let total = '0.00';
    activeSubs.forEach((sub) => {
      if (sub.frequency === 'yearly') {
        const monthly = (parseFloat(sub.recurring_amount) / 12).toFixed(2);
        total = addDecimals(total, monthly);
      } else if (sub.frequency === 'weekly') {
        const monthly = (parseFloat(sub.recurring_amount) * 4.33).toFixed(2);
        total = addDecimals(total, monthly);
      } else {
        total = addDecimals(total, sub.recurring_amount);
      }
    });
    return total;
  }, [activeSubs]);

  const arrAmount = (parseFloat(mrrAmount) * 12).toFixed(2);

  // Invoiced vs Cash Collected
  const totalInvoiced = useMemo(() => {
    return invoices
      .filter((i) => i.status !== 'void')
      .reduce((acc, i) => addDecimals(acc, i.total), '0.00');
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => addDecimals(acc, p.amount), '0.00');
  }, [payments]);

  // Invoice Ageing Buckets
  const ageingBuckets = useMemo(() => {
    let current = 0;
    let days1_30 = 0;
    let days31_60 = 0;
    let days60plus = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'paid' || inv.status === 'void') return;
      const balance = parseFloat(inv.balance_due) || 0;
      if (balance <= 0) return;

      const dueDate = new Date(inv.due_date);
      const today = new Date('2026-10-31');
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 0) {
        current += balance;
      } else if (diffDays <= 30) {
        days1_30 += balance;
      } else if (diffDays <= 60) {
        days31_60 += balance;
      } else {
        days60plus += balance;
      }
    });

    return [
      { name: 'Current (Not Due)', amount: current, color: '#34C759' },
      { name: '1-30 Days Overdue', amount: days1_30, color: '#FF9500' },
      { name: '31-60 Days Overdue', amount: days31_60, color: '#FF3B30' },
      { name: '60+ Days Overdue', amount: days60plus, color: '#AF52DE' },
    ];
  }, [invoices]);

  // Plan distribution chart data
  const planRevenueData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSubs.forEach((s) => {
      counts[s.plan_name] = (counts[s.plan_name] || 0) + (parseFloat(s.total_recurring) || 0);
    });

    return Object.entries(counts).map(([name, total]) => ({
      name,
      total: Math.round(total),
    }));
  }, [activeSubs]);

  // Export JSON summary
  const handleExportJson = () => {
    const summary = {
      workspace: settings.company_name,
      generated_at: new Date().toISOString(),
      mrr: mrrAmount,
      arr: arrAmount,
      total_invoiced: totalInvoiced,
      total_collected: totalCollected,
      active_subscriptions: activeSubs.length,
      ageing_distribution: ageingBuckets,
      invoices_count: invoices.length,
      payments_count: payments.length,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `brightloop_financial_report_${dateRange}.json`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Financial Reports & Analytics
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Reconcile invoiced balances, cash receipts, subscription retention, and accounts receivable ageing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="rounded-xl bg-surface shadow-xs"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Summary (JSON)
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="apple-segmented-container">
          <button
            onClick={() => setDateRange('30d')}
            className={cn('apple-segmented-item', dateRange === '30d' && 'active')}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('quarter')}
            className={cn('apple-segmented-item', dateRange === 'quarter' && 'active')}
          >
            Current Quarter
          </button>
          <button
            onClick={() => setDateRange('ytd')}
            className={cn('apple-segmented-item', dateRange === 'ytd' && 'active')}
          >
            Year to Date
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={cn('apple-segmented-item', dateRange === 'all' && 'active')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apple-card p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Estimated MRR
          </span>
          <div className="text-3xl font-bold text-text-primary mt-3">
            {formatCurrency(mrrAmount, settings.currency_symbol)}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Normalized recurring subscription run-rate (excl. one-time fees & taxes)
          </p>
        </div>

        <div className="apple-card p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Projected ARR
          </span>
          <div className="text-3xl font-bold text-accent mt-3">
            {formatCurrency(arrAmount, settings.currency_symbol)}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Annualized recurring run-rate (MRR × 12)
          </p>
        </div>

        <div className="apple-card p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Total Invoiced Value
          </span>
          <div className="text-3xl font-bold text-text-primary mt-3">
            {formatCurrency(totalInvoiced, settings.currency_symbol)}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Across {invoices.filter((i) => i.status !== 'void').length} active invoices
          </p>
        </div>

        <div className="apple-card p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Cash Collected
          </span>
          <div className="text-3xl font-bold text-success mt-3">
            {formatCurrency(totalCollected, settings.currency_symbol)}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Verified cash receipts in bank/ledger
          </p>
        </div>
      </div>

      {/* Grid: Invoice Ageing + Plan Revenue Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Ageing Analysis */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Accounts Receivable Ageing
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Outstanding invoice balances grouped by overdue brackets (as of Oct 31, 2026)
            </p>
          </div>

          <div className="space-y-4 my-6">
            {ageingBuckets.map((bucket) => {
              const totalDue = ageingBuckets.reduce((acc, b) => acc + b.amount, 0);
              const pct = totalDue > 0 ? Math.round((bucket.amount / totalDue) * 100) : 0;

              return (
                <div key={bucket.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bucket.color }} />
                      <span className="font-medium text-text-primary">{bucket.name}</span>
                    </div>
                    <span className="font-bold text-text-primary">
                      {formatCurrency(bucket.amount.toFixed(2), settings.currency_symbol)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/60 text-xs text-text-secondary">
            <p>
              Rule: Overdue invoices are highlighted in the Subscription Control Tower for priority follow-up.
            </p>
          </div>
        </div>

        {/* Revenue Distribution by Plan */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Active Recurring Value by Plan
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Contract distribution across offering tiers
            </p>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planRevenueData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="name" type="category" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(28, 28, 30, 0.9)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [val ? `$${Number(val).toLocaleString()}` : '$0', 'Total Recurring']}
                />
                <Bar dataKey="total" fill="#007AFF" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-border/60 text-xs text-text-tertiary text-center">
            Normalized to billing currency ({settings.currency})
          </div>
        </div>
      </div>
    </div>
  );
}
