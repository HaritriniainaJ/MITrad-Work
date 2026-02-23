// ─────────────────────────────────────────────────────────────────────────────
// PARSER TRADOVATE — Importe les trades depuis un export CSV Tradovate
// Colonnes Tradovate : "Account","Order Id","Fill Id","Action","Qty","Fill Price",
//                      "Instrument","Create Time","Status","Fees","P&L"
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

/** Détermine le statut depuis le P&L */
function getStatus(pnl: number): 'WIN' | 'LOSS' | 'BE' {
  if (pnl > 0) return 'WIN';
  if (pnl < 0) return 'LOSS';
  return 'BE';
}

/**
 * Parse un export CSV Tradovate.
 * @param csvText - Contenu du fichier CSV
 * @param userId - Email utilisateur
 * @param accountId - Compte cible (optionnel)
 */
export function parseTradovateCSV(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const action     = (cols[3] || '').toLowerCase();
      const qty        = parseFloat(cols[4]) || 1;
      const fillPrice  = parseFloat(cols[5]) || 0;
      const instrument = cols[6] || 'UNKNOWN';
      const dateStr    = cols[7] || '';
      const pnl        = parseFloat(cols[10]) || 0;

      if (!fillPrice) continue;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) continue;

      const direction = action === 'buy' ? 'BUY' : 'SELL';
      const resultR   = pnl > 0 ? Math.abs(pnl / 50) : -Math.abs(pnl / 50);

      trades.push({
        id:             `tradovate-${userId}-${Date.now()}-${i}`,
        userId,
        accountId,
        date:           dateObj.toISOString(),
        pair:           instrument.toUpperCase(),
        direction,
        session:        'New York',
        quality:        7,
        setup:          'Importé Tradovate',
        emotion:        'Neutre',
        entryPrice:     fillPrice,
        stopLoss:       fillPrice * 0.998,
        takeProfit:     fillPrice * 1.004,
        lotSize:        qty,
        exitPrice:      fillPrice,
        resultR:        Math.round(resultR * 100) / 100,
        resultDollar:   Math.round(pnl * 100) / 100,
        status:         getStatus(pnl),
        duration:       0,
        entryNote:      'Trade importé depuis Tradovate',
        exitNote:       '',
        tradingViewLink:'',
        screenshot:     '',
      });
    } catch { continue; }
  }

  return trades;
}
