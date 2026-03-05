import { useState, useMemo } from 'react';
import { X, Calendar, Check, ExternalLink, ChevronDown } from 'lucide-react';
import { Trade, TradingAccount } from '@/types/trading';
import { calculateBadges } from '@/lib/badgeEngine';
import { useDisplayMode } from '@/context/DisplayModeContext';

interface ShareModalProps {
  onClose: () => void;
  trades: Trade[];
  user: { name: string; avatar?: string };
  capital: number;
  accounts: TradingAccount[];
}

const getLevel = (pct: number | null) => {
  if (pct === null || pct < 0) return { emoji: '🌱', label: 'Starter',   color: '#8B9BB4', bg: '#1E2A3A', border: '#2A3A50' };
  if (pct < 10)                return { emoji: '⚡', label: 'Rising',    color: '#EAB308', bg: '#2A2A0A', border: '#4A4A10' };
  if (pct < 30)                return { emoji: '🔥', label: 'Confirmed', color: '#F97316', bg: '#2A1A0A', border: '#4A2A10' };
  if (pct < 60)                return { emoji: '💎', label: 'Pro',       color: '#3B82F6', bg: '#0A1A2A', border: '#102A4A' };
  if (pct < 100)               return { emoji: '👑', label: 'Elite',     color: '#A855F7', bg: '#1A0A2A', border: '#2A1040' };
  return                              { emoji: '🚀', label: 'Legend',   color: '#1A6BFF', bg: '#0A1A2A', border: '#1040AA' };
};

const BADGE_MAP: Record<string, { emoji: string; name: string }> = {
  sniper: { emoji: '🎯', name: 'Sniper' }, diamond: { emoji: '💎', name: 'Diamond Hands' },
  fire: { emoji: '🔥', name: 'On Fire' }, speed: { emoji: '⚡', name: 'Speed Trader' },
  lion: { emoji: '🦁', name: 'Lion' }, strategist: { emoji: '🧠', name: 'Strategist' },
  consistent: { emoji: '📅', name: 'Consistent' }, rookie: { emoji: '🚀', name: 'Rookie Star' },
  icecold: { emoji: '❄️', name: 'Ice Cold' }, champion: { emoji: '🏆', name: 'Champion' },
};

export default function ShareModal({ onClose, trades, user, capital, accounts }: ShareModalProps) {
  const today         = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom]               = useState(thirtyDaysAgo);
  const [dateTo, setDateTo]                   = useState(today);
  const [selectedAccIds, setSelectedAccIds]   = useState<string[]>([]);
  const [showAccDropdown, setShowAccDropdown] = useState(false);
  const { formatResult, mode } = useDisplayMode();

  const activeAccs      = selectedAccIds.length === 0 ? accounts : accounts.filter(a => selectedAccIds.includes(String(a.id)));
  const capitalSelected = activeAccs.reduce((s, a) => s + Number(a.capital || 0), 0) || capital;

  const filtered = useMemo(() => trades.filter(t => {
    if (t.status === 'RUNNING') return false;
    const d = (t.date || '').split('T')[0];
    if (d < dateFrom || d > dateTo) return false;
    if (selectedAccIds.length === 0) return true;
    const tid = String((t as any).accountId || (t as any).trading_account_id || '');
    return selectedAccIds.includes(tid);
  }), [trades, dateFrom, dateTo, selectedAccIds]);

  const filledTrades = useMemo(() => filtered.map(t => {
    if (t.resultR !== 0 && t.resultR != null) return t;
    const acc = accounts.find(a => String(a.id) === String((t as any).accountId || (t as any).trading_account_id));
    const cap = Number(acc?.capital) || capitalSelected || 10000;
    const riskDollar = cap * 0.01;
    if (riskDollar === 0) return t;
    return { ...t, resultR: Math.round((t.resultDollar / riskDollar) * 100) / 100 };
  }), [filtered, accounts, capitalSelected]);

  const wins        = filledTrades.filter(t => t.status === 'WIN');
  const losses      = filledTrades.filter(t => t.status === 'LOSS');
  const totalR      = filledTrades.reduce((s, t) => s + (t.resultR ?? 0), 0);
  const totalDollar = filledTrades.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const winRate     = filledTrades.length ? (wins.length / filledTrades.length * 100) : 0;
  const grossProfit = wins.reduce((s, t) => s + (t.resultR ?? 0), 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.resultR ?? 0), 0));
  const pf          = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgR        = filledTrades.length ? totalR / filledTrades.length : 0;
  const croissance  = capitalSelected > 0 ? (totalDollar / capitalSelected * 100) : 0;
  const badges      = calculateBadges(filledTrades);
  const level       = getLevel(croissance);
  const isPos       = totalR >= 0;

  const fmtVal = (r: number, d: number) => formatResult(r, d, capitalSelected);

  const kpis = [
    { label: 'Win Rate',      value: `${winRate.toFixed(1)}%`,         color: winRate >= 50 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Profit Factor', value: pf.toFixed(2),                    color: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C' },
    { label: mode === 'R' ? 'R Total' : mode === '$' ? 'P&L $' : 'P&L %', value: fmtVal(totalR, totalDollar), color: isPos ? '#00D4AA' : '#FF3B5C' },
    { label: mode === 'R' ? 'R Moyen' : 'Moyen', value: fmtVal(avgR, totalDollar / (filledTrades.length || 1)), color: avgR >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Croissance',    value: `${croissance >= 0 ? '+' : ''}${croissance.toFixed(2)}%`, color: croissance >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Trades',        value: `${wins.length}W / ${losses.length}L`, color: '#8899AA' },
  ];

  const toggleAccount = (id: string) => setSelectedAccIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleOpen = () => {
    if (filledTrades.length === 0) return;

    const sorted = [...filledTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumR = 0;
    let cumD = 0;
    const equity = sorted.map(t => ({
      date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }),
      r: Math.round((cumR += t.resultR ?? 0) * 100) / 100,
      d: Math.round((cumD += t.resultDollar ?? 0) * 100) / 100,
    }));

    const dayMap: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    const dayMapD: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    filledTrades.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in dayMap) { dayMap[name] += t.resultR ?? 0; dayMapD[name] += t.resultDollar ?? 0; }
    });
    const dayPerf = Object.entries(dayMap).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100, d: Math.round((dayMapD[day] ?? 0) * 100) / 100 }));

    const pairMap: Record<string, number> = {};
    const pairMapD: Record<string, number> = {};
    filledTrades.forEach(t => { pairMap[t.pair] = (pairMap[t.pair] || 0) + (t.resultR ?? 0); pairMapD[t.pair] = (pairMapD[t.pair] || 0) + (t.resultDollar ?? 0); });
    const pairPerf = Object.entries(pairMap).map(([pair, r]) => ({ pair, r: Math.round(r * 100) / 100, d: Math.round((pairMapD[pair] ?? 0) * 100) / 100 })).sort((a, b) => b.r - a.r).slice(0, 6);

    const payload = {
      trader: user.name,
      avatar: user.avatar || null,
      dateFrom,
      dateTo,
      accountNames: activeAccs.map(a => a.name),
      level: { emoji: level.emoji, label: level.label, color: level.color, bg: level.bg, border: level.border },
      kpis,
      badges: badges.map(b => b.id),
      equity,
      dayPerf,
      pairPerf,
      isPos,
      mode,
    };

    const key = 'mitrad_report_' + Date.now();
    sessionStorage.setItem(key, JSON.stringify(payload));
    window.open(`/share/${key}`, '_blank');
  };

  const presets = [
    { label: '7J', days: 7 }, { label: '30J', days: 30 },
    { label: '90J', days: 90 }, { label: 'Tout', days: 3650 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.10)', padding: 0 }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/30 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">📊 Exporter mes performances</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Générez un rapport PDF professionnel</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent/40 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 px-6 py-5 space-y-4">

          {accounts.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Comptes</p>
              <div className="relative">
                <button onClick={() => setShowAccDropdown(v => !v)}
                  className="w-full flex items-center justify-between bg-accent/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors">
                  <span>{selectedAccIds.length === 0 ? `Tous les comptes (${accounts.length})` : `${selectedAccIds.length} compte${selectedAccIds.length > 1 ? 's' : ''} sélectionné${selectedAccIds.length > 1 ? 's' : ''}`}</span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showAccDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showAccDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl overflow-hidden shadow-xl z-50">
                    <button onClick={() => { setSelectedAccIds([]); setShowAccDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors ${selectedAccIds.length === 0 ? 'text-primary' : 'text-foreground'}`}>
                      <span>Tous les comptes</span>
                      {selectedAccIds.length === 0 && <Check size={13} className="text-primary" />}
                    </button>
                    <div className="border-t border-border/30" />
                    {accounts.map(acc => {
                      const id = String(acc.id);
                      const sel = selectedAccIds.includes(id);
                      return (
                        <button key={id} onClick={() => toggleAccount(id)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sel ? 'bg-primary border-primary' : 'border-border/60'}`}>
                              {sel && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-foreground">{acc.name}</span>
                            <span className="text-xs text-muted-foreground">${Number(acc.capital).toLocaleString('fr')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <Calendar size={11} /> Période
            </p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {presets.map(p => (
                <button key={p.label} onClick={() => { setDateFrom(new Date(Date.now() - p.days * 86400000).toISOString().split('T')[0]); setDateTo(today); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/40 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['Du', dateFrom, setDateFrom], ['Au', dateTo, setDateTo]] as const).map(([label, val, setter]) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input type="date" value={val} onChange={e => setter(e.target.value)}
                    className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {filledTrades.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm bg-accent/20 rounded-xl border border-border/30">
              Aucun trade sur cette période
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Aperçu — {filledTrades.length} trades</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {kpis.map(s => (
                  <div key={s.label} className="bg-accent/20 rounded-xl p-3 text-center border border-border/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: level.color, background: level.bg, borderColor: level.border }}>
                  {level.emoji} {level.label}
                </span>
                {badges.slice(0, 4).map(b => BADGE_MAP[b.id] && (
                  <span key={b.id} className="text-xs bg-accent/30 px-2.5 py-1 rounded-full text-foreground border border-border/20">
                    {BADGE_MAP[b.id].emoji} {BADGE_MAP[b.id].name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleOpen} disabled={filledTrades.length === 0}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              filledTrades.length === 0
                ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                : 'gradient-primary text-white hover:opacity-90'
            }`}>
            <ExternalLink size={16} /> Ouvrir le rapport PDF
          </button>
        </div>
      </div>
    </div>
  );
}
