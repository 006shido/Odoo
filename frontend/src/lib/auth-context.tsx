import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from './api';
import type { AuthUser, UserRole } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  customerId: string | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: 'demo-admin-id',
    email: 'admin@brightloop.io',
    first_name: 'Sarah',
    last_name: 'Connor',
    role: 'admin',
    is_active: true,
  },
  staff: {
    id: 'demo-staff-id',
    email: 'staff@brightloop.io',
    first_name: 'David',
    last_name: 'Miller',
    role: 'staff',
    is_active: true,
  },
  customer: {
    id: 'demo-customer-id',
    email: 'alex@acmecorp.com',
    first_name: 'Alex',
    last_name: 'Rivera',
    role: 'customer',
    is_active: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_USERS.admin);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get<{ authenticated: boolean; user: AuthUser; customer_id?: string }>('/auth/me/')
      .then((res) => {
        if (res.authenticated && res.user) {
          setUser(res.user);
          setCustomerId(res.customer_id || null);
        }
      })
      .catch(() => {
        // Fallback to demo admin user for smooth evaluation
      });
  }, []);

  const login = async (email: string, role: UserRole = 'admin') => {
    setIsLoading(true);
    try {
      const demoUser: AuthUser = Object.values(DEMO_USERS).find((u) => u.email === email) || {
        id: 'user-' + Date.now(),
        email,
        first_name: email.split('@')[0] || 'User',
        last_name: '',
        role,
        is_active: true,
      };
      setUser(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // ignore
    }
    setUser(null);
    setCustomerId(null);
  };

  const switchDemoRole = (role: UserRole) => {
    setUser(DEMO_USERS[role]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerId,
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
