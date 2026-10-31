import React, { useEffect, useState } from 'react';
import { Users, Plus, Mail, Phone, MapPin } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Customer modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    api.get<any>('/auth/customers/')
      .then((res) => {
        const results = res.results || res;
        setCustomers(results);
      })
      .catch(() => {
        setCustomers([
          {
            id: '1',
            name: 'Alex Rivera',
            company_name: 'Acme Corporation',
            email: 'alex@acmecorp.com',
            phone: '+91 98765 43210',
            billing_address: '42 Cyber City, Tower B, Sector 24, Gurugram, India',
            tax_id: '07AAAAA0000A1Z5',
            is_active: true,
          },
          {
            id: '2',
            name: 'Vikram Rao',
            company_name: 'Zen Retail Store',
            email: 'vikram@zenretail.com',
            phone: '+91 91234 56789',
            billing_address: '18 MG Road, Bengaluru, Karnataka, India',
            tax_id: '29BBBBB1111B2Z6',
            is_active: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    try {
      await api.post('/auth/customers/', {
        name,
        company_name: company || name,
        email,
        phone,
        billing_address: address,
        tax_id: taxId,
      });
      setAddModalOpen(false);
      fetchCustomers();
    } catch {
      setAddModalOpen(false);
      fetchCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Customer accounts, billing profiles, GST / tax identifiers, and contact records."
        actions={
          <Button onClick={() => setAddModalOpen(true)} className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
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
                    <th className="px-6 py-3 text-left">Company / Name</th>
                    <th className="px-6 py-3 text-left">Contact Info</th>
                    <th className="px-6 py-3 text-left">Billing Address</th>
                    <th className="px-6 py-3 text-left">Tax ID</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-text-primary">
                        <div>{c.company_name || c.name}</div>
                        <div className="text-xs text-text-tertiary">{c.name}</div>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-text-tertiary" /> {c.email}
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary mt-0.5">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary max-w-xs truncate">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                          <span className="truncate">{c.billing_address || 'Not specified'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-text-secondary">
                        {c.tax_id || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge variant={c.is_active ? 'success' : 'outline'}>
                          {c.is_active ? 'Active' : 'Inactive'}
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

      {/* Add Customer Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer Profile</DialogTitle>
            <DialogDescription>
              Create customer record with contact and billing information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Contact Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Company</label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@acmecorp.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Tax / GST Number</label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="07AAAAA0000A1Z5" />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Billing Address</label>
              <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address line, City, State..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer} disabled={!name || !email}>Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

