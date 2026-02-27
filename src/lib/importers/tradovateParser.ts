// ─────────────────────────────────────────────────────────────────────────────
// PARSER TRADOVATE — Position History CSV
// Format : Position ID, Timestamp, Trade Date, Net Pos, Net Price, Bought,
//          Avg. Buy, Sold, Avg. Sell, Account, Contract, Product, ...,
//          Paired Qty, Buy Price, Sell Price, P/L, Currency,
//          Bought Timestamp, Sold Timestamp
//
// ⚠️  Un trade Tradovate = plusieurs lignes (fills) avec le même Position ID.
//     Ce parser groupe les fills par Position ID pour reconstruire 1 trade.
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

/** Nettoie et parse un nombre (gère "1,050.00" → 1050) */
function parseNum(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/,/g, '')) || 0;
}

/** Parse une date Tradovate "MM/DD/YYYY HH:MM:SS" → ISO string */
function parseDate(s: string): Date | null {
  if (!s) return null;
  // Format : 02/17/2026 15:26:28
  const match = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, mm, dd, yyyy, hh, min, sec] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`);
}

/** Détermine la session selon l'heure UTC */
function getSession(date: Date): string {
  const h = date.getUTCHours();
  if (h >= 7  && h < 12)  return 'London';
  if (h >= 12 && h < 17)  return 'New York';
  if (h >= 12 && h < 16)  return 'London/NY Overlap';
  if (h >= 0  && h < 7)   return 'Asia';
  return 'New York';
}

/** Statut depuis P&L */
function getStatus(pnl: number): 'WIN' | 'LOSS' | 'BE' {
  if (pnl > 0)  return 'WIN';
  if (pnl < 0)  return 'LOSS';
  return 'BE';
}

/** Normalise le symbole Tradovate → paire lisible */
function normalizePair(product: string, contract: string): string {
  const map: Record<string, string> = {
    'MGC': 'XAUUSD',   // E-Micro Gold
    'GC':  'XAUUSD',   // Gold
    'SI':  'XAGUSD',   // Silver
    'NQ':  'NAS100',   // Nasdaq
    'ES':  'SP500',    // S&P 500
    'YM':  'DJ30',     // Dow Jones
    '6E':  'EURUSD',   // Euro FX
    '6B':  'GBPUSD',   // British Pound
    '6J':  'USDJPY',   // Japanese Yen
    '6A':  'AUDUSD',   // Australian Dollar
    'CL':  'USOIL',    // Crude Oil
    'NG':  'NATGAS',   // Natural Gas
    'BTC': 'BTCUSD',
  };
  return map[product] || product.toUpperCase();
}

/**
 * Parse un export CSV Tradovate "Position History".
 * Groupe les fills par Position ID pour reconstruire 1 trade complet par position.
 */
export function parseTradovateCSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText
    .split('\n')
    .map(l => l.trim().replace(/\r$/, ''))
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  // Parser CSV simple (gère les virgules dans les nombres entre guillemets)
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

  // Index des colonnes
  const iPositionId       = headers.indexOf('position id');
  const iProduct          = headers.indexOf('product');
  const iContract         = headers.indexOf('contract');
  const iAvgBuy           = headers.indexOf('avg. buy');
  const iAvgSell          = headers.indexOf('avg. sell');
  const iBought           = headers.indexOf('bought');
  const iSold             = headers.indexOf('sold');
  const iPnl              = headers.indexOf('p/l');
  const iBoughtTimestamp  = headers.indexOf('bought timestamp');
  const iSoldTimestamp    = headers.indexOf('sold timestamp');
  const iTradeDate        = headers.indexOf('trade date');
  const iAccount          = headers.indexOf('account');

  // Grouper les lignes par Position ID
  const positionMap: Map<string, string[][]> = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;
    const pid = cols[iPositionId] || `unknown-${i}`;
    if (!positionMap.has(pid)) positionMap.set(pid, []);
    positionMap.get(pid)!.push(cols);
  }

  const trades: Trade[] = [];
  let counter = 0;

  positionMap.forEach((fills, pid) => {
    try {
      const first = fills[0];

      // Somme du P&L de tous les fills
      const totalPnl = fills.reduce((sum, row) => sum + parseNum(row[iPnl] || '0'), 0);

      const product    = first[iProduct]  || 'UNKNOWN';
      const contract   = first[iContract] || '';
      const avgBuy     = parseNum(first[iAvgBuy]  || '0');
      const avgSell    = parseNum(first[iAvgSell] || '0');
      const qtyBought  = parseNum(first[iBought]  || '0');
      const qtySold    = parseNum(first[iSold]    || '0');

      // Direction : si avg buy > avg sell → on a acheté haut et vendu bas → SELL
      // Si avg buy < avg sell → on a acheté bas et vendu haut → BUY
      const direction: 'BUY' | 'SELL' =
        (avgBuy > 0 && avgSell > 0)
          ? (avgBuy < avgSell ? 'BUY' : 'SELL')
          : (qtyBought >= qtySold ? 'BUY' : 'SELL');

      const entryPrice = direction === 'BUY' ? avgBuy  : avgSell;
      const exitPrice  = direction === 'BUY' ? avgSell : avgBuy;
      const lotSize    = Math.max(qtyBought, qtySold) || 1;

      // Timestamps
      const boughtTs = parseDate(first[iBoughtTimestamp] || '');
      const soldTs   = parseDate(first[iSoldTimestamp]   || '');
      const tradeDate = first[iTradeDate] || '';

      // Date d'entrée = plus ancienne des deux timestamps
      let entryDate: Date;
      if (boughtTs && soldTs) {
        entryDate = boughtTs < soldTs ? boughtTs : soldTs;
      } else {
        entryDate = boughtTs || soldTs || new Date(tradeDate) || new Date();
      }

      // Durée en minutes
      let duration = 0;
      if (boughtTs && soldTs) {
        duration = Math.abs(Math.round((boughtTs.getTime() - soldTs.getTime()) / 60000));
      }

      // Calcul R approximatif (SL non disponible dans Tradovate → on estime 1% du prix)
      const slDist = entryPrice * 0.01;
      const pnlDist = direction === 'BUY'
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice);
      const resultR = slDist > 0
        ? Math.round((pnlDist / slDist) * 100) / 100
        : (totalPnl > 0 ? 1 : -1);

      const pair = normalizePair(product, contract);

      trades.push({
        id:              `tradovate-${pid}-${counter++}`,
        userId,
        accountId,
        date:            entryDate.toISOString(),
        pair,
        direction,
        session:         getSession(entryDate),
        quality:         null,
        setup:           null,
        emotion:         'Neutre',
        entryPrice,
        stopLoss:        direction === 'BUY'
                           ? entryPrice * 0.99
                           : entryPrice * 1.01,
        takeProfit:      direction === 'BUY'
                           ? entryPrice * 1.02
                           : entryPrice * 0.98,
        lotSize,
        exitPrice,
        resultR:         null,
        resultDollar:    Math.round(totalPnl * 100) / 100,
        status:          getStatus(totalPnl),
        duration,
        entryNote:       '',
        exitNote:        '',
        tradingViewLink: '',
        screenshot:      '',
      });
    } catch {
      // Ignore les positions malformées
    }
  });

  return trades;
}




