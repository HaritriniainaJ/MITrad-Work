import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import NProgress from 'nprogress';
import { cn } from '@/lib/utils';
import CoachAlphaFloat from '@/components/CoachAlphaFloat';
import { usePageProgress } from '@/hooks/usePageProgress';
import { DisplayModeToggle } from '@/context/DisplayModeContext';
import {
  LayoutDashboard, PlusCircle, ClipboardList, BarChart3,
  CalendarDays, FileText, Trophy, User, Calculator, Settings,
  LogOut, Menu, X, Bot, BookOpen, Award, Target,
  ChevronDown, Wallet, Check, Upload, HeadphonesIcon,
  ChevronLeft, ChevronRight, Sun, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  // { path: '/dashboard',      label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/analytics',      label: 'Dashboard',     icon: BarChart3 },
  { path: '/new-trade',      label: 'Nouveau Trade',   icon: PlusCircle },
  { path: '/history',        label: 'Historique',      icon: ClipboardList },
  { path: '/calendar',       label: 'Calendrier',      icon: CalendarDays },
  { path: '/daily-analysis', label: 'Mon Analyse', icon: FileText },
  { path: '/coach',          label: 'Mentor-X',        icon: Bot },
  { path: '/trading-plan',   label: 'Mon Plan',        icon: BookOpen },
  { path: '/objectives',     label: 'Mes Objectifs',   icon: Target },
  { path: '/successes',      label: 'Mes Succès',      icon: Award },
  // { path: '/leaderboard',    label: 'Classement',      icon: Trophy },
  { path: '/profile',        label: 'Mon Profil',      icon: User },
  // { path: '/calculator',     label: 'Calculateur',     icon: Calculator },
  { path: '/import',         label: 'Importer',        icon: Upload },
  { path: '/support',        label: 'Support',         icon: HeadphonesIcon },
  { path: '/settings',       label: 'Paramètres',      icon: Settings },
];

const TYPE_COLORS: Record<string, string> = {
  Personnel: 'bg-blue-500/20 text-blue-400',
  Funded:    'bg-emerald-500/20 text-emerald-400',
  Démo:      'bg-amber-500/20 text-amber-400',
  Propfirm:  'bg-purple-500/20 text-purple-400',
};

const SIDEBAR_W    = 240;
const SIDEBAR_MINI = 68;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, accounts, activeAccounts, setActiveAccounts } = useAuth();
  const isDemoMode = (user as any)?.isDemo === true;
  usePageProgress();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [collapsed,    setCollapsed]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const allSelected  = activeAccounts.length === 0;
  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_W;


  const toggleAccount = (acc: typeof accounts[0]) => {
    const isSelected = activeAccounts.some(a => String(a.id) === String(acc.id));
    setActiveAccounts(
      isSelected
        ? activeAccounts.filter(a => String(a.id) !== String(acc.id))
        : [...activeAccounts, acc]
    );
  };
  const selectAll = () => setActiveAccounts([]);

  const triggerLabel = allSelected
    ? 'Tous les comptes'
    : activeAccounts.length === 1
      ? activeAccounts[0].name
      : `${activeAccounts.length} comptes`;

  return (
    <div className="flex min-h-screen bg-background">

      {/* Overlay mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col border-r border-border',
          'transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ background: 'rgba(10,13,22,0.95)', backdropFilter: 'blur(24px)', overflow: 'visible' }}
      >
        {/* Bouton collapse repositionné sur le bord droit */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all z-10 shadow-lg"
          title={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
        >
          <ChevronLeft size={12} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border/40 shrink-0" style={{ minHeight: 64 }}>
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 min-w-0">
                <Link to="/analytics" className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                </Link>
                <Link to="/analytics" className="gradient-text text-lg font-black tracking-tight truncate">
                  Pro MITrad
                </Link>
              </motion.div>
            ) : (
              <motion.div key="mini" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Link to="/analytics">
                  <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton fermer mobile */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Badge DEMO */}
        {isDemoMode && !collapsed && (
          <div className="mx-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: '#f59e0b' }}>Mode Démo</p>
              <p className="text-[10px] text-muted-foreground">Lecture seule</p>
            </div>
          </div>
        )}
        {isDemoMode && collapsed && (
          <div className="flex justify-center py-1" title="Mode Démo — Lecture seule">
            <span style={{ fontSize: 16 }}>🔒</span>
          </div>
        )}

        {/* Sélecteur de compte */}
        {accounts.length > 0 && !collapsed && (
          <div className="px-3 pt-3 pb-2 shrink-0" ref={dropdownRef}>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5 px-1">
              Compte actif
            </p>
            <button
              onClick={() => setDropdownOpen(p => !p)}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-left text-xs',
                'bg-accent/40 hover:bg-accent/70',
                dropdownOpen ? 'border-primary/40' : 'border-white/5 hover:border-white/10'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Wallet size={12} className={allSelected ? 'text-muted-foreground' : 'text-primary'} />
                <span className="font-medium text-foreground truncate">{triggerLabel}</span>
              </div>
              <ChevronDown size={12} className={cn('text-muted-foreground transition-transform shrink-0', dropdownOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-3 right-3 mt-1.5 z-50 rounded-xl border border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
                  style={{ background: '#0a0d16' }}
                >
                  <button onClick={selectAll}
                    className={cn('w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors',
                      allSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground')}>
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', allSelected ? 'bg-primary border-primary' : 'border-white/20')}>
                        {allSelected && <Check size={9} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="font-semibold">Tous les comptes</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{accounts.length} compte{accounts.length > 1 ? 's' : ''}</span>
                  </button>
                  <div className="h-px bg-white/5 mx-2" />
                  {accounts.map((acc, idx) => {
                    const sel = activeAccounts.some(a => String(a.id) === String(acc.id));
                    return (
                      <button key={acc.id} onClick={() => toggleAccount(acc)}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors',
                          idx !== 0 && 'border-t border-white/[0.04]',
                          sel ? 'bg-primary/8 text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground')}>
                        <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', sel ? 'bg-primary border-primary' : 'border-white/20')}>
                          {sel && <Check size={9} strokeWidth={3} className="text-white" />}
                        </span>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-medium truncate text-foreground/90">{acc.name}</div>
                          <div className="text-[10px] text-muted-foreground/60 truncate">{acc.broker}</div>
                        </div>
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0', TYPE_COLORS[acc.type] ?? 'bg-white/10 text-white/60')}>
                          {acc.type}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin mt-1 py-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  active
                    ? 'gradient-primary text-white shadow-[0_0_16px_rgba(26,107,255,0.4)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )}
              >
                <item.icon size={17} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip mini sidebar */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium bg-card border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}

                {active && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/80" />}
              </Link>
            );
          })}
        </nav>

        {/* Toggle mode affichage */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-border/40 shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1.5">Affichage résultats</p>
            <DisplayModeToggle />
          </div>
        )}

        {/* Thème clair / sombre */}
        {!collapsed ? (
          <div className="px-3 py-2 border-t border-border/40 shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1.5">Apparence</p>
            <button onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/40 hover:bg-accent/70 transition-all text-sm">
              <motion.div animate={{ rotate: theme === 'light' ? 180 : 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                {theme === 'dark'
                  ? <Sun size={14} className="text-warning" />
                  : <Moon size={14} className="text-primary" />}
              </motion.div>
              <span className="text-xs font-medium text-muted-foreground">
                {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-2 border-t border-border/40 shrink-0">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/40 hover:bg-accent/70 transition-all" title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
              {theme === 'dark' ? <Sun size={14} className="text-warning" /> : <Moon size={14} className="text-primary" />}
            </button>
          </div>
        )}

        {/* Profil + déconnexion */}
        <div className={cn('p-3 border-t border-border/40 shrink-0', collapsed && 'flex flex-col items-center gap-2')}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.country}</p>
                </div>
              </div>
              <button onClick={() => { NProgress.start(); logout(); }}
                className="flex items-center gap-2 text-destructive text-xs w-full px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors font-medium">
                <LogOut size={14} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-background" />
              </div>
              <button onClick={() => { NProgress.start(); setTimeout(logout, 100); }} title="Déconnexion"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </motion.aside>

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────── */}
      <motion.main
        className="flex-1 min-w-0 w-full"
        style={{ marginLeft: 0 }}
      >
        <div className="hidden lg:block" style={{ height: 0 }} />
        <style>{`@media (min-width: 1024px) { .main-content { margin-left: ${sidebarWidth}px !important; transition: margin-left 0.28s ease-in-out; } }`}</style>
        <div className="main-content">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border"
          style={{ background: 'rgba(10,13,22,0.9)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setMobileOpen(true)} className="text-foreground p-1">
            <Menu size={22} />
          </button>
          <span className="gradient-text font-black text-lg tracking-tight">Pro MITrad</span>
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white">
            {user.name.charAt(0)}
          </div>
        </header>

        {/* Page content */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-8 max-w-[1400px] mx-auto pb-24"
        >
          {children}
        </motion.div>
        </div>
      </motion.main>

      {/* Floating Mentor-X */}
      <CoachAlphaFloat />
    </div>
  );
}








