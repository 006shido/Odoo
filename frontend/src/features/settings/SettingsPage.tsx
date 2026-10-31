import { useState } from 'react';
import {
  Building,
  DollarSign,
  Hash,
  RotateCcw,
  CheckCircle2,
  Users,
  Save,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkspaceSettings } from '@/types';

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    allUsers,
    currentUser,
    switchRole,
    resetToDefaults,
  } = useSubscription();

  const [activeSection, setActiveSection] = useState<'general' | 'financial' | 'numbering' | 'team' | 'data'>('general');

  // Form State
  const [formSettings, setFormSettings] = useState<WorkspaceSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isStaffReadOnly = currentUser.role === 'staff';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Workspace Settings
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Configure commercial identity, currency standards, numbering schemes, and staff access permissions.
          </p>
        </div>

        {isStaffReadOnly && (
          <Badge variant="warning" className="text-xs">
            Staff Mode: Read-Only Workspace Parameters
          </Badge>
        )}
      </div>

      {/* Apple Settings Grouped Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {[
            { id: 'general', label: 'Company Profile', icon: Building },
            { id: 'financial', label: 'Currency & Tax', icon: DollarSign },
            { id: 'numbering', label: 'Document Numbering', icon: Hash },
            { id: 'team', label: 'Team & RBAC', icon: Users },
            { id: 'data', label: 'Data Management', icon: RotateCcw },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-colors',
                  isActive
                    ? 'bg-accent text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-text-tertiary')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="apple-card p-6 space-y-6">
            {/* Section 1: General */}
            {activeSection === 'general' && (
              <div className="space-y-4">
                <div className="border-b border-border/80 pb-3">
                  <h3 className="text-base font-bold text-text-primary">Commercial Organization</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your business identity printed on commercial quotations and tax invoices.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Display Name</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.company_name}
                      onChange={(e) => setFormSettings({ ...formSettings, company_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Legal Entity Name</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.legal_name}
                      onChange={(e) => setFormSettings({ ...formSettings, legal_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Billing Support Email</label>
                    <input
                      type="email"
                      disabled={isStaffReadOnly}
                      value={formSettings.contact_email}
                      onChange={(e) => setFormSettings({ ...formSettings, contact_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Phone Number</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.phone}
                      onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Street Address</label>
                  <input
                    type="text"
                    disabled={isStaffReadOnly}
                    value={formSettings.address?.street}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        address: { ...formSettings.address, street: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">City</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.address?.city}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          address: { ...formSettings.address, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">State</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.address?.state}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          address: { ...formSettings.address, state: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Tax / EIN ID</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.tax_id}
                      onChange={(e) => setFormSettings({ ...formSettings, tax_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Financial */}
            {activeSection === 'financial' && (
              <div className="space-y-4">
                <div className="border-b border-border/80 pb-3">
                  <h3 className="text-base font-bold text-text-primary">Currency & Tax Rates</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Default financial parameters across subscriptions and invoices (BR-09: One currency per workspace).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Base Currency</label>
                    <select
                      disabled={isStaffReadOnly}
                      value={formSettings.currency}
                      onChange={(e) => {
                        const cur = e.target.value;
                        const symbol = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'INR' ? '₹' : '$';
                        setFormSettings({ ...formSettings, currency: cur, currency_symbol: symbol });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Currency Symbol</label>
                    <input
                      type="text"
                      disabled
                      value={formSettings.currency_symbol}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface-secondary opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Default Tax Rate (%)</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.default_tax_rate}
                      onChange={(e) => setFormSettings({ ...formSettings, default_tax_rate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Default Payment Terms</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.default_payment_terms}
                      onChange={(e) => setFormSettings({ ...formSettings, default_payment_terms: e.target.value })}
                      placeholder="Net 30"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Billing Engine Timezone</label>
                  <input
                    type="text"
                    disabled={isStaffReadOnly}
                    value={formSettings.billing_timezone}
                    onChange={(e) => setFormSettings({ ...formSettings, billing_timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-[11px] text-text-tertiary">
                    All recurring invoice generation timestamps are anchored to this reference timezone.
                  </p>
                </div>
              </div>
            )}

            {/* Section 3: Numbering */}
            {activeSection === 'numbering' && (
              <div className="space-y-4">
                <div className="border-b border-border/80 pb-3">
                  <h3 className="text-base font-bold text-text-primary">Document Prefix Sequences</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Formatting patterns applied to generated commercial documents.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Quotation Number Prefix</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.quotation_prefix}
                      onChange={(e) => setFormSettings({ ...formSettings, quotation_prefix: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[10px] text-text-tertiary">Example: {formSettings.quotation_prefix}2026-001</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Invoice Number Prefix</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.invoice_prefix}
                      onChange={(e) => setFormSettings({ ...formSettings, invoice_prefix: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[10px] text-text-tertiary">Example: {formSettings.invoice_prefix}2026-001</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Subscription Contract Prefix</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.subscription_prefix}
                      onChange={(e) => setFormSettings({ ...formSettings, subscription_prefix: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[10px] text-text-tertiary">Example: {formSettings.subscription_prefix}2026-001</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-primary">Payment Receipt Prefix</label>
                    <input
                      type="text"
                      disabled={isStaffReadOnly}
                      value={formSettings.payment_prefix}
                      onChange={(e) => setFormSettings({ ...formSettings, payment_prefix: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm font-mono text-text-primary bg-surface disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-[10px] text-text-tertiary">Example: {formSettings.payment_prefix}2026-001</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Team & RBAC */}
            {activeSection === 'team' && (
              <div className="space-y-4">
                <div className="border-b border-border/80 pb-3">
                  <h3 className="text-base font-bold text-text-primary">Team Accounts & RBAC</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Authorized operators with defined organizational roles (Admin, Staff, Customer).
                  </p>
                </div>

                <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden">
                  {allUsers.map((u) => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center">
                          {u.first_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{u.first_name} {u.last_name}</p>
                          <p className="text-text-secondary">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : u.role === 'staff' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => switchRole(u.role)}
                          className="text-xs text-accent hover:text-accent-hover"
                        >
                          Switch User
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-border/60 text-xs text-text-secondary space-y-1">
                  <p><strong>Admin:</strong> Full system access, workspace configuration, billing runs, and user governance.</p>
                  <p><strong>Staff:</strong> Operational records (quotes, subscriptions, invoices, payments). Cannot edit numbering or currency.</p>
                  <p><strong>Customer:</strong> Scoped strictly to their own commercial records in self-service portal.</p>
                </div>
              </div>
            )}

            {/* Section 5: Data Management */}
            {activeSection === 'data' && (
              <div className="space-y-4">
                <div className="border-b border-border/80 pb-3">
                  <h3 className="text-base font-bold text-text-primary">Demo State Management</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Reset demo workspace records to the pristine initial realistic seed state.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-warning-light/50 border border-warning/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <RotateCcw className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Reset Demo Records</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Restores initial customers, catalogue products, plans, active & paused subscriptions, quotations, and verified payment allocations.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaults}
                    className="rounded-xl bg-surface"
                  >
                    Restore Clean Demo State
                  </Button>
                </div>
              </div>
            )}

            {/* Save Button Bar */}
            {activeSection !== 'team' && activeSection !== 'data' && !isStaffReadOnly && (
              <div className="flex items-center justify-between pt-4 border-t border-border/80">
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  {isSaved && (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Settings successfully persisted!
                    </>
                  )}
                </span>

                <Button type="submit" size="sm" className="rounded-xl shadow-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
