import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDisplayMode, DisplayModeToggle } from '@/context/DisplayModeContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { getMaxWinStreak, getMaxLossStreak, getMaxDrawdown } from '@/lib/badgeEngine';
import { Trade } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import ShareModal from '@/components/ShareModal';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Legend,
} from 'recharts';
import { X, Share2 } from 'lucide-react';

const CHART_COLORS = ['#1A6BFF', '#6C3AFF', '#00D4AA', '#FF4757', '#FFB800', '#FF6B9D', '#00BCD4', '#8BC34A'];
const tooltipStyle = {
  background: '#0A1628',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
};

export default function Analytics() {
  const { user, accounts, activeAccounts } = useAuth();
  // État pour la modale du meilleur trade (cliquable)
  const [showBestTrade, setShowBestTrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [chartView, setChartView] = useState<'area' | 'bar' | 'distribution'>('area');
  const { mode, formatResult } = useDisplayMode();
const capital = useMemo(() => {
  const targets = activeAccounts.length > 0 ? activeAccounts : accounts;
  if (targets.length === 0) return 0;
  return targets.reduce((sum, acc) => sum + Number(acc.capital || 0), 0);
}, [activeAccounts, accounts, user]);

  // â”€â”€ Trades filtrés par le sidebar (activeAccounts) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const trades = useFilteredTrades();

  const closed  = useMemo(() => trades.filter(t => t.status !== 'RUNNING').map(t => {
    if (t.resultR !== 0) return t;
    const acc = accounts.find(a => String(a.id) === String(t.accountId || (t as any).trading_account_id));
    const cap = Number(acc?.capital) || capital || 10000;
    const riskDollar = cap * 0.01;
    if (riskDollar === 0) return t;
    const computedR = Math.round((t.resultDollar / riskDollar) * 100) / 100;
    return { ...t, resultR: computedR };
  }), [trades, accounts, capital]);
  const wins    = useMemo(() => closed.filter(t => t.status === 'WIN'),  [closed]);
  const losses  = useMemo(() => closed.filter(t => t.status === 'LOSS'), [closed]);
  const be      = useMemo(() => closed.filter(t => t.status === 'BE'),   [closed]);

  // â”€â”€ Capital actuel + croissance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const capitalTotal  = closed.reduce((s, t) => s + t.resultDollar, 0);
  const capitalActuel = capital + capitalTotal;
  const croissancePct = capital > 0 ? ((capitalTotal / capital) * 100) : 0;

  // â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalR      = closed.reduce((s, t) => s + (t.resultR ?? 0), 0);
  const totalDollar = closed.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
  const winRate     = closed.length ? (wins.length / closed.length * 100) : 0;
  const pf          = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgR        = closed.length ? totalR / closed.length : 0;
  const maxWS       = getMaxWinStreak(closed);
  const maxLS       = getMaxLossStreak(closed);
  const maxDD = closed.length === 0 ? { r: 0, dollar: 0, pct: 0 } : getMaxDrawdown(closed, capital);
  const bestTrade   = closed.reduce<Trade | null>(
    (best, t) => t.resultR > (best?.resultR ?? -999) ? t : best, null
  );

  // â”€â”€ Format drawdown selon mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtDD = () => {
    if (mode === 'R')  return `${maxDD.r.toFixed(2)}R`;
    if (mode === '$')  return `$${maxDD.dollar.toFixed(0)}`;
    return `${maxDD.pct.toFixed(2)}%`;
  };
  const modeUnit = mode === 'R' ? 'R' : mode === '$' ? '$' : '%';
  const modeKey  = mode === 'R' ? 'r' : mode === '$' ? 'd' : 'p';

  // â”€â”€ Données graphiques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sortedClosed = useMemo(() =>
    [...closed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [closed]);

  const cumData = useMemo(() => {
    let cumR = 0, cumD = 0;
    return sortedClosed.map(t => {
      cumR += t.resultR; cumD += t.resultDollar;
      return {
        date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }),
        r: Math.round(cumR * 100) / 100,
        d: Math.round(cumD * 100) / 100,
        p: Math.round((cumD / capital * 100) * 100) / 100,
      };
    });
  }, [sortedClosed, capital]);

  const dayData = useMemo(() => {
    const days: Record<string, { r: number; d: number }> = {
      Lun: { r: 0, d: 0 }, Mar: { r: 0, d: 0 }, Mer: { r: 0, d: 0 },
      Jeu: { r: 0, d: 0 }, Ven: { r: 0, d: 0 },
    };
    closed.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in days) { days[name].r += t.resultR; days[name].d += t.resultDollar; }
    });
    return Object.entries(days).map(([day, v]) => ({
      day,
      r: Math.round(v.r * 100) / 100,
      d: Math.round(v.d * 100) / 100,
      p: Math.round((v.d / capital * 100) * 100) / 100,
    }));
  }, [closed, capital]);

  const pairData = useMemo(() => {
    const map: Record<string, { r: number; d: number }> = {};
    closed.forEach(t => {
      if (!map[t.pair]) map[t.pair] = { r: 0, d: 0 };
      map[t.pair].r += t.resultR; map[t.pair].d += t.resultDollar;
    });
    return Object.entries(map).map(([pair, v]) => ({
      pair,
      r: Math.round(v.r * 100) / 100,
      d: Math.round(v.d * 100) / 100,
      p: Math.round((v.d / capital * 100) * 100) / 100,
    })).sort((a, b) => b.r - a.r);
  }, [closed, capital]);

  const sessionData = useMemo(() => {
    const map: Record<string, number> = {};
    closed.forEach(t => { map[t.session] = (map[t.session] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [closed]);

  const setupData = useMemo(() => {
    const map: Record<string, { r: number; count: number; wins: number }> = {};
    closed.forEach(t => {
      if (!map[t.setup]) map[t.setup] = { r: 0, count: 0, wins: 0 };
      map[t.setup].r += t.resultR; map[t.setup].count++;
      if (t.status === 'WIN') map[t.setup].wins++;
    });
    return Object.entries(map).map(([setup, d]) => ({
      setup, r: Math.round(d.r * 100) / 100, count: d.count,
      winRate: Math.round((d.wins / d.count) * 100),
      avgR: Math.round((d.r / d.count) * 100) / 100,
    })).sort((a, b) => b.r - a.r);
  }, [closed]);

  const emotionData = useMemo(() => {
    const map: Record<string, { r: number; d: number }> = {};
    closed.forEach(t => {
      if (!map[t.emotion]) map[t.emotion] = { r: 0, d: 0 };
      map[t.emotion].r += t.resultR; map[t.emotion].d += t.resultDollar;
    });
    return Object.entries(map).map(([emotion, v]) => ({
      emotion,
      r: Math.round(v.r * 100) / 100,
      d: Math.round(v.d * 100) / 100,
      p: Math.round((v.d / capital * 100) * 100) / 100,
    }));
  }, [closed, capital]);

  const statusData = [
    { name: 'WIN',  value: wins.length },
    { name: 'LOSS', value: losses.length },
    { name: 'BE',   value: be.length },
  ];

  // â”€â”€ Indicateur comptes actifs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activeLabel = activeAccounts.length === 0
    ? 'Tous les comptes'
    : activeAccounts.length === 1
      ? activeAccounts[0].name
      : `${activeAccounts.length} comptes`;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Analyse approfondie de ta performance</p>
      </div>
      <GlassCard className="animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'}, {user!.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString('fr', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-muted-foreground text-sm mt-2 italic">"Planifie ton trade. Trade ton plan."</p>
          </div>
          <div className="flex items-center gap-3"><DisplayModeToggle /><button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-white hover:opacity-90 transition-all"><Share2 size={15} /> Partager</button></div>
        </div>
      </GlassCard>
      {/* â”€â”€ KPI ROW 1 (compact) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="animate-fade-up stagger-1 !py-3 !px-4 relative overflow-hidden"
          style={{ boxShadow: totalR >= 0 ? '0 0 16px rgba(0,212,170,0.08)' : '0 0 16px rgba(255,59,92,0.08)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="14" height="14" fill="none" stroke="#1A6BFF" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Trades clôturés</p>
          <p className="metric-value text-xl font-bold text-foreground mt-0.5">{closed.length}</p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-2 !py-3 !px-4 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="14" height="14" fill="none" stroke={winRate >= 50 ? '#00D4AA' : '#FF3B5C'} strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Win Rate</p>
          <p className={`metric-value text-xl font-bold mt-0.5 ${winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
            {winRate.toFixed(0)}%
          </p>
          <div className="h-1 rounded-full bg-accent mt-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width:`${winRate}%`, background: winRate >= 50 ? '#00D4AA' : '#FF3B5C' }} />
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-3 !py-3 !px-4 relative overflow-hidden"
          style={{ boxShadow: totalR >= 0 ? '0 0 16px rgba(0,212,170,0.12)' : '0 0 16px rgba(255,59,92,0.12)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="14" height="14" fill="none" stroke={totalR >= 0 ? '#00D4AA' : '#FF3B5C'} strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">P&L Total</p>
          <p className={`metric-value text-xl font-bold mt-0.5 ${totalDollar > 0 ? 'text-success' : totalDollar < 0 ? 'text-destructive' : 'text-warning'}`}>
            {formatResult(totalR, totalDollar, capital)}
          </p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-4 !py-3 !px-4 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="14" height="14" fill="none" stroke={pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C'} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Profit Factor</p>
          <p className={`metric-value text-xl font-bold mt-0.5 ${pf >= 1.5 ? 'text-success' : pf >= 1 ? 'text-warning' : 'text-destructive'}`}>
            {pf.toFixed(2)}
          </p>
          <div className="h-1 rounded-full bg-accent mt-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width:`${Math.min(pf/3*100,100)}%`, background: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C' }} />
          </div>
        </GlassCard>
      </div>

{/* ── CAPITAL + CROISSANCE + KPI ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="animate-fade-up !p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Capital initial</p>
          <p className="metric-value text-2xl text-foreground mt-1">${capital.toLocaleString('fr')}</p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-1 !p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Croissance</p>
          <p className={`metric-value text-2xl mt-1 ${croissancePct >= 0 ? 'text-success' : 'text-destructive'}`}>
            {croissancePct >= 0 ? '+' : ''}{croissancePct.toFixed(2)}%
          </p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-2 !p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none rounded-2xl" />
          <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center mb-2">
            <svg width="11" height="11" fill="none" stroke="#FF6B35" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
              <polyline points="17 18 23 18 23 12"/>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Drawdown</p>
          <p className={`metric-value text-3xl mt-1 ${maxDD.dollar > 5 ? 'text-destructive' : 'text-warning'}`}>
            {fmtDD()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">affiché en {modeUnit}</p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-3 !p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent pointer-events-none rounded-2xl" />
          <div className="w-6 h-6 rounded-lg bg-blue-400/15 flex items-center justify-center mb-2">
            <svg width="11" height="11" fill="none" stroke="#60A5FA" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">R Moyen / Trade</p>
          <p className={`metric-value text-3xl mt-1 ${avgR >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatResult(avgR, avgR * capital * 0.01, capital)}
          </p>
          <div className="mt-2 h-0.5 w-8 rounded-full bg-blue-400/50" />
        </GlassCard>
      </div>

      {/* Meilleur Trade "” cliquable pour voir le détail */}
      {bestTrade && (
        <GlassCard glow="gold" className="animate-fade-up cursor-pointer hover:border-warning/30 transition-all" onClick={() => setShowBestTrade(true)}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-warning uppercase tracking-wide">⭐ Meilleur Trade</p>
            <span className="text-xs text-muted-foreground hover:text-primary transition-colors">Voir détail ←’</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-foreground font-bold text-lg">{bestTrade.pair}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${bestTrade.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
              {bestTrade.direction}
            </span>
            <span className="text-success metric-value text-xl">
              {formatResult(bestTrade.resultR, bestTrade.resultDollar, capital)}
            </span>
            <span className="text-muted-foreground text-xs">
              {bestTrade.setup} Â· {new Date(bestTrade.date).toLocaleDateString('fr')}
            </span>
          </div>
        </GlassCard>
      )}

      {/* â”€â”€ MODALE DÉTAIL MEILLEUR TRADE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showShare && <ShareModal onClose={() => setShowShare(false)} trades={trades} user={user!} capital={capital} accounts={accounts} />}{showBestTrade && bestTrade && (
        <div className="modal-overlay" onClick={() => setShowBestTrade(false)}>
          <div className="modal-content glass p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-foreground text-lg gradient-text">
                â­ {bestTrade.pair} "” {bestTrade.direction}
              </h3>
              <button onClick={() => setShowBestTrade(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Date',    val: new Date(bestTrade.date).toLocaleString('fr') },
                { label: 'Session', val: bestTrade.session },
                { label: 'Setup',   val: bestTrade.setup },
                { label: 'Émotion', val: bestTrade.emotion },
                { label: 'Entrée',  val: bestTrade.entryPrice },
                { label: 'SL',      val: bestTrade.stopLoss },
                { label: 'TP',      val: bestTrade.takeProfit },
                { label: 'Sortie',  val: bestTrade.exitPrice || '"”' },
                { label: 'Durée',   val: `${bestTrade.duration} min` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{String(val)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Résultat</span>
                <span className="text-success metric-value">
                  {formatResult(bestTrade.resultR, bestTrade.resultDollar, capital)}
                </span>
              </div>
              {bestTrade.entryNote && (
                <div className="pt-1">
                  <p className="text-muted-foreground text-xs mb-1">Note d'entrée</p>
                  <p className="text-foreground bg-accent/30 rounded-lg p-3 text-sm">{bestTrade.entryNote}</p>
                </div>
              )}
              {bestTrade.screenshot && (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-2">Capture</p>
                  <img src={bestTrade.screenshot} alt="Capture" className="rounded-xl w-full object-cover max-h-60" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ GRAPHIQUES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Equity Curve</h3>
            <div className="flex items-center gap-1.5">
              {(['area','bar','distribution'] as const).map((v, i) => {
                const labels = ['Equity Curve', 'Performance', 'Distribution'];
                return (
                  <button key={v} onClick={() => setChartView(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      chartView === v
                        ? 'gradient-primary text-white shadow-sm'
                        : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    }`}>
                    {labels[i]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-[220px]">
            {chartView === 'area' && (() => {
              const vals = cumData.map(d => d[modeKey as keyof typeof d] as number);
              const minVal = Math.min(0, ...vals);
              const maxVal = Math.max(0, ...vals);
              const range = maxVal - minVal || 1;
              const zeroOffset = maxVal / range;
              const last = cumData[cumData.length - 1];
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumData}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                        <stop offset={`${zeroOffset * 100}%`} stopColor="#00D4AA" stopOpacity={0.1} />
                        <stop offset={`${zeroOffset * 100}%`} stopColor="#FF3B5C" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#FF3B5C" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="equityStroke" x1="0" y1="0" x2="0" y2="1">
                        <stop offset={`${zeroOffset * 100}%`} stopColor="#00D4AA" />
                        <stop offset={`${zeroOffset * 100}%`} stopColor="#FF3B5C" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v:number) => [`${v.toFixed(2)}${modeUnit}`,'Cumul']} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey={modeKey} stroke="url(#equityStroke)" strokeWidth={2.5}
                      strokeLinecap="round" fill="url(#equityGrad)" isAnimationActive animationDuration={1800} />
                    {last && (
                      <ReferenceDot x={last.date} y={last[modeKey as keyof typeof last] as number}
                        r={5} fill={last[modeKey as keyof typeof last] as number >= 0 ? '#00D4AA' : '#FF3B5C'}
                        stroke="white" strokeWidth={2} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v:number) => [`${v.toFixed(2)}${modeUnit}`,'P&L']} />
                  <Bar dataKey={modeKey} radius={[6,6,0,0]} isAnimationActive animationDuration={1500}>
                    {dayData.map((entry,i) => <Cell key={i} fill={entry.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {chartView === 'distribution' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="setup" tick={{ fill:'#8899AA', fontSize:10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v:number) => [`${v.toFixed(2)}R`,'P&L']} />
                  <Bar dataKey="r" radius={[0,6,6,0]} isAnimationActive animationDuration={1500}>
                    {setupData.map((e,i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Performance par jour</h3>
            <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-lg">{modeUnit}</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}${modeUnit}`, 'P&L']} />
                <Bar dataKey={modeKey} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1500}>
                  {dayData.map((entry, i) => <Cell key={i} fill={entry.r >= 0 ? '#00D4AA' : '#FF4757'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Performance par paire</h3>
            <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-lg">{modeUnit}</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pairData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="pair" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}${modeUnit}`, 'P&L']} />
                <Bar dataKey={modeKey} radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1500}>
                  {pairData.map((entry, i) => <Cell key={i} fill={entry.r >= 0 ? '#00D4AA' : '#FF4757'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Trades par session</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sessionData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70}
                  isAnimationActive animationDuration={1500}>
                  {sessionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend layout="horizontal" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Performance par émotion</h3>
            <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-lg">{modeUnit}</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="emotion" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}${modeUnit}`, 'P&L']} />
                <Bar dataKey={modeKey} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1500}>
                  {emotionData.map((entry, i) => <Cell key={i} fill={entry.r >= 0 ? '#6C3AFF' : '#FF4757'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Distribution Win / Loss / BE</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70}
                  isAnimationActive animationDuration={1500}>
                  <Cell fill="#00D4AA" />
                  <Cell fill="#FF4757" />
                  <Cell fill="#8899AA" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend layout="horizontal" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Tableau par setup */}
      <GlassCard>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Performance par Setup</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Setup', 'Trades', 'Win Rate', 'R Moyen', 'R Total'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setupData.map(s => (
                <tr key={s.setup} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground">{s.setup || 'Pas encore défini'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.count}</td>
                  <td className="px-4 py-2.5 text-foreground">{s.winRate}%</td>
                  <td className={`px-4 py-2.5 metric-value ${s.avgR >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {s.avgR >= 0 ? '+' : ''}{s.avgR}R
                  </td>
                  <td className={`px-4 py-2.5 metric-value ${s.r >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {s.r >= 0 ? '+' : ''}{s.r}R
                  </td>
                </tr>
              ))}
              {setupData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Aucun trade clôturé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}




