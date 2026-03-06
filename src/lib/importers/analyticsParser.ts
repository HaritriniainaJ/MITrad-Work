// ─────────────────────────────────────────────────────────────────────────────
// PARSER ANALYTICS/TRADESYNC CSV
// Format: id,dateStart,dateEnd,pair,uPnL,rPnL,side,entryPrice,initalSL,
//         maxTP,idealTP,amount,amountClosed,status,day,tags,avgClosePrice,
//         avgRiskReward,maxRiskReward,exchangeRate,initialBalance,currentRealizedBalance
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

export function parseAnalyticsCSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const idx = (name: string) => headers.indexOf(name);

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 5) continue;

      const status = cols[idx('status')]?.toLowerCase();
      if (status !== 'closed') continue; // ignorer les trades ouverts

      const pairRaw = cols[idx('pair')] || '';
      // Nettoyer le pair: "OANDA:GBPUSD" -> "GBPUSD"
      const pair = pairRaw.includes(':') ? pairRaw.split(':')[1] : pairRaw;

      const dateStr = cols[idx('datestart')] || cols[idx('dateStart')] || '';
      const dateEnd = cols[idx('dateend')] || cols[idx('dateEnd')] || '';

      const date = dateStr ? new Date(dateStr.replace(' ', 'T')).toISOString().split('T')[0] : '';
      if (!date) continue;

      const sideRaw = (cols[idx('side')] || '').toLowerCase();
      const direction = sideRaw === 'buy' ? 'Long' : sideRaw === 'sell' ? 'Short' : 'Long';

      const entryPrice  = parseFloat(cols[idx('entryprice')]) || 0;
      const closePrice  = parseFloat(cols[idx('avgcloseprice')]) || 0;
      const sl          = parseFloat(cols[idx('initalsl')]) || undefined;
      const tp          = parseFloat(cols[idx('idealtp')]) || parseFloat(cols[idx('maxtp')]) || undefined;
      const resultDollar = parseFloat(cols[idx('rpnl')]) || 0;
      const rr          = parseFloat(cols[idx('avgriskReward')] || cols[idx('avgriskReward'.toLowerCase())]) || undefined;

      // Calcul resultR depuis le RR si disponible
      const resultR = rr !== undefined ? (resultDollar >= 0 ? rr : -rr) : undefined;

      const tags = cols[idx('tags')] || '';
      const setup = tags ? tags.split(';')[0].trim() : '';

      const trade: Trade = {
        id: `analytics_${cols[idx('id')] || i}_${Date.now()}`,
        userId,
        accountId: accountId || '',
        date,
        pair,
        direction,
        entryPrice,
        exitPrice: closePrice,
        stopLoss: sl,
        takeProfit: tp,
        resultDollar,
        resultR,
        setup: setup || undefined,
        status: 'closed',
        createdAt: new Date().toISOString(),
      };

      trades.push(trade);
    } catch (e) {
      console.warn('analyticsParser: erreur ligne', i, e);
    }
  }

  return trades;
}
