// ─────────────────────────────────────────────────────────────────────────────
// PARSER MT4 — Importe les trades depuis un export CSV MetaTrader 4
// Format attendu : Date,Symbol,Type,Volume,Open,SL,TP,Close,Commission,Swap,Profit
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

/** Calcule le résultat R depuis les prix MT4 */
function calcResultR(open: number, sl: number, close: number, type: string): number {
  const slDist = Math.abs(open - sl);
  if (slDist === 0) return 0;
  const pnlDist = type === 'buy' ? close - open : open - close;
  return Math.round((pnlDist / slDist) * 100) / 100;
}

/** Détermine le statut depuis le profit */
function getStatus(profit: number): 'WIN' | 'LOSS' | 'BE' {
  if (profit > 0) return 'WIN';
  if (profit < 0) return 'LOSS';
  return 'BE';
}

/**
 * Parse un export CSV MetaTrader 4.
 * @param csvText - Contenu du fichier CSV
 * @param userId - Email utilisateur
 * @param accountId - Compte cible (optionnel)
 */
export function parseMT4CSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const dateStr    = cols[0] || '';
      const symbol     = cols[1] || 'UNKNOWN';
      const type       = (cols[2] || '').toLowerCase();
      const volume     = parseFloat(cols[3]) || 0.01;
      const openPrice  = parseFloat(cols[4]) || 0;
      const sl         = parseFloat(cols[5]) || 0;
      const tp         = parseFloat(cols[6]) || 0;
      const closePrice = parseFloat(cols[7]) || 0;
      const profit     = parseFloat(cols[10]) || 0;

      if (type !== 'buy' && type !== 'sell') continue;
      if (!openPrice || !closePrice) continue;

      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) continue;

      const resultR = sl > 0 ? calcResultR(openPrice, sl, closePrice, type) : null;

      trades.push({
        id:             `mt4-${userId}-${Date.now()}-${i}`,
        userId,
        accountId,
        date:           dateObj.toISOString(),
        pair:           symbol.toUpperCase(),
        direction:      type === 'buy' ? 'BUY' : 'SELL',
        session:        'London',
        quality:        null,
        setup:          null,
        emotion:        'Neutre',
        entryPrice:     openPrice,
        stopLoss:       sl || openPrice * 0.999,
        takeProfit:     tp || openPrice * 1.002,
        lotSize:        volume,
        exitPrice:      closePrice,
        resultR:         null,
        resultDollar:   Math.round(profit * 100) / 100,
        status:         getStatus(profit),
        duration:       0,
        entryNote:      '',
        exitNote:       '',
        tradingViewLink:'',
        screenshot:     '',
      });
    } catch { continue; }
  }

  return trades;
}




