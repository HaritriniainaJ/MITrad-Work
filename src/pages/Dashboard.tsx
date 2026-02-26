import { useMemo, useState, useEffect } from 'react';
import { getAccounts } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDisplayMode } from '@/context/DisplayModeContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import GlassCard from '@/components/GlassCard';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3 } from 'lucide-react';

const QUOTES = [
  "L'objectif d'un trader performant est de prendre les meilleurs trades. L'argent est secondaire.",
  "Le risque vient de ne pas savoir ce que tu fais.",
  "Planifie ton trade. Trade ton plan.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { formatResult } = useDisplayMode();
  const [quoteIdx] = useState(Math.floor(Date.now() / 60000) % QUOTES.length);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  useEffect(() => {
    getAccounts().then(data => {
      setAccounts(data);
      if (data.length > 0) setSelectedAccountId(data[0].id);
    });
  }, []);

  const trades = useFilteredTrades();

  const now = new Date();
  const monthTrades = useMemo(() =>
    trades.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [trades]);
  
  const closedMonth = monthTrades.filter(t => t.status !== 'RUNNING');
  const winsMonth = closedMonth.filter(t => t.status === 'WIN');
  const lossesMonth = closedMonth.filter(t => t.status === 'LOSS');
  const winRate = closedMonth.length ? (winsMonth.length / closedMonth.length * 100) : 0;
  const totalR = closedMonth.reduce((s, t) => s + t.resultR, 0);
  const totalDollar = closedMonth.reduce((s, t) => s + t.resultDollar, 0);
  const grossProfit = winsMonth.reduce((s, t) => s + t.resultR, 0);
  const grossLoss = Math.abs(lossesMonth.reduce((s, t) => s + t.resultR, 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  const goalR = user!.monthlyGoalR || 0;
  const goalProgress = goalR > 0 ? Math.max(0, Math.min(100, (totalR / goalR) * 100)) : 0;

  const cumData = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.status !== 'RUNNING')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
    let cum = 0;
    return sorted.map(t => {
      cum += t.resultR;
      return { date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }), r: Math.round(cum * 100) / 100 };
    });
  }, [trades]);

  const dayData = useMemo(() => {
    const days: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    trades.filter(t => t.status !== 'RUNNING').forEach(t => {
      const d = new Date(t.date).getDay();
      const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const n = names[d];
      if (n in days) days[n] += t.resultR;
    });
    return Object.entries(days).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100 }));
  }, [trades]);

  const recentTrades = trades.slice(0, 5);
  const allClosedTrades = trades.filter(t => t.status !== 'RUNNING');
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

// Capital de base = compte sélectionné
const selectedAccount = accounts.find(a => a.id === selectedAccountId);
const capitalInitial = selectedAccount?.capital || user?.capital || 0;


const capitalTotal = trades.filter(t => t.status !== 'RUNNING').reduce((s, t) => s + Number(t.resultDollar), 0);
const capitalActuel = Number(user?.capital || 0) + Number(capitalTotal || 0);
const croissancePct = capitalInitial > 0 ? ((capitalTotal / capitalInitial) * 100) : 0;

  const kpis = [
    { label: 'Trades ce mois', value: closedMonth.length, icon: Activity, change: null },
    { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, icon: Target, change: winRate >= 50 ? 'up' : 'down' },
    { label: 'P&L', value: formatResult(totalR, totalDollar, user?.capital), icon: TrendingUp, change: totalR >= 0 ? 'up' : 'down' },
    { label: 'Profit Factor', value: pf.toFixed(2), icon: BarChart3, change: pf >= 1.5 ? 'up' : 'down' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de ton trading</p>
      </div>

      <GlassCard className="animate-fade-up">
        <h2 className="text-xl font-bold text-foreground">{greeting}, {user!.name}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {now.toLocaleDateString('fr', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-muted-foreground text-sm mt-2 italic">"{QUOTES[quoteIdx]}"</p>
      </GlassCard>

      {goalR > 0 && (
        <GlassCard className="animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Objectif mensuel</p>
            <Link to="/settings" className="text-xs text-primary hover:underline">Modifier</Link>
          </div>
          <p className="text-sm text-foreground mb-2">
            Objectif : +{goalR}R · Actuel : {totalR >= 0 ? '+' : ''}{totalR.toFixed(1)}R · {goalProgress.toFixed(0)}% atteint
          </p>
          <div className="h-3 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-1000"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <GlassCard key={kpi.label} className={`animate-fade-up stagger-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="metric-value text-2xl text-foreground">{kpi.value}</span>
              {kpi.change && (
                kpi.change === 'up'
                  ? <TrendingUp size={16} className="text-success" />
                  : <TrendingDown size={16} className="text-destructive" />
              )}
            </div>
          </GlassCard>
        ))}
      </div>


      {/* ── CAPITAL ACTUEL + CROISSANCE ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="animate-fade-up">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital initial</p>
          <p className="metric-value text-2xl text-foreground">${capitalInitial.toLocaleString('fr')}</p>
        </GlassCard>
        <GlassCard className="animate-fade-up stagger-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">P&L cumulé</p>
          <p className={`metric-value text-2xl ${capitalTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
            {capitalTotal >= 0 ? '+' : ''}${capitalTotal.toFixed(0)}
          </p>
        </GlassCard>
        <GlassCard className="animate-fade-up stagger-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capital actuel</p>
          <p className="metric-value text-2xl text-foreground">${capitalActuel.toFixed(0)}</p>
          <div className={`text-xs mt-1 font-bold ${croissancePct >= 0 ? 'text-success' : 'text-destructive'}`}>
            {croissancePct >= 0 ? '▲' : '▼'} Croissance : {croissancePct >= 0 ? '+' : ''}{croissancePct.toFixed(2)}%
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="animate-fade-up">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">R Cumulatif (30 derniers trades)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#8899AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff' }} />
                <Line type="monotone" dataKey="r" stroke="#1A6BFF" strokeWidth={2} dot={false} animationDuration={2000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Performance par jour</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#8899AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff' }} />
                <Bar dataKey="r" fill="#1A6BFF" radius={[6, 6, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Trades récents</h3>
          <Link to="/history" className="text-xs text-primary hover:underline">Voir tout</Link>
        </div>
        <div className="space-y-2">
          {recentTrades.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                  {t.direction}
                </span>
                <span className="text-sm font-medium text-foreground">{t.pair}</span>
                <span className="text-xs text-muted-foreground">{t.setup}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`metric-value text-sm ${t.resultR >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatResult(t.resultR, t.resultDollar, user?.capital)}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  t.status === 'WIN' ? 'badge-win' : t.status === 'LOSS' ? 'badge-loss' : 'badge-be'
                }`}>{t.status}</span>
              </div>
            </div>
          ))}
          {recentTrades.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Aucun trade pour le moment. Commence à enregistrer !</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}