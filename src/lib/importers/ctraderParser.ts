import { Trade } from '@/types/trading';

function cleanNumber(str: string): number {
  if (!str) return 0;
  return parseFloat(str.replace(/[\u00A0\s]/g, '').replace(',', '.')) || 0;
}

function parseDate(str: string): string {
  if (!str) return new Date().toISOString();
  const months: Record<string, number> = {
    'jan': 0, 'fév': 1, 'feb': 1, 'mar': 2, 'avr': 3, 'apr': 3,
    'mai': 4, 'may': 4, 'jun': 5, 'jui': 5, 'jul': 6,
    'aoû': 7, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'déc': 11, 'dec': 11,
  };
  const clean = str.replace(/\u00A0/g, ' ').trim();
  const parts = clean.split(' ');
  if (parts.length >= 4) {
    const day   = parseInt(parts[0]);
    const month = months[parts[1].toLowerCase().substring(0, 3)] ?? 0;
    const year  = parseInt(parts[2]);
    const time  = parts[3].split('.')[0];
    const [h, m, s] = time.split(':').map(Number);
    return new Date(year, month, day, h, m, s).toISOString();
  }
  return new Date().toISOString();
}

function parseDirection(sens: string): 'BUY' | 'SELL' {
  const s = sens.toLowerCase().replace(/\u00A0/g, '').trim();
  if (s.includes('ach') || s.includes('buy') || s.includes('long')) return 'BUY';
  return 'SELL';
}

export function parseCTraderCSV(
  text: string,
  userId: string,
  accountId?: string
): Trade[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const trades: Trade[] = [];

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if ((l.includes('symbole') || l.includes('symbol')) && 
        (l.includes('sens') || l.includes('side') || l.includes('direction'))) {
      startIdx = i + 1;
      break;
    }
  }

  if (startIdx === -1) return trades;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('ordres') ||
        line.toLowerCase().includes('orders') ||
        line.toLowerCase().includes('résumé') ||
        line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('solde')) break;

    const cols = line.split(',');
    if (cols.length < 7) continue;

    const symbol      = cols[0].replace(/\u00A0/g, '').trim();
    const direction   = cols[1].replace(/\u00A0/g, '').trim();
    const closeTime   = cols[2].replace(/\u00A0/g, '').trim();
    const entryPrice  = cols[3].replace(/\u00A0/g, '').trim();
    const exitPrice   = cols[4].replace(/\u00A0/g, '').trim();
    const lotSize     = cols[5].replace(/\u00A0/g, '').replace(/lots?/i, '').trim();
    const netUsd      = cols[6].replace(/\u00A0/g, '').trim();

    if (!symbol || !direction || !closeTime) continue;
    if (!symbol.match(/[A-Z]{3,}/)) continue;

    const resultDollar = cleanNumber(netUsd);
    const entry        = cleanNumber(entryPrice);
    const exit         = cleanNumber(exitPrice);
    const lots         = cleanNumber(lotSize);

    const status: 'WIN' | 'LOSS' | 'BE' =
      resultDollar > 0 ? 'WIN' :
      resultDollar < 0 ? 'LOSS' : 'BE';

    trades.push({
      id:              `ctrader-${userId}-${Date.now()}-${i}`,
      userId,
      accountId:       accountId || '',
      date:            parseDate(closeTime),
      pair:            symbol,
      direction:       parseDirection(direction),
      session:         'London',
      setup:           null,
      quality:         null,
      emotion:         null,
      entryPrice:      entry,
      stopLoss:        null,
      takeProfit:      null,
      lotSize:         lots,
      exitPrice:       exit,
      resultR:         0,
      resultDollar,
      status,
      entryNote:       null,
      exitNote:        null,
      tradingViewLink: '',
      screenshot:      '',
      planRespected:   null,
      duration:        0,
      isImported:      true,
    } as Trade);
  }

  return trades;
}