// ─────────────────────────────────────────────────────────────────────────────
// PARSER GÉNÉRIQUE — Tente de lire n'importe quel CSV avec des colonnes standard
// Compatible MT5, cTrader, ThinkorSwim (avec colonnes reconnues automatiquement)
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

/** Cherche une colonne par un ensemble de noms possibles (insensible à la casse) */
function findColIndex(headers: string[], names: string[]): number {
  return headers.findIndex(h => names.some(n => h.toLowerCase().includes(n.toLowerCase())));
}

/**
 * Parse un CSV générique en cherchant des colonnes communes.
 * Supporte MT5, cTrader, ThinkorSwim, et tout format similaire.
 */
export function parseGenericCSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Détection automatique des colonnes depuis l'en-tête
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const colDate   = findColIndex(headers, ['date', 'time', 'open time', 'datetime']);
  const colSymbol = findColIndex(headers, ['symbol', 'pair', 'instrument', 'market']);
  const colDir    = findColIndex(headers, ['type', 'direction', 'action', 'side']);
  const colEntry  = findColIndex(headers, ['open', 'entry', 'open price', 'fill price']);
  const colClose  = findColIndex(headers, ['close', 'exit', 'close price', 'exit price']);
  const colSL     = findColIndex(headers, ['sl', 'stoploss', 'stop loss', 'stop_loss']);
  const colTP     = findColIndex(headers, ['tp', 'takeprofit', 'take profit', 'take_profit']);
  const colProfit = findColIndex(headers, ['profit', 'p&l', 'pnl', 'gain', 'net profit']);
  const colVol    = findColIndex(headers, ['volume', 'qty', 'size', 'lots', 'quantity']);

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      const dateStr   = colDate >= 0   ? cols[colDate]   : '';
      const symbol    = colSymbol >= 0 ? cols[colSymbol] : 'UNKNOWN';
      const dirRaw    = colDir >= 0    ? cols[colDir].toLowerCase()   : 'buy';
      const entry     = colEntry >= 0  ? parseFloat(cols[colEntry]) : 0;
      const close     = colClose >= 0  ? parseFloat(cols[colClose]) : 0;
      const sl        = colSL >= 0     ? parseFloat(cols[colSL])    : 0;
      const tp        = colTP >= 0     ? parseFloat(cols[colTP])    : 0;
      const profit    = colProfit >= 0 ? parseFloat(cols[colProfit]) : 0;
      const vol       = colVol >= 0    ? parseFloat(cols[colVol])   : 0.01;

      if (!entry) continue;
      const dateObj = dateStr ? new Date(dateStr) : new Date();
      if (dateStr && isNaN(dateObj.getTime())) continue;

      const direction = dirRaw.includes('buy') || dirRaw.includes('long') ? 'BUY' : 'SELL';
      const slDist    = sl > 0 ? Math.abs(entry - sl) : entry * 0.001;
      const pnlDist   = close > 0
        ? (direction === 'BUY' ? close - entry : entry - close)
        : 0;
      const resultR   = slDist > 0 ? Math.round((pnlDist / slDist) * 100) / 100 : (profit > 0 ? 1 : -1);

      trades.push({
        id:             `generic-${userId}-${Date.now()}-${i}`,
        userId,
        accountId,
        date:           dateObj.toISOString(),
        pair:           symbol.toUpperCase().replace(/\//g, ''),
        direction,
        session:        'London',
        quality:        7,
        setup:          'Importé CSV',
        emotion:        'Neutre',
        entryPrice:     entry,
        stopLoss:       sl || entry * 0.998,
        takeProfit:     tp || entry * 1.004,
        lotSize:        vol,
        exitPrice:      close || undefined,
        resultR,
        resultDollar:   Math.round(profit * 100) / 100,
        status:         profit > 0 ? 'WIN' : profit < 0 ? 'LOSS' : 'BE',
        duration:       0,
        entryNote:      'Trade importé',
        exitNote:       '',
        tradingViewLink:'',
        screenshot:     '',
      });
    } catch { continue; }
  }

  return trades;
}


