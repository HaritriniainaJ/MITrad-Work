import { useState, useMemo } from 'react';
import { X, Calendar, Check, Download, ChevronDown } from 'lucide-react';
import { Trade, TradingAccount } from '@/types/trading';
import { calculateBadges } from '@/lib/badgeEngine';

interface ShareModalProps {
  onClose: () => void;
  trades: Trade[];
  user: { name: string; avatar?: string };
  capital: number;
  accounts: TradingAccount[];
}

export default function ShareModal({ onClose, trades, user, capital, accounts }: ShareModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom]           = useState(thirtyDaysAgo);
  const [dateTo, setDateTo]               = useState(today);
  const [selectedAccIds, setSelectedAccIds] = useState<string[]>([]);
  const [showAccDropdown, setShowAccDropdown] = useState(false);

  // Comptes sélectionnés (vide = tous)
  const activeAccs = selectedAccIds.length === 0 ? accounts : accounts.filter(a => selectedAccIds.includes(String(a.id)));
  const capitalSelected = activeAccs.reduce((s, a) => s + Number(a.capital || 0), 0) || capital;

  // Trades filtrés par comptes + période
  const filtered = useMemo(() => {
    return trades.filter(t => {
      if (t.status === 'RUNNING') return false;
      const d = (t.date || '').split('T')[0];
      if (d < dateFrom || d > dateTo) return false;
      if (selectedAccIds.length === 0) return true;
      const tid = String(t.accountId || (t as any).trading_account_id || '');
      return selectedAccIds.includes(tid);
    });
  }, [trades, dateFrom, dateTo, selectedAccIds]);

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

  const toggleAccount = (id: string) => {
    setSelectedAccIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return;

    // Construire equity curve
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumR = 0;
    const equity = sorted.map(t => {
      cumR += t.resultR;
      return {
        date: new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' }),
        r: Math.round(cumR * 100) / 100,
      };
    });

    // Par jour
    const dayMap: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0 };
    filtered.forEach(t => {
      const name = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][new Date(t.date).getDay()];
      if (name in dayMap) dayMap[name] += t.resultR;
    });
    const dayPerf = Object.entries(dayMap).map(([day, r]) => ({ day, r: Math.round(r * 100) / 100 }));

    // Par paire
    const pairMap: Record<string, number> = {};
    filtered.forEach(t => { pairMap[t.pair] = (pairMap[t.pair] || 0) + t.resultR; });
    const pairPerf = Object.entries(pairMap)
      .map(([pair, r]) => ({ pair, r: Math.round(r * 100) / 100 }))
      .sort((a, b) => b.r - a.r).slice(0, 6);

    const payload = {
      trader: user.name,
      avatar: user.avatar || null,
      dateFrom,
      dateTo,
      accountNames: activeAccs.map(a => a.name),
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
        capital: capitalSelected,
      },
      badges: badges.map(b => b.id),
      equity,
      dayPerf,
      pairPerf,
    };

    // Stocker dans sessionStorage et ouvrir la page
    const key = 'mitrad_report_' + Date.now();
    sessionStorage.setItem(key, JSON.stringify(payload));
    window.open(`${window.location.origin}/share/${key}?print=1`, '_blank');
  };

  const presets = [
    { label: '7J',   days: 7 },
    { label: '30J',  days: 30 },
    { label: '90J',  days: 90 },
    { label: 'Tout', days: 3650 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.10)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/30">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="text-xl">📊</span> Exporter mes performances
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configurez puis exportez en PDF professionnel</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent/40">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 px-6 py-5 space-y-5">

          {/* ── Sélection des comptes ── */}
          {accounts.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Comptes
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowAccDropdown(v => !v)}
                  className="w-full flex items-center justify-between bg-accent/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground hover:border-primary/40 transition-colors"
                >
                  <span>
                    {selectedAccIds.length === 0
                      ? `Tous les comptes (${accounts.length})`
                      : `${selectedAccIds.length} compte${selectedAccIds.length > 1 ? 's' : ''} sélectionné${selectedAccIds.length > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showAccDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAccDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl overflow-hidden shadow-xl z-50">
                    {/* Option "Tous" */}
                    <button
                      onClick={() => { setSelectedAccIds([]); setShowAccDropdown(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors ${selectedAccIds.length === 0 ? 'text-primary' : 'text-foreground'}`}
                    >
                      <span>Tous les comptes</span>
                      {selectedAccIds.length === 0 && <Check size={13} className="text-primary" />}
                    </button>
                    <div className="border-t border-border/30" />
                    {accounts.map(acc => {
                      const id = String(acc.id);
                      const selected = selectedAccIds.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => toggleAccount(id)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-primary border-primary' : 'border-border/60'}`}>
                              {selected && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-foreground">{acc.name}</span>
                            <span className="text-xs text-muted-foreground">${Number(acc.capital).toLocaleString('fr')}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{acc.type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Période ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <Calendar size={11} /> Période
            </p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => {
                    setDateFrom(new Date(Date.now() - p.days * 86400000).toISOString().split('T')[0]);
                    setDateTo(today);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/40 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['Du', dateFrom, setDateFrom], ['Au', dateTo, setDateTo]] as const).map(([label, val, setter]) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input
                    type="date"
                    value={val}
                    onChange={e => setter(e.target.value)}
                    className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Aperçu ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
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
                    { label: 'Win Rate',      value: `${winRate.toFixed(0)}%`,                                          color: winRate >= 50 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'Profit Factor', value: pf.toFixed(2),                                                     color: pf >= 1.5 ? '#00D4AA' : pf >= 1 ? '#F59E0B' : '#FF3B5C' },
                    { label: 'R Total',       value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(2)}R`,                  color: totalR >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'R Moyen',       value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R`,                      color: avgR >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'Croissance',    value: `${croissance >= 0 ? '+' : ''}${croissance.toFixed(2)}%`,          color: croissance >= 0 ? '#00D4AA' : '#FF3B5C' },
                    { label: 'W / L',         value: `${wins.length} / ${losses.length}`,                              color: '#8899AA' },
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

          {/* ── Contenu du PDF ── */}
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

          {/* ── Bouton export ── */}
          <button
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              filtered.length === 0
                ? 'bg-accent/30 text-muted-foreground cursor-not-allowed opacity-50'
                : 'gradient-primary text-white hover:opacity-90'
            }`}
          >
            <Download size={16} /> Exporter en PDF
          </button>
        </div>
      </div>
    </div>
  );
}
