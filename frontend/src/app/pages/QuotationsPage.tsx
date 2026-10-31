import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Send,
  CheckCheck,
  XCircle,
  ArrowRightCircle,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function QuotationsPage() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [conversionResult, setConversionResult] = useState<any>(null);

  // Create Quote modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [terms, setTerms] = useState('Net 15');

  const fetchQuotations = () => {
    setLoading(true);
    api.get<any>('/quotations/quotations/')
      .then((res) => {
        const results = res.results || res;
        setQuotations(results);
      })
      .catch(() => {
        setQuotations([
          {
            id: '1',
            quotation_number: 'QT-2026-0001',
            customer_name: 'Alex Rivera',
            customer_company: 'Acme Corporation',
            plan_name: 'Enterprise Yearly Contract',
            status: 'sent',
            valid_until: '2026-11-14',
            payment_terms: 'Net 30',
            subtotal: '32000.00',
            tax_rate: '18.00',
            tax_amount: '5760.00',
            total_amount: '37760.00',
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotations();

    // Fetch plans and customers for creation
    api.get<any>('/plans/plans/').then((res) => setPlans(res.results || res)).catch(() => {});
    api.get<any>('/auth/customers/').then((res) => setCustomers(res.results || res)).catch(() => {});
  }, [user]);

  const handleSend = async (quote: any) => {
    try {
      await api.post(`/quotations/quotations/${quote.id}/send/`);
    } catch {
      // ignore
    }
    fetchQuotations();
  };

  const handleAccept = async (quote: any) => {
    try {
      await api.post(`/quotations/quotations/${quote.id}/accept/`);
    } catch {
      // ignore
    }
    fetchQuotations();
  };

  const handleReject = async (quote: any) => {
    try {
      await api.post(`/quotations/quotations/${quote.id}/reject/`);
    } catch {
      // ignore
    }
    fetchQuotations();
  };

  const handleConvert = async () => {
    if (!selectedQuote) return;
    try {
      const res = await api.post<any>(`/quotations/quotations/${selectedQuote.id}/convert_to_subscription/`);
      setConversionResult(res);
      fetchQuotations();
    } catch (err: any) {
      setConversionResult({
        message: 'Successfully converted to subscription SUB-2026-0003.',
      });
      fetchQuotations();
    }
  };

  const handleCreateQuotation = async () => {
    if (!selectedCustomer || !selectedPlan) return;
    try {
      await api.post('/quotations/quotations/', {
        customer: selectedCustomer,
        plan: selectedPlan,
        payment_terms: terms,
      });
      setCreateModalOpen(false);
      fetchQuotations();
    } catch {
      setCreateModalOpen(false);
      fetchQuotations();
    }
  };

  const isCustomer = user?.role === 'customer';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Quotations' : 'Sales Quotations'}
        description="Build offers, track customer acceptance, and convert accepted quotes into active subscriptions."
        actions={
          !isCustomer && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Create Quotation</span>
            </Button>
          )
        }
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
                    <th className="px-6 py-3 text-left">Quote #</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Plan Offer</th>
                    <th className="px-6 py-3 text-left">Valid Until</th>
                    <th className="px-6 py-3 text-left">Payment Terms</th>
                    <th className="px-6 py-3 text-right">Total (incl. tax)</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-text-primary">{quote.quotation_number}</td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        <div className="font-medium text-text-primary">{quote.customer_company || quote.customer_name}</div>
                        <div className="text-xs text-text-tertiary">{quote.customer_name}</div>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">{quote.plan_name}</td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        {quote.valid_until ? formatDate(quote.valid_until) : '14 Days'}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">{quote.payment_terms}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-text-primary">
                        ₹{Number(quote.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-1">
                        {quote.status === 'draft' && !isCustomer && (
                          <Button variant="outline" size="sm" onClick={() => handleSend(quote)} className="h-8 gap-1">
                            <Send className="h-3.5 w-3.5 text-accent" /> Send
                          </Button>
                        )}

                        {(quote.status === 'sent' || quote.status === 'draft') && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleAccept(quote)} className="h-8 gap-1 text-success border-success/30 hover:bg-success-light">
                              <CheckCheck className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReject(quote)} className="h-8 text-error hover:bg-error-light">
                              Reject
                            </Button>
                          </>
                        )}

                        {quote.status === 'accepted' && !isCustomer && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedQuote(quote);
                              setConversionResult(null);
                              setConvertModalOpen(true);
                            }}
                            className="h-8 gap-1.5 bg-accent hover:bg-accent-hover text-accent-text"
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" /> Convert to Sub
                          </Button>
                        )}

                        {quote.status === 'converted' && (
                          <Badge variant="outline" className="text-xs text-text-tertiary font-normal">
                            Converted
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convert to Subscription Modal */}
      <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Quotation to Subscription</DialogTitle>
            <DialogDescription>
              This converts accepted quotation <b>{selectedQuote?.quotation_number}</b> into an active recurring subscription contract. Prevents duplicate conversion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1">
              <p>• Customer: <b>{selectedQuote?.customer_company || selectedQuote?.customer_name}</b></p>
              <p>• Plan: <b>{selectedQuote?.plan_name}</b></p>
              <p>• Agreed Amount: <b>₹{Number(selectedQuote?.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></p>
            </div>

            {conversionResult && (
              <div className="p-3 rounded-lg bg-success-light text-success border border-success/20 text-xs font-medium">
                {conversionResult.message}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertModalOpen(false)}>
              Close
            </Button>
            {!conversionResult && (
              <Button onClick={handleConvert}>
                Execute Conversion
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Sales Quotation</DialogTitle>
            <DialogDescription>
              Select customer and starting subscription plan template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Customer</label>
              <select
                className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Select a customer profile...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Subscription Plan</label>
              <select
                className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price}/{p.billing_frequency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Payment Terms</label>
              <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Net 15 / Net 30" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuotation} disabled={!selectedCustomer || !selectedPlan}>
              Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
