import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TradingAccount } from '@/types/trading';
import { getAccounts } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mitradacademy.mg/api';

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

// Clé unique par utilisateur
const getUserKey = (userId: string | number) => `mitrad_user_${userId}`;
const getTokenKey = (userId: string | number) => `mitrad_token_${userId}`;

// Récupère l'utilisateur actif (via clé générique qui pointe vers son ID)
const getActiveUser = () => {
  const activeId = localStorage.getItem('mitrad_active_id');
  if (!activeId) {
    // Fallback : ancienne cl� pour migration
    const legacy = localStorage.getItem('mitrad_user');
    return legacy ? JSON.parse(legacy) : null;
  }
  const saved = localStorage.getItem(getUserKey(activeId));
  return saved ? JSON.parse(saved) : null;
};

const getActiveToken = () => {
  const activeId = localStorage.getItem('mitrad_active_id');
  if (!activeId) return localStorage.getItem('mitrad_token');
  return localStorage.getItem(getTokenKey(activeId));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const savedUser = getActiveUser();
  const [user, setUser] = useState<any | null>(savedUser);
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<TradingAccount[]>(
    savedUser?.isDemo ? [{ id: 'demo-account', name: 'Compte Démo', type: 'Démo', capital: 10000, currency: 'USD' } as any] : []
  );
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [activeAccounts, setActiveAccountsState] = useState<TradingAccount[]>([]);

  const refreshAccounts = () => {
    const currentUser = getActiveUser();
    if (!currentUser || currentUser?.isDemo) return;
    getAccounts().then(data => setAccounts(Array.isArray(data) ? data : []));
  };

  // Recharge le profil frais depuis le serveur au démarrage
  useEffect(() => {
    const token = getActiveToken();
    const saved = getActiveUser();
    if (!token || !saved) return;
    if (saved?.isDemo) return;
    fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (profile) {
          const updated = {
            ...saved,
            ...profile,
            tradingStyle: profile.trading_style || saved.tradingStyle || "",
          };
          localStorage.setItem(getUserKey(updated.id), JSON.stringify(updated));
          setUser(updated);
          refreshAccounts();
        }
      })
      .catch(() => {});
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (email === 'demo@mitrad.com' && password === 'mitrad123') {
      localStorage.setItem('mitrad_active_id', 'demo');
      localStorage.setItem(getUserKey('demo'), JSON.stringify(DEMO_USER));
      localStorage.setItem(getTokenKey('demo'), 'demo-token');
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
        const userId = data.user.id;
        localStorage.setItem('mitrad_active_id', String(userId));
        localStorage.setItem(getUserKey(userId), JSON.stringify(data.user));
        localStorage.setItem(getTokenKey(userId), data.token);
        // Compatibilité ancienne clé
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
    const token = getActiveToken();
    const activeId = localStorage.getItem('mitrad_active_id');
    setUser(null);
    setAccounts([]);
    setActiveAccount(null);
    setActiveAccountsState([]);
    if (activeId) {
      localStorage.removeItem(getUserKey(activeId));
      localStorage.removeItem(getTokenKey(activeId));
    }
    localStorage.removeItem('mitrad_active_id');
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
    const updated = {
      ...user,
      ...updates,
      tradingStyle: updates.tradingStyle || user.tradingStyle || "",
      trading_style: updates.tradingStyle || user.tradingStyle || "",
    };
    localStorage.setItem(getUserKey(user.id), JSON.stringify(updated));
    localStorage.setItem('mitrad_user', JSON.stringify(updated)); // compatibilité
    setUser(updated);

    const token = getActiveToken();
    if (!token || updated.isDemo) return;
    fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name:          updates.name,
        bio:           updates.bio,
        country:       updates.country,
        experience:    updates.experience,
        trading_style: updates.tradingStyle,
        broker:        updates.broker,
        avatar:        updates.avatar,
        banner:        updates.banner,
        is_public:     updates.isPublic,
      }),
    }).then(async (r) => {
      if (r && r.ok) {
        const profile = await r.json();
        if (profile) {
          const synced = {
            ...updated,
            tradingStyle: profile.trading_style || updated.tradingStyle || "",
          };
          localStorage.setItem(getUserKey(user.id), JSON.stringify(synced));
          localStorage.setItem('mitrad_user', JSON.stringify(synced));
          setUser(synced);
        }
      }
    }).catch(() => {});
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
