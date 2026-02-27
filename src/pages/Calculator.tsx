import { useState, useMemo } from 'react';
import { ALL_PAIRS } from '@/types/trading';
import GlassCard from '@/components/GlassCard';

export default function Calculator() {
  const [capital, setCapital] = useState('10000');
  const [leverage, setLeverage] = useState('100');
  const [riskMode, setRiskMode] = useState<'percent' | 'dollar'>('percent');
  const [riskAmount, setRiskAmount] = useState('1');
  const [pair, setPair] = useState('EURUSD');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');

  const result = useMemo(() => {
    const cap = parseFloat(capital);
    const lev = parseFloat(leverage);
    const entryP = parseFloat(entry);
    const slP = parseFloat(sl);
    const tpP = parseFloat(tp);
    const risk = parseFloat(riskAmount);

    if (isNaN(cap) || isNaN(entryP) || isNaN(slP) || isNaN(risk)) return null;

    const riskDollar = riskMode === 'percent' ? cap * (risk / 100) : risk;
    const pipSize = pair.includes('JPY') ? 0.01 : pair === 'XAUUSD' ? 0.1 : 0.0001;
    const slPips = Math.abs(entryP - slP) / pipSize;
    const tpPips = !isNaN(tpP) ? Math.abs(tpP - entryP) / pipSize : 0;

    if (slPips === 0) return null;

    const pipValue = riskDollar / slPips;
    const lotSize = pipValue / 10;
    const margin = (lotSize * 100000 * entryP) / lev;
    const rr = tpPips > 0 ? tpPips / slPips : 0;

    return {
      riskDollar: riskDollar.toFixed(2), lotSize: lotSize.toFixed(2),
      slPips: slPips.toFixed(1), tpPips: tpPips.toFixed(1),
      pipValue: pipValue.toFixed(2), margin: margin.toFixed(2),
      potentialR: rr.toFixed(2), rr: rr.toFixed(2),
    };
  }, [capital, leverage, riskMode, riskAmount, pair, entry, sl, tp]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Calculateur de Position</h1>
        <p className="text-muted-foreground text-sm mt-1">Calcule ta taille de position et ton risque</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="animate-fade-up">
          <h3 className="text-sm font-bold text-foreground mb-4">Paramètres</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Capital ($)</label>
              <input type="number" value={capital} onChange={e => setCapital(e.target.value)} className="input-dark mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Levier (1:X)</label>
              <input type="number" value={leverage} onChange={e => setLeverage(e.target.value)} className="input-dark mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mode de risque</label>
              <div className="flex gap-2 mt-1">
                {(['percent', 'dollar'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setRiskMode(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      riskMode === m ? 'gradient-primary text-foreground' : 'bg-accent text-muted-foreground'
                    }`}>{m === 'percent' ? '%' : '$'}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Montant du risque ({riskMode === 'percent' ? '%' : '$'})</label>
              <input type="number" step="any" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} className="input-dark mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Paire</label>
              <select value={pair} onChange={e => setPair(e.target.value)} className="select-dark mt-1">
                {ALL_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Prix d'entrée</label>
              <input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} className="input-dark mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Stop Loss</label>
              <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} className="input-dark mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Take Profit (optionnel)</label>
              <input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} className="input-dark mt-1" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-1">
          <h3 className="text-sm font-bold text-foreground mb-4">Résultats</h3>
          {result ? (
            <div className="space-y-4">
              {[
                { label: 'Montant risqué', value: `$${result.riskDollar}`, color: 'text-destructive' },
                { label: 'Taille de lot', value: result.lotSize, color: 'text-foreground' },
                { label: 'Distance SL (pips)', value: result.slPips, color: 'text-foreground' },
                { label: 'Distance TP (pips)', value: result.tpPips, color: 'text-foreground' },
                { label: 'Valeur du pip', value: `$${result.pipValue}`, color: 'text-foreground' },
                { label: 'Marge requise', value: `$${result.margin}`, color: 'text-foreground' },
                { label: 'Risk/Reward', value: `1:${result.rr}`, color: 'text-primary' },
                { label: 'R Potentiel', value: result.potentialR, color: 'text-success' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-accent/30">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`metric-value text-lg ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Entre les valeurs pour voir les calculs en temps réel
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}


