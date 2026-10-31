import { useState } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Layers,
  Sparkles,
  FileText,
  Zap,
  CreditCard,
  Percent,
  BarChart3,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { useTheme } from '@/lib/theme';
import { CommandPalette } from '@/components/shared/command-palette';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const {
    currentUser,
    switchRole,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    invoices,
    quotations,
    subscriptions,
  } = useSubscription();

  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Badges calculation
  const overdueCount = invoices.filter((i) => i.is_overdue || (i.status === 'issued' && i.due_date < '2026-10-31')).length;
  const acceptedQuoteCount = quotations.filter((q) => q.status === 'accepted').length;
  const pausedSubsCount = subscriptions.filter((s) => s.status === 'paused').length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const navigationSections = [
    {
      title: 'General',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        {
          name: 'Control Tower',
          path: '/control-tower',
          icon: ShieldAlert,
          badge: overdueCount + pausedSubsCount > 0 ? `${overdueCount + pausedSubsCount}` : undefined,
          badgeColor: 'text-warning bg-warning-light',
        },
      ],
    },
    {
      title: 'Commercial',
      items: [
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Products', path: '/products', icon: Layers },
        { name: 'Plans', path: '/plans', icon: Sparkles },
        {
          name: 'Quotations',
          path: '/quotations',
          icon: FileText,
          badge: acceptedQuoteCount > 0 ? `${acceptedQuoteCount}` : undefined,
          badgeColor: 'text-success bg-success-light',
        },
      ],
    },
    {
      title: 'Billing & Finance',
      items: [
        { name: 'Subscriptions', path: '/subscriptions', icon: Zap },
        {
          name: 'Invoices',
          path: '/invoices',
          icon: FileText,
          badge: overdueCount > 0 ? `${overdueCount}` : undefined,
          badgeColor: 'text-error bg-error-light',
        },
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Discounts', path: '/discounts', icon: Percent },
      ],
    },
    {
      title: 'Analytics & Tools',
      items: [
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Customer Portal', path: '/portal', icon: ExternalLink },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/control-tower')) return 'Control Tower';
    if (p.includes('/customers')) return 'Customers';
    if (p.includes('/products')) return 'Products';
    if (p.includes('/plans')) return 'Plans';
    if (p.includes('/quotations')) return 'Quotations';
    if (p.includes('/subscriptions')) return 'Subscriptions';
    if (p.includes('/invoices')) return 'Invoices';
    if (p.includes('/payments')) return 'Payments';
    if (p.includes('/discounts')) return 'Discounts';
    if (p.includes('/reports')) return 'Reports';
    if (p.includes('/settings')) return 'Settings';
    if (p.includes('/portal')) return 'Customer Portal';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex antialiased relative overflow-hidden">
      {/* Ambient Apple Gaussian Backlights (Light & Dark Vibrancy) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[15%] -right-[10%] w-[550px] h-[550px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[140px] transform-gpu" />
        <div className="absolute top-[30%] -left-[10%] w-[480px] h-[480px] rounded-full bg-emerald-500/6 dark:bg-emerald-500/10 blur-[130px] transform-gpu" />
        <div className="absolute -bottom-[15%] right-[15%] w-[600px] h-[600px] rounded-full bg-indigo-500/6 dark:bg-indigo-600/12 blur-[150px] transform-gpu" />
      </div>
      {/* Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Clean, Grounded Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-surface/80 dark:bg-surface/75 backdrop-blur-2xl border-r border-border/80 flex flex-col transition-transform duration-200 lg:translate-x-0 shadow-xs',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-white">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className="font-semibold text-base text-text-primary">Brightloop</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md text-text-secondary hover:bg-surface-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-light text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-text-tertiary')} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', item.badgeColor)}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile and role switcher in footer */}
        <div className="p-3 border-t border-border bg-surface-secondary/40 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-text-tertiary font-medium">Role:</span>
            <div className="flex items-center gap-1 bg-surface border border-border p-0.5 rounded-md">
              {(['admin', 'staff', 'customer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    if (r === 'customer') navigate('/portal');
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors',
                    currentUser.role === r
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-1 pt-1">
            <div className="h-7 w-7 rounded-full bg-accent/15 text-accent font-semibold text-xs flex items-center justify-center shrink-0">
              {currentUser.first_name[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-text-primary truncate">
                {currentUser.first_name} {currentUser.last_name}
              </span>
              <span className="text-[11px] text-text-tertiary truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-60">
        {/* Simple Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-14 bg-surface/80 dark:bg-surface/75 backdrop-blur-2xl border-b border-border/80 flex items-center justify-between px-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-text-primary">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 hover:bg-surface/80 dark:bg-surface/40 backdrop-blur-md border border-border/80 text-xs text-text-secondary hover:text-text-primary transition-all shadow-2xs"
            >
              <Search className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-[10px] bg-surface px-1 py-0.5 rounded border border-border text-text-tertiary font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface/85 dark:bg-surface/80 backdrop-blur-3xl border border-white/60 dark:border-white/12 shadow-apple-floating p-3 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="text-xs font-semibold text-text-primary">
                        Notifications ({unreadNotifs})
                      </span>
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-accent hover:underline"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-text-tertiary py-4">
                          No notifications
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => {
                          const Icon =
                            n.type === 'success'
                              ? CheckCircle2
                              : n.type === 'warning'
                              ? AlertTriangle
                              : Info;
                          const iconColor =
                            n.type === 'success'
                              ? 'text-success'
                              : n.type === 'warning'
                              ? 'text-warning'
                              : 'text-accent';

                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setNotifOpen(false);
                                }
                              }}
                              className={cn(
                                'flex items-start gap-2.5 p-2 rounded-lg text-left cursor-pointer transition-colors',
                                n.read
                                  ? 'hover:bg-surface-secondary text-text-secondary'
                                  : 'bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-medium',
                              )}
                            >
                              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColor)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{n.title}</p>
                                <p className="text-[11px] text-text-secondary truncate">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
