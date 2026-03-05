import { useState, useMemo, useRef } from 'react';
import { X, Calendar, Check, Download, ChevronDown, Loader2 } from 'lucide-react';
import { Trade, TradingAccount } from '@/types/trading';
import { calculateBadges } from '@/lib/badgeEngine';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

interface ShareModalProps {
  onClose: () => void;
  trades: Trade[];
  user: { name: string; avatar?: string };
  capital: number;
  accounts: TradingAccount[];
}

// Niveaux identiques au profil
const getLevel = (pct: number | null) => {
  if (pct === null || pct < 0) return { emoji: '🌱', label: 'Starter',   bg: '#1E2A3A', color: '#8B9BB4', border: '#2A3A50' };
  if (pct < 10)                return { emoji: '⚡', label: 'Rising',    bg: '#2A2A0A', color: '#EAB308', border: '#4A4A10' };
  if (pct < 30)                return { emoji: '🔥', label: 'Confirmed', bg: '#2A1A0A', color: '#F97316', border: '#4A2A10' };
  if (pct < 60)                return { emoji: '💎', label: 'Pro',       bg: '#0A1A2A', color: '#3B82F6', border: '#102A4A' };
  if (pct < 100)               return { emoji: '👑', label: 'Elite',     bg: '#1A0A2A', color: '#A855F7', border: '#2A1040' };
  return                              { emoji: '🚀', label: 'Legend',   bg: '#0A1A2A', color: '#1A6BFF', border: '#1040AA' };
};

const BADGE_MAP: Record<string, { emoji: string; name: string }> = {
  sniper: { emoji: '🎯', name: 'Sniper' }, diamond: { emoji: '💎', name: 'Diamond Hands' },
  fire: { emoji: '🔥', name: 'On Fire' }, speed: { emoji: '⚡', name: 'Speed Trader' },
  lion: { emoji: '🦁', name: 'Lion' }, strategist: { emoji: '🧠', name: 'Strategist' },
  consistent: { emoji: '📅', name: 'Consistent' }, rookie: { emoji: '🚀', name: 'Rookie Star' },
  icecold: { emoji: '❄️', name: 'Ice Cold' }, champion: { emoji: '🏆', name: 'Champion' },
};

const tooltipStyle = { background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 11 };

export default function ShareModal({ onClose, trades, user, capital, accounts }: ShareModalProps) {
  const today         = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom]               = useState(thirtyDaysAgo);
  const [dateTo, setDateTo]                   = useState(today);
  const [selectedAccIds, setSelectedAccIds]   = useState<string[]>([]);
  const [showAccDropdown, setShowAccDropdown] = useState(false);
  const [exporting, setExporting]             = useState(false);
  const [showReport, setShowReport]           = useState(false);
  const reportRef                             = useRef<HTMLDivElement>(null);

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

  // Recalculer resultR si null (trades importés)
  const filledTrades = useMemo(() => filtered.map(t => {
    if (t.resultR !== 0 && t.resultR != null) return t;
    const cap = capitalSelected || 10000;
    const riskDollar = cap * 0.01;
    if (riskDollar === 0) return t;
    return { ...t, resultR: Math.round((t.resultDollar / riskDollar) * 100) / 100 };
  }), [filtered, capitalSelected]);

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

  const equity = useMemo(() => {
    let cumR = 0;
    return [...filledTrades]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        cumR += t.resultR ?? 0;
        return { date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }), r: Math.round(cumR * 100) / 100 };
      });
  }, [filledTrades]);

  const dayPerf = useMemo(() => {
    const map: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    filledTrades.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in map) map[name] += t.resultR ?? 0;
    });
    return Object.entries(map).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100 }));
  }, [filledTrades]);

  const pairPerf = useMemo(() => {
    const map: Record<string, number> = {};
    filledTrades.forEach(t => { map[t.pair] = (map[t.pair] || 0) + (t.resultR ?? 0); });
    return Object.entries(map).map(([pair, r]) => ({ pair, r: Math.round(r * 100) / 100 })).sort((a, b) => b.r - a.r).slice(0, 6);
  }, [filledTrades]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });
  const toggleAccount = (id: string) => setSelectedAccIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const kpis = [
    { label: 'Win Rate',      value: `${winRate.toFixed(1)}%`,                                      color: winRate >= 50 ? '#00D4AA' : '#FF3B5C', bg: winRate >= 50 ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'Profit Factor', value: pf.toFixed(2),                                                 color: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C', bg: pf >= 1.5 ? 'rgba(0,212,170,0.08)' : pf >= 1 ? 'rgba(245,158,11,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'R Total',       value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R`,              color: isPos ? '#00D4AA' : '#FF3B5C', bg: isPos ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'R Moyen',       value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R`,                  color: avgR >= 0 ? '#00D4AA' : '#FF3B5C', bg: avgR >= 0 ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'Croissance',    value: `${croissance >= 0 ? '+' : ''}${croissance.toFixed(2)}%`,      color: croissance >= 0 ? '#00D4AA' : '#FF3B5C', bg: croissance >= 0 ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'Trades',        value: `${wins.length}W / ${losses.length}L`,                         color: '#C0CCD8', bg: 'rgba(255,255,255,0.04)' },
  ];

  const handleExport = async () => {
    if (!reportRef.current || filledTrades.length === 0) return;
    setExporting(true);
    setShowReport(true);
    await new Promise(r => setTimeout(r, 1000));
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, backgroundColor: '#060D1A', useCORS: true, logging: false, allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfW = 210; // A4 width en mm
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`MITrad_${user.name}_${dateFrom}_${dateTo}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
    } finally {
      setShowReport(false);
      setExporting(false);
    }
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

        {/* Header modal */}
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

          {/* Comptes */}
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

          {/* Période */}
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

          {/* Aperçu */}
          {filledTrades.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm bg-accent/20 rounded-xl border border-border/30">
              Aucun trade sur cette période
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Aperçu — {filledTrades.length} trades</p>
              <div className="grid grid-cols-3 gap-2">
                {kpis.map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center border border-border/20" style={{ background: s.bg }}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
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

          {/* Bouton */}
          <button onClick={handleExport} disabled={filledTrades.length === 0 || exporting}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              filledTrades.length === 0 || exporting
                ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                : 'gradient-primary text-white hover:opacity-90'
            }`}>
            {exporting ? <><Loader2 size={16} className="animate-spin" /> Génération PDF...</> : <><Download size={16} /> Télécharger le PDF</>}
          </button>
        </div>
      </div>

      {/* ── RAPPORT PDF (rendu hors écran sauf pendant capture) ── */}
      <div style={{ position: 'fixed', left: showReport ? '0' : '-9999px', top: 0, zIndex: showReport ? 9999 : -1, width: 900, background: '#060D1A', overflowY: 'auto', maxHeight: '100vh' }}>
        <div ref={reportRef} style={{ background: '#060D1A', color: '#fff', padding: '32px 36px', fontFamily: "'Inter', -apple-system, sans-serif", width: 900 }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src="/logo.png" alt="MITrad" style={{ height: 48, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#1A6BFF', letterSpacing: '-0.5px' }}>MITrad Journal</div>
                <div style={{ fontSize: 12, color: '#556677', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rapport de Performance</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${level.color}` }} />}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{user.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: level.color, background: level.bg, border: `1px solid ${level.border}`, borderRadius: 20, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  {level.emoji} {level.label}
                </span>
                <div style={{ fontSize: 12, color: '#8899AA', marginTop: 6 }}>{fmtDate(dateFrom)} → {fmtDate(dateTo)}</div>
                {activeAccs.length > 0 && <div style={{ fontSize: 11, color: '#445566', marginTop: 2 }}>{activeAccs.map(a => a.name).join(' · ')}</div>}
              </div>
            </div>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: 16, padding: '16px 16px', borderLeft: `3px solid ${k.color}`, overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, whiteSpace: 'nowrap' }}>{k.label}</div>
                <div style={{ fontSize: k.value.length > 9 ? 16 : k.value.length > 6 ? 20 : 24, fontWeight: 900, color: k.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', wordBreak: 'break-all' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* ── Badges performance ── */}
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
              {badges.map(b => BADGE_MAP[b.id] && (
                <span key={b.id} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 12px', color: '#C0CCD8' }}>
                  {BADGE_MAP[b.id].emoji} {BADGE_MAP[b.id].name}
                </span>
              ))}
            </div>
          )}

          {/* ── Equity Curve ── */}
          {equity.length > 1 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '22px 22px 12px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📈 Equity Curve</div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={equity}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'Cumul R']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="r" stroke={isPos ? '#00D4AA' : '#FF3B5C'} strokeWidth={3} fill="url(#eqGrad)" isAnimationActive={false} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Par jour + Par paire ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 16px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📅 Par Jour</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dayPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[5,5,0,0]} isAnimationActive={false}>
                    {dayPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 16px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>💱 Par Paire</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={pairPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="pair" tick={{ fill: '#556677', fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[0,5,5,0]} isAnimationActive={false}>
                    {pairPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(26,107,255,0.10)', border: '1px solid rgba(26,107,255,0.25)', borderRadius: 24, padding: '8px 20px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#1A6BFF"/>
                  <path d="M6 12.5L10 16.5L18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#C0D8FF', letterSpacing: '0.02em' }}>Vérifié par Hari Invest</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#334455' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A6BFF', flexShrink: 0, marginTop: 1 }} />
                <span>projournalmitrad.vercel.app</span>
              </div>
              <span>Généré le {new Date().toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
