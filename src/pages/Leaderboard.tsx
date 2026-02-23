import { useMemo, useState } from 'react';
import { StorageManager } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { calculateBadges, getMaxWinStreak } from '@/lib/badgeEngine';
import { AFRICAN_COUNTRIES, COUNTRY_FLAGS } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { X, Trophy, Medal, Award, TrendingUp, BarChart2, Target, Zap } from 'lucide-react';

type SortKey = 'winRate' | 'totalR' | 'pf' | 'trades' | 'avgR';

// ── Icônes podium SVG (or / argent / bronze) sans emoji ──────────────────────
function PodiumIcon({ rank }: { rank: 1 | 2 | 3 }) {
  const configs = {
    1: { Icon: Trophy,  color: '#F59E0B', glow: 'rgba(245,158,11,0.35)',  size: 32 },
    2: { Icon: Medal,   color: '#94A3B8', glow: 'rgba(148,163,184,0.25)', size: 28 },
    3: { Icon: Award,   color: '#C2703A', glow: 'rgba(194,112,58,0.25)',  size: 26 },
  };
  const { Icon, color, size } = configs[rank];
  return <Icon size={size} style={{ color }} />;
}

// ── Badge design sans emoji ───────────────────────────────────────────────────
function BadgePill({ name, description }: { name: string; description: string }) {
  return (
    <span
      title={description}
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/8 text-primary font-medium"
    >
      <Zap size={9} />
      {name}
    </span>
  );
}

// ── Panneau détail trader ─────────────────────────────────────────────────────
interface TraderStats {
  user: { name: string; country: string; email: string };
  trades: number;
  winRate: number;
  totalR: number;
  pf: number;
  avgR: number;
  badges: { id: string; name: string; emoji: string; description: string }[];
  bestStreak: number;
}

function TraderDetail({ stats, onClose }: { stats: TraderStats; onClose: () => void }) {
  const kpis = [
    { label: 'Win Rate',        value: `${stats.winRate.toFixed(1)}%`,   icon: Target,   positive: stats.winRate >= 50 },
    { label: 'Total P&L',       value: `${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(1)}R`, icon: TrendingUp, positive: stats.totalR >= 0 },
    { label: 'Profit Factor',   value: stats.pf.toFixed(2),              icon: BarChart2, positive: stats.pf >= 1 },
    { label: 'R Moyen/Trade',   value: `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, icon: Zap, positive: stats.avgR >= 0 },
    { label: 'Trades réalisés', value: stats.trades.toString(),           icon: BarChart2, positive: true },
    { label: 'Meilleure série', value: `${stats.bestStreak} WIN consécutifs`, icon: Trophy, positive: true },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-foreground">
              {stats.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{stats.user.name}</h3>
              <p className="text-sm text-muted-foreground">
                {COUNTRY_FLAGS[stats.user.country] || ''} {stats.user.country}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* KPIs — uniquement R et % */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {kpis.map(({ label, value, icon: Icon, positive }) => (
            <div key={label} className="p-3 rounded-xl bg-accent/40 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
              </div>
              <p className={`text-sm font-bold metric-value ${positive ? 'text-foreground' : 'text-destructive'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Badges */}
        {stats.badges.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Badges</p>
            <div className="flex flex-wrap gap-2">
              {stats.badges.map(b => (
                <BadgePill key={b.id} name={b.name} description={b.description} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Leaderboard ──────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [sortBy, setSortBy] = useState<SortKey>('totalR');
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<TraderStats | null>(null);

  const rankings = useMemo(() => {
    const users = StorageManager.getUsers().filter(u => u.isPublic);
    const allTrades = StorageManager.getAllTrades();

    return users
      .map(u => {
        const trades = allTrades.filter(t => t.userId === u.email && t.status !== 'RUNNING');
        const wins = trades.filter(t => t.status === 'WIN');
        const losses = trades.filter(t => t.status === 'LOSS');
        const winRate = trades.length ? (wins.length / trades.length * 100) : 0;
        const totalR = trades.reduce((s, t) => s + t.resultR, 0);
        const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
        const grossLoss = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
        const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
        const avgR = trades.length ? totalR / trades.length : 0;
        const badges = calculateBadges(trades);
        const bestStreak = getMaxWinStreak(trades);

        return { user: u, trades: trades.length, winRate, totalR, pf, avgR, badges, bestStreak };
      })
      .filter(r => !countryFilter || r.user.country === countryFilter)
      .sort((a, b) => {
        switch (sortBy) {
          case 'winRate': return b.winRate - a.winRate;
          case 'totalR':  return b.totalR - a.totalR;
          case 'pf':      return b.pf - a.pf;
          case 'trades':  return b.trades - a.trades;
          case 'avgR':    return b.avgR - a.avgR;
          default:        return 0;
        }
      })
      .slice(0, 20);
  }, [sortBy, countryFilter]);

  const podium = rankings.slice(0, 3);
  const rest   = rankings.slice(3);

  const podiumBorder = [
    'border-yellow-500/40 shadow-[0_0_24px_rgba(245,158,11,0.2)]',
    'border-slate-400/30',
    'border-orange-700/30',
  ];

  const handleRowClick = (r: typeof rankings[0]) => {
    setSelectedTrader({
      user: r.user,
      trades: r.trades,
      winRate: r.winRate,
      totalR: r.totalR,
      pf: r.pf,
      avgR: r.avgR,
      badges: r.badges,
      bestStreak: r.bestStreak,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Classement MITrad</h1>
        <p className="text-muted-foreground text-sm mt-1">Les meilleurs traders de la communauté</p>
      </div>

      {/* Filtres */}
      <GlassCard className="animate-fade-up">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs text-muted-foreground mr-2">Trier par :</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="select-dark text-xs py-1.5 w-auto inline-block"
            >
              <option value="totalR">P&L en R</option>
              <option value="winRate">Win Rate</option>
              <option value="pf">Profit Factor</option>
              <option value="trades">Total Trades</option>
              <option value="avgR">R Moyen/Trade</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mr-2">Pays :</label>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="select-dark text-xs py-1.5 w-auto inline-block"
            >
              <option value="">Tous les pays</option>
              {AFRICAN_COUNTRIES.map(c => (
                <option key={c} value={c}>{COUNTRY_FLAGS[c] || ''} {c}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* ── Podium ─────────────────────────────────────────────────────────── */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {podium.map((r, idx) => (
            <GlassCard
              key={r.user.email}
              onClick={() => handleRowClick(r)}
              className={`text-center border cursor-pointer hover:border-primary/30 transition-all ${podiumBorder[idx]} animate-fade-up stagger-${idx + 1} ${r.user.email === currentUser?.email ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Icône trophée SVG */}
              <div className="flex justify-center mb-2">
                <PodiumIcon rank={(idx + 1) as 1 | 2 | 3} />
              </div>

              {/* Avatar */}
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold mx-auto mb-3 text-foreground">
                {r.user.name.charAt(0).toUpperCase()}
              </div>

              <h3 className="font-bold text-foreground">{r.user.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {COUNTRY_FLAGS[r.user.country] || ''} {r.user.country}
              </p>

              {/* Stats — uniquement R et % */}
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-muted-foreground">
                  Win Rate : <span className="text-foreground font-bold">{r.winRate.toFixed(0)}%</span>
                </p>
                <p className="text-muted-foreground">
                  P&L :{' '}
                  <span className={`font-bold ${r.totalR >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {r.totalR >= 0 ? '+' : ''}{r.totalR.toFixed(1)}R
                  </span>
                </p>
                <p className="text-muted-foreground">
                  PF : <span className="text-foreground font-bold">{r.pf.toFixed(2)}</span>
                </p>
              </div>

              {/* Badges design (sans emoji) */}
              {r.badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {r.badges.slice(0, 3).map(b => (
                    <BadgePill key={b.id} name={b.name} description={b.description} />
                  ))}
                  {r.badges.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5">+{r.badges.length - 3}</span>
                  )}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground/60 mt-3">Cliquer pour les détails</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ── Reste du classement ───────────────────────────────────────────── */}
      {rest.length > 0 && (
        <GlassCard className="animate-fade-up overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['#', 'Trader', 'Pays', 'Trades', 'Win Rate', 'P&L (R)', 'PF', 'Badges'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rest.map((r, idx) => (
                <tr
                  key={r.user.email}
                  onClick={() => handleRowClick(r)}
                  className={`border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer ${r.user.email === currentUser?.email ? 'bg-primary/10' : ''}`}
                >
                  <td className="px-4 py-3 font-bold text-muted-foreground">{idx + 4}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {r.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{r.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {COUNTRY_FLAGS[r.user.country] || ''} {r.user.country}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.trades}</td>
                  <td className="px-4 py-3 text-foreground">{r.winRate.toFixed(0)}%</td>
                  <td className={`px-4 py-3 metric-value ${r.totalR >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {r.totalR >= 0 ? '+' : ''}{r.totalR.toFixed(1)}R
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.pf.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.badges.slice(0, 2).map(b => (
                        <BadgePill key={b.id} name={b.name} description={b.description} />
                      ))}
                      {r.badges.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{r.badges.length - 2}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Empty state */}
      {rankings.length === 0 && (
        <GlassCard className="text-center py-14">
          <Trophy size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Aucun trader public{countryFilter ? ` en ${countryFilter}` : ''} pour le moment.
          </p>
        </GlassCard>
      )}

      {/* Panneau détail trader */}
      {selectedTrader && (
        <TraderDetail stats={selectedTrader} onClose={() => setSelectedTrader(null)} />
      )}
    </div>
  );
}