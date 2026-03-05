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

const tooltipStyle = {
  background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, color: '#fff', fontSize: 11,
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
  const [exporting, setExporting] = useState(false);
  const [showReport, setShowReport] = useState(false);
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

  const wins        = filtered.filter(t => t.status === 'WIN');
  const losses      = filtered.filter(t => t.status === 'LOSS');
  const totalR      = filtered.reduce((s, t) => s + (t.resultR ?? 0), 0);
  const totalDollar = filtered.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const winRate     = filtered.length ? (wins.length / filtered.length * 100) : 0;
  const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
  const pf          = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgR        = filtered.length ? totalR / filtered.length : 0;
  const croissance  = capitalSelected > 0 ? (totalDollar / capitalSelected * 100) : 0;
  const badges      = calculateBadges(filtered);

  const sortedFiltered = useMemo(() =>
    [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [filtered]);

  const equity = useMemo(() => {
    let cumR = 0;
    return sortedFiltered.map(t => {
      cumR += t.resultR;
      return { date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }), r: Math.round(cumR * 100) / 100 };
    });
  }, [sortedFiltered]);

  const dayPerf = useMemo(() => {
    const map: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    filtered.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in map) map[name] += t.resultR;
    });
    return Object.entries(map).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100 }));
  }, [filtered]);

  const pairPerf = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(t => { map[t.pair] = (map[t.pair] || 0) + t.resultR; });
    return Object.entries(map).map(([pair, r]) => ({ pair, r: Math.round(r * 100) / 100 })).sort((a, b) => b.r - a.r).slice(0, 6);
  }, [filtered]);

  const isPos = totalR >= 0;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });

  const toggleAccount = (id: string) =>
    setSelectedAccIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleExport = async () => {
    if (!reportRef.current || filtered.length === 0) return;
    setExporting(true);
    setShowReport(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#060D1A',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      while (y < pdfH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, pdfW, pdfH);
        y += pageH;
      }
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

  const kpis = [
    { label: 'Win Rate',      value: `${winRate.toFixed(0)}%`,                                        color: winRate >= 50 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Profit Factor', value: pf.toFixed(2),                                                   color: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C' },
    { label: 'R Total',       value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R`,                color: isPos ? '#00D4AA' : '#FF3B5C' },
    { label: 'R Moyen',       value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R`,                    color: avgR >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Croissance',    value: `${croissance >= 0 ? '+' : ''}${croissance.toFixed(2)}%`,        color: croissance >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'W / L',         value: `${wins.length} / ${losses.length}`,                            color: '#8899AA' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.10)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/30 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>📊</span> Exporter mes performances
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configurez puis téléchargez en PDF</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent/40">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 px-6 py-5 space-y-5">

          {/* Config */}
          <div className="grid grid-cols-1 gap-4">

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
          </div>

          {/* Aperçu stats */}
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm bg-accent/20 rounded-xl border border-border/30">
              Aucun trade sur cette période
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {kpis.map(s => (
                <div key={s.label} className="bg-accent/20 rounded-xl p-3 text-center border border-border/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bouton export */}
          <button onClick={handleExport} disabled={filtered.length === 0 || exporting}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              filtered.length === 0 || exporting
                ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                : 'gradient-primary text-white hover:opacity-90'
            }`}>
            {exporting ? <><Loader2 size={16} className="animate-spin" /> Génération du PDF...</> : <><Download size={16} /> Télécharger le PDF</>}
          </button>

          {/* ── RAPPORT (caché visuellement mais rendu pour html2canvas) ── */}
          <div style={{ position: 'fixed', left: showReport ? '0' : '-9999px', top: 0, zIndex: showReport ? 9999 : -1, width: 900, background: '#060D1A' }}>
            <div ref={reportRef} style={{
              background: '#060D1A', color: '#fff', padding: '40px',
              fontFamily: "'Inter', sans-serif", width: 900,
            }}>
              {/* Header rapport */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src="/logo.png" alt="MITrad" style={{ height: 44, objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1A6BFF' }}>MITrad Journal</div>
                    <div style={{ fontSize: 11, color: '#8899AA', marginTop: 2 }}>Rapport de Performance</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#8899AA', marginTop: 4 }}>{fmtDate(dateFrom)} → {fmtDate(dateTo)}</div>
                  {activeAccs.length > 0 && <div style={{ fontSize: 11, color: '#556677', marginTop: 2 }}>{activeAccs.map(a => a.name).join(' · ')}</div>}
                  {badges.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
                      {badges.map(b => BADGE_MAP[b.id] && (
                        <span key={b.id} style={{ fontSize: 11, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '2px 8px', color: '#fff' }}>
                          {BADGE_MAP[b.id].emoji} {BADGE_MAP[b.id].name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {kpis.map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{k.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Equity Curve */}
              {equity.length > 1 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 20px 12px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equity Curve</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={equity}>
                      <defs>
                        <linearGradient id="pdfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'Cumul']} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="r" stroke={isPos ? '#00D4AA' : '#FF3B5C'} strokeWidth={2.5} fill="url(#pdfGrad)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Par jour + Par paire */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {dayPerf.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 16px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par Jour</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={dayPerf}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                        <Bar dataKey="r" radius={[4,4,0,0]} isAnimationActive={false}>
                          {dayPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {pairPerf.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 16px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par Paire</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={pairPerf} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="pair" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} width={52} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                        <Bar dataKey="r" radius={[0,4,4,0]} isAnimationActive={false}>
                          {pairPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#445566' }}>
                <span>Généré avec MITrad Journal · projournalmitrad.vercel.app</span>
                <span>Rapport du {new Date().toLocaleDateString('fr')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
