import type { ReactNode } from 'react';
import { useSubscription } from './store/subscriptionStore';
import { api } from './api';

export function AuthProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
export function useAuth() {
 const store = useSubscription();
 return {
  user: store.isSignedIn ? store.currentUser : null,
  customerId: store.currentUser.customer_id || null,
  isLoading: store.isLoading,
  login: async (email: string, password: string) => { await api.post('/auth/login/', {email,password}); await store.refresh(); },
  logout: store.logout,
  switchDemoRole: store.switchRole,
 };
}
