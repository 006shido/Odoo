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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  Compass,
} from 'lucide-react';
import { useSubscription } from '@/lib/store/subscriptionStore';
import { useTheme } from '@/lib/theme';
import { CommandPalette } from '@/components/shared/command-palette';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const {
    currentUser,
    switchRole,
    switchCustomerUser,
    customers,
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

  const navigationItems = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        {
          name: 'Control Tower',
          path: '/control-tower',
          icon: ShieldAlert,
          badge: overdueCount + pausedSubsCount > 0 ? `${overdueCount + pausedSubsCount}` : undefined,
          badgeVariant: 'warning',
        },
      ],
    },
    {
      group: 'Commercial',
      items: [
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Products', path: '/products', icon: Layers },
        { name: 'Subscription Plans', path: '/plans', icon: Sparkles },
        {
          name: 'Quotations',
          path: '/quotations',
          icon: FileText,
          badge: acceptedQuoteCount > 0 ? `${acceptedQuoteCount}` : undefined,
          badgeVariant: 'success',
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        { name: 'Subscriptions', path: '/subscriptions', icon: Zap },
        {
          name: 'Invoices',
          path: '/invoices',
          icon: FileText,
          badge: overdueCount > 0 ? `${overdueCount}` : undefined,
          badgeVariant: 'error',
        },
        { name: 'Payments', path: '/payments', icon: CreditCard },
        { name: 'Discounts', path: '/discounts', icon: Percent },
      ],
    },
    {
      group: 'Intelligence & Discovery',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
        { name: 'Customer Portal', path: '/portal', icon: ExternalLink },
        { name: 'Workspace Settings', path: '/settings', icon: Settings },
        { name: 'Product Tour', path: '/welcome', icon: Compass },
      ],
    },
  ];

  // Helper for current page title and category
  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('/control-tower')) return { category: 'Overview', title: 'Control Tower' };
    if (p.includes('/customers')) return { category: 'Commercial', title: 'Customer Accounts' };
    if (p.includes('/products')) return { category: 'Commercial', title: 'Product Catalogue & Variants' };
    if (p.includes('/plans')) return { category: 'Commercial', title: 'Subscription Plans & Pricing' };
    if (p.includes('/quotations')) return { category: 'Commercial', title: 'Quotations & Proposals' };
    if (p.includes('/subscriptions')) return { category: 'Operations', title: 'Subscription Contracts' };
    if (p.includes('/invoices')) return { category: 'Operations', title: 'Invoices & Billing Engine' };
    if (p.includes('/payments')) return { category: 'Operations', title: 'Payments & Allocations' };
    if (p.includes('/discounts')) return { category: 'Operations', title: 'Discounts & Credits' };
    if (p.includes('/reports')) return { category: 'Intelligence', title: 'Financial Reports & Analytics' };
    if (p.includes('/settings')) return { category: 'Intelligence', title: 'Workspace Settings' };
    if (p.includes('/portal')) return { category: 'Portal', title: 'Customer Self-Service' };
    if (p.includes('/welcome')) return { category: 'Discovery', title: 'Product Overview & Tour' };
    return { category: 'Overview', title: 'Executive Overview' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-background text-text-primary flex antialiased">
      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* macOS-style Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
          'bg-surface/85 dark:bg-surface/80 backdrop-blur-2xl border-r border-border/80 shadow-sm',
          collapsed ? 'w-20' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base tracking-tight leading-tight truncate">
                  Brightloop
                </span>
                <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                  Subscription Ops
                </span>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-surface-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationItems.map((group) => (
            <div key={group.group} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-text-tertiary mb-2">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                      collapsed && 'justify-center px-0',
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0 transition-transform duration-150', isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary')} />
                    {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          'text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                          isActive
                            ? 'bg-white/25 text-white'
                            : item.badgeVariant === 'error'
                            ? 'bg-error-light text-error'
                            : item.badgeVariant === 'warning'
                            ? 'bg-warning-light text-warning'
                            : 'bg-success-light text-success',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Role Switcher & Profile */}
        <div className="p-3 border-t border-border/60 bg-surface/40 space-y-2">
          {/* Quick Role Switcher Pill (Interactive for live demo) */}
          {!collapsed && (
            <div className="p-2 rounded-xl bg-surface-secondary/70 border border-border/50">
              <div className="flex items-center justify-between text-[11px] font-medium text-text-tertiary mb-1.5 px-1">
                <span>Active Role</span>
                <span className="capitalize text-accent font-semibold">{currentUser.role}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['admin', 'staff', 'customer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      if (r === 'customer') navigate('/portal');
                    }}
                    className={cn(
                      'py-1 rounded-lg text-xs font-semibold capitalize transition-all',
                      currentUser.role === r
                        ? 'bg-surface text-text-primary shadow-xs border border-border/50'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User profile row */}
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-secondary/60 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.first_name[0]}
                {currentUser.last_name[0] || ''}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                  <span className="text-[10px] text-text-tertiary truncate">
                    {currentUser.email}
                  </span>
                </div>
              )}
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        {/* Apple Liquid Glass Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 liquid-glass border-b border-border/70 flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-surface-secondary text-text-primary"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary mb-0.5">
                <span>Brightloop</span>
                <span>/</span>
                <span className="text-text-secondary">{pageInfo.category}</span>
                <span>/</span>
                <span className="text-accent font-semibold">{pageInfo.title}</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-text-primary leading-tight">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* Top Bar Role Switcher (Apple Segmented Control) */}
            <div className="hidden xl:flex items-center bg-surface-secondary/80 p-0.5 rounded-xl border border-border/60 text-xs">
              {(['admin', 'staff', 'customer'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    if (r === 'customer') navigate('/portal');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold capitalize transition-all duration-150',
                    currentUser.role === r
                      ? 'bg-surface text-accent shadow-xs'
                      : 'text-text-tertiary hover:text-text-primary',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Persona Switcher when in Customer role */}
            {currentUser.role === 'customer' && (
              <div className="hidden md:flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-accent/10 border border-accent/20 text-accent font-medium">
                <span>As:</span>
                <select
                  value={currentUser.customer_id || customers[0]?.id}
                  onChange={(e) => switchCustomerUser(e.target.value)}
                  className="bg-transparent font-semibold cursor-pointer outline-none text-accent"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-text-primary bg-surface">
                      {c.company_name} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Action Button */}
            <div className="relative">
              <button
                onClick={() => setQuickActionOpen(!quickActionOpen)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

              {quickActionOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setQuickActionOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl border border-border shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-1">
                    <button
                      onClick={() => {
                        navigate('/quotations');
                        setQuickActionOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-secondary text-text-primary font-medium"
                    >
                      <FileText className="h-3.5 w-3.5 text-accent" />
                      <span>Create Quotation</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/customers');
                        setQuickActionOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-secondary text-text-primary font-medium"
                    >
                      <Users className="h-3.5 w-3.5 text-success" />
                      <span>Add Customer</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/control-tower');
                        setQuickActionOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-secondary text-text-primary font-medium"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                      <span>Run Billing Engine</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/payments');
                        setQuickActionOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-secondary text-text-primary font-medium"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-accent" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Global Search Button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-surface-secondary hover:bg-surface-secondary/80 border border-border text-xs text-text-secondary hover:text-text-primary transition-all shadow-xs"
            >
              <Search className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="hidden md:inline">Search anything...</span>
              <kbd className="hidden md:inline-block text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-text-tertiary font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl border border-border shadow-2xl p-3 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Notifications ({unreadNotifs})
                      </span>
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-accent hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-text-tertiary py-6">
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
                                'flex items-start gap-2.5 p-2 rounded-xl text-left cursor-pointer transition-colors',
                                n.read
                                  ? 'hover:bg-surface-secondary/50 text-text-secondary'
                                  : 'bg-surface-secondary/70 hover:bg-surface-secondary text-text-primary font-medium',
                              )}
                            >
                              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColor)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-snug truncate">{n.title}</p>
                                <p className="text-[11px] text-text-secondary line-clamp-2">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-text-tertiary">
                                  {n.timestamp}
                                </span>
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

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Avatar & Role */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-accent text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {currentUser.first_name[0]}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none">{currentUser.first_name}</span>
                <span className="text-[10px] font-medium text-text-tertiary capitalize">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
