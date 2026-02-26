import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDisplayMode } from '@/context/DisplayModeContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { Trade, ALL_PAIRS, ALL_SESSIONS, ALL_SETUPS, ALL_EMOTIONS } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { Download, Trash2, X, Pencil, Save, ImageIcon, ZoomIn, AlertTriangle } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import { ZoomableImage } from '@/components/ImageLightbox';
import { updateTrade, deleteTrade as deleteTadeApi } from '@/lib/api';
import { toast } from 'sonner';
import { StorageManager } from '@/lib/storage';


function QualityBar({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const color = value <= 3 ? '#ef4444' : value <= 6 ? '#f59e0b' : '#00d4aa';
  const percent = ((value - 1) / 9) * 100;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 h-2 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, #1A6BFF, ${color})` }}
        />
        <input
          type="range" min={1} max={10} step={1} value={value}
          disabled={!onChange}
          onChange={e => onChange?.(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-300 pointer-events-none"
          style={{
            left: `calc(${percent}% - 10px)`,
            background: `linear-gradient(135deg, #1A6BFF, ${color})`,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
      </div>
      <div
        className="shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300"
        style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
      >
        {value}/10
      </div>
    </div>
  );
}

export default function TradeHistory() {
  const { user, accounts, activeAccount } = useAuth();
  const { formatResult } = useDisplayMode();
  const [confirm, ConfirmModal] = useConfirm();

  const [filters, setFilters] = useState({
    pair: '', session: '', direction: '', setup: '', emotion: '', status: ''
  });
  const [page, setPage]                   = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade]   = useState<Trade | null>(null);
  const [zoomImg, setZoomImg]             = useState<string | null>(null);
  const [refreshKey, setRefreshKey]       = useState(0);
  const perPage = 20;

  const allTrades = useFilteredTrades(refreshKey);

  const filtered = useMemo(() => allTrades.filter(t => {
    if (filters.pair      && t.pair      !== filters.pair)      return false;
    if (filters.session   && t.session   !== filters.session)   return false;
    if (filters.direction && t.direction !== filters.direction) return false;
    if (filters.setup     && t.setup     !== filters.setup)     return false;
    if (filters.emotion   && t.emotion   !== filters.emotion)   return false;
    if (filters.status    && t.status    !== filters.status)    return false;
    return true;
  }), [allTrades, filters]);

  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const getQualityNum = (q: Trade['quality']): number =>
    typeof q === 'number' ? q : q === 'A+' ? 10 : q === 'A' ? 8 : q === 'B' ? 6 : 4;

  const autoCalc = (t: Partial<Trade>): Partial<Trade> => {
    const entry = Number(t.entryPrice) || 0;
    const sl    = Number(t.stopLoss)   || 0;
    const exit  = Number(t.exitPrice)  || 0;
    const acc   = accounts.find(a => String(a.id) === String(t.accountId || (t as any).trading_account_id));
    const cap   = Number(acc?.capital) || user?.capital || 10000;
    const riskDollar = cap * 0.01;
    const slDist = Math.abs(entry - sl);

    if (!entry || !sl || slDist === 0) return t;

    if (exit) {
      const pnlDist = (t.direction === 'BUY' ? exit - entry : entry - exit);
      const resultR = Math.round((pnlDist / slDist) * 100) / 100;
      return { ...t, resultR, resultDollar: Math.round(resultR * riskDollar * 100) / 100 };
    }

    if (t.status === 'WIN') {
      const tp     = Number(t.takeProfit) || 0;
      const tpDist = Math.abs(tp - entry);
      if (tp && tpDist > 0) {
        const resultR = Math.round((tpDist / slDist) * 100) / 100;
        return { ...t, resultR, resultDollar: Math.round(resultR * riskDollar * 100) / 100, exitPrice: tp };
      }
    }
    if (t.status === 'LOSS') {
      return { ...t, resultR: -1, resultDollar: Math.round(-riskDollar * 100) / 100, exitPrice: sl };
    }
    if (t.status === 'BE') {
      return { ...t, resultR: 0, resultDollar: 0, exitPrice: entry };
    }

    return t;
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wsData = [
      ['MITRAD JOURNAL - HISTORIQUE DES TRADES'],
      [],
      ['Date', 'Paire', 'Direction', 'Session', 'Setup', 'Ã‰motion', 'QualitÃ©',
       'EntrÃ©e', 'SL', 'TP', 'Sortie', 'Lot', 'RÃ©sultat R', 'RÃ©sultat $', 'Statut', 'Note entrÃ©e', 'Note sortie'],
      ...filtered.map(t => [
        t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '',
        t.pair, t.direction, t.session, t.setup, t.emotion, t.quality,
        t.entryPrice, t.stopLoss, t.takeProfit, t.exitPrice ?? '',
        t.lotSize, t.resultR, t.resultDollar, t.status,
        t.entryNote ?? '', t.exitNote ?? '',
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 8 },  { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 8 },  { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 30 }, { wch: 30 },
    ];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    XLSX.writeFile(wb, `MITrad_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    toast.success('Excel exportÃ© !');
  };

  const deleteTrade = async (id: string) => {
    const ok = await confirm({ title: 'Supprimer ce trade', message: 'Cette action est irrÃ©versible.', confirmText: 'Supprimer', variant: 'danger' });
    if (!ok) return;
    try {
      const trade = allTrades.find(t => t.id === id);
      if (!trade) return;
      await deleteTadeApi(trade.trading_account_id, Number(id));
      setSelectedTrade(null);
      setEditingTrade(null);
      setRefreshKey(k => k + 1);
      toast.success('Trade supprimÃ©');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const startEdit = (trade: Trade, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTrade({ ...trade });
    setSelectedTrade(null);
  };

  const setEditField = (key: keyof Trade, value: unknown) =>
    setEditingTrade(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };

      if (['entryPrice', 'stopLoss', 'exitPrice', 'direction'].includes(key as string)) {
        return autoCalc(updated) as Trade;
      }

      if (key === 'status') {
        const entry      = Number(updated.entryPrice);
        const sl         = Number(updated.stopLoss);
        const tp         = Number(updated.takeProfit);
        const capital    = user?.capital || 10000;
        const slDist     = Math.abs(entry - sl);
        const tpDist     = Math.abs(tp - entry);
        const riskDollar = capital * 0.01;

        if (value === 'WIN' && tp && slDist > 0) {
          const resultR      = Math.round((tpDist / slDist) * 100) / 100;
          const resultDollar = Math.round(resultR * riskDollar * 100) / 100;
          return { ...updated, resultR, resultDollar, exitPrice: tp };
        }
        if (value === 'LOSS' && sl && slDist > 0) {
          return { ...updated, resultR: -1, resultDollar: Math.round(-riskDollar * 100) / 100, exitPrice: sl };
        }
        if (value === 'BE') {
          return { ...updated, resultR: 0, resultDollar: 0, exitPrice: entry };
        }
      }

      return updated;
    });

  const handleEditScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setEditField('screenshot', reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editingTrade) return;
    try {
      await updateTrade(editingTrade.trading_account_id, editingTrade.id, {
        date:              editingTrade.date,
        pair:              editingTrade.pair,
        direction:         editingTrade.direction,
        session:           editingTrade.session,
        setup:             editingTrade.setup,
        emotion:           editingTrade.emotion,
        quality:           typeof editingTrade.quality === 'number' ? editingTrade.quality : 7,
        entry_price:       editingTrade.entryPrice,
        stop_loss:         editingTrade.stopLoss,
        take_profit:       editingTrade.takeProfit,
        lot_size:          editingTrade.lotSize,
        exit_price:        editingTrade.exitPrice ?? null,
        result_r:          editingTrade.resultR,
        result_dollar:     editingTrade.resultDollar,
        status:            editingTrade.status,
        duration:          editingTrade.duration,
        entry_note:        editingTrade.entryNote,
        exit_note:         editingTrade.exitNote,
        trading_view_link: editingTrade.tradingViewLink ?? '',
        screenshot:        editingTrade.screenshot ?? '',
        plan_respected:    editingTrade.planRespected ?? null,
        is_imported:       false,
      });
      setEditingTrade(null);
      setRefreshKey(k => k + 1);
      toast.success('Trade mis Ã  jour !');
    } catch {
      toast.error('Erreur mise Ã  jour');
    }
  };

  const allSetups = useMemo(() => {
    const custom = user?.customSetups || [];
    return [...new Set([...ALL_SETUPS, ...custom])];
  }, [user]);

  // Compte du trade en cours d'Ã©dition (lecture seule)
  const editingAccount = useMemo(() => {
    if (!editingTrade) return null;
    return accounts.find(a =>
      String(a.id) === String(editingTrade.accountId || (editingTrade as any).trading_account_id)
    ) || activeAccount || accounts[0];
  }, [editingTrade, accounts, activeAccount]);

  const FilterSelect = ({
    label, value, onChange, options
  }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <select
      value={value}
      onChange={e => { onChange(e.target.value); setPage(1); }}
      className="select-dark text-xs py-2"
    >
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Historique</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} trade{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportExcel} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
          <Download size={14} /> Exporter CSV
        </button>
      </div>

      <GlassCard className="animate-fade-up">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <FilterSelect label="Toutes paires"   value={filters.pair}      onChange={v => setFilters(p => ({ ...p, pair: v }))}      options={ALL_PAIRS} />
          <FilterSelect label="Sessions"         value={filters.session}   onChange={v => setFilters(p => ({ ...p, session: v }))}   options={ALL_SESSIONS} />
          <FilterSelect label="Direction"        value={filters.direction} onChange={v => setFilters(p => ({ ...p, direction: v }))} options={['BUY', 'SELL']} />
          <FilterSelect label="Setups"           value={filters.setup}     onChange={v => setFilters(p => ({ ...p, setup: v }))}     options={allSetups} />
          <FilterSelect label="Ã‰motion"          value={filters.emotion}   onChange={v => setFilters(p => ({ ...p, emotion: v }))}   options={ALL_EMOTIONS} />
          <FilterSelect label="Statut"           value={filters.status}    onChange={v => setFilters(p => ({ ...p, status: v }))}    options={['WIN', 'LOSS', 'BE', 'RUNNING']} />
          <button
            onClick={() => { setFilters({ pair: '', session: '', direction: '', setup: '', emotion: '', status: '' }); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2 hover:bg-accent/30 rounded-lg"
          >
            RÃ©initialiser
          </button>
        </div>
      </GlassCard>

      <GlassCard className="animate-fade-up overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Date', 'Paire', 'Dir.', 'Session', 'Setup', 'QualitÃ©', 'RÃ©sultat', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(t => (
              <tr
                key={t.id}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setSelectedTrade(t)}
              >
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('fr', { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{t.pair}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.session}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {t.is_imported && !t.setup ? (
                    <span title="A completer" className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle size={12} /> <span className="text-xs">A dÃ©finir</span>
                    </span>
                  ) : t.setup}
                </td>
                <td className="px-4 py-3">
                  {t.is_imported && t.quality == null ? (
                    <span title="A completer" className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle size={12} /> <span className="text-xs">A dÃ©finir</span>
                    </span>
                  ) : (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    getQualityNum(t.quality) >= 8 ? 'bg-success/20 text-success' :
                    getQualityNum(t.quality) >= 5 ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {getQualityNum(t.quality)}/10
                  </span>
                  )}
                </td>
                <td className={`px-4 py-3 metric-value text-sm ${t.resultR != null && t.resultR >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatResult(t.resultR, t.resultDollar, Number(accounts.find(a => String(a.id) === String(t.accountId || (t as any).trading_account_id))?.capital) || activeAccount?.capital || 10000)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    t.status === 'WIN' ? 'badge-win' : t.status === 'LOSS' ? 'badge-loss' : 'badge-be'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {t.screenshot && (
                      <span title="Capture disponible">
                        <ImageIcon size={12} className="text-primary/60" />
                      </span>
                    )}
                    <button
                      onClick={e => startEdit(t, e)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-white hover:bg-primary px-2 py-1 rounded-lg transition-all duration-200 font-medium"
                    >
                      <Pencil size={12} /> Modifier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginated.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">T'as pas tradÃ©. C'est bien ou t'as ratÃ© des setups ?</p>
        )}
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                page === i + 1
                  ? 'gradient-primary text-white shadow-lg'
                  : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* â”€â”€ MODALE DÃ‰TAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedTrade && !editingTrade && (
        <div className="modal-overlay" onClick={() => setSelectedTrade(null)}>
          <div className="modal-content glass p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-foreground text-lg gradient-text">
                {selectedTrade.pair} â€” {selectedTrade.direction}
              </h3>
              <button onClick={() => setSelectedTrade(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Date',    val: new Date(selectedTrade.date).toLocaleString('fr') },
                { label: 'Session', val: selectedTrade.session },
                { label: 'Setup',   val: selectedTrade.setup || 'ï¿½ Non dï¿½fini' },

                { label: 'Ã‰motion', val: selectedTrade.emotion },
                { label: 'EntrÃ©e',  val: selectedTrade.entryPrice },
                { label: 'SL',      val: selectedTrade.stopLoss },
                { label: 'TP',      val: selectedTrade.takeProfit },
                { label: 'Sortie',  val: selectedTrade.exitPrice || 'â€”' },
                { label: 'DurÃ©e',   val: `${selectedTrade.duration} min` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{String(val)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">QualitÃ©</span>
                {selectedTrade.is_imported && selectedTrade.quality == null ? (<span className="flex items-center gap-1 text-amber-400 text-xs font-bold"><AlertTriangle size={12} /> ï¿½ dï¿½finir</span>) : (<span className="text-foreground font-bold">{getQualityNum(selectedTrade.quality)}/10</span>)}
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">RÃ©sultat</span>
                <span className={`metric-value ${selectedTrade.resultR != null && selectedTrade.resultR >= 0 ? "text-success" : "text-destructive"}`}>{formatResult(selectedTrade.resultR, selectedTrade.resultDollar, Number(accounts.find(a => String(a.id) === String(selectedTrade.accountId || (selectedTrade as any).trading_account_id))?.capital) || activeAccount?.capital || 10000)}</span>


              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Statut</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  selectedTrade.status === 'WIN' ? 'badge-win' : selectedTrade.status === 'LOSS' ? 'badge-loss' : 'badge-be'
                }`}>{selectedTrade.status}</span>
              </div>
              {/* Plan respectÃ© */}
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Plan respectÃ©</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  selectedTrade.planRespected === true  ? 'bg-success/20 text-success' :
                  selectedTrade.planRespected === false ? 'bg-destructive/20 text-destructive' :
                  'bg-accent/40 text-muted-foreground'
                }`}>
                  {selectedTrade.planRespected === true ? 'âœ… Oui' : selectedTrade.planRespected === false ? 'âŒ Non' : 'â€” NSP'}
                </span>
              </div>
              {selectedTrade.entryNote && (
                <div className="pt-1">
                  <p className="text-muted-foreground text-xs mb-1">Note d'entrÃ©e</p>
                  <p className="text-foreground bg-accent/30 rounded-lg p-3 text-sm">{selectedTrade.entryNote}</p>
                </div>
              )}
              {selectedTrade.exitNote && (
                <div className="pt-1">
                  <p className="text-muted-foreground text-xs mb-1">Note de sortie</p>
                  <p className="text-foreground bg-accent/30 rounded-lg p-3 text-sm">{selectedTrade.exitNote}</p>
                </div>
              )}
              {selectedTrade.screenshot && (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-2">Capture</p>
                  <div className="relative group cursor-pointer" onClick={() => setZoomImg(selectedTrade.screenshot)}>
                    <img src={selectedTrade.screenshot} alt="Capture" className="rounded-xl w-full object-cover max-h-60 transition-transform group-hover:scale-[1.01]" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <ZoomIn size={32} className="text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => startEdit(selectedTrade)} className="gradient-btn flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                <Pencil size={14} /> Modifier
              </button>
              <button onClick={() => deleteTrade(selectedTrade.id)} className="flex-1 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} className="inline mr-1" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ MODALE Ã‰DITION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editingTrade && (
        <div className="modal-overlay" onClick={() => setEditingTrade(null)}>
          <div className="modal-content glass p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-foreground text-lg gradient-text">Modifier le trade</h3>
              <button onClick={() => setEditingTrade(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">

              {/* â”€â”€ Compte â€” lecture seule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {editingAccount && (
                <div>
                  <label className="text-xs text-muted-foreground">Compte</label>
                  <div className="flex items-center gap-3 p-3 rounded-xl mt-1"
                    style={{ background: 'rgba(26,107,255,0.08)', border: '1px solid rgba(26,107,255,0.2)' }}>
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{editingAccount.name}</p>
                      <p className="text-xs text-muted-foreground">{editingAccount.broker} Â· {editingAccount.type}</p>
                    </div>
                    <span className="ml-auto text-[10px] text-primary/70 font-medium">Compte actif</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Date & Heure</label>
                <input type="datetime-local"
                  value={editingTrade.date ? new Date(editingTrade.date).toISOString().slice(0, 16) : ''}
                  onChange={e => setEditField('date', new Date(e.target.value).toISOString())}
                  className="input-dark mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Paire</label>
                  <select value={editingTrade.pair} onChange={e => setEditField('pair', e.target.value)} className="select-dark mt-1">
                    {ALL_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Direction</label>
                  <div className="flex gap-2 mt-1">
                    {(['BUY', 'SELL'] as const).map(d => (
                      <button key={d} type="button" onClick={() => setEditField('direction', d)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          editingTrade.direction === d
                            ? d === 'BUY' ? 'badge-buy border border-current' : 'badge-sell border border-current'
                            : 'bg-accent text-muted-foreground hover:bg-accent/60'
                        }`}>
                        {d === 'BUY' ? 'ACHAT' : 'VENTE'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Session</label>
                  <select value={editingTrade.session} onChange={e => setEditField('session', e.target.value)} className="select-dark mt-1">
                    {ALL_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Setup</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={allSetups.includes(editingTrade.setup) ? editingTrade.setup : '__custom__'}
                        onChange={e => {
                          if (e.target.value !== '__custom__') setEditField('setup', e.target.value);
                        }}
                        className="select-dark flex-1"
                      >
                        {allSetups.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="__custom__">âž• Autre setup...</option>
                      </select>
                    </div>
                    {(!allSetups.includes(editingTrade.setup) || editingTrade.setup === '__custom__') && (
                      <input
                        type="text"
                        autoFocus
                        value={editingTrade.setup === '__custom__' ? '' : editingTrade.setup}
                        placeholder="Nom de votre setup (ex: BOS + FVG)"
                        className="input-dark mt-2"
                        onChange={e => setEditField('setup', e.target.value)}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (val && !allSetups.includes(val)) {
                            const custom = user?.customSetups || [];
                            StorageManager.updateUser(user!.email, {
                              customSetups: [...custom, val],
                            });
                          }
                        }}
                      />
                    )}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ã‰motion</label>
                  <select value={editingTrade.emotion} onChange={e => setEditField('emotion', e.target.value)} className="select-dark mt-1">
                    {ALL_EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Statut</label>
                  <select value={editingTrade.status} onChange={e => setEditField('status', e.target.value as Trade['status'])} className="select-dark mt-1">
                    <option value="WIN">Win</option>
                    <option value="LOSS">Loss</option>
                    <option value="BE">Breakeven</option>
                    <option value="RUNNING">En cours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">QualitÃ© du trade</label>
                <div className="mt-2">
                  <QualityBar value={getQualityNum(editingTrade.quality)} onChange={v => setEditField('quality', v)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Prix d'entrÃ©e</label>
                  <input type="number" step="any" value={editingTrade.entryPrice}
                    onChange={e => setEditField('entryPrice', parseFloat(e.target.value) || 0)} className="input-dark mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Stop Loss</label>
                  <input type="number" step="any" value={editingTrade.stopLoss}
                    onChange={e => setEditField('stopLoss', parseFloat(e.target.value) || 0)} className="input-dark mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Take Profit</label>
                  <input type="number" step="any" value={editingTrade.takeProfit}
                    onChange={e => setEditField('takeProfit', parseFloat(e.target.value) || 0)} className="input-dark mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Prix de sortie</label>
                  <input type="number" step="any" value={editingTrade.exitPrice || ''}
                    onChange={e => setEditField('exitPrice', parseFloat(e.target.value) || undefined)} className="input-dark mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Taille de lot</label>
                  <input type="number" step="any" value={editingTrade.lotSize || ''}
                    onChange={e => setEditField('lotSize', parseFloat(e.target.value) || 0)} className="input-dark mt-1" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-accent/40 border border-border/50 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">RÃ©sultats (recalculÃ©s automatiquement)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">RÃ©sultat R</label>
                    <input type="number" step="any" value={editingTrade.resultR}
                      onChange={e => setEditField('resultR', parseFloat(e.target.value) || 0)} className="input-dark mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">RÃ©sultat $</label>
                    <input type="number" step="any" value={editingTrade.resultDollar}
                      onChange={e => setEditField('resultDollar', parseFloat(e.target.value) || 0)} className="input-dark mt-1 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <div className={`w-full text-center py-2 rounded-lg text-sm font-bold ${
                      editingTrade.resultR >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {editingTrade.resultR >= 0 ? '+' : ''}{editingTrade.resultR?.toFixed(2)}R
                    </div>
                  </div>
                </div>
              </div>

              {/* â”€â”€ Plan respectÃ© â€” toggle Ã©ditable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div>
                <label className="text-xs text-muted-foreground">Plan de trading respectÃ© ?</label>
                <div className="flex gap-2 mt-2">
                  {([
                    { value: true,  label: 'âœ… Oui', active: 'bg-success/20 border-success/50 text-success' },
                    { value: false, label: 'âŒ Non',  active: 'bg-destructive/20 border-destructive/50 text-destructive' },
                    { value: null,  label: 'â€” NSP',   active: 'bg-accent/60 border-border text-muted-foreground' },
                  ] as const).map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setEditField('planRespected', opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        editingTrade.planRespected === opt.value
                          ? opt.active
                          : 'bg-accent/20 border-border/30 text-muted-foreground hover:bg-accent/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Note d'entrÃ©e</label>
                <textarea value={editingTrade.entryNote}
                  onChange={e => setEditField('entryNote', e.target.value)}
                  className="input-dark mt-1 min-h-[70px] resize-none" placeholder="Justifie ton entrÃ©e. Pas d'excuse." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Note de sortie</label>
                <textarea value={editingTrade.exitNote}
                  onChange={e => setEditField('exitNote', e.target.value)}
                  className="input-dark mt-1 min-h-[70px] resize-none" placeholder="RÃ©sultat ? Sois honnÃªte." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Lien TradingView</label>
                <input type="url" value={editingTrade.tradingViewLink || ''}
                  onChange={e => setEditField('tradingViewLink', e.target.value)}
                  className="input-dark mt-1" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Capture d'Ã©cran</label>
                {editingTrade.screenshot && (
                  <div className="relative group mt-2 cursor-pointer" onClick={() => setZoomImg(editingTrade.screenshot!)}>
                    <img src={editingTrade.screenshot} alt="Capture"
                      className="rounded-xl w-full max-h-48 object-cover border border-border/30 transition-transform group-hover:scale-[1.01]" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <ZoomIn size={28} className="text-white" />
                    </div>
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setEditField('screenshot', ''); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleEditScreenshot}
                  className="input-dark mt-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:gradient-primary file:text-white file:px-3 file:py-1 file:text-xs file:cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingTrade(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground hover:bg-accent transition-colors">
                Annuler
              </button>
              <button onClick={saveEdit} className="flex-1 gradient-btn py-2.5 text-sm flex items-center justify-center gap-2">
                <Save size={14} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {ConfirmModal}

      {/* â”€â”€ ZOOM IMAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {zoomImg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={() => setZoomImg(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setZoomImg(null)}>
            <X size={32} />
          </button>
          <img src={zoomImg} alt="Zoom" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}









