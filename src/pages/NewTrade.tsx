import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { Trade, ALL_PAIRS, ALL_SESSIONS, ALL_SETUPS, ALL_EMOTIONS } from '@/types/trading';
import { ZoomableImage } from '@/components/ImageLightbox';
import GlassCard from '@/components/GlassCard';
import { Plus, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

// ── Slider qualité réutilisable ──────────────────────────────────
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
    entryNote: '',
    exitNote: '',
    tradingViewLink: '',
    screenshot: '',
    accountId: activeAccount?.id || accounts[0]?.id || '',
  });

  const [newSetupName, setNewSetupName] = useState('');
  const [showNewSetup, setShowNewSetup]  = useState(false);
  const [zoomImg, setZoomImg]            = useState<string | null>(null);

  const setField = (key: string, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Setups combinés (défaut + custom) ───────────────────────
  const allSetups = useMemo(() => {
    const custom = user?.customSetups || [];
    return [...new Set([...ALL_SETUPS, ...custom])];
  }, [user]);

  // ── Paires combinées (défaut + custom utilisateur) ───────────
  const allPairs = useMemo(() => {
    const custom = user?.customPairs || [];
    return [...new Set([...ALL_PAIRS, ...custom])];
  }, [user]);

  // ── Ajouter une paire personnalisée ─────────────────────────
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

  // ── Calculs automatiques en temps réel ──────────────────────
  const calc = useMemo(() => {
    const entry  = parseFloat(form.entryPrice);
    const sl     = parseFloat(form.stopLoss);
    const tp     = parseFloat(form.takeProfit);
    const exit   = parseFloat(form.exitPrice);
    const capital = user?.capital || 10000;
    if (isNaN(entry) || isNaN(sl) || sl === entry) return null;

    const slDist = Math.abs(entry - sl);
    const tpDist = !isNaN(tp) ? Math.abs(tp - entry) : 0;
    const rr     = slDist > 0 ? tpDist / slDist : 0;
    const riskDollar = capital * 0.01;

    // Calcul auto résultat si prix de sortie renseigné
    let autoR: number | null = null;
    let autoDollar: number | null = null;
    let autoPct: number | null = null;
    if (!isNaN(exit) && exit > 0) {
      const pnlDist = form.direction === 'BUY' ? exit - entry : entry - exit;
      autoR      = Math.round((pnlDist / slDist) * 100) / 100;
      autoDollar = Math.round(autoR * riskDollar * 100) / 100;
      autoPct    = Math.round((autoDollar / capital) * 10000) / 100;
    }

    return {
      slPips:         Math.round(slDist * (form.pair.includes('JPY') ? 100 : 10000)),
      tpPips:         Math.round(tpDist * (form.pair.includes('JPY') ? 100 : 10000)),
      rr:             rr.toFixed(2),
      riskDollar:     riskDollar.toFixed(2),
      potentialDollar:(riskDollar * rr).toFixed(2),
      autoR, autoDollar, autoPct,
    };
  }, [form.entryPrice, form.stopLoss, form.takeProfit, form.exitPrice, form.pair, form.direction, user]);

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

  // ── Ajouter un setup personnalisé ───────────────────────────
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

  // ── Screenshot ───────────────────────────────────────────────
  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setField('screenshot', reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const sl    = parseFloat(form.stopLoss);
    if (isNaN(entry) || isNaN(sl)) { toast.error('Entrée et Stop Loss requis'); return; }

    const capital    = user?.capital || 10000;
    const resultR    = form.resultR ? parseFloat(form.resultR) : 0;
    const resultDollar = form.resultDollar ? parseFloat(form.resultDollar) : resultR * capital * 0.01;

    const trade: Trade = {
      id:          `${user!.email}-${Date.now()}`,
      userId:      user!.email,
      accountId:   form.accountId || undefined,
      date:        new Date(form.date).toISOString(),
      pair:        form.pair === 'Other' ? form.customPair : form.pair,
      direction:   form.direction,
      session:     form.session,
      quality:     form.quality,
      setup:       form.setup,
      emotion:     form.emotion,
      entryPrice:  entry,
      stopLoss:    sl,
      takeProfit:  parseFloat(form.takeProfit) || 0,
      lotSize:     parseFloat(form.lotSize) || 0.1,
      exitPrice:   parseFloat(form.exitPrice) || undefined,
      resultR,
      resultDollar,
      status:      form.status,
      duration:    0,
      entryNote:   form.entryNote,
      exitNote:    form.exitNote,
      tradingViewLink: form.tradingViewLink,
      screenshot:  form.screenshot,
    };

    StorageManager.addTrade(trade);
    toast.success('Trade enregistré !');

    setForm(prev => ({
      ...prev,
      date:        new Date().toISOString().slice(0, 16),
      entryPrice:  '', stopLoss: '', takeProfit: '', lotSize: '',
      exitPrice:   '', resultR: '', resultDollar: '',
      status:      'RUNNING',
      entryNote:   '', exitNote: '', tradingViewLink: '', screenshot: '',
    }));
  };

  const reset = () => {
    setForm({
      date:        new Date().toISOString().slice(0, 16),
      pair:        'EURUSD', customPair: '',
      direction:   'BUY', session: 'London', quality: 7,
      setup:       'BOS', emotion: 'Confiant',
      entryPrice:  '', stopLoss: '', takeProfit: '', lotSize: '',
      exitPrice:   '', resultR: '', resultDollar: '',
      status:      'RUNNING',
      entryNote:   '', exitNote: '', tradingViewLink: '', screenshot: '',
      accountId:   activeAccount?.id || accounts[0]?.id || '',
    });
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Nouveau Trade</h1>
        <p className="text-muted-foreground text-sm mt-1">Enregistrer une nouvelle entrée</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COL 1 : Infos de base ───────────────────────── */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">Informations de base</h3>
            <div className="space-y-4">

              {/* Sélecteur de compte (checkboxes radio) */}
              {accounts.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Compte</label>
                  <div className="flex flex-col gap-2 mt-2">
                    {accounts.map(acc => (
                      <label
                        key={acc.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          form.accountId === acc.id
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border/40 hover:border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountId"
                          value={acc.id}
                          checked={form.accountId === acc.id}
                          onChange={() => setField('accountId', acc.id)}
                          className="accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">{acc.name}</p>
                          <p className="text-xs text-muted-foreground">{acc.broker} · {acc.type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
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

              {/* Qualité — slider */}
              <div>
                <label className="text-xs text-muted-foreground">Qualité du trade</label>
                <div className="mt-3">
                  <QualitySlider value={form.quality} onChange={v => setField('quality', v)} />
                </div>
              </div>

              {/* Setup + bouton créer custom */}
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

          {/* ── COL 2 : Paramètres ──────────────────────────── */}
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
              </div>

              {/* Bloc calculs */}
              {calc && (
                <div className="p-4 rounded-xl bg-accent/40 border border-border/50 space-y-2 text-xs">
                  <p className="text-muted-foreground font-medium text-[11px] uppercase tracking-wide mb-2">Calculs automatiques</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ratio R/R</span>
                    <span className="text-foreground font-bold">1:{calc.rr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SL (pips)</span>
                    <span className="text-foreground">{calc.slPips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TP (pips)</span>
                    <span className="text-foreground">{calc.tpPips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risque ($)</span>
                    <span className="text-destructive font-medium">-${calc.riskDollar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potentiel ($)</span>
                    <span className="text-success font-medium">+${calc.potentialDollar}</span>
                  </div>
                </div>
              )}

              <hr className="border-border/50" />
              <h4 className="text-xs font-bold text-foreground">Résultat (après clôture)</h4>

              {/* Prix de sortie → déclenche calcul auto */}
              <div>
                <label className="text-xs text-muted-foreground">Prix de sortie</label>
                <input type="number" step="any" value={form.exitPrice}
                  onChange={e => setField('exitPrice', e.target.value)}
                  className="input-dark mt-1" placeholder="Renseigne pour calcul auto" />
              </div>

              {/* Résultats auto-calculés (affichage + édition manuelle) */}
              {calc?.autoR !== null && calc?.autoR !== undefined ? (
                <div className="p-3 rounded-xl border space-y-2 text-sm border-border/50 bg-accent/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Résultat calculé automatiquement</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`py-2 rounded-lg font-bold ${calc.autoR >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {calc.autoR >= 0 ? '+' : ''}{calc.autoR}R
                    </div>
                    <div className={`py-2 rounded-lg font-bold ${calc.autoR >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {calc.autoR >= 0 ? '+' : ''}{calc.autoPct}%
                    </div>
                    <div className={`py-2 rounded-lg font-bold ${calc.autoR >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {calc.autoR >= 0 ? '+' : ''}${calc.autoDollar}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground">Résultat R (manuel)</label>
                  <input type="number" step="any" value={form.resultR}
                    onChange={e => setField('resultR', e.target.value)}
                    className="input-dark mt-1" placeholder="+2.5 ou -1" />
                </div>
              )}

              {/* Statut */}
              <div>
                <label className="text-xs text-muted-foreground">Statut</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Trade['status'] }))}
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

          {/* ── COL 3 : Notes & Preuves ─────────────────────── */}
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