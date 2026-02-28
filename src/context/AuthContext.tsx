import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TradingAccount } from '@/types/trading';
import { getAccounts } from '@/lib/api';

const API_URL = 'http://localhost:8000/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: any) => void;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  setActiveAccount: (account: TradingAccount | null) => void;
  activeAccounts: TradingAccount[];
  setActiveAccounts: (accounts: TradingAccount[]) => void;
  refreshAccounts: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER = {
  id: 'demo',
  name: 'Trader Demo',
  email: 'demo@mitrad.com',
  isDemo: true,
  password_set: false,
  customSetups: [],
};

const DEMO_ACCOUNT = {
  id: 'demo-account',
  name: 'Compte Démo',
  type: 'Démo',
  capital: 10000,
  currency: 'USD',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const savedUser = localStorage.getItem('mitrad_user');
  const [user, setUser] = useState<any | null>(savedUser ? JSON.parse(savedUser) : null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [activeAccounts, setActiveAccountsState] = useState<TradingAccount[]>([]);

  const refreshAccounts = () => {
    const savedUser = JSON.parse(localStorage.getItem('mitrad_user') || '{}');
    if (savedUser?.isDemo) return;
    getAccounts().then(data => setAccounts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    if (user) {
      refreshAccounts();
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (email === 'demo@mitrad.com' && password === 'mitrad123') {
      localStorage.setItem('mitrad_token', 'demo-token');
      localStorage.setItem('mitrad_user', JSON.stringify(DEMO_USER));
      setUser(DEMO_USER);
      setAccounts([DEMO_ACCOUNT as any]);
      setActiveAccount(DEMO_ACCOUNT as any);
      return true;
    }
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('mitrad_token', data.token);
        localStorage.setItem('mitrad_user', JSON.stringify(data.user));
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    const token = localStorage.getItem('mitrad_token');
    setUser(null);
    setAccounts([]);
    setActiveAccount(null);
    setActiveAccountsState([]);
    localStorage.removeItem('mitrad_token');
    localStorage.removeItem('mitrad_user');
    localStorage.removeItem('mitrad_active_account');
    localStorage.removeItem('mitrad_active_accounts');
    if (token) {
      fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }).catch(() => {});
    }
  };

  const updateProfile = (updates: any) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    localStorage.setItem('mitrad_user', JSON.stringify(updated));
    setUser(updated);
  };

  const handleSetActiveAccount = (account: TradingAccount | null) => {
    setActiveAccount(account);
    if (account) {
      localStorage.setItem('mitrad_active_account', account.id);
    } else {
      localStorage.removeItem('mitrad_active_account');
    }
  };

  const handleSetActiveAccounts = (selected: TradingAccount[]) => {
    setActiveAccountsState(selected);
    if (selected.length > 0) {
      localStorage.setItem('mitrad_active_accounts', JSON.stringify(selected.map(a => a.id)));
    } else {
      localStorage.removeItem('mitrad_active_accounts');
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateProfile,
      accounts,
      activeAccount, setActiveAccount: handleSetActiveAccount,
      activeAccounts, setActiveAccounts: handleSetActiveAccounts,
      refreshAccounts,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}