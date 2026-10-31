import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
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
import { WelcomePage } from '@/app/pages/WelcomePage';

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
                  {/* Public Welcome Page */}
                  <Route path="/welcome" element={<WelcomePage />} />

                  {/* Authenticated Application Shell */}
                  <Route element={<AppShell />}>
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
                    <Route path="/portal" element={<CustomerPortalPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
