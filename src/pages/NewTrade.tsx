import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTrade } from "@/lib/api";
import { Trade, ALL_PAIRS, ALL_SESSIONS, ALL_SETUPS, ALL_EMOTIONS } from '@/types/trading';
import { ZoomableImage } from '@/components/ImageLightbox';
import GlassCard from '@/components/GlassCard';
import { toast } from 'sonner';
import { refreshTrades } from '@/hooks/useFilteredTrades';
import { Plus, X, ZoomIn, ChevronDown } from 'lucide-react';

// ── Slider qualité réutilisable ───────────────────────────────────────────────
function QualitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
          onChange={e => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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

export default function NewTrade() {
  const { user, accounts, activeAccount, updateProfile } = useAuth();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pair: 'EURUSD',
    customPair: '',
    direction: 'BUY' as 'BUY' | 'SELL',
    session: 'London',
    quality: 7,
    setup: 'BOS',
    emotion: 'Confiant',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: '',
    exitPrice: '',
    resultR: '',
    resultDollar: '',
    status: 'RUNNING' as Trade['status'],
    planRespected: null as boolean | null,
    entryNote: '',
    exitNote: '',
    tradingViewLink: '',
    screenshot: '',
    accountId: activeAccount?.id || accounts[0]?.id || '',
  });
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const [showNewSetup, setShowNewSetup]  = useState(false);
  const [zoomImg, setZoomImg]            = useState<string | null>(null);

  useEffect(() => {
    if (!form.accountId && accounts.length > 0) {
      setField('accountId', activeAccount?.id || accounts[0]?.id);
    }
  }, [accounts, activeAccount]);

  const setField = (key: string, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Setups combinés (défaut + custom) ────────────────────────────────────
  const allSetups = useMemo(() => {
    const custom = user?.customSetups || [];
    return [...new Set([...ALL_SETUPS, ...custom])];
  }, [user]);

  // ── Paires combinées (défaut + custom utilisateur) ────────────────────────
  const allPairs = useMemo(() => {
    const custom = user?.customPairs || [];
    return [...new Set([...ALL_PAIRS, ...custom])];
  }, [user]);

  // ── Ajouter une paire personnalisée ──────────────────────────────────────
  const [showNewPair, setShowNewPair] = useState(false);
  const [newPairName, setNewPairName] = useState('');

  const addCustomPair = () => {
    const name = newPairName.trim().toUpperCase();
    if (!name) { toast.error('Nom de la paire requis'); return; }
    const current = user?.customPairs || [];
    if ([...ALL_PAIRS, ...current].includes(name)) { toast.error('Paire déjà existante'); return; }
    updateProfile({ customPairs: [...current, name] });
    setField('pair', name);
    setNewPairName('');
    setShowNewPair(false);
    toast.success(`Paire "${name}" ajoutée !`);
  };

  // ── Calculs automatiques en temps réel ───────────────────────────────────
  const calc = useMemo(() => {
    const entry   = parseFloat(form.entryPrice);
    const sl      = parseFloat(form.stopLoss);
    const tp      = parseFloat(form.takeProfit);
    const exit    = parseFloat(form.exitPrice);
    const isBuy   = form.direction === 'BUY';

    const selectedAccount = accounts.find(a => a.id == form.accountId);
    const capital = Number(selectedAccount?.capital) || user?.capital || 10000;
    const riskPercent = 0.01;
    const riskDollar = capital * riskPercent;

    if (isNaN(entry) || isNaN(sl) || sl === entry) return null;

    const slValid = isBuy ? sl < entry : sl > entry;
    const tpValid = !isNaN(tp) ? (isBuy ? tp > entry : tp < entry) : true;

    const isJPY   = form.pair.includes('JPY');
    const pipSize = isJPY ? 0.01 : 0.0001;
    const slDist  = Math.abs(entry - sl);
    const tpDist  = !isNaN(tp) ? Math.abs(tp - entry) : 0;
    const slPips  = Math.round(slDist / pipSize);
    const tpPips  = Math.round(tpDist / pipSize);
    const rr      = slDist > 0 && tpDist > 0 ? tpDist / slDist : 0;

    const pipValuePerLot = isJPY ? 1000 * pipSize : 10;
    const lotSize = slPips > 0 ? Math.round((riskDollar / (slPips * pipValuePerLot)) * 100) / 100 : 0;

    let autoR: number | null = null;
    let autoDollar: number | null = null;
    let autoPct: number | null = null;
    if (!isNaN(exit) && exit > 0) {
      const pnlDist = isBuy ? exit - entry : entry - exit;
      autoR      = Math.round((pnlDist / slDist) * 100) / 100;
      autoDollar = Math.round(autoR * riskDollar * 100) / 100;
      autoPct    = Math.round((autoDollar / capital) * 10000) / 100;
    }

    return {
      slPips, tpPips,
      rr:              rr.toFixed(2),
      riskDollar:      riskDollar.toFixed(2),
      potentialDollar: (riskDollar * rr).toFixed(2),
      lotSize:         lotSize.toFixed(2),
      capital,
      autoR, autoDollar, autoPct,
      slValid, tpValid,
    };
  }, [form.entryPrice, form.stopLoss, form.takeProfit, form.exitPrice, form.pair, form.direction, form.accountId, accounts, user]);

  const calcFromLot = useMemo(() => {
    const entry   = parseFloat(form.entryPrice);
    const sl      = parseFloat(form.stopLoss);
    const lot     = parseFloat(form.lotSize);
    const selectedAccount = accounts.find(a => a.id == form.accountId);
    const capital = Number(selectedAccount?.capital) || user?.capital || 10000;

    if (isNaN(entry) || isNaN(sl) || isNaN(lot) || lot <= 0) return null;

    const isJPY      = form.pair.includes('JPY');
    const pipSize    = isJPY ? 0.01 : 0.0001;
    const slPips     = Math.abs(entry - sl) / pipSize;
    const pipValuePerLot = isJPY ? 1000 * pipSize : 10;
    const riskDollar = Math.round(lot * slPips * pipValuePerLot * 100) / 100;
    const riskPct    = Math.round((riskDollar / capital) * 10000) / 100;

    return { riskDollar, riskPct, capital };
  }, [form.entryPrice, form.stopLoss, form.lotSize, form.pair, form.accountId, accounts, user]);

  // Sync résultat auto → champs
  useMemo(() => {
    if (calc?.autoR !== null && calc?.autoR !== undefined) {
      setForm(prev => ({
        ...prev,
        resultR:      String(calc.autoR),
        resultDollar: String(calc.autoDollar),
      }));
    }
  }, [calc?.autoR, calc?.autoDollar]);

  // ── Ajouter un setup personnalisé ─────────────────────────────────────────
  const addCustomSetup = () => {
    const name = newSetupName.trim();
    if (!name) { toast.error('Nom du setup requis'); return; }
    const current = user?.customSetups || [];
    if (current.includes(name)) { toast.error('Setup déjà existant'); return; }
    updateProfile({ customSetups: [...current, name] });
    setField('setup', name);
    setNewSetupName('');
    setShowNewSetup(false);
    toast.success(`Setup "${name}" ajouté !`);
  };

  // ── Screenshot ───────────────────────────────────────────────────────────
  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setField('screenshot', reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const sl    = parseFloat(form.stopLoss);
    if (isNaN(entry) || isNaN(sl)) { toast.error('Entrée et Stop Loss requis'); return; }

    const selectedAccount = accounts.find(a => a.id === form.accountId);
    const capital = selectedAccount?.capital || user?.capital || 10000;
    const resultR      = form.resultR ? parseFloat(form.resultR) : 0;
    const resultDollar = form.resultDollar ? parseFloat(form.resultDollar) : resultR * capital * 0.01;

    const trade = {
      date:              new Date(form.date).toISOString(),
      pair:              form.pair === 'Other' ? form.customPair : form.pair,
      direction:         form.direction,
      session:           form.session,
      quality:           form.quality,
      setup:             form.setup,
      emotion:           form.emotion,
      entry_price:       entry,
      stop_loss:         sl,
      take_profit:       parseFloat(form.takeProfit) || 0,
      lot_size:          parseFloat(form.lotSize) || 0.1,
      exit_price:        parseFloat(form.exitPrice) || null,
      result_r:          resultR,
      result_dollar:     resultDollar,
      status:            form.status,
      plan_respected:    form.planRespected,   // ← NOUVEAU
      entry_note:        form.entryNote,
      exit_note:         form.exitNote,
      trading_view_link: form.tradingViewLink,
      screenshot:        form.screenshot,
    };

    try {
      await createTrade(String(form.accountId), trade);
      refreshTrades();
      toast.success('Trade enregistré !');
      reset();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(err);
    }
  };

  const reset = () => {
    setForm({
      date:          new Date().toISOString().slice(0, 16),
      pair:          'EURUSD', customPair: '',
      direction:     'BUY', session: 'London', quality: 7,
      setup:         'BOS', emotion: 'Confiant',
      entryPrice:    '', stopLoss: '', takeProfit: '', lotSize: '',
      exitPrice:     '', resultR: '', resultDollar: '',
      status:        'RUNNING',
      planRespected: null,   // ← NOUVEAU
      entryNote:     '', exitNote: '', tradingViewLink: '', screenshot: '',
      accountId:     activeAccount?.id || accounts[0]?.id || '',
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Nouveau Trade</h1>
        <p className="text-muted-foreground text-sm mt-1">Enregistrer une nouvelle entrée</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COL 1 : Infos de base ───────────────────────────────────── */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">Informations de base</h3>
            <div className="space-y-4">

              {/* Sélecteur de compte */}
{accounts.length > 0 && (
  <div>
    <label className="text-xs text-muted-foreground">Compte</label>

    {/* Compte sélectionné — affiché en permanence */}
    <div
      className="flex items-center justify-between p-3 rounded-xl border border-primary/40 bg-primary/8 mt-2 cursor-pointer hover:border-primary/60 transition-all"
      onClick={() => setShowAccountPicker(v => !v)}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
        <div>
          {accounts.find(a => a.id == form.accountId) ? (
            <>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {accounts.find(a => a.id == form.accountId)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {accounts.find(a => a.id == form.accountId)?.broker}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sélectionner un compte</p>
          )}
        </div>
      </div>
      <ChevronDown
        size={16}
        className={`text-muted-foreground transition-transform duration-200 ${showAccountPicker ? 'rotate-180' : ''}`}
      />
    </div>

    {/* Carrousel déroulant */}
    {showAccountPicker && (
      <div className="mt-2 space-y-2 animate-fade-up">
        {accounts.map((acc, idx) => (
          <div
            key={acc.id}
            onClick={() => { setField('accountId', acc.id); setShowAccountPicker(false); }}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
              form.accountId == acc.id
                ? 'border-primary/60 bg-primary/10'
                : 'border-border/40 bg-accent/20 hover:border-primary/30 hover:bg-primary/5'
            }`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              form.accountId == acc.id ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'
            }`}>
              {acc.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">{acc.name}</p>
              <p className="text-xs text-muted-foreground">{acc.broker} · {acc.type}</p>
            </div>
            {form.accountId == acc.id && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

              {/* Date */}
              <div>
                <label className="text-xs text-muted-foreground">Date & Heure</label>
                <input
                  type="datetime-local" value={form.date}
                  onChange={e => setField('date', e.target.value)}
                  className="input-dark mt-1"
                />
              </div>

              {/* Paire */}
              <div>
                <label className="text-xs text-muted-foreground">Paire</label>
                <select
                  value={form.pair}
                  onChange={e => setField('pair', e.target.value)}
                  className="select-dark mt-1"
                >
                  {allPairs.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Other">Autre</option>
                </select>
                {form.pair === 'Other' && (
                  <input
                    placeholder="Paire personnalisée" value={form.customPair}
                    onChange={e => setField('customPair', e.target.value)}
                    className="input-dark mt-2"
                  />
                )}
              </div>

              {/* Direction */}
              <div>
                <label className="text-xs text-muted-foreground">Direction</label>
                <div className="flex gap-2 mt-1">
                  {(['BUY', 'SELL'] as const).map(d => (
                    <button
                      key={d} type="button" onClick={() => setField('direction', d)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        form.direction === d
                          ? d === 'BUY'
                            ? 'badge-buy border border-current shadow-lg'
                            : 'badge-sell border border-current shadow-lg'
                          : 'bg-accent text-muted-foreground hover:bg-accent/60'
                      }`}
                    >
                      {d === 'BUY' ? 'ACHAT' : 'VENTE'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session */}
              <div>
                <label className="text-xs text-muted-foreground">Session</label>
                <select value={form.session} onChange={e => setField('session', e.target.value)} className="select-dark mt-1">
                  {ALL_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Qualité – slider */}
              <div>
                <label className="text-xs text-muted-foreground">Qualité du trade</label>
                <div className="mt-3">
                  <QualitySlider value={form.quality} onChange={v => setField('quality', v)} />
                </div>
              </div>

              {/* Setup */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground">Setup</label>
                  <button
                    type="button"
                    onClick={() => setShowNewSetup(v => !v)}
                    className="text-xs text-primary hover:text-white hover:bg-primary px-2 py-0.5 rounded-md transition-all flex items-center gap-1"
                  >
                    <Plus size={11} /> Créer
                  </button>
                </div>
                <select value={form.setup} onChange={e => setField('setup', e.target.value)} className="select-dark">
                  <optgroup label="Setups par défaut">
                    {ALL_SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  {(user?.customSetups || []).length > 0 && (
                    <optgroup label="Mes setups">
                      {(user?.customSetups || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                  )}
                </select>
                {showNewSetup && (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newSetupName}
                      onChange={e => setNewSetupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSetup())}
                      placeholder="Nom du setup..."
                      className="input-dark flex-1 text-sm"
                    />
                    <button type="button" onClick={addCustomSetup} className="gradient-btn px-3 py-2 text-xs shrink-0">
                      OK
                    </button>
                    <button type="button" onClick={() => setShowNewSetup(false)} className="text-muted-foreground hover:text-foreground p-2">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Émotion */}
              <div>
                <label className="text-xs text-muted-foreground">Émotion</label>
                <select value={form.emotion} onChange={e => setField('emotion', e.target.value)} className="select-dark mt-1">
                  {ALL_EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>
          </GlassCard>

          {/* ── COL 2 : Paramètres ──────────────────────────────────────── */}
          <GlassCard className="animate-fade-up stagger-1">
            <h3 className="text-sm font-bold text-foreground mb-4">Paramètres du trade</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Prix d'entrée</label>
                <input type="number" step="any" value={form.entryPrice}
                  onChange={e => setField('entryPrice', e.target.value)}
                  className="input-dark mt-1" placeholder="1.0850" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Stop Loss</label>
                <input type="number" step="any" value={form.stopLoss}
                  onChange={e => setField('stopLoss', e.target.value)}
                  className="input-dark mt-1" placeholder="1.0820" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Take Profit</label>
                <input type="number" step="any" value={form.takeProfit}
                  onChange={e => setField('takeProfit', e.target.value)}
                  className="input-dark mt-1" placeholder="1.0920" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Taille de lot</label>
                <input type="number" step="any" value={form.lotSize}
                  onChange={e => setField('lotSize', e.target.value)}
                  className="input-dark mt-1" placeholder="0.10" />
                {calcFromLot && (
                  <div className="p-3 rounded-xl bg-accent/40 border border-border/50 space-y-1 text-xs mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risque ($)</span>
                      <span className="text-destructive font-bold">-${calcFromLot.riskDollar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risque (%)</span>
                      <span className={`font-bold ${calcFromLot.riskPct > 2 ? 'text-destructive' : 'text-success'}`}>
                        {calcFromLot.riskPct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bloc calculs */}
              {calc && (
                <div className="p-4 rounded-xl bg-accent/40 border border-border/50 space-y-2 text-xs">
                  {!calc.slValid && (
                    <div className="text-xs text-destructive font-bold bg-destructive/10 px-3 py-2 rounded-lg mb-2">
                      ⚠️ Stop Loss invalide — le SL doit être {form.direction === 'BUY' ? 'en-dessous' : 'au-dessus'} du prix d'entrée
                    </div>
                  )}
                  {!calc.tpValid && (
                    <div className="text-xs text-amber-400 font-bold bg-amber-400/10 px-3 py-2 rounded-lg mb-2">
                      ⚠️ Take Profit invalide — le TP doit être {form.direction === 'BUY' ? 'au-dessus' : 'en-dessous'} du prix d'entrée
                    </div>
                  )}
                  <p className="text-muted-foreground font-medium text-[11px] uppercase tracking-wide mb-2">Calculs automatiques</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital compte</span>
                    <span className="text-foreground font-medium">${calc.capital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ratio R/R</span>
                    <span className={`font-bold ${calc.slValid && calc.tpValid ? 'text-foreground' : 'text-destructive'}`}>1:{calc.rr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SL (pips)</span>
                    <span className="text-foreground">{calc.slPips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TP (pips)</span>
                    <span className="text-foreground">{calc.tpPips}</span>
                  </div>
                  <hr className="border-border/30" />
                  {calcFromLot ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risque réel ($)</span>
                        <span className="text-destructive font-bold">-${calcFromLot.riskDollar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risque réel (%)</span>
                        <span className={`font-bold ${calcFromLot.riskPct > 2 ? 'text-destructive' : 'text-success'}`}>
                          {calcFromLot.riskPct}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gain potentiel ($)</span>
                        <span className="text-success font-bold">+${Math.round(calcFromLot.riskDollar * Number(calc.rr) * 100) / 100}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risque 1% ($)</span>
                        <span className="text-destructive font-medium">-${calc.riskDollar}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gain potentiel ($)</span>
                        <span className="text-success font-medium">+${calc.potentialDollar}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <hr className="border-border/50" />

              {/* Statut */}
              <div>
                <label className="text-xs text-muted-foreground">Statut</label>
                <select
                  value={form.status}
                  onChange={e => {
                    const status = e.target.value as Trade['status'];
                    const entry   = parseFloat(form.entryPrice);
                    const sl      = parseFloat(form.stopLoss);
                    const tp      = parseFloat(form.takeProfit);
                    const selectedAccount = accounts.find(a => a.id === form.accountId);
                    const capital = Number(selectedAccount?.capital) || user?.capital || 10000;
                    const riskDollar = capital * 0.01;
                    const slDist  = Math.abs(entry - sl);
                    const tpDist  = Math.abs(tp - entry);
                    if (status === 'WIN' && tp && slDist > 0) {
                      const resultR      = Math.round((tpDist / slDist) * 100) / 100;
                      const resultDollar = Math.round(resultR * riskDollar * 100) / 100;
                      setForm(prev => ({ ...prev, status, resultR: String(resultR), resultDollar: String(resultDollar), exitPrice: String(tp) }));
                    } else if (status === 'LOSS' && sl && slDist > 0) {
                      const resultDollar = Math.round(-riskDollar * 100) / 100;
                      setForm(prev => ({ ...prev, status, resultR: '-1', resultDollar: String(resultDollar), exitPrice: String(sl) }));
                    } else if (status === 'BE') {
                      setForm(prev => ({ ...prev, status, resultR: '0', resultDollar: '0', exitPrice: String(entry) }));
                    } else {
                      setForm(prev => ({ ...prev, status }));
                    }
                  }}
                  className="select-dark mt-1"
                >
                  <option value="RUNNING">En cours</option>
                  <option value="WIN">Win</option>
                  <option value="LOSS">Loss</option>
                  <option value="BE">Breakeven</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* ── COL 3 : Notes & Preuves ─────────────────────────────────── */}
          <GlassCard className="animate-fade-up stagger-2">
            <h3 className="text-sm font-bold text-foreground mb-4">Notes & Preuves</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Note d'entrée</label>
                <textarea value={form.entryNote} onChange={e => setField('entryNote', e.target.value)}
                  className="input-dark mt-1 min-h-[80px] resize-none" placeholder="Justifie ton entrée. Pas d'excuse." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Note de sortie</label>
                <textarea value={form.exitNote} onChange={e => setField('exitNote', e.target.value)}
                  className="input-dark mt-1 min-h-[80px] resize-none" placeholder="Résultat ? Sois honnête." />
              </div>

              {/* ── Plan de trading respecté ? ── NOUVEAU ─────────────── */}
              <div>
                <label className="text-xs text-muted-foreground">Plan de trading respecté ?</label>
                <div className="flex gap-2 mt-2">
                  {([
                    { value: true,  label: '✅ Oui', active: 'bg-success/20 border-success/50 text-success' },
                    { value: false, label: '❌ Non',  active: 'bg-destructive/20 border-destructive/50 text-destructive' },
                    { value: null,  label: '— Je ne sais pas',   active: 'bg-accent/60 border-border text-muted-foreground' },
                  ] as const).map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setField('planRespected', opt.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        form.planRespected === opt.value
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
                <label className="text-xs text-muted-foreground">Lien TradingView (optionnel)</label>
                <input type="url" value={form.tradingViewLink} onChange={e => setField('tradingViewLink', e.target.value)}
                  className="input-dark mt-1" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Capture d'écran (max 5MB)</label>
                <input type="file" accept="image/*" onChange={handleScreenshot}
                  className="input-dark mt-1 text-xs file:mr-3 file:rounded-lg file:border-0 file:gradient-primary file:text-white file:px-3 file:py-1 file:text-xs file:cursor-pointer" />
                {form.screenshot && (
                  <div className="relative group mt-2 cursor-pointer" onClick={() => setZoomImg(form.screenshot)}>
                    <img src={form.screenshot} alt="Aperçu" className="rounded-xl max-h-40 w-full object-cover border border-border/30 transition-transform group-hover:scale-[1.01]" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <ZoomIn size={24} className="text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setField('screenshot', ''); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={reset}
                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm">
                Réinitialiser
              </button>
              <button type="submit" className="flex-1 gradient-btn py-2.5 text-sm">
                Enregistrer
              </button>
            </div>
          </GlassCard>
        </div>
      </form>

      {/* Zoom image */}
      {zoomImg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={() => setZoomImg(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors" onClick={() => setZoomImg(null)}>
            <X size={32} />
          </button>
          <img src={zoomImg} alt="Zoom" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
