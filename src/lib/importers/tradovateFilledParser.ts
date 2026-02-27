// ─────────────────────────────────────────────────────────────────────────────
// PARSER TRADOVATE PAIRED FILLS — 1 trade par ligne (comme le propfirm)
// ─────────────────────────────────────────────────────────────────────────────
import { Trade } from '@/types/trading';

function parseDate(str: string): Date {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function parsePnl(str: string): number {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/"/g, '')) || 0;
}

function getSession(date: Date): string {
  const h = date.getUTCHours();
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 17) return 'New York';
  if (h >= 0  && h < 7)  return 'Asia';
  return 'New York';
}

function getStatus(pnl: number): 'WIN' | 'LOSS' | 'BE' {
  if (pnl > 0) return 'WIN';
  if (pnl < 0) return 'LOSS';
  return 'BE';
}

export function parseTradovatePairedFills(csvText: string, userId: string, accountId?: string): Trade[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  console.log('PARSER - nb lignes:', lines.length);
  console.log('PARSER - headers:', lines[0]);
  console.log('PARSER - ligne 1:', lines[1]);

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const col = (names: string[]) => headers.findIndex(h =>
    names.some(n => h === n.toLowerCase() || h.includes(n.toLowerCase()))
  );

  const colPairId      = col(['pair id']);
  const colProduct     = col(['product']);
  const colContract    = col(['contract']);
  const colAvgBuy      = col(['avg. buy', 'avg buy']);
  const colAvgSell     = col(['avg. sell', 'avg sell']);
  const colBought      = col(['bought']);
  const colSold        = col(['sold']);
  const colBuyPrice    = col(['buy price']);
  const colSellPrice   = col(['sell price']);
  const colPnl         = col(['p/l']);
  const colBoughtTs    = col(['bought timestamp']);
  const colSoldTs      = col(['sold timestamp']);
  const colPairedQty   = col(['paired qty']);
  const colTimestamp   = col(['timestamp']);
  const colTradeDate   = col(['trade date']);

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV avec guillemets
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cols.push(current.trim());

    if (cols.length < 5) continue;

    const pairId     = colPairId   >= 0 ? cols[colPairId]   : `line-${i}`;
    const product    = colProduct  >= 0 ? cols[colProduct]  : 'UNKNOWN';
    const buyPrice   = colBuyPrice >= 0 ? parseFloat(cols[colBuyPrice])  || 0 : 0;
    const sellPrice  = colSellPrice>= 0 ? parseFloat(cols[colSellPrice]) || 0 : 0;
    const pnl        = colPnl      >= 0 ? parsePnl(cols[colPnl]) : 0;
    const boughtTs   = colBoughtTs >= 0 ? cols[colBoughtTs] : '';
    const soldTs     = colSoldTs   >= 0 ? cols[colSoldTs]   : '';
    const qty        = colPairedQty>= 0 ? parseFloat(cols[colPairedQty]) || 1 : 1;
    const timestamp  = colTimestamp>= 0 ? cols[colTimestamp] : '';
    const tradeDate  = colTradeDate>= 0 ? cols[colTradeDate] : '';

    if (!buyPrice && !sellPrice) continue;

    // Direction : si soldTimestamp < boughtTimestamp → SELL (vendu avant d'acheter)
    const boughtTime = boughtTs ? parseDate(boughtTs) : null;
    const soldTime   = soldTs   ? parseDate(soldTs)   : null;

    let direction: 'BUY' | 'SELL';
    if (boughtTime && soldTime && boughtTime.getTime() !== soldTime.getTime()) {
      direction = boughtTime < soldTime ? 'BUY' : 'SELL';
    } else {
      // Fallback sur le P&L et les prix
      const buyWouldWin = sellPrice > buyPrice;
      if (pnl > 0)      direction = buyWouldWin ? 'BUY' : 'SELL';
      else if (pnl < 0) direction = buyWouldWin ? 'SELL' : 'BUY';
      else              direction = 'BUY';
    }

    // Entrée = prix d'ouverture, Sortie = prix de clôture
    const entryPrice = direction === 'BUY' ? buyPrice  : sellPrice;
    const exitPrice  = direction === 'BUY' ? sellPrice : buyPrice;

    // Date entrée et sortie
    const entryDateStr = direction === 'BUY' ? boughtTs : soldTs;
    const exitDateStr  = direction === 'BUY' ? soldTs   : boughtTs;

    const entryDate = parseDate(entryDateStr || tradeDate);
    const exitDate  = parseDate(exitDateStr  || timestamp);

    const duration = Math.abs(Math.round(
      (exitDate.getTime() - entryDate.getTime()) / 60000
    ));

    const slDist    = entryPrice * 0.01;
    const stopLoss  = direction === 'BUY' ? entryPrice - slDist : entryPrice + slDist;
    const takeProfit = direction === 'BUY' ? entryPrice + slDist * 2 : entryPrice - slDist * 2;

    trades.push({
      id:              `tradovate-${userId}-${pairId}`,
      userId,
      accountId,
      date:            entryDate.toISOString(),
      pair:            product.toUpperCase(),
      direction,
      session:         getSession(entryDate),
      quality:         null,
      setup:           null,
      emotion:         'Neutre',
      entryPrice,
      stopLoss,
      takeProfit,
      lotSize:         qty,
      exitPrice,
      resultR:         null,
      resultDollar:    Math.round(pnl * 100) / 100,
      status:          getStatus(pnl),
      duration,
      entryNote:       '',
      exitNote:        '',
      tradingViewLink: '',
      screenshot:      '',
    });
  }

  console.log('PARSER - trades générés:', trades.length);
  return trades;
}

