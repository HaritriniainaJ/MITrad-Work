// ─────────────────────────────────────────────────────────────────────────────
// PARSER MITRAD EXPORT — Format XLSX/CSV exporté depuis MITrad Journal
// Colonnes: Date,Paire,Direction,Session,Setup,Émotion,Qualité,Entrée,SL,TP,
//           Sortie,Lot,Résultat R,Résultat $,Statut,Note entrée,Note sortie
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

function parseNum(s: string): number {
  if (!s) return 0;
  // Remplacer virgule par point (format français)
  return parseFloat(s.toString().replace(',', '.')) || 0;
}

function parseDate(s: string): string {
  if (!s) return '';
  // Format DD/MM/YYYY -> YYYY-MM-DD
  const parts = s.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  // Essayer format ISO direct
  try {
    return new Date(s).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function parseMITradCSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Chercher la ligne d'en-tête (contient "Date" et "Paire")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('date') && l.includes('paire')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const headers = lines[headerIdx].split(',').map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever accents
  );

  const idx = (names: string[]) => {
    for (const name of names) {
      const i = headers.findIndex(h => h.includes(name));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iDate     = idx(['date']);
  const iPaire    = idx(['paire', 'pair', 'symbol']);
  const iDir      = idx(['direction', 'side', 'type']);
  const iSession  = idx(['session']);
  const iSetup    = idx(['setup']);
  const iEmotion  = idx(['emotion']);
  const iQualite  = idx(['qualite', 'qualité', 'quality']);
  const iEntree   = idx(['entree', 'entrée', 'entry', 'open']);
  const iSL       = idx(['sl', 'stoploss', 'stop']);
  const iTP       = idx(['tp', 'takeprofit', 'take']);
  const iSortie   = idx(['sortie', 'exit', 'close']);
  const iLot      = idx(['lot', 'size', 'volume']);
  const iResultR  = idx(['resultat r', 'résultat r', 'result r', 'r']);
  const iResultD  = idx(['resultat $', 'résultat $', 'result $', 'pnl', 'profit']);
  const iStatut   = idx(['statut', 'status']);
  const iNoteE    = idx(['note entree', 'note entrée', 'note_entry']);
  const iNoteS    = idx(['note sortie', 'note sortie', 'note_exit']);

  const trades: Trade[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    try {
      const raw = lines[i];
      if (!raw || raw.length < 3) continue;

      const cols = raw.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4) continue;

      const dateStr = iDate >= 0 ? cols[iDate] : '';
      const date = parseDate(dateStr);
      if (!date) continue;

      const pair = iPaire >= 0 ? cols[iPaire].toUpperCase() : '';
      if (!pair) continue;

      const dirRaw = iDir >= 0 ? cols[iDir].toUpperCase() : '';
      const direction = dirRaw === 'SELL' ? 'Short' : 'Long';

      const entryPrice  = iEntree >= 0  ? parseNum(cols[iEntree])  : 0;
      const exitPrice   = iSortie >= 0  ? parseNum(cols[iSortie])  : 0;
      const stopLoss    = iSL >= 0      ? parseNum(cols[iSL]) || undefined : undefined;
      const takeProfit  = iTP >= 0      ? parseNum(cols[iTP]) || undefined : undefined;
      const resultR     = iResultR >= 0 ? parseNum(cols[iResultR]) || undefined : undefined;
      const resultDollar = iResultD >= 0 ? parseNum(cols[iResultD]) : 0;
      const setup       = iSetup >= 0   ? cols[iSetup] || undefined : undefined;
      const session     = iSession >= 0 ? cols[iSession] || undefined : undefined;
      const emotion     = iEmotion >= 0 ? cols[iEmotion] || undefined : undefined;
      const noteEntry   = iNoteE >= 0   ? cols[iNoteE] || undefined : undefined;
      const noteExit    = iNoteS >= 0   ? cols[iNoteS] || undefined : undefined;

      const statusRaw = iStatut >= 0 ? cols[iStatut].toUpperCase() : '';
      const status = statusRaw === 'WIN' || statusRaw === 'LOSS' || statusRaw === 'BE' ? 'closed' : 'closed';

      const trade: Trade = {
        id: `mitrad_${i}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        userId,
        accountId: accountId || '',
        date,
        pair,
        direction,
        entryPrice,
        exitPrice,
        stopLoss: stopLoss && stopLoss !== 0 ? stopLoss : undefined,
        takeProfit: takeProfit && takeProfit !== 0 ? takeProfit : undefined,
        resultDollar,
        resultR,
        setup,
        session,
        emotion,
        noteEntry,
        noteExit,
        status: 'closed',
        createdAt: new Date().toISOString(),
      };

      trades.push(trade);
    } catch (e) {
      console.warn('mitradParser: erreur ligne', i, e);
    }
  }

  return trades;
}
