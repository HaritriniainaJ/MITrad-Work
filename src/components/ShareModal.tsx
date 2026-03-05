import { useState, useMemo } from 'react';
import { X, Link, Calendar, Check, Copy, Download } from 'lucide-react';
import { Trade } from '@/types/trading';
import { calculateBadges } from '@/lib/badgeEngine';

interface ShareModalProps {
  onClose: () => void;
  trades: Trade[];
  user: { name: string; avatar?: string };
  capital: number;
}

export default function ShareModal({ onClose, trades, user, capital }: ShareModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'pdf'>('link');

  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (t.status === 'RUNNING') return false;
      const d = t.date.split('T')[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [trades, dateFrom, dateTo]);

  const wins        = filtered.filter(t => t.status === 'WIN');
  const losses      = filtered.filter(t => t.status === 'LOSS');
  const totalR      = filtered.reduce((s, t) => s + (t.resultR ?? 0), 0);
  const totalDollar = filtered.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const winRate     = filtered.length ? (wins.length / filtered.length * 100) : 0;
  const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
  const pf          = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgR        = filtered.length ? totalR / filtered.length : 0;
  const croissance  = capital > 0 ? (totalDollar / capital * 100) : 0;
  const badges      = calculateBadges(filtered);

  const generateToken = () => {
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumR = 0;
    const equity = sorted.map(t => {
      cumR += t.resultR;
      return {
        date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }),
        r: Math.round(cumR * 100) / 100,
      };
    });

    const dayMap: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    filtered.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in dayMap) dayMap[name] += t.resultR;
    });
    const dayPerf = Object.entries(dayMap).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100 }));

    const pairMap: Record<string, number> = {};
    filtered.forEach(t => { pairMap[t.pair] = (pairMap[t.pair] || 0) + t.resultR; });
    const pairPerf = Object.entries(pairMap)
      .map(([pair, r]) => ({ pair, r: Math.round(r * 100) / 100 }))
      .sort((a, b) => b.r - a.r)
      .slice(0, 6);

    const payload = {
      trader: user.name,
      avatar: user.avatar || null,
      dateFrom,
      dateTo,
      stats: {
        trades: filtered.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round(winRate * 10) / 10,
        totalR: Math.round(totalR * 100) / 100,
        totalDollar: Math.round(totalDollar * 100) / 100,
        pf: Math.round(pf * 100) / 100,
        avgR: Math.round(avgR * 100) / 100,
        croissance: Math.round(croissance * 100) / 100,
        capital,
      },
      badges: badges.map(b => b.id),
      equity,
      dayPerf,
      pairPerf,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    };
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  };

  const shareUrl = `${window.location.origin}/share/${generateToken()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportPDF = () => {
    const token = generateToken();
    const win = window.open(`${window.location.origin}/share/${token}?print=1`, '_blank');
    if (win) {
      win.onload = () => setTimeout(() => win.print(), 1200);
    }
  };

  const presetRanges = [
    { label: '7J',  days: 7 },
    { label: '30J', days: 30 },
    { label: '90J', days: 90 },
    { label: 'Tout', days: 3650 },
  ];

  const applyPreset = (days: number) => {
    setDateFrom(new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDateTo(today);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.10)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/30">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-xl">📊</span> Partager mes performances
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Générez un lien ou exportez en PDF professionnel</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent/40">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 px-6 py-5 space-y-6">

          {/* ── Période ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar size={11} /> Sélectionner la période
            </p>
            <div className="flex gap-2 mb-3">
              {presetRanges.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/40 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Du', dateFrom, setDateFrom], ['Au', dateTo, setDateTo]].map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label as string}</label>
                  <input
                    type="date"
                    value={val as string}
                    onChange={e => (setter as (v: string) => void)(e.target.value)}
                    className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Aperçu stats ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Aperçu — {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm bg-accent/20 rounded-xl border border-border/30">
                Aucun trade sur cette période
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Win Rate',      value: `${winRate.toFixed(0)}%`,                                   color: winRate >= 50 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'Profit Factor', value: pf.toFixed(2),                                              color: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C' },
                    { label: 'R Total',       value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R`,           color: totalR >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'R Moyen',       value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R`,              color: avgR >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'Croissance',    value: `${croissance >= 0 ? '+' : ''}${croissance.toFixed(2)}%`,  color: croissance >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'W / L',         value: `${wins.length} / ${losses.length}`,                       color: '#8899AA' },
                  ].map(s => (
                    <div key={s.label} className="bg-accent/20 rounded-xl p-3 text-center border border-border/20">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {badges.map(b => (
                      <span key={b.id} className="text-xs bg-accent/30 px-2.5 py-1 rounded-full text-foreground border border-border/20">
                        {b.emoji} {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Tabs export ── */}
          <div>
            <div className="flex gap-1 p-1 bg-accent/30 rounded-xl mb-4">
              {([['link', '🔗 Lien public'], ['pdf', '📄 Export PDF']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'gradient-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'link' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-accent/20 border border-border/40 rounded-xl p-3">
                  <Link size={13} className="text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{shareUrl.slice(0, 60)}...</p>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block animate-pulse" />
                  Lien valable 24 heures · Accessible sans connexion
                </p>
                <button
                  onClick={handleCopyLink}
                  disabled={filtered.length === 0}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    filtered.length === 0
                      ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                      : copied
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'gradient-primary text-white hover:opacity-90 active:scale-98'
                  }`}
                >
                  {copied ? <><Check size={16} /> Lien copié !</> : <><Copy size={16} /> Copier le lien</>}
                </button>
              </div>
            )}

            {activeTab === 'pdf' && (
              <div className="space-y-3">
                <div className="bg-accent/20 rounded-xl p-4 border border-border/20">
                  <p className="font-medium text-foreground text-sm mb-3">Le PDF contiendra :</p>
                  <div className="space-y-2">
                    {[
                      'Logo MITrad + Nom du trader + Badges',
                      'Statistiques clés de la période',
                      'Equity Curve',
                      'Performance par jour & par paire',
                      'Résumé professionnel',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check size={12} className="text-success shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={filtered.length === 0}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    filtered.length === 0
                      ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                      : 'gradient-primary text-white hover:opacity-90 active:scale-98'
                  }`}
                >
                  <Download size={16} /> Exporter en PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
