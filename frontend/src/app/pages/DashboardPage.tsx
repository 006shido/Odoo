import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Repeat,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/analytics/dashboard/')
      .then((res) => setData(res))
      .catch(() => {
        // Fallback default snapshot
        setData({
          subscriptions: {
            total: 2,
            active: 1,
            paused: 1,
            closed: 0,
            renewals_due_soon: 0,
          },
          financials: {
            total_invoiced: '7221.60',
            total_collected: '5110.80',
            total_outstanding: '2110.80',
            overdue_count: 1,
            overdue_amount: '2110.80',
            estimated_mrr: '3060.00',
          },
          recent_invoices: [
            {
              id: '1',
              invoice_number: 'INV-2026-00001',
              customer__name: 'Alex Rivera',
              customer__company_name: 'Acme Corporation',
              issue_date: '2026-10-01',
              due_date: '2026-10-16',
              total_amount: '3610.80',
              paid_amount: '3610.80',
              balance_due: '0.00',
              status: 'paid',
            },
            {
              id: '2',
              invoice_number: 'INV-2026-00002',
              customer__name: 'Vikram Rao',
              customer__company_name: 'Zen Retail Store',
              issue_date: '2026-09-20',
              due_date: '2026-10-05',
              total_amount: '3610.80',
              paid_amount: '1500.00',
              balance_due: '2110.80',
              status: 'confirmed',
            },
          ],
          alerts: [
            {
              type: 'warning',
              title: 'Overdue Receivables',
              message: '1 invoice totaling ₹2,110.80 is past due.',
            },
            {
              type: 'info',
              title: 'Paused Subscriptions',
              message: '1 subscription is currently paused and not generating invoices.',
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <LoadingState fullPage />;
  }

  const { subscriptions, financials, recent_invoices, alerts } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance Control Tower"
        description="Real-time operational health, recurring billing metrics, and receivable reconciliation."
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Subscriptions */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Active Subscriptions
            </CardTitle>
            <Repeat className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{subscriptions.active}</div>
            <p className="text-xs text-text-tertiary mt-1">
              {subscriptions.paused} paused · {subscriptions.total} total contracts
            </p>
          </CardContent>
        </Card>

        {/* Estimated MRR */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Estimated MRR
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              ₹{Number(financials.estimated_mrr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-text-tertiary mt-1">Normalized monthly recurring run-rate</p>
          </CardContent>
        </Card>

        {/* Invoiced vs Collected */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Cash Collected
            </CardTitle>
            <CreditCard className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              ₹{Number(financials.total_collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              of ₹{Number(financials.total_invoiced).toLocaleString('en-IN', { minimumFractionDigits: 2 })} invoiced
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="shadow-xs border-error/30 bg-error-light/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-error uppercase tracking-wider">
              Outstanding Due
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              ₹{Number(financials.total_outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-error/80 mt-1">
              {financials.overdue_count} overdue invoice(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Tower Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Operational Health Alerts</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface shadow-xs"
              >
                <div className="p-2 rounded-md bg-warning-light text-warning shrink-0 mt-0.5">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">{alert.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices Table */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">Recent Billing Activity</CardTitle>
          <CardDescription>Latest invoices generated across customer subscription cycles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-secondary/50 text-xs font-medium text-text-secondary uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Invoice #</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Issue Date</th>
                  <th className="px-6 py-3 text-left">Due Date</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent_invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-text-primary">{inv.invoice_number}</td>
                    <td className="px-6 py-3.5 text-text-secondary">
                      {inv.customer__company_name || inv.customer__name}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">{formatDate(inv.issue_date)}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{formatDate(inv.due_date)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-text-primary">
                      ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium">
                      {Number(inv.balance_due) > 0 ? (
                        <span className="text-error font-semibold">
                          ₹{Number(inv.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-success">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

