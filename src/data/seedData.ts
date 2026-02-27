import { User, Trade, DailyAnalysis, TradingAccount, ALL_PAIRS, ALL_SESSIONS, ALL_SETUPS, ALL_QUALITIES, BIAS_OPTIONS, DECISION_OPTIONS } from '@/types/trading';

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SEED_EMOTIONS = ['Confiant', 'Neutre', 'Stressé', 'FOMO', 'Revenge Trading', 'Discipliné', 'Hésitant', 'Surexcité'];

const USER_CONFIGS: Array<{
  email: string; password: string; name: string; country: string;
  winRate: number; avgRR: number; capital: number; experience: string;
  style: string; broker: string; bio: string; favPairs: string[];
}> = [
  { email: 'alpha@mitrad.com', password: 'mitrad123', name: 'Kofi Asante', country: 'Ghana', winRate: 0.72, avgRR: 2.2, capital: 10000, experience: '3-5 ans', style: 'Day Trading', broker: 'FTMO', bio: 'Trader ICT discipliné depuis Accra. Spécialiste Gold et EURUSD.', favPairs: ['XAUUSD', 'EURUSD', 'GBPUSD'] },
  { email: 'beta@mitrad.com', password: 'mitrad123', name: 'Amara Diallo', country: 'Senegal', winRate: 0.45, avgRR: 1.4, capital: 5000, experience: '1-2 ans', style: 'Scalping', broker: 'IC Markets', bio: 'Trader en apprentissage depuis Dakar. Construction de la régularité étape par étape.', favPairs: ['EURUSD', 'GBPUSD'] },
  { email: 'gamma@mitrad.com', password: 'mitrad123', name: 'Njoku Emeka', country: 'Nigeria', winRate: 0.58, avgRR: 1.9, capital: 8000, experience: '3-5 ans', style: 'Day Trading', broker: 'MyForexFunds', bio: 'Swing trader basé à Lagos. La structure est primordiale.', favPairs: ['EURUSD', 'XAUUSD', 'USDJPY'] },
  { email: 'delta@mitrad.com', password: 'mitrad123', name: 'Fatima Ouedraogo', country: 'Burkina Faso', winRate: 0.35, avgRR: 0.9, capital: 3000, experience: 'Moins d\'1 an', style: 'Scalping', broker: 'Exness', bio: 'Nouvelle dans le trading mais déterminée à apprendre. Focus sur la gestion du risque.', favPairs: ['EURUSD', 'GBPUSD'] },
  { email: 'epsilon@mitrad.com', password: 'mitrad123', name: 'Tendai Moyo', country: 'Zimbabwe', winRate: 0.65, avgRR: 2.3, capital: 12000, experience: '5+ ans', style: 'Swing Trading', broker: 'FTMO', bio: 'Trader vétéran de Harare. La patience est mon avantage.', favPairs: ['XAUUSD', 'EURUSD', 'BTCUSD'] },
  { email: 'zeta@mitrad.com', password: 'mitrad123', name: 'Salim Benali', country: 'Morocco', winRate: 0.50, avgRR: 1.6, capital: 7000, experience: '1-2 ans', style: 'Day Trading', broker: 'FundedNext', bio: 'Trader de Casablanca. Travail sur la régularité et la discipline.', favPairs: ['EURUSD', 'USDJPY', 'GBPUSD'] },
  { email: 'eta@mitrad.com', password: 'mitrad123', name: 'Aya Kouassi', country: 'Ivory Coast', winRate: 0.40, avgRR: 1.1, capital: 4000, experience: '1-2 ans', style: 'Scalping', broker: 'XM', bio: 'Trader basée à Abidjan. Apprentissage des concepts ICT.', favPairs: ['EURUSD', 'GBPUSD', 'XAUUSD'] },
  { email: 'theta@mitrad.com', password: 'mitrad123', name: 'Mandla Dlamini', country: 'South Africa', winRate: 0.68, avgRR: 2.5, capital: 15000, experience: '5+ ans', style: 'Day Trading', broker: 'FTMO', bio: 'Pro trader depuis Johannesburg. Funded account holder.', favPairs: ['XAUUSD', 'EURUSD', 'USDJPY', 'BTCUSD'] },
  { email: 'iota@mitrad.com', password: 'mitrad123', name: 'Rania Khalil', country: 'Egypt', winRate: 0.55, avgRR: 1.8, capital: 9000, experience: '3-5 ans', style: 'Swing Trading', broker: 'Pepperstone', bio: 'Trader basée au Caire. Focus sur les structures HTF.', favPairs: ['EURUSD', 'XAUUSD', 'GBPUSD'] },
  { email: 'demo@mitrad.com', password: 'mitrad123', name: 'Jean Rakoto', country: 'Madagascar', winRate: 0.48, avgRR: 1.3, capital: 5000, experience: '1-2 ans', style: 'Day Trading', broker: 'Exness', bio: 'Trader d\'Antananarivo. J\'apprends de chaque trade.', favPairs: ['EURUSD', 'GBPUSD'] },
];

export function generateTrades(userId: string, config: { winRate: number; avgRR: number }, accountId?: string): Trade[] {
  const random = seededRandom(hashCode(userId));
  const trades: Trade[] = [];
  const now = new Date();
  const tradeCount = 30 + Math.floor(random() * 15);

  for (let i = 0; i < tradeCount; i++) {
    const daysAgo = Math.floor(random() * 90);
    const tradeDate = new Date(now);
    tradeDate.setDate(tradeDate.getDate() - daysAgo);
    tradeDate.setHours(Math.floor(8 + random() * 10), Math.floor(random() * 60));

    const pair = ALL_PAIRS[Math.floor(random() * 6)];
    const direction: 'BUY' | 'SELL' = random() > 0.5 ? 'BUY' : 'SELL';
    const session = ALL_SESSIONS[Math.floor(random() * ALL_SESSIONS.length)];
    const quality = ALL_QUALITIES[Math.floor(random() * ALL_QUALITIES.length)];
    const setup = ALL_SETUPS[Math.floor(random() * ALL_SETUPS.length)];
    const emotion = random() < 0.6 ? (random() < 0.5 ? 'Confiant' : 'Neutre') :
      SEED_EMOTIONS[Math.floor(random() * SEED_EMOTIONS.length)];

    const isWin = random() < config.winRate;
    const isBE = !isWin && random() < 0.25;
    const status: Trade['status'] = isWin ? 'WIN' : isBE ? 'BE' : 'LOSS';

    let resultR: number;
    if (status === 'WIN') {
      resultR = Math.round((1 + random() * (config.avgRR * 1.5)) * 100) / 100;
    } else if (status === 'LOSS') {
      resultR = -Math.round((0.5 + random() * 0.5) * 100) / 100;
    } else {
      resultR = 0;
    }

    const basePrice = pair === 'XAUUSD' ? 2000 + random() * 100 :
      pair === 'BTCUSD' ? 60000 + random() * 5000 :
      pair === 'ETHUSD' ? 3000 + random() * 500 :
      pair === 'USDJPY' ? 148 + random() * 5 :
      1.0 + random() * 0.3;

    const pipSize = pair === 'USDJPY' ? 0.01 :
      pair === 'XAUUSD' ? 0.1 :
      pair === 'BTCUSD' ? 1 :
      pair === 'ETHUSD' ? 0.1 : 0.0001;

    const slPips = 10 + random() * 30;
    const entryPrice = Math.round(basePrice * 10000) / 10000;
    const slOffset = slPips * pipSize;
    const tpOffset = slOffset * (1.5 + random() * 2);

    const stopLoss = direction === 'BUY'
      ? Math.round((entryPrice - slOffset) * 10000) / 10000
      : Math.round((entryPrice + slOffset) * 10000) / 10000;
    const takeProfit = direction === 'BUY'
      ? Math.round((entryPrice + tpOffset) * 10000) / 10000
      : Math.round((entryPrice - tpOffset) * 10000) / 10000;

    const lotSize = Math.round((0.05 + random() * 0.45) * 100) / 100;
    const duration = Math.floor(15 + random() * 225);
    const capital = 10000;
    const resultDollar = Math.round(resultR * (capital * 0.01) * 100) / 100;

    trades.push({
      id: `${userId}-trade-${i}`,
      userId,
      accountId: accountId || `${userId}-account-default`,
      date: tradeDate.toISOString(),
      pair, direction, session, quality, setup, emotion,
      entryPrice, stopLoss, takeProfit, lotSize,
      exitPrice: entryPrice + (resultR > 0 ? tpOffset * 0.8 : resultR < 0 ? -slOffset : 0),
      resultR, resultDollar, status, duration,
      entryNote: '', exitNote: '', tradingViewLink: '', screenshot: '',
    });
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateAnalyses(userId: string): DailyAnalysis[] {
  const random = seededRandom(hashCode(userId + '-analysis'));
  const analyses: DailyAnalysis[] = [];
  const now = new Date();

  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 3);
    const pairCount = 2 + Math.floor(random() * 3);
    const pairs = [];
    for (let j = 0; j < pairCount; j++) {
      pairs.push({
        pair: ALL_PAIRS[Math.floor(random() * 6)],
        fundamentalBias: BIAS_OPTIONS[Math.floor(random() * BIAS_OPTIONS.length)],
        technicalBias: BIAS_OPTIONS[Math.floor(random() * BIAS_OPTIONS.length)],
        decision: DECISION_OPTIONS[Math.floor(random() * DECISION_OPTIONS.length)],
        tvLink: '', note: '',
      });
    }
    analyses.push({
      id: `${userId}-analysis-${i}`,
      userId, date: date.toISOString().split('T')[0], pairs,
    });
  }
  return analyses;
}

export function initializeSeedData(): void {
  if (localStorage.getItem('mitrad_initialized_v2')) return;

  // Clear old data on version upgrade
  localStorage.removeItem('mitrad_initialized');

  const users: User[] = USER_CONFIGS.map(c => ({
    email: c.email, password: c.password, name: c.name, country: c.country,
    capital: c.capital, monthlyGoalR: 10 + Math.floor(Math.random() * 10),
    bio: c.bio, experience: c.experience, tradingStyle: c.style,
    favoritePairs: c.favPairs, broker: c.broker,
    isPublic: true, customSetups: [],
  }));

  localStorage.setItem('mitrad_users', JSON.stringify(users));

  const allTrades: Trade[] = [];
  const allAnalyses: DailyAnalysis[] = [];
  const allAccounts: TradingAccount[] = [];

  USER_CONFIGS.forEach(c => {
    const defaultAccountId = `${c.email}-account-default`;
    allAccounts.push({
      id: defaultAccountId,
      userId: c.email,
      name: 'Compte Principal',
      broker: c.broker,
      type: 'Personnel',
      capital: c.capital,
      isDefault: true,
    });

    const trades = generateTrades(c.email, { winRate: c.winRate, avgRR: c.avgRR }, defaultAccountId);
    allTrades.push(...trades);
    allAnalyses.push(...generateAnalyses(c.email));
  });

  localStorage.setItem('mitrad_trades', JSON.stringify(allTrades));
  localStorage.setItem('mitrad_analyses', JSON.stringify(allAnalyses));
  localStorage.setItem('mitrad_accounts', JSON.stringify(allAccounts));
  localStorage.setItem('mitrad_initialized_v2', 'true');
}

export { USER_CONFIGS };


