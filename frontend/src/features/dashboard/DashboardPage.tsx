import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Plus,
  RefreshCw,
  Calendar,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { formatCurrency, addDecimals } from '@/lib/decimal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    subscriptions,
    invoices,
    payments,
    customers,
    settings,
    metrics,
    runBillingEngine,
  } = useSubscription();

  const [revenuePeriod, setRevenuePeriod] = useState<'6m' | '12m'>('6m');
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  // Compute Active Subscriptions
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused');

  // Compute MRR
  const mrrAmount = metrics.mrr;

  // Compute Total Collected Cash
  const totalCollected = useMemo(() => {
    let sum = '0.00';
    payments.forEach((p) => {
      sum = addDecimals(sum, p.amount);
    });
    return sum;
  }, [payments]);

  // Compute Outstanding Invoiced Balance
  const outstandingBalance = useMemo(() => {
    let sum = '0.00';
    invoices.forEach((inv) => {
      if (inv.status !== 'void') {
        sum = addDecimals(sum, inv.balance_due);
      }
    });
    return sum;
  }, [invoices]);

  // Overdue Invoices
  const overdueInvoices = invoices.filter(
    (inv) => inv.status !== 'void' && inv.status !== 'paid' && (inv.is_overdue || inv.due_date < new Date().toISOString().slice(0, 10)),
  );

  // Upcoming Renewals
  const upcomingRenewals = useMemo(() => {
    return activeSubs
      .filter((s) => s.next_billing_date)
      .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
      .slice(0, 4);
  }, [activeSubs]);

  // Chart data for revenue trend
  const revenueChartData = useMemo(() => metrics.revenue_months.slice(revenuePeriod === '6m' ? -6 : -12).map(row => ({
    month: row.month, invoiced: Number(row.invoiced), collected: Number(row.collected),
  })), [metrics, revenuePeriod]);

  // Status breakdown chart data
  const statusPieData = useMemo(() => {
    return [
      { name: 'Active', value: activeSubs.length, color: '#16a34a' },
      { name: 'Paused', value: pausedSubs.length, color: '#d97706' },
      { name: 'Draft', value: subscriptions.filter((s) => s.status === 'draft').length, color: '#64748b' },
      { name: 'Closed', value: subscriptions.filter((s) => s.status === 'closed').length, color: '#94a3b8' },
    ].filter((item) => item.value > 0);
  }, [activeSubs, pausedSubs, subscriptions]);

  const handleQuickBillingRun = async () => {
    setIsBillingRunning(true);
    try {
      await runBillingEngine();
    } catch { /* The shared request banner shows the server error. */ }
    finally { setIsBillingRunning(false); }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Overview</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Subscriptions, cash collected, and upcoming renewals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickBillingRun}
            disabled={isBillingRunning}
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isBillingRunning && 'animate-spin')} />
            {isBillingRunning ? 'Running...' : 'Run Billing'}
          </Button>
          <Button size="sm" onClick={() => navigate('/quotations')}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* KPI Cards: Clean, simple, human-designed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium text-text-secondary">Monthly Recurring (MRR)</p>
          <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
            {formatCurrency(mrrAmount, settings.currency_symbol)}
          </div>
          <p className="text-xs text-success mt-1 flex items-center gap-1 font-medium">
            Normalized from active subscriptions
          </p>
        </div>

        {/* Card 2: Total Collected Cash */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium text-text-secondary">Cash Collected</p>
          <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
            {formatCurrency(totalCollected, settings.currency_symbol)}
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Across {payments.length} transactions
          </p>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium text-text-secondary">Active Subscriptions</p>
          <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
            {activeSubs.length}
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            {pausedSubs.length} paused • {customers.length} customers
          </p>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium text-text-secondary">Outstanding Balance</p>
          <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
            {formatCurrency(outstandingBalance, settings.currency_symbol)}
          </div>
          <p className="text-xs mt-1 font-medium">
            {overdueInvoices.length > 0 ? (
              <span className="text-error">{overdueInvoices.length} overdue invoices</span>
            ) : (
              <span className="text-success">All accounts current</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid: Revenue Chart + Subscriptions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Revenue Trend</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Invoiced revenue vs. cash collected
              </p>
            </div>
            <div className="flex items-center bg-surface-secondary border border-border rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setRevenuePeriod('6m')}
                className={cn('px-2.5 py-1 rounded-md font-medium transition-colors', revenuePeriod === '6m' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary')}
              >
                6 Months
              </button>
              <button
                onClick={() => setRevenuePeriod('12m')}
                className={cn('px-2.5 py-1 rounded-md font-medium transition-colors', revenuePeriod === '12m' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-secondary')}
              >
                12 Months
              </button>
            </div>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [val ? `$${Number(val).toLocaleString()}` : '$0', '']}
                />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-border text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span>Invoiced Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <span>Collected Cash</span>
            </div>
          </div>
        </div>

        {/* Subscription Status Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Subscription Status</h3>
            <p className="text-xs text-text-secondary mt-0.5">Active portfolio breakdown</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-text-primary">{subscriptions.length}</span>
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border text-xs">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-text-secondary">{s.name}</span>
                </div>
                <span className="font-semibold text-text-primary">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Upcoming Renewals + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Upcoming Renewals</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Subscriptions scheduled for billing soon
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/subscriptions')}
              className="text-xs text-accent hover:text-accent-hover"
            >
              View all <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border mt-1">
            {upcomingRenewals.length === 0 ? (
              <p className="text-xs text-text-tertiary py-6 text-center">No upcoming renewals</p>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary leading-tight">
                        {sub.customer_name}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {sub.plan_name} • {sub.number}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-text-primary tabular-nums">
                      {formatCurrency(sub.total_recurring, settings.currency_symbol)}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Due: {sub.next_billing_date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Recent Payments</h3>
              <p className="text-xs text-text-secondary mt-0.5">Latest recorded transactions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/payments')}
              className="text-xs text-accent hover:text-accent-hover"
            >
              View all <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border mt-1">
            {payments.length === 0 ? (
              <p className="text-xs text-text-tertiary py-6 text-center">No transactions recorded</p>
            ) : (
              payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-success-light text-success flex items-center justify-center">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary leading-tight">
                        {pay.customer_name}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5 capitalize">
                        {pay.method.replace('_', ' ')} • Ref: {pay.reference}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-success tabular-nums">
                      +{formatCurrency(pay.amount, settings.currency_symbol)}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {pay.received_date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
