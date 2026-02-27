import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TradingAccount } from '@/types/trading';
import { getAccounts } from '@/lib/api';
const API_URL = 'http://localhost:8000/api';

interface AuthContextType {
  user: any | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [activeAccounts, setActiveAccountsState] = useState<TradingAccount[]>([]);

  const refreshAccounts = () => {
    getAccounts().then(data => setAccounts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('mitrad_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshAccounts();
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
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

  const logout = async () => {
    const token = localStorage.getItem('mitrad_token');
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    }
    setUser(null);
    setAccounts([]);
    setActiveAccount(null);
    setActiveAccountsState([]);
    localStorage.removeItem('mitrad_token');
    localStorage.removeItem('mitrad_user');
    localStorage.removeItem('mitrad_active_account');
    localStorage.removeItem('mitrad_active_accounts');
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
      user, login, logout, updateProfile,
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

