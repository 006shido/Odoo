import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SubscriptionProvider } from '@/lib/store/subscriptionStore';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/components/ui/toast';
import { AppShell } from '@/app/AppShell';

// Feature Pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ControlTowerPage } from '@/features/subscriptions/ControlTowerPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { PlansPage } from '@/features/plans/PlansPage';
import { QuotationsPage } from '@/features/quotations/QuotationsPage';
import { SubscriptionsPage } from '@/features/subscriptions/SubscriptionsPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { DiscountsPage } from '@/features/discounts/DiscountsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { CustomerPortalPage } from '@/features/portal/CustomerPortalPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AICopilotPage } from '@/features/ai/AICopilotPage';
import { WelcomePage } from '@/app/pages/WelcomePage';
import { LoginPage } from '@/app/pages/LoginPage';
import { useSubscription } from '@/lib/store/subscriptionStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SubscriptionProvider>
          <ToastProvider>
            <TooltipProvider delayDuration={300}>
              <BrowserRouter>
                <Routes>
                  {/* Public Welcome / Design System Preview */}
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Authenticated Application Shell */}
                  <Route element={<AuthenticatedShell />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/control-tower" element={<ControlTowerPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/quotations" element={<QuotationsPage />} />
                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/discounts" element={<DiscountsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/ai" element={<AICopilotPage />} />
                    <Route path="/portal" element={<CustomerPortalPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ToastProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function HomeRoute() {
  const { currentUser } = useSubscription();
  const isSignedIn = localStorage.getItem('brightloop_session') === 'active';
  if (!isSignedIn) return <WelcomePage />;
  return <Navigate to={currentUser.role === 'customer' ? '/plans' : '/dashboard'} replace />;
}

function AuthenticatedShell() {
  const { currentUser } = useSubscription();
  const location = useLocation();
  const isSignedIn = localStorage.getItem('brightloop_session') === 'active';

  if (!isSignedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (currentUser.role === 'customer' && !['/plans', '/portal', '/ai'].includes(location.pathname)) {
    return <Navigate to="/plans" replace />;
  }
  if (currentUser.role === 'staff' && ['/products', '/discounts', '/reports', '/settings'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppShell />;
}
