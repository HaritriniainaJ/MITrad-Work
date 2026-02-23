import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, TradingAccount } from '@/types/trading';
import { StorageManager } from '@/lib/storage';
import { initializeSeedData } from '@/data/seedData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  accounts: TradingAccount[];
  // Sélection simple (rétrocompat)
  activeAccount: TradingAccount | null;
  setActiveAccount: (account: TradingAccount | null) => void;
  // Sélection multiple
  activeAccounts: TradingAccount[];
  setActiveAccounts: (accounts: TradingAccount[]) => void;
  refreshAccounts: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [activeAccounts, setActiveAccountsState] = useState<TradingAccount[]>([]);

  const refreshAccounts = () => {
    if (user) {
      const accs = StorageManager.getAccounts(user.email);
      setAccounts(accs);
    }
  };

  useEffect(() => {
    initializeSeedData();
    const savedEmail = localStorage.getItem('mitrad_session');
    if (savedEmail) {
      const u = StorageManager.getUser(savedEmail);
      if (u) setUser(u);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const accs = StorageManager.getAccounts(user.email);
      setAccounts(accs);

      // Restore active account (single)
      const savedAccId = localStorage.getItem('mitrad_active_account');
      if (savedAccId) {
        const acc = accs.find(a => a.id === savedAccId);
        if (acc) setActiveAccount(acc);
      }

      // Restore active accounts (multi)
      const savedMulti = localStorage.getItem('mitrad_active_accounts');
      if (savedMulti) {
        try {
          const ids: string[] = JSON.parse(savedMulti);
          const matched = accs.filter(a => ids.includes(a.id));
          if (matched.length > 0) setActiveAccountsState(matched);
        } catch { /* ignore */ }
      }
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const u = StorageManager.getUser(email);
    if (u && u.password === password) {
      setUser(u);
      localStorage.setItem('mitrad_session', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setActiveAccount(null);
    setActiveAccountsState([]);
    localStorage.removeItem('mitrad_session');
    localStorage.removeItem('mitrad_active_account');
    localStorage.removeItem('mitrad_active_accounts');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    StorageManager.updateUser(user.email, updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
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