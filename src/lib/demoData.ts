// demoData.ts — Données fictives enrichies pour le mode démo
import { Trade, DailyAnalysis } from '@/types/trading';

// ─── Helper : date relative à aujourd'hui ────────────────────────────────────
const daysAgo = (n: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

// ─── TRADES ──────────────────────────────────────────────────────────────────
export const DEMO_TRADES: Trade[] = [
  {
    id: 'demo-1', accountId: 'demo', symbol: 'XAUUSD', direction: 'LONG',
    setup: 'BOS + OB', quality: 'A+', status: 'WIN',
    entryPrice: 2318.50, exitPrice: 2341.00, stopLoss: 2308.00, takeProfit: 2345.00,
    lotSize: 0.5, pnl: 112.50, riskReward: 2.1, emotion: 'Discipliné',
    session: 'London', entryDate: daysAgo(1, 9, 15), exitDate: daysAgo(1, 11, 30),
    notes: 'Belle structure BOS sur H1, OB respecté, entrée propre.',
    imageUrl: '', tags: ['SMC', 'London', 'OB'],
  },
  {
    id: 'demo-2', accountId: 'demo', symbol: 'EURUSD', direction: 'SHORT',
    setup: 'FVG London', quality: 'A', status: 'WIN',
    entryPrice: 1.0845, exitPrice: 1.0812, stopLoss: 1.0862, takeProfit: 1.0800,
    lotSize: 1.0, pnl: 88.00, riskReward: 1.94, emotion: 'Calme',
    session: 'London', entryDate: daysAgo(2, 8, 45), exitDate: daysAgo(2, 10, 20),
    notes: 'FVG H1 clairement identifié, exécution parfaite.',
    imageUrl: '', tags: ['FVG', 'London', 'EUR'],
  },
  {
    id: 'demo-3', accountId: 'demo', symbol: 'GBPUSD', direction: 'SHORT',
    setup: 'Liquidity Sweep', quality: 'B', status: 'LOSS',
    entryPrice: 1.2734, exitPrice: 1.2768, stopLoss: 1.2770, takeProfit: 1.2680,
    lotSize: 0.8, pnl: -54.40, riskReward: 1.0, emotion: 'FOMO',
    session: 'New York', entryDate: daysAgo(3, 14, 0), exitDate: daysAgo(3, 15, 10),
    notes: 'Entré trop tôt, le sweep n\'était pas terminé. FOMO évident.',
    imageUrl: '', tags: ['Liquidity', 'NY', 'GBP'],
  },
  {
    id: 'demo-4', accountId: 'demo', symbol: 'XAUUSD', direction: 'LONG',
    setup: 'OB + FVG', quality: 'A', status: 'BE',
    entryPrice: 2305.00, exitPrice: 2305.50, stopLoss: 2295.00, takeProfit: 2330.00,
    lotSize: 0.3, pnl: 0.15, riskReward: 0, emotion: 'Hésitant',
    session: 'London', entryDate: daysAgo(4, 10, 0), exitDate: daysAgo(4, 13, 30),
    notes: 'Bonne setup mais hésitation — sorti au BE par précaution.',
    imageUrl: '', tags: ['OB', 'FVG', 'XAUUSD'],
  },
  {
    id: 'demo-5', accountId: 'demo', symbol: 'USDJPY', direction: 'LONG',
    setup: 'Rejet support H4', quality: 'B', status: 'WIN',
    entryPrice: 151.20, exitPrice: 152.85, stopLoss: 150.50, takeProfit: 153.00,
    lotSize: 0.6, pnl: 99.00, riskReward: 2.35, emotion: 'Confiant',
    session: 'Asian', entryDate: daysAgo(5, 3, 30), exitDate: daysAgo(5, 8, 0),
    notes: 'Support H4 bien défendu, TP quasi atteint.',
    imageUrl: '', tags: ['JPY', 'Support', 'Asian'],
  },
  {
    id: 'demo-6', accountId: 'demo', symbol: 'EURUSD', direction: 'LONG',
    setup: 'BOS + FVG', quality: 'A+', status: 'WIN',
    entryPrice: 1.0798, exitPrice: 1.0851, stopLoss: 1.0775, takeProfit: 1.0860,
    lotSize: 1.2, pnl: 153.60, riskReward: 2.3, emotion: 'Discipliné',
    session: 'London', entryDate: daysAgo(6, 9, 0), exitDate: daysAgo(6, 12, 45),
    notes: 'Structure parfaite, patience récompensée.',
    imageUrl: '', tags: ['BOS', 'FVG', 'EUR'],
  },
  {
    id: 'demo-7', accountId: 'demo', symbol: 'GBPJPY', direction: 'SHORT',
    setup: 'CHoCH + OB', quality: 'A', status: 'LOSS',
    entryPrice: 192.40, exitPrice: 193.10, stopLoss: 193.20, takeProfit: 190.50,
    lotSize: 0.4, pnl: -64.00, riskReward: 1.0, emotion: 'Impatient',
    session: 'London', entryDate: daysAgo(7, 11, 15), exitDate: daysAgo(7, 13, 0),
    notes: 'CHoCH valide mais news inattendue a renversé le mouvement.',
    imageUrl: '', tags: ['CHoCH', 'OB', 'GBP'],
  },
  {
    id: 'demo-8', accountId: 'demo', symbol: 'XAUUSD', direction: 'SHORT',
    setup: 'Liquidity Sweep + OB', quality: 'A+', status: 'WIN',
    entryPrice: 2352.00, exitPrice: 2328.00, stopLoss: 2362.00, takeProfit: 2325.00,
    lotSize: 0.5, pnl: 120.00, riskReward: 2.4, emotion: 'Discipliné',
    session: 'New York', entryDate: daysAgo(8, 15, 0), exitDate: daysAgo(8, 17, 30),
    notes: 'Sweep parfait des highs, OB 15min pour l\'entrée.',
    imageUrl: '', tags: ['Sweep', 'OB', 'NY'],
  },
  {
    id: 'demo-9', accountId: 'demo', symbol: 'EURUSD', direction: 'SHORT',
    setup: 'Rejet résistance D1', quality: 'B', status: 'BE',
    entryPrice: 1.0920, exitPrice: 1.0921, stopLoss: 1.0940, takeProfit: 1.0860,
    lotSize: 0.9, pnl: 0.09, riskReward: 0, emotion: 'Neutre',
    session: 'London', entryDate: daysAgo(9, 10, 30), exitDate: daysAgo(9, 14, 0),
    notes: 'Zone valide mais momentum insuffisant. BE.',
    imageUrl: '', tags: ['Résistance', 'D1', 'EUR'],
  },
  {
    id: 'demo-10', accountId: 'demo', symbol: 'GBPUSD', direction: 'LONG',
    setup: 'OB Weekly', quality: 'A+', status: 'WIN',
    entryPrice: 1.2620, exitPrice: 1.2710, stopLoss: 1.2580, takeProfit: 1.2720,
    lotSize: 1.0, pnl: 180.00, riskReward: 2.25, emotion: 'Confiant',
    session: 'London', entryDate: daysAgo(10, 8, 30), exitDate: daysAgo(10, 15, 0),
    notes: 'OB weekly avec confluence H4. Trade de la semaine.',
    imageUrl: '', tags: ['OB', 'Weekly', 'GBP'],
  },
  {
    id: 'demo-11', accountId: 'demo', symbol: 'XAUUSD', direction: 'LONG',
    setup: 'FVG H1', quality: 'B', status: 'LOSS',
    entryPrice: 2290.00, exitPrice: 2278.00, stopLoss: 2278.00, takeProfit: 2315.00,
    lotSize: 0.3, pnl: -36.00, riskReward: 1.0, emotion: 'FOMO',
    session: 'Asian', entryDate: daysAgo(11, 4, 0), exitDate: daysAgo(11, 6, 15),
    notes: 'FOMO en session asiatique. FVG pas assez confluent.',
    imageUrl: '', tags: ['FVG', 'Asian', 'XAUUSD'],
  },
  {
    id: 'demo-12', accountId: 'demo', symbol: 'USDJPY', direction: 'SHORT',
    setup: 'CHoCH + FVG', quality: 'A', status: 'WIN',
    entryPrice: 153.40, exitPrice: 151.90, stopLoss: 154.20, takeProfit: 151.80,
    lotSize: 0.7, pnl: 126.00, riskReward: 1.875, emotion: 'Discipliné',
    session: 'London', entryDate: daysAgo(12, 9, 45), exitDate: daysAgo(12, 14, 0),
    notes: 'CHoCH propre H1, FVG 15min pour timing.',
    imageUrl: '', tags: ['CHoCH', 'FVG', 'JPY'],
  },
  {
    id: 'demo-13', accountId: 'demo', symbol: 'EURUSD', direction: 'LONG',
    setup: 'BOS + OB', quality: 'A', status: 'WIN',
    entryPrice: 1.0755, exitPrice: 1.0810, stopLoss: 1.0730, takeProfit: 1.0815,
    lotSize: 1.0, pnl: 137.50, riskReward: 2.2, emotion: 'Calme',
    session: 'London', entryDate: daysAgo(14, 9, 0), exitDate: daysAgo(14, 12, 30),
    notes: 'Patience sur l\'OB. Exécution propre.',
    imageUrl: '', tags: ['BOS', 'OB', 'EUR'],
  },
  {
    id: 'demo-14', accountId: 'demo', symbol: 'GBPUSD', direction: 'SHORT',
    setup: 'FVG + Résistance', quality: 'B', status: 'LOSS',
    entryPrice: 1.2810, exitPrice: 1.2845, stopLoss: 1.2850, takeProfit: 1.2730,
    lotSize: 0.5, pnl: -40.00, riskReward: 1.0, emotion: 'Stressé',
    session: 'New York', entryDate: daysAgo(15, 14, 30), exitDate: daysAgo(15, 16, 0),
    notes: 'News NFP a tout renversé. Stop touché de justesse.',
    imageUrl: '', tags: ['FVG', 'NFP', 'GBP'],
  },
  {
    id: 'demo-15', accountId: 'demo', symbol: 'XAUUSD', direction: 'LONG',
    setup: 'OB + Sweep Low', quality: 'A+', status: 'WIN',
    entryPrice: 2265.00, exitPrice: 2298.00, stopLoss: 2252.00, takeProfit: 2300.00,
    lotSize: 0.4, pnl: 132.00, riskReward: 2.538, emotion: 'Discipliné',
    session: 'London', entryDate: daysAgo(16, 8, 0), exitDate: daysAgo(16, 13, 0),
    notes: 'Sweep des lows HTF parfait. OB H1 en confluence.',
    imageUrl: '', tags: ['OB', 'Sweep', 'XAUUSD'],
  },
  {
    id: 'demo-16', accountId: 'demo', symbol: 'EURUSD', direction: 'SHORT',
    setup: 'Liquidity Sweep + CHoCH', quality: 'A', status: 'WIN',
    entryPrice: 1.0895, exitPrice: 1.0842, stopLoss: 1.0918, takeProfit: 1.0840,
    lotSize: 0.8, pnl: 107.20, riskReward: 2.304, emotion: 'Confiant',
    session: 'London', entryDate: daysAgo(18, 10, 0), exitDate: daysAgo(18, 13, 30),
    notes: 'Excellent setup CHoCH après sweep des highs EQH.',
    imageUrl: '', tags: ['CHoCH', 'Sweep', 'EUR'],
  },
  {
    id: 'demo-17', accountId: 'demo', symbol: 'GBPJPY', direction: 'LONG',
    setup: 'OB H4', quality: 'B', status: 'BE',
    entryPrice: 190.80, exitPrice: 190.82, stopLoss: 189.90, takeProfit: 193.00,
    lotSize: 0.3, pnl: 0.06, riskReward: 0, emotion: 'Hésitant',
    session: 'Asian', entryDate: daysAgo(19, 3, 0), exitDate: daysAgo(19, 7, 0),
    notes: 'Sorti au BE, pas assez de momentum en session asiatique.',
    imageUrl: '', tags: ['OB', 'H4', 'GBP'],
  },
  {
    id: 'demo-18', accountId: 'demo', symbol: 'XAUUSD', direction: 'SHORT',
    setup: 'FVG + Résistance D1', quality: 'A+', status: 'WIN',
    entryPrice: 2380.00, exitPrice: 2348.00, stopLoss: 2392.00, takeProfit: 2345.00,
    lotSize: 0.5, pnl: 160.00, riskReward: 2.916, emotion: 'Discipliné',
    session: 'New York', entryDate: daysAgo(20, 15, 0), exitDate: daysAgo(20, 18, 30),
    notes: 'Short parfait depuis résistance D1 avec FVG H1.',
    imageUrl: '', tags: ['FVG', 'D1', 'XAUUSD'],
  },
  {
    id: 'demo-19', accountId: 'demo', symbol: 'USDJPY', direction: 'LONG',
    setup: 'BOS H4 + OB', quality: 'A', status: 'WIN',
    entryPrice: 149.50, exitPrice: 151.20, stopLoss: 148.70, takeProfit: 151.30,
    lotSize: 0.6, pnl: 122.40, riskReward: 2.125, emotion: 'Calme',
    session: 'London', entryDate: daysAgo(22, 9, 30), exitDate: daysAgo(22, 14, 0),
    notes: 'BOS H4 bullish, OB H1 pour l\'entrée. Propre.',
    imageUrl: '', tags: ['BOS', 'OB', 'JPY'],
  },
  {
    id: 'demo-20', accountId: 'demo', symbol: 'EURUSD', direction: 'LONG',
    setup: 'FVG Asian + London Open', quality: 'A', status: 'WIN',
    entryPrice: 1.0720, exitPrice: 1.0775, stopLoss: 1.0698, takeProfit: 1.0780,
    lotSize: 1.0, pnl: 137.50, riskReward: 2.5, emotion: 'Discipliné',
    session: 'London', entryDate: daysAgo(24, 8, 0), exitDate: daysAgo(24, 10, 30),
    notes: 'FVG créé en Asian, rempli à London Open. Setup favori.',
    imageUrl: '', tags: ['FVG', 'Asian', 'London'],
  },
  {
    id: 'demo-21', accountId: 'demo', symbol: 'XAUUSD', direction: 'LONG',
    setup: 'OB + BOS en cours', quality: 'A', status: 'RUNNING',
    entryPrice: 2312.00, exitPrice: undefined, stopLoss: 2300.00, takeProfit: 2340.00,
    lotSize: 0.4, pnl: 18.00, riskReward: 2.333, emotion: 'Confiant',
    session: 'London', entryDate: daysAgo(0, 9, 0), exitDate: undefined,
    notes: 'Trade en cours. Structure bullish intacte.',
    imageUrl: '', tags: ['OB', 'BOS', 'Running'],
  },
];

// ─── ANALYSES QUOTIDIENNES ────────────────────────────────────────────────────
export const DEMO_ANALYSES: DailyAnalysis[] = [
  {
    id: 'demo-analysis-1',
    accountId: 'demo',
    date: daysAgo(1, 7, 0).split('T')[0],
    fundamentalBias: 'Bullish USD — discours hawkish Fed. DXY en hausse. XAUUSD sous pression baissière potentielle en intraday.',
    technicalBias: 'XAUUSD : structure H4 bullish intacte. OB H1 à 2318 à surveiller. BOS récent validé.',
    decision: 'Chercher des longs sur XAUUSD au retest OB H1. Éviter EUR avant CPI.',
    notes: 'Session London prioritaire. Pas de trades NY si volatilité trop élevée.',
    createdAt: daysAgo(1, 7, 0),
  },
  {
    id: 'demo-analysis-2',
    accountId: 'demo',
    date: daysAgo(3, 7, 0).split('T')[0],
    fundamentalBias: 'Risk-off ambiant — tensions géopolitiques. Or en accumulation. JPY fort.',
    technicalBias: 'GBPUSD : CHoCH H1 baissier. FVG à 1.2740 zone d\'intérêt short. USDJPY : support H4 à 150.50.',
    decision: 'Short GBPUSD si retest FVG confirmé. Long USDJPY au support si structure tient.',
    notes: 'Attention aux news NFP en fin de session NY.',
    createdAt: daysAgo(3, 7, 0),
  },
  {
    id: 'demo-analysis-3',
    accountId: 'demo',
    date: daysAgo(7, 7, 0).split('T')[0],
    fundamentalBias: 'BCE dovish — EUR sous pression. USD stable. Pas de catalyseur majeur attendu.',
    technicalBias: 'EURUSD : structure D1 baissière. Résistance à 1.0920 à tenir. H4 : FVG baissier à 1.0895.',
    decision: 'Short EURUSD depuis résistance 1.0920 ou FVG 1.0895. TP zone 1.0840.',
    notes: 'Ne pas trader GBP aujourd\'hui — spread élevé annoncé par broker.',
    createdAt: daysAgo(7, 7, 0),
  },
];

// ─── RÈGLES DU PLAN DE TRADING ────────────────────────────────────────────────
export const DEMO_PLAN_RULES = [
  { id: 'rule-1', text: 'Ne trader que les setups A et A+ uniquement.', category: 'Entrée' },
  { id: 'rule-2', text: 'Risque maximum 1% du capital par trade.', category: 'Risk Management' },
  { id: 'rule-3', text: 'Pas de trade 30min avant/après news majeures (NFP, CPI, FOMC).', category: 'News' },
  { id: 'rule-4', text: 'Analyser HTF (D1, H4) avant toute entrée LTF.', category: 'Analyse' },
  { id: 'rule-5', text: 'Maximum 2 trades par jour. Arrêt après 2 pertes consécutives.', category: 'Discipline' },
  { id: 'rule-6', text: 'Journaliser chaque trade avec screenshot avant clôture.', category: 'Journal' },
];

// ─── OBJECTIFS ────────────────────────────────────────────────────────────────
export const DEMO_OBJECTIVES = [
  { id: 'goal-1', title: 'Atteindre 70% de winrate sur 30 trades', progress: 72, target: 70, unit: '%' },
  { id: 'goal-2', title: 'Maintenir RR moyen > 2.0', progress: 2.18, target: 2.0, unit: 'RR' },
  { id: 'goal-3', title: 'Ne pas dépasser 5% drawdown mensuel', progress: 3.2, target: 5, unit: '%' },
  { id: 'goal-4', title: 'Journaliser 100% des trades ce mois', progress: 95, target: 100, unit: '%' },
];

// ─── SUCCÈS ───────────────────────────────────────────────────────────────────
export const DEMO_SUCCESSES = [
  { id: 'ach-1', title: 'Série de 5 wins consécutifs', date: daysAgo(5).split('T')[0], icon: '🔥' },
  { id: 'ach-2', title: 'RR > 2.5 atteint 3 fois ce mois', date: daysAgo(10).split('T')[0], icon: '🎯' },
  { id: 'ach-3', title: '0 trade FOMO pendant 7 jours', date: daysAgo(15).split('T')[0], icon: '🧘' },
  { id: 'ach-4', title: 'Objectif mensuel +8% atteint', date: daysAgo(20).split('T')[0], icon: '🏆' },
];

// ─── isDemo helper ────────────────────────────────────────────────────────────
export const isDemo = (): boolean => {
  try {
    if (localStorage.getItem('mitrad_active_id') === 'demo') return true;
    const raw = localStorage.getItem('mitrad_user_demo') || localStorage.getItem('mitrad_user');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.isDemo === true || parsed?.id === 'demo';
  } catch {
    return false;
  }
};