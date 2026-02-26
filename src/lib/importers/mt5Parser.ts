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
  // Nettoyer les lignes (MT5 peut avoir des lignes vides ou des en-têtes parasites)
  const allLines = csvText
    .split('\n')
    .map(l => l.trim().replace(/\r$/, ''))
    .filter(l => l.length > 0);

  if (allLines.length < 2) return [];

  // Trouver la vraie ligne d'en-tête (contient "symbol" ou "time" ou "open")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allLines.length, 10); i++) {
    const lower = allLines[i].toLowerCase();
    if (lower.includes('symbol') || lower.includes('open time') || lower.includes('time,deal')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;

  const headers = allLines[headerIdx]
    .split(/[,;\t]/)
    .map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  // ── Détection du format ────────────────────────────────────────────────────
  const isDetailedReport = headers.some(h => h.includes('deal') || h.includes('direction'));
  const separator = allLines[headerIdx].includes(';') ? ';'
                  : allLines[headerIdx].includes('\t') ? '\t' : ',';

  function parseLine(line: string): string[] {
    return line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
  }

  // ── INDEX COLONNES FORMAT A (rapport détaillé) ─────────────────────────────
  const iTimeA    = findCol(headers, ['time', 'open time', 'date']);
  const iSymbolA  = findCol(headers, ['symbol', 'pair', 'instrument']);
  const iTypeA    = findCol(headers, ['type']);
  const iDirA     = findCol(headers, ['direction']);
  const iVolumeA  = findCol(headers, ['volume', 'lots', 'qty']);
  const iPriceA   = findCol(headers, ['price', 'open price', 'entry']);
  const iSLA      = findCol(headers, ['sl', 'stoploss', 'stop loss']);
  const iTA       = findCol(headers, ['tp', 'takeprofit', 'take profit']);
  const iProfitA  = findCol(headers, ['profit', 'p&l', 'pnl', 'net profit']);
  const iCommentA = findCol(headers, ['comment']);

  // ── INDEX COLONNES FORMAT B (historique simplifié) ─────────────────────────
  const iOpenTime  = findCol(headers, ['open time', 'opentime']);
  const iCloseTime = findCol(headers, ['close time', 'closetime']);
  const iSymbolB   = findCol(headers, ['symbol']);
  const iTypeB     = findCol(headers, ['type', 'direction', 'action']);
  const iVolumeB   = findCol(headers, ['volume', 'lots']);
  const iOpenB     = findCol(headers, ['open', 'open price', 'entry', 'price']);
  const iSLB       = findCol(headers, ['sl', 'stop loss']);
  const iTPB       = findCol(headers, ['tp', 'take profit']);
  const iCloseB    = findCol(headers, ['close', 'close price', 'exit price']);
  const iProfitB   = findCol(headers, ['profit', 'p&l']);

  const trades: Trade[] = [];

  // Pour le format A (rapport détaillé), on regroupe les deals par position
  // Un trade = 1 deal IN + 1 deal OUT
  if (isDetailedReport) {
    // Garder seulement les lignes "out" ou "buy/sell" (pas "balance", "deposit")
    const validTypes = ['buy', 'sell', 'buy limit', 'sell limit', 'buy stop', 'sell stop',
                        'out', 'in', 'in/out'];

    interface Deal {
      time: Date; symbol: string; type: string; direction: string;
      volume: number; price: number; profit: number; comment: string;
    }

    const deals: Deal[] = [];

    for (let i = headerIdx + 1; i < allLines.length; i++) {
      const cols = parseLine(allLines[i]);
      if (cols.length < 5) continue;

      const typeRaw = iTypeA >= 0 ? cols[iTypeA].toLowerCase() : '';
      if (!validTypes.some(t => typeRaw.includes(t))) continue;

      const timeDate = parseDate(iTimeA >= 0 ? cols[iTimeA] : '');
      if (!timeDate) continue;

      const symbol  = iSymbolA >= 0  ? cols[iSymbolA].toUpperCase().replace('/', '') : 'UNKNOWN';
      const dir     = iDirA >= 0     ? cols[iDirA].toLowerCase() : typeRaw;
      const volume  = iVolumeA >= 0  ? parseNum(cols[iVolumeA]) : 0.01;
      const price   = iPriceA >= 0   ? parseNum(cols[iPriceA])  : 0;
      const profit  = iProfitA >= 0  ? parseNum(cols[iProfitA]) : 0;
      const comment = iCommentA >= 0 ? cols[iCommentA] : '';

      if (!price) continue;

      deals.push({ time: timeDate, symbol, type: typeRaw, direction: dir, volume, price, profit, comment });
    }

    // Grouper par symbole+volume → reconstituer des trades
    // Stratégie simple : chaque deal avec profit != 0 est une sortie de trade
    deals.forEach((deal, idx) => {
      if (deal.profit === 0 && idx < deals.length - 1) return; // deal d'entrée

      const direction: 'BUY' | 'SELL' =
        deal.direction.includes('buy') || deal.type.includes('buy') ? 'BUY' : 'SELL';

      // Chercher le deal d'entrée correspondant (même symbole, avant, profit=0)
      const entryDeal = [...deals].slice(0, idx).reverse()
        .find(d => d.symbol === deal.symbol && d.profit === 0);

      const entryPrice = entryDeal ? entryDeal.price : deal.price;
      const entryDate  = entryDeal ? entryDeal.time  : deal.time;
      const duration   = entryDeal
        ? Math.round((deal.time.getTime() - entryDeal.time.getTime()) / 60000)
        : 0;

      const slDist = entryPrice * 0.01;
      const pnlDist = direction === 'BUY'
        ? deal.price - entryPrice
        : entryPrice - deal.price;
      const resultR = Math.round((pnlDist / slDist) * 100) / 100;

      trades.push({
        id:              `mt5-${userId}-${Date.now()}-${idx}`,
        userId,
        accountId,
        date:            entryDate.toISOString(),
        pair:            deal.symbol,
        direction,
        session:         getSession(entryDate),
        quality:         null,
        setup:           null,
        emotion:         'Neutre',
        entryPrice,
        stopLoss:        direction === 'BUY' ? entryPrice * 0.99 : entryPrice * 1.01,
        takeProfit:      direction === 'BUY' ? entryPrice * 1.02 : entryPrice * 0.98,
        lotSize:         deal.volume,
        exitPrice:       deal.price,
        resultR:         null,
        resultDollar:    Math.round(deal.profit * 100) / 100,
        status:          getStatus(deal.profit),
        duration,
        entryNote:       '',
        exitNote:        '',
        tradingViewLink: '',
        screenshot:      '',
      });
    });

  } else {
    // ── FORMAT B : une ligne = un trade complet ────────────────────────────
    for (let i = headerIdx + 1; i < allLines.length; i++) {
      try {
        const cols = parseLine(allLines[i]);
        if (cols.length < 5) continue;

        const typeRaw    = iTypeB >= 0  ? cols[iTypeB].toLowerCase()  : 'buy';
        if (['balance', 'deposit', 'withdrawal', 'credit'].some(t => typeRaw.includes(t))) continue;

        const dateStr    = iOpenTime >= 0  ? cols[iOpenTime]  : '';
        const closeDateStr = iCloseTime >= 0 ? cols[iCloseTime] : '';
        const symbol     = iSymbolB >= 0  ? cols[iSymbolB].toUpperCase().replace('/', '') : 'UNKNOWN';
        const volume     = iVolumeB >= 0  ? parseNum(cols[iVolumeB])  : 0.01;
        const openPrice  = iOpenB >= 0    ? parseNum(cols[iOpenB])    : 0;
        const sl         = iSLB >= 0      ? parseNum(cols[iSLB])      : 0;
        const tp         = iTPB >= 0      ? parseNum(cols[iTPB])      : 0;
        const closePrice = iCloseB >= 0   ? parseNum(cols[iCloseB])   : 0;
        const profit     = iProfitB >= 0  ? parseNum(cols[iProfitB])  : 0;

        if (!openPrice) continue;
        const entryDate  = parseDate(dateStr);
        const exitDate   = parseDate(closeDateStr);
        if (!entryDate) continue;

        const direction: 'BUY' | 'SELL' =
          typeRaw.includes('buy') || typeRaw.includes('long') ? 'BUY' : 'SELL';

        const duration = exitDate && entryDate
          ? Math.round((exitDate.getTime() - entryDate.getTime()) / 60000)
          : 0;

        const resultR = (sl > 0 && closePrice > 0) ? calcR(openPrice, sl, closePrice, direction) : null;

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
      } catch { continue; }
    }
  }

  return trades;
}


