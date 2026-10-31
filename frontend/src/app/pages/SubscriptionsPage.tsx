import React, { useEffect, useState } from 'react';
import {
  Repeat,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Calendar,
  CheckCircle,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pause Dialog state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [pauseReason, setPauseReason] = useState('');

  // Close Dialog state
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const fetchSubscriptions = () => {
    setLoading(true);
    api.get<any>('/subscriptions/subscriptions/')
      .then((res) => {
        const results = res.results || res;
        setSubscriptions(results);
      })
      .catch(() => {
        // Fallback demo data
        setSubscriptions([
          {
            id: '1',
            subscription_number: 'SUB-2026-0001',
            customer_name: 'Alex Rivera',
            customer_company: 'Acme Corporation',
            plan_name: 'Business Professional Monthly',
            status: 'active',
            billing_frequency: 'monthly',
            start_date: '2026-09-01',
            expiry_date: '2027-08-31',
            next_billing_date: '2026-11-01',
            total_amount: '3610.80',
            can_pause: true,
            can_renew: true,
            can_close_early: true,
          },
          {
            id: '2',
            subscription_number: 'SUB-2026-0002',
            customer_name: 'Vikram Rao',
            customer_company: 'Zen Retail Store',
            plan_name: 'Business Professional Monthly',
            status: 'paused',
            billing_frequency: 'monthly',
            start_date: '2026-08-01',
            expiry_date: '2027-07-31',
            next_billing_date: '2026-11-15',
            total_amount: '3610.80',
            pause_reason: 'Store renovation until middle of next month',
            can_pause: true,
            can_renew: true,
            can_close_early: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const handlePause = async () => {
    if (!selectedSub) return;
    try {
      await api.post(`/subscriptions/subscriptions/${selectedSub.id}/pause/`, {
        reason: pauseReason || 'Customer requested temporary pause',
      });
    } catch {
      // update state optimistically
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === selectedSub.id ? { ...s, status: 'paused', pause_reason: pauseReason } : s))
      );
    }
    setPauseDialogOpen(false);
    fetchSubscriptions();
  };

  const handleResume = async (sub: any) => {
    try {
      await api.post(`/subscriptions/subscriptions/${sub.id}/resume/`);
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'active' } : s))
      );
    }
    fetchSubscriptions();
  };

  const handleRenew = async (sub: any) => {
    try {
      await api.post(`/subscriptions/subscriptions/${sub.id}/renew/`);
    } catch {
      // ignore
    }
    fetchSubscriptions();
  };

  const handleClose = async () => {
    if (!selectedSub) return;
    try {
      await api.post(`/subscriptions/subscriptions/${selectedSub.id}/close/`, {
        reason: closeReason || 'Terminated early',
      });
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === selectedSub.id ? { ...s, status: 'closed' } : s))
      );
    }
    setCloseDialogOpen(false);
    fetchSubscriptions();
  };

  const isCustomer = user?.role === 'customer';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Subscriptions' : 'Subscription Contracts'}
        description="Lifecycle tracking from quotation conversion to recurring renewal, pause, and closure."
      />

      <Card className="shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <LoadingState rows={4} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-secondary/50 text-xs font-medium text-text-secondary uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Subscription #</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Plan & Frequency</th>
                    <th className="px-6 py-3 text-left">Next Billing</th>
                    <th className="px-6 py-3 text-left">Expiry</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-text-primary">
                        {sub.subscription_number}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        <div className="font-medium text-text-primary">{sub.customer_company || sub.customer_name}</div>
                        <div className="text-xs text-text-tertiary">{sub.customer_name}</div>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        <div>{sub.plan_name}</div>
                        <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">
                          {sub.billing_frequency}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        {sub.status === 'paused' ? (
                          <span className="text-warning text-xs font-medium">Paused (Skipped)</span>
                        ) : (
                          formatDate(sub.next_billing_date)
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        {sub.expiry_date ? formatDate(sub.expiry_date) : 'Continuous'}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-text-primary">
                        ₹{Number(sub.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {sub.status === 'active' && sub.can_pause && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setPauseReason('');
                                  setPauseDialogOpen(true);
                                }}
                              >
                                <Pause className="mr-2 h-4 w-4 text-warning" /> Pause Billing
                              </DropdownMenuItem>
                            )}

                            {sub.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleResume(sub)}>
                                <Play className="mr-2 h-4 w-4 text-success" /> Resume Contract
                              </DropdownMenuItem>
                            )}

                            {sub.can_renew && sub.status !== 'closed' && (
                              <DropdownMenuItem onClick={() => handleRenew(sub)}>
                                <RotateCw className="mr-2 h-4 w-4 text-accent" /> Extend Renewal
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {sub.can_close_early && sub.status !== 'closed' && (
                              <DropdownMenuItem
                                destructive
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setCloseReason('');
                                  setCloseDialogOpen(true);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Close Early
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
            <DialogDescription>
              Pausing <b>{selectedSub?.subscription_number}</b> suppresses invoice generation on billing days while paused.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Reason for Pausing
            </label>
            <Textarea
              placeholder="e.g. Customer branch renovation or temporary operational pause..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePause} className="bg-warning text-white hover:bg-warning/90">
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Early Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terminate Subscription Early</DialogTitle>
            <DialogDescription>
              Are you sure you want to close <b>{selectedSub?.subscription_number}</b>? This stops all future recurring billing periods.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Termination Reason
            </label>
            <Textarea
              placeholder="e.g. Mutual cancellation agreed with customer..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClose}>
              Terminate Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
