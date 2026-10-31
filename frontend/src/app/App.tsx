import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/AppShell';

import { DashboardPage } from '@/app/pages/DashboardPage';
import { SubscriptionsPage } from '@/app/pages/SubscriptionsPage';
import { QuotationsPage } from '@/app/pages/QuotationsPage';
import { InvoicesPage } from '@/app/pages/InvoicesPage';
import { PaymentsPage } from '@/app/pages/PaymentsPage';
import { CustomersPage } from '@/app/pages/CustomersPage';
import { CataloguePage } from '@/app/pages/CataloguePage';
import { PlansPage } from '@/app/pages/PlansPage';
import { DiscountsPage } from '@/app/pages/DiscountsPage';
import { LoginPage } from '@/app/pages/LoginPage';
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

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={user.role === 'customer' ? <SubscriptionsPage /> : <DashboardPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/discounts" element={<DiscountsPage />} />
        <Route path="/design-system" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
