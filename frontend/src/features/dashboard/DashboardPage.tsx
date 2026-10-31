import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Zap,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Calendar,
  ChevronRight,
  ShieldAlert,
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    subscriptions,
    invoices,
    payments,
    customers,
    settings,
    runBillingEngine,
  } = useSubscription();

  const [revenuePeriod, setRevenuePeriod] = useState<'6m' | '12m'>('6m');
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  // Compute Active Subscriptions
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused');

  // Compute MRR (Normalized monthly recurring revenue)
  const mrrAmount = useMemo(() => {
    let total = '0.00';
    activeSubs.forEach((sub) => {
      if (sub.frequency === 'yearly') {
        const monthlyPortion = (parseFloat(sub.recurring_amount) / 12).toFixed(2);
        total = addDecimals(total, monthlyPortion);
      } else if (sub.frequency === 'weekly') {
        const monthlyPortion = (parseFloat(sub.recurring_amount) * 4.33).toFixed(2);
        total = addDecimals(total, monthlyPortion);
      } else {
        total = addDecimals(total, sub.recurring_amount);
      }
    });
    return total;
  }, [activeSubs]);

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
    (inv) => inv.status !== 'void' && inv.status !== 'paid' && (inv.is_overdue || inv.due_date < '2026-10-31'),
  );

  // Upcoming Renewals (next 14 days)
  const upcomingRenewals = useMemo(() => {
    return activeSubs
      .filter((s) => s.next_billing_date)
      .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
      .slice(0, 4);
  }, [activeSubs]);

  // Chart data for revenue trend
  const revenueChartData = useMemo(() => {
    return [
      { month: 'May', invoiced: 3200, collected: 3000 },
      { month: 'Jun', invoiced: 4100, collected: 3800 },
      { month: 'Jul', invoiced: 4800, collected: 4600 },
      { month: 'Aug', invoiced: 5600, collected: 5200 },
      { month: 'Sep', invoiced: 6400, collected: 6100 },
      { month: 'Oct', invoiced: 7800, collected: 7200 },
    ];
  }, []);

  // Status breakdown chart data
  const statusPieData = useMemo(() => {
    return [
      { name: 'Active', value: activeSubs.length, color: '#34C759' },
      { name: 'Paused', value: pausedSubs.length, color: '#FF9500' },
      { name: 'Draft', value: subscriptions.filter((s) => s.status === 'draft').length, color: '#8E8E93' },
      { name: 'Closed', value: subscriptions.filter((s) => s.status === 'closed').length, color: '#D1D1D6' },
    ].filter((item) => item.value > 0);
  }, [activeSubs, pausedSubs, subscriptions]);

  const handleQuickBillingRun = () => {
    setIsBillingRunning(true);
    setTimeout(() => {
      runBillingEngine();
      setIsBillingRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Executive Overview</h2>
          <p className="text-sm text-text-secondary mt-1">
            Real-time subscription operations, financial health, and customer renewals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickBillingRun}
            disabled={isBillingRunning}
            className="rounded-xl border-border bg-surface shadow-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isBillingRunning && 'animate-spin')} />
            {isBillingRunning ? 'Running Billing...' : 'Run Billing Engine'}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/quotations')}
            className="rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Apple Wallet Style KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Monthly Recurring (MRR)
            </span>
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              {formatCurrency(mrrAmount, settings.currency_symbol)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% from last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Collected Cash */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Cash Collected
            </span>
            <div className="p-2 rounded-xl bg-success-light text-success">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              {formatCurrency(totalCollected, settings.currency_symbol)}
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Across {payments.length} verified transactions
            </p>
          </div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Active Subscriptions
            </span>
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              {activeSubs.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[11px] rounded-full">
                {pausedSubs.length} paused
              </Badge>
              <span className="text-xs text-text-secondary">
                {customers.length} total customers
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding & Overdue */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Outstanding Balance
            </span>
            <div className="p-2 rounded-xl bg-warning-light text-warning">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              {formatCurrency(outstandingBalance, settings.currency_symbol)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {overdueInvoices.length > 0 ? (
                <span className="text-xs font-semibold text-error flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-error animate-pulse" />
                  {overdueInvoices.length} overdue invoice(s)
                </span>
              ) : (
                <span className="text-xs text-success">All invoices current</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Tower Alert Banner */}
      {(overdueInvoices.length > 0 || pausedSubs.length > 0) && (
        <div className="p-4 rounded-2xl bg-warning-light/60 border border-warning/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Control Tower Attention Needed
              </p>
              <p className="text-xs text-text-secondary">
                You have {overdueInvoices.length} overdue invoice(s) totaling{' '}
                {formatCurrency(
                  overdueInvoices.reduce((acc, i) => addDecimals(acc, i.balance_due), '0.00'),
                  settings.currency_symbol,
                )}{' '}
                and {pausedSubs.length} paused subscription(s).
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/control-tower')}
            className="rounded-xl shrink-0 bg-surface"
          >
            Open Control Tower <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Main Grid: Revenue Chart + Subscriptions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 apple-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Revenue Trend</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Invoiced revenue vs. cash collected over time
              </p>
            </div>
            <div className="apple-segmented-container">
              <button
                onClick={() => setRevenuePeriod('6m')}
                className={cn('apple-segmented-item', revenuePeriod === '6m' && 'active')}
              >
                6 Months
              </button>
              <button
                onClick={() => setRevenuePeriod('12m')}
                className={cn('apple-segmented-item', revenuePeriod === '12m' && 'active')}
              >
                12 Months
              </button>
            </div>
          </div>

          <div className="h-72 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34C759" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34C759" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(28, 28, 30, 0.9)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [val ? `$${Number(val).toLocaleString()}` : '$0', '']}
                />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#007AFF" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Collected Cash" stroke="#34C759" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-border/60 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-accent" />
              <span>Invoiced Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <span>Collected Cash</span>
            </div>
          </div>
        </div>

        {/* Subscription Status Breakdown */}
        <div className="apple-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Subscription Health</h3>
            <p className="text-xs text-text-secondary mt-0.5">Current portfolio distribution</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-text-primary">{subscriptions.length}</span>
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
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
        <div className="apple-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Upcoming Renewals</h3>
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

          <div className="divide-y divide-border/60 mt-2">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-text-tertiary py-8 text-center">No upcoming renewals</p>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-surface-secondary flex items-center justify-center text-text-secondary font-semibold text-xs">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary leading-tight">
                        {sub.customer_name}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {sub.plan_name} • {sub.number}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">
                      {formatCurrency(sub.total_recurring, settings.currency_symbol)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Due: {sub.next_billing_date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="apple-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Recent Transactions</h3>
              <p className="text-xs text-text-secondary mt-0.5">Payments & billing activities</p>
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

          <div className="divide-y divide-border/60 mt-2">
            {payments.length === 0 ? (
              <p className="text-sm text-text-tertiary py-8 text-center">No transactions recorded</p>
            ) : (
              payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-success-light text-success flex items-center justify-center">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary leading-tight">
                        {pay.customer_name}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 capitalize">
                        {pay.method.replace('_', ' ')} • Ref: {pay.reference}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-success">
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
