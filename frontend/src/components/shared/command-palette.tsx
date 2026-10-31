import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Users,
  Layers,
  FileText,
  CreditCard,
  RefreshCw,
  Sun,
  Moon,
  Shield,
  Zap,
  ArrowRight,
  X,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { useTheme } from '@/lib/theme';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { customers, subscriptions, invoices, quotations, plans, switchRole } = useSubscription();
  const { toggleTheme, isDark } = useTheme();

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        actions: [
          {
            id: 'act-new-quote',
            title: 'Create New Quotation',
            subtitle: 'Draft a commercial proposal',
            icon: FileText,
            action: () => {
              navigate('/quotations');
              onClose();
            },
          },
          {
            id: 'act-record-payment',
            title: 'Record & Allocate Payment',
            subtitle: 'Receive funds and allocate to invoices',
            icon: CreditCard,
            action: () => {
              navigate('/payments');
              onClose();
            },
          },
          {
            id: 'act-run-billing',
            title: 'Run Recurring Billing Engine',
            subtitle: 'Trigger scheduled billing job',
            icon: RefreshCw,
            action: () => {
              navigate('/invoices');
              onClose();
            },
          },
          {
            id: 'act-toggle-theme',
            title: isDark ? 'Switch to Light Appearance' : 'Switch to Dark Appearance',
            subtitle: 'Toggle theme display',
            icon: isDark ? Sun : Moon,
            action: () => {
              toggleTheme();
              onClose();
            },
          },
          {
            id: 'act-role-cust',
            title: 'Simulate Customer Portal View',
            subtitle: 'Switch perspective to Customer role',
            icon: Shield,
            action: () => {
              switchRole('customer');
              navigate('/portal');
              onClose();
            },
          },
        ],
        matches: [],
      };
    }

    const matches: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: string;
      icon: React.ElementType;
      path: string;
    }> = [];

    // Search customers
    customers.forEach((c) => {
      if (c.company_name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
        matches.push({
          id: c.id,
          title: c.company_name,
          subtitle: `Customer • ${c.email}`,
          category: 'Customers',
          icon: Users,
          path: '/customers',
        });
      }
    });

    // Search subscriptions
    subscriptions.forEach((s) => {
      if (s.number.toLowerCase().includes(q) || s.customer_name.toLowerCase().includes(q) || s.plan_name.toLowerCase().includes(q)) {
        matches.push({
          id: s.id,
          title: `${s.number} - ${s.customer_name}`,
          subtitle: `Subscription • ${s.plan_name} • ${s.status}`,
          category: 'Subscriptions',
          icon: Zap,
          path: '/subscriptions',
        });
      }
    });

    // Search invoices
    invoices.forEach((inv) => {
      if (inv.number.toLowerCase().includes(q) || inv.customer_name.toLowerCase().includes(q)) {
        matches.push({
          id: inv.id,
          title: `${inv.number} - $${inv.total}`,
          subtitle: `Invoice • ${inv.customer_name} • ${inv.status}`,
          category: 'Invoices',
          icon: FileText,
          path: '/invoices',
        });
      }
    });

    // Search quotations
    quotations.forEach((quo) => {
      if (quo.number.toLowerCase().includes(q) || quo.customer_name.toLowerCase().includes(q)) {
        matches.push({
          id: quo.id,
          title: `${quo.number} - $${quo.total}`,
          subtitle: `Quotation • ${quo.customer_name} • ${quo.status}`,
          category: 'Quotations',
          icon: FileText,
          path: '/quotations',
        });
      }
    });

    // Search plans
    plans.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q)) {
        matches.push({
          id: p.id,
          title: p.name,
          subtitle: `Plan • $${p.price}/${p.frequency} • ${p.product_name}`,
          category: 'Plans',
          icon: Layers,
          path: '/plans',
        });
      }
    });

    return { actions: [], matches: matches.slice(0, 8) };
  }, [query, customers, subscriptions, invoices, quotations, plans, isDark, toggleTheme, switchRole, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
          <Search className="h-5 w-5 text-text-tertiary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, subscriptions, invoices, or type a command..."
            className="flex-1 bg-transparent text-text-primary text-base placeholder:text-text-tertiary focus:outline-none"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-text-tertiary hover:text-text-primary p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-[11px] font-medium text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md border border-border">
              ESC
            </span>
          )}
        </div>

        {/* Content list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {results.actions.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Suggested Actions
              </p>
              {results.actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-surface-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-secondary text-text-secondary group-hover:bg-accent group-hover:text-accent-text transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{act.title}</p>
                        <p className="text-xs text-text-secondary">{act.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {results.matches.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Search Results ({results.matches.length})
              </p>
              {results.matches.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-surface-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-secondary text-text-secondary group-hover:bg-accent group-hover:text-accent-text transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {query && results.matches.length === 0 && (
            <div className="py-12 text-center text-text-secondary">
              <Search className="h-8 w-8 mx-auto text-text-tertiary mb-2" />
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs text-text-tertiary mt-1">Try searching by ID, company name, or plan.</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-surface-secondary/50 border-t border-border flex items-center justify-between text-xs text-text-tertiary">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Brightloop Operations Engine</span>
        </div>
      </div>
    </div>
  );
}

