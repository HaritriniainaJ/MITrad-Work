// ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
// PAGE : Import "” MT5 & Tradovate
// ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { parseMT5CSV } from '@/lib/importers/mt5Parser';
import { parseCTraderCSV } from '@/lib/importers/ctraderParser';
import { parseTradovateCSV } from '@/lib/importers/tradovateParser';
import { parseGenericCSV } from '@/lib/importers/genericParser';
import { Trade } from '@/types/trading';
import { StorageManager } from '@/lib/storage';
import { importTrades } from '@/lib/api';
import GlassCard from '@/components/GlassCard';
import { Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { parseTradovatePairedFills } from '@/lib/importers/tradovateFilledParser';
import * as XLSX from 'xlsx';
type Platform = 'mt5' | 'tradovate' | 'mt4' | 'generic';

const PLATFORMS: {
  id: Platform;
  label: string;
  desc: string;
  format: string;
  color: string;
}[] = [
  {
    id: 'mt5',
    label: 'MetaTrader 5',
    desc: 'Rapport détaillé ou historique simplifié',
    format: 'CSV MT5',
    color: 'border-blue-500/40 bg-blue-500/5',
  },
  {
    id: 'tradovate',
    label: 'Tradovate',
    desc: 'Position History (fills groupés par position)',
    format: 'CSV Position History',
    color: 'border-emerald-500/40 bg-emerald-500/5',
  },
  {
    id: 'mt4',
    label: 'MetaTrader 4',
    desc: 'Export depuis l\'onglet Historique',
    format: 'CSV MT4',
    color: 'border-purple-500/40 bg-purple-500/5',
  },
  {
    id: 'generic',
    label: 'Autre CSV',
    desc: 'Tout format avec colonnes standards',
    format: 'CSV générique',
    color: 'border-orange-500/40 bg-orange-500/5',
  },
  {
    id: 'ctrader' as Platform,
    label: 'cTrader',
    desc: 'Export Transactions depuis cTrader Web',
    format: 'CSV cTrader',
    color: 'border-cyan-500/40 bg-cyan-500/5',
  },
];

// Instructions d'export par plateforme
const INSTRUCTIONS: Record<Platform, React.ReactNode> = {
  mt5: (
    <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
      <li>Ouvrez MetaTrader 5</li>
      <li>Allez dans <strong className="text-foreground">Boîte à outils ←’ Historique</strong></li>
      <li>Clic droit sur la liste ←’ <strong className="text-foreground">Rapport ←’ Rapport en CSV</strong></li>
      <li>Ou : Clic droit ←’ <strong className="text-foreground">Enregistrer comme rapport détaillé (CSV)</strong></li>
    </ol>
  ),
  tradovate: (
    <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
      <li>Connectez-vous sur <strong className="text-foreground">trader.tradovate.com</strong></li>
      <li>Allez dans <strong className="text-foreground">Account ←’ Performance</strong></li>
      <li>Cliquez sur <strong className="text-foreground">Position History</strong></li>
      <li>Cliquez sur <strong className="text-foreground">Export ←’ CSV</strong></li>
    </ol>
  ),
  mt4: (
    <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
      <li>Ouvrez MetaTrader 4</li>
      <li>Allez dans <strong className="text-foreground">Terminal ←’ Historique du compte</strong></li>
      <li>Clic droit ←’ <strong className="text-foreground">Enregistrer comme rapport détaillé</strong></li>
      <li>Choisissez le format <strong className="text-foreground">CSV</strong></li>
    </ol>
  ),
  generic: (
    <p className="text-sm text-muted-foreground">
      Exportez votre historique en CSV depuis n'importe quelle plateforme.
      Le parser détecte automatiquement les colonnes : date, symbole, direction,
      prix d'entrée/sortie, SL, TP, profit.
    </p>
  ),
};

export default function Import() {
  const { user, accounts } = useAuth();
  const [platform, setPlatform]   = useState<Platform>('mt5');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [preview, setPreview]     = useState<Trade[]>([]);
  const [step, setStep]           = useState<'select' | 'preview' | 'done'>('select');
  const [importing, setImporting] = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  console.log('FICHIER SÉLECTIONNÉ:', file?.name, file?.type, file?.size);
  if (!file) return;
  setError('');
  console.log('IS EXCEL:', file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  const reader = new FileReader();
  reader.onload = () => {
    let trades: Trade[] = [];
    try {
      if (isExcel) {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        console.log('LIGNES CSV:', csvText.split('\n').slice(0, 3));
        console.log('LIGNES 1-30:', csvText.split('\n').slice(0, 30).join('\n'));
        console.log('TOTAL LIGNES:', csvText.split('\n').length);
        console.log('LIGNES 1-20:', csvText.split('\n').slice(0, 20));
        if (platform === 'tradovate') {
          trades = parseTradovatePairedFills(csvText, user!.email, accountId || undefined);
        } else if (platform === 'mt5' || platform === 'mt4') {
          trades = parseMT5CSV(csvText, user!.email, accountId || undefined);
        } else if (platform === 'ctrader') {
          trades = parseCTraderCSV(csvText, user!.email, accountId || undefined);
        } else {
          trades = parseGenericCSV(csvText, user!.email, accountId || undefined);
        }
        console.log('TRADES PARSÉS:', trades.length, trades.map(t => t.id));
      } else {
        const text = reader.result as string;
        if (platform === 'mt5' || platform === 'mt4') {
          trades = parseMT5CSV(text, user!.email, accountId || undefined);
        } else if (platform === 'tradovate') {
          trades = parseTradovatePairedFills(text, user!.email, accountId || undefined);
        } else if (platform === 'ctrader') {
          trades = parseCTraderCSV(text, user!.email, accountId || undefined);
        } else {
          trades = parseGenericCSV(text, user!.email, accountId || undefined);
        }
      }
    } catch (err) {
      console.error('ERREUR PARSER:', err);
      setError('Erreur lors de la lecture. Vérifiez que le fichier est valide.');
      toast.error('Erreur de lecture du fichier.');
      return;
    }

    if (trades.length === 0) {
      setError('Aucun trade détecté. Vérifiez la plateforme sélectionnée et le format du fichier.');
      toast.error('Aucun trade détecté.');
      return;
    }

    setPreview(trades);
    setStep('preview');
    toast.success(`${trades.length} trade${trades.length > 1 ? 's' : ''} détecté${trades.length > 1 ? 's' : ''} !`);
  };

  if (isExcel) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
  e.target.value = '';
};

// Par ce nouveau bloc :
const confirmImport = async () => {
  setImporting(true);
  const targetAccountId = accountId || accounts[0]?.id;
  if (!targetAccountId) {
    toast.error("Aucun compte trouvé. Créez un compte avant d'importer.");
    setImporting(false);
    return;
  }
  try {
    const tradesToSend = preview.map(trade => ({
      date:              trade.date,
      pair:              trade.pair,
      direction:         trade.direction,
      session:           trade.session,
      quality:           null,
      setup:             null,
      emotion:           trade.emotion,
      entry_price:       trade.entryPrice,
      stop_loss:         trade.stopLoss,
      take_profit:       trade.takeProfit,
      lot_size:          trade.lotSize,
      exit_price:        trade.exitPrice ?? null,
      result_r:          null,
      result_dollar:     trade.resultDollar,
      status:            trade.status,
      entry_note:        null,
      exit_note:         null,
      trading_view_link: trade.tradingViewLink ?? "",
      screenshot:        trade.screenshot ?? "",
      plan_respected:    null,
      is_imported:       true,
    }));
    await importTrades(targetAccountId, tradesToSend);
    toast.success(`${preview.length} trade${preview.length > 1 ? "s" : ""} importé${preview.length > 1 ? "s" : ""} !`);
  } catch {
    toast.error("Erreur lors de l'import.");
  }
  setImporting(false);
  setStep('done');
};

  const reset = () => {
    setPreview([]);
    setStep('select');
    setError('');
  };

  // Stats de l'aperçu
  const wins   = preview.filter(t => t.status === 'WIN').length;
  const losses = preview.filter(t => t.status === 'LOSS').length;
  const totalPnl = preview.reduce((s, t) => s + t.resultDollar, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Importer des trades</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importez votre historique depuis MT5 ou Tradovate "” les données apparaissent dans tout le journal
        </p>
      </div>

      {/* ”€”€ ÉTAPE 1 : Sélection ”€”€ */}
      {step === 'select' && (
        <>
          {/* Choix plateforme */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">1. Choisissez votre plateforme</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    platform === p.id
                      ? `${p.color} border-opacity-100`
                      : 'border-border/50 hover:border-border bg-accent/20 hover:bg-accent/40'
                  }`}
                >
                  <p className="text-sm font-bold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{p.desc}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary mt-2 inline-block">
                    {p.format}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Compte cible */}
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
                  <option key={acc.id} value={acc.id}>{acc.name} "” {acc.broker}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Si sélectionné, les trades seront liés à ce compte dans vos statistiques.
              </p>
            </GlassCard>
          )}

          {/* Upload */}
          <GlassCard className="animate-fade-up">
            <h3 className="text-sm font-bold text-foreground mb-4">
              {accounts.length > 0 ? '3.' : '2.'} Sélectionnez votre fichier CSV
            </h3>
            <div
              className="border-2 border-dashed border-border/50 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={40} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Cliquez pour sélectionner votre fichier</p>
              <p className="text-sm text-muted-foreground">
                Format attendu : {PLATFORMS.find(p => p.id === platform)?.format}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFile} className="hidden" />

            {/* Erreur */}
            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </GlassCard>

          {/* Instructions */}
          <GlassCard className="animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Comment exporter depuis {PLATFORMS.find(p => p.id === platform)?.label} ?
              </h3>
            </div>
            {INSTRUCTIONS[platform]}
          </GlassCard>
        </>
      )}

      {/* ”€”€ ÉTAPE 2 : Aperçu ”€”€ */}
      {step === 'preview' && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-bold text-foreground text-lg">
                {preview.length} trade{preview.length > 1 ? 's' : ''} détecté{preview.length > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vérifiez les données avant de confirmer l'import
              </p>
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-all">
              Annuler
            </button>
          </div>

          {/* Résumé rapide */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-center">
              <p className="text-lg font-bold text-success">{wins}</p>
              <p className="text-xs text-muted-foreground">WIN</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-lg font-bold text-destructive">{losses}</p>
              <p className="text-xs text-muted-foreground">LOSS</p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${totalPnl >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <p className={`text-lg font-bold ${totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">P&L Total</p>
            </div>
          </div>

          {/* Tableau aperçu */}
          <div className="overflow-x-auto mb-5 rounded-xl border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {['Date', 'Paire', 'Dir.', 'Entrée', 'Sortie', 'P&L $', 'Durée', 'Statut'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 25).map((t, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-accent/20 transition-colors">
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('fr', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{t.pair}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.direction === 'BUY' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{t.entryPrice}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{t.exitPrice || '"”'}</td>
                    <td className={`px-3 py-2 text-sm font-bold ${t.resultDollar >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.resultDollar >= 0 ? '+' : ''}${t.resultDollar}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {t.duration > 0 ? `${t.duration}min` : '"”'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        t.status === 'WIN'  ? 'bg-success/20 text-success' :
                        t.status === 'LOSS' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted/30 text-muted-foreground'
                      }`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 25 && (
              <p className="text-center text-xs text-muted-foreground py-3">
                + {preview.length - 25} autres trades non affichés
              </p>
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
              {importing ? 'Import en cours...' : `Importer ${preview.length} trade${preview.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </GlassCard>
      )}

      {/* ”€”€ ÉTAPE 3 : Succès ”€”€ */}
      {step === 'done' && (
        <GlassCard className="animate-fade-up text-center py-12">
          <CheckCircle size={60} className="text-success mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Import réussi !</h3>
          <p className="text-muted-foreground text-sm mb-2">
            <span className="font-bold text-foreground">{preview.length} trade{preview.length > 1 ? 's' : ''}</span> ajouté{preview.length > 1 ? 's' : ''} à votre journal.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Les données sont maintenant visibles dans le Dashboard, l'Historique et les Analytiques.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="gradient-btn px-6 py-2.5 text-sm">
              Importer d'autres trades
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}







