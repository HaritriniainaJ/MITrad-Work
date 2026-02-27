// ─────────────────────────────────────────────────────────────────────────────
// PARSER MT5 — Export CSV MetaTrader 5
//
// MT5 peut exporter en plusieurs formats. Ce parser gère les 2 formats communs :
//
// FORMAT A (Rapport détaillé HTML→CSV) :
//   Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Swap,Profit,Balance,Comment
//
// FORMAT B (Historique simplifié) :
//   Open Time,Symbol,Type,Volume,Open,SL,TP,Close,Swap,Commission,Profit
//
// La détection du format est automatique via les en-têtes.
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

/** Nettoie et parse un nombre */
function parseNum(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/,/g, '').replace(/\s/g, '')) || 0;
}

/** Parse une date MT5 (plusieurs formats possibles) */
function parseDate(s: string): Date | null {
  if (!s) return null;
  // "2024.01.15 10:30:00" ou "2024-01-15 10:30:00" ou "2024.01.15"
  const cleaned = s.replace(/\./g, '-').replace(' ', 'T');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/** Détermine la session selon l'heure UTC */
function getSession(date: Date): string {
  const h = date.getUTCHours();
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 17) return 'New York';
  if (h >= 12 && h < 16) return 'London/NY Overlap';
  if (h >= 0  && h < 7)  return 'Asia';
  return 'London';
}

/** Statut depuis profit */
function getStatus(profit: number): 'WIN' | 'LOSS' | 'BE' {
  if (profit > 0) return 'WIN';
  if (profit < 0) return 'LOSS';
  return 'BE';
}

/** Calcul R depuis prix */
function calcR(entry: number, sl: number, exit: number, dir: 'BUY' | 'SELL'): number {
  const slDist = Math.abs(entry - sl);
  if (slDist === 0) return 0;
  const pnl = dir === 'BUY' ? exit - entry : entry - exit;
  return Math.round((pnl / slDist) * 100) / 100;
}

/** Cherche index d'une colonne par noms possibles */
function findCol(headers: string[], names: string[]): number {
  return headers.findIndex(h =>
    names.some(n => h.toLowerCase().replace(/[\s._]/g, '').includes(n.toLowerCase().replace(/[\s._]/g, '')))
  );
}

/**
 * Parse un export CSV MetaTrader 5.
 * Détecte automatiquement le format (rapport détaillé ou historique simplifié).
 */
export function parseMT5CSV(csvText: string, userId: string, accountId?: string): Trade[] {
  return parseMT5XLSX(csvText, userId, accountId);
}

export function parseMT5XLSX(csvText: string, userId: string, accountId?: string): Trade[] {  const trades: Trade[] = [];
  const allLines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Trouver la section "Positions" - header avec Heure,Position,Symbole
  let headerIdx = -1;
  for (let i = 0; i < allLines.length; i++) {
    const lower = allLines[i].toLowerCase();
    if ((lower.includes('heure') || lower.includes('time')) && 
        (lower.includes('symbole') || lower.includes('symbol')) && 
        (lower.includes('type'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return parseMT5CSV(csvText, userId, accountId);

  // Trouver où s'arrête la section Positions (ligne "Ordres" ou "Orders")
  let endIdx = allLines.length;
  for (let i = headerIdx + 1; i < allLines.length; i++) {
    const lower = allLines[i].toLowerCase();
    if (lower.startsWith('ordres') || lower.startsWith('orders') || 
        lower.startsWith('transactions') || lower.startsWith('résultats')) {
      endIdx = i;
      break;
    }
  }

  // Parser chaque ligne de position
  for (let i = headerIdx + 1; i < endIdx; i++) {
    const line = allLines[i];
    if (!line) continue;

    // Split par tabulation ou virgule selon le séparateur
    const sep = line.includes('\t') ? '\t' : ',';
    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));

    if (cols.length < 10) continue;

    // Format: Heure | Position | Symbole | Type | Volume | Prix | S/L | T/P | Heure(close) | Prix(close) | Commission | Echange | Profit
    const openDateStr  = cols[0];
    const symbol       = (cols[2] || '').toUpperCase().replace(/\.(vxc|raw|ecn|pro|mt5)/i, '').trim();
    const typeRaw      = (cols[3] || '').toLowerCase().trim();
    const volumeStr    = (cols[4] || '').replace(/\s/g, '').replace(',', '.');
    const openStr      = (cols[5] || '').replace(/\s/g, '').replace(',', '.');
    const slStr        = (cols[6] || '').replace(/\s/g, '').replace(',', '.');
    const tpStr        = (cols[7] || '').replace(/\s/g, '').replace(',', '.');
    const closeDateStr = cols[8];
    const closeStr     = (cols[9] || '').replace(/\s/g, '').replace(',', '.');
    const profitStr    = (cols[12] || '').replace(/\s/g, '').replace(',', '.').replace('−', '-');

    if (!symbol || !typeRaw) continue;
    if (!typeRaw.includes('buy') && !typeRaw.includes('sell')) continue;
    if (['balance', 'dépôt', 'retrait', 'credit'].some(t => typeRaw.includes(t))) continue;

    const volume     = parseFloat(volumeStr) || 0.01;
    const openPrice  = parseFloat(openStr) || 0;
    const sl         = parseFloat(slStr) || 0;
    const tp         = parseFloat(tpStr) || 0;
    const closePrice = parseFloat(closeStr) || 0;
    const profit     = parseFloat(profitStr) || 0;

    if (!openPrice) continue;

    const entryDate = parseDate(openDateStr.replace(/\./g, '-').replace(' ', 'T'));
    const exitDate  = parseDate(closeDateStr.replace(/\./g, '-').replace(' ', 'T'));
    if (!entryDate) continue;

    const direction: 'BUY' | 'SELL' = typeRaw.includes('buy') ? 'BUY' : 'SELL';
    const duration = exitDate ? Math.round((exitDate.getTime() - entryDate.getTime()) / 60000) : 0;

    trades.push({
      id:              `mt5-${userId}-${Date.now()}-${i}`,
      userId,
      accountId,
      date:            entryDate.toISOString(),
      pair:            symbol,
      direction,
      session:         getSession(entryDate),
      quality:         null,
      setup:           null,
      emotion:         'Neutre',
      entryPrice:      openPrice,
      stopLoss:        sl || (direction === 'BUY' ? openPrice * 0.99 : openPrice * 1.01),
      takeProfit:      tp || (direction === 'BUY' ? openPrice * 1.02 : openPrice * 0.98),
      lotSize:         volume,
      exitPrice:       closePrice || undefined,
      resultR:         null,
      resultDollar:    Math.round(profit * 100) / 100,
      status:          getStatus(profit),
      duration,
      entryNote:       '',
      exitNote:        '',
      tradingViewLink: '',
      screenshot:      '',
    });
  }

  return trades;
}




