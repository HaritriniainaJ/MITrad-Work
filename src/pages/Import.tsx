// ─────────────────────────────────────────────────────────────────────────────
// PAGE : Import
// Permet d'importer des trades depuis des fichiers CSV (MT4, MT5, Tradovate, cTrader, générique)
// Les trades importés s'ajoutent sans écraser les trades existants.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { parseMT4CSV } from '@/lib/importers/mt4Parser';
import { parseTradovateCSV } from '@/lib/importers/tradovateParser';
import { parseGenericCSV } from '@/lib/importers/genericParser';
import { Trade } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { Upload, FileText, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// Types de plateforme supportées
type Platform = 'mt4' | 'mt5' | 'tradovate' | 'ctrader' | 'thinkorswim' | 'generic';

const PLATFORMS: { id: Platform; label: string; desc: string; format: string }[] = [
  { id: 'mt4',         label: 'MetaTrader 4',   desc: 'Export depuis l\'onglet Historique',          format: 'CSV MT4' },
  { id: 'mt5',         label: 'MetaTrader 5',   desc: 'Export depuis l\'onglet Historique',          format: 'CSV MT5' },
  { id: 'tradovate',   label: 'Tradovate',       desc: 'Export depuis Fills ou Orders',              format: 'CSV Tradovate' },
  { id: 'ctrader',     label: 'cTrader',         desc: 'Export depuis Position History',             format: 'CSV cTrader' },
  { id: 'thinkorswim', label: 'ThinkOrSwim',     desc: 'Export depuis Account Statement',           format: 'CSV TOS' },
  { id: 'generic',     label: 'Autre (CSV)',     desc: 'Tout format CSV avec colonnes standards',   format: 'CSV générique' },
];

export default function Import() {
  const { user, accounts } = useAuth();

  // État du formulaire d'import
  const [platform, setPlatform]       = useState<Platform>('mt4');
  const [accountId, setAccountId]     = useState(accounts[0]?.id || '');
  const [preview, setPreview]         = useState<Trade[]>([]);
  const [step, setStep]               = useState<'select' | 'preview' | 'done'>('select');
  const [importing, setImporting]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Lit le fichier CSV sélectionné, applique le bon parser,
   * et affiche un aperçu des trades détectés.
   */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      let trades: Trade[] = [];

      // Sélection du parser selon la plateforme
      try {
        if (platform === 'mt4' || platform === 'mt5') {
          trades = parseMT4CSV(text, user!.email, accountId || undefined);
        } else if (platform === 'tradovate') {
          trades = parseTradovateCSV(text, user!.email, accountId || undefined);
        } else {
          // cTrader, ThinkorSwim, générique → parser générique
          trades = parseGenericCSV(text, user!.email, accountId || undefined);
        }
      } catch {
        toast.error('Erreur lors de la lecture du fichier. Vérifie le format.');
        return;
      }

      if (trades.length === 0) {
        toast.error('Aucun trade détecté. Vérifie le format du fichier.');
        return;
      }

      setPreview(trades);
      setStep('preview');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input pour permettre le re-sélection
  };

  /**
   * Confirme l'import : sauvegarde tous les trades prévisualisés
   * sans écraser les trades existants.
   */
  const confirmImport = () => {
    setImporting(true);
    let count = 0;
    preview.forEach(trade => {
      StorageManager.addTrade(trade);
      count++;
    });
    setImporting(false);
    setStep('done');
    toast.success(`${count} trade${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} avec succès !`);
  };

  /** Réinitialise pour permettre un nouvel import */
  const reset = () => {
    setPreview([]);
    setStep('select');
    setPlatform('mt4');
  };

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Importer des trades</h1>
        <p className="text-muted-foreground text-sm mt-1">Importe ton historique depuis MT4, MT5, Tradovate, cTrader et plus</p>
      </div>

      {/* ── ÉTAPE 1 : Sélection de la plateforme ─────────── */}
      {step === 'select' && (
        <>
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">1. Choisis ta plateforme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    platform === p.id
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border/50 hover:border-border bg-accent/20 hover:bg-accent/40'
                  }`}
                >
                  <p className="text-sm font-bold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary mt-2 inline-block">{p.format}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Sélection du compte cible */}
          {accounts.length > 0 && (
            <GlassCard className="animate-fade-up">
              <h3 className="text-sm font-bold text-foreground mb-3">2. Compte cible (optionnel)</h3>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="select-dark"
              >
                <option value="">Aucun compte spécifique</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} — {acc.broker}</option>
                ))}
              </select>
            </GlassCard>
          )}

          {/* Zone d'upload */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">3. Sélectionne ton fichier CSV</h3>
            <div
              className="border-2 border-dashed border-border/50 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={40} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Clique pour sélectionner ton fichier</p>
              <p className="text-sm text-muted-foreground">Format : CSV ({PLATFORMS.find(p => p.id === platform)?.format})</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="hidden"
            />
          </GlassCard>

          {/* Instructions */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-3">Comment exporter ?</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {platform === 'mt4' && (
                <>
                  <p>1. Ouvre MetaTrader 4</p>
                  <p>2. Va dans <strong className="text-foreground">Terminal → Historique du compte</strong></p>
                  <p>3. Clic droit → <strong className="text-foreground">Enregistrer comme rapport détaillé</strong></p>
                  <p>4. Choisis le format <strong className="text-foreground">CSV</strong></p>
                </>
              )}
              {platform === 'mt5' && (
                <>
                  <p>1. Ouvre MetaTrader 5</p>
                  <p>2. Va dans <strong className="text-foreground">Boîte à outils → Historique</strong></p>
                  <p>3. Clic droit → <strong className="text-foreground">Rapport → Rapport en CSV</strong></p>
                </>
              )}
              {platform === 'tradovate' && (
                <>
                  <p>1. Connecte-toi à Tradovate</p>
                  <p>2. Va dans <strong className="text-foreground">Account → Fills</strong></p>
                  <p>3. Clique sur <strong className="text-foreground">Export CSV</strong></p>
                </>
              )}
              {(platform === 'ctrader' || platform === 'thinkorswim' || platform === 'generic') && (
                <>
                  <p>Exporte ton historique en format CSV depuis ta plateforme.</p>
                  <p>Le parser générique détecte automatiquement les colonnes communes.</p>
                </>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* ── ÉTAPE 2 : Prévisualisation ────────────────────── */}
      {step === 'preview' && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-foreground">Aperçu — {preview.length} trades détectés</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Vérifie les données avant de confirmer l'import</p>
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-all">
              Annuler
            </button>
          </div>

          {/* Tableau de prévisualisation */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Paire', 'Dir.', 'Entrée', 'Sortie', 'P&L $', 'Statut'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((t, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-accent/20">
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('fr')}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{t.pair}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.entryPrice}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.exitPrice || '—'}</td>
                    <td className={`px-3 py-2 text-sm font-bold metric-value ${t.resultDollar >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.resultDollar >= 0 ? '+' : ''}${t.resultDollar}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        t.status === 'WIN' ? 'badge-win' : t.status === 'LOSS' ? 'badge-loss' : 'badge-be'
                      }`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="text-center text-xs text-muted-foreground pt-3">+ {preview.length - 20} autres trades</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:bg-accent transition-all">
              Annuler
            </button>
            <button
              onClick={confirmImport}
              disabled={importing}
              className="flex-1 gradient-btn py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              {importing ? 'Import...' : `Importer ${preview.length} trades`}
            </button>
          </div>
        </GlassCard>
      )}

      {/* ── ÉTAPE 3 : Succès ─────────────────────────────── */}
      {step === 'done' && (
        <GlassCard className="animate-fade-up text-center py-12" glow="blue">
          <CheckCircle size={60} className="text-success mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Import réussi !</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {preview.length} trade{preview.length > 1 ? 's' : ''} importé{preview.length > 1 ? 's' : ''} dans ton journal.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="gradient-btn px-6 py-2.5 text-sm">
              Importer d'autres
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
