// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — Données fictives pour le mode démo
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_ACCOUNT = {
  id: 'demo-account',
  name: 'Compte Démo',
  type: 'Démo',
  capital: 10000,
  currency: 'USD',
};

export const DEMO_USER = {
  id: 'demo',
  name: 'Trader Demo',
  email: 'demo@mitrad.com',
  isDemo: true,
  password_set: false,
  customSetups: [],
};

export const DEMO_TRADES = [
  { id: 'd1',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-01T09:15:00', pair: 'XAUUSD', direction: 'BUY',  session: 'London',   setup: 'Breakout', quality: 8, emotion: 'Neutre',   entryPrice: 2020, stopLoss: 2010, takeProfit: 2040, lotSize: 0.1, exitPrice: 2038, resultR: 1.8,  resultDollar: 180,  status: 'WIN',  duration: 45, entryNote: 'Structure haussière claire', exitNote: 'TP atteint proprement', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd2',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-01T14:30:00', pair: 'EURUSD', direction: 'SELL', session: 'New York', setup: 'Rejet',    quality: 7, emotion: 'Confiant', entryPrice: 1.085, stopLoss: 1.088, takeProfit: 1.079, lotSize: 1, exitPrice: 1.091, resultR: -1,   resultDollar: -150, status: 'LOSS', duration: 30, entryNote: 'Rejet sur résistance', exitNote: 'SL touché, faux signal', tradingViewLink: '', screenshot: '', planRespected: false },
  { id: 'd3',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-03T10:00:00', pair: 'NAS100', direction: 'BUY',  session: 'London',   setup: 'Breakout', quality: 9, emotion: 'Neutre',   entryPrice: 17500, stopLoss: 17400, takeProfit: 17700, lotSize: 0.5, exitPrice: 17680, resultR: 1.8,  resultDollar: 220,  status: 'WIN',  duration: 60, entryNote: 'Breakout de range', exitNote: 'Sortie avant news', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd4',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-04T09:45:00', pair: 'XAUUSD', direction: 'SELL', session: 'London',   setup: 'Rejet',    quality: 6, emotion: 'Stressé',  entryPrice: 2035, stopLoss: 2042, takeProfit: 2021, lotSize: 0.1, exitPrice: 2022, resultR: 1.9,  resultDollar: 195,  status: 'WIN',  duration: 55, entryNote: 'Rejet zone premium', exitNote: 'TP quasi atteint', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd5',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-05T15:00:00', pair: 'GBPUSD', direction: 'BUY',  session: 'New York', setup: 'Breakout', quality: 5, emotion: 'Anxieux',  entryPrice: 1.265, stopLoss: 1.260, takeProfit: 1.275, lotSize: 1, exitPrice: 1.261, resultR: -1,   resultDollar: -120, status: 'LOSS', duration: 20, entryNote: 'Breakout tardif', exitNote: 'Entrée trop tard', tradingViewLink: '', screenshot: '', planRespected: false },
  { id: 'd6',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-06T09:30:00', pair: 'XAUUSD', direction: 'BUY',  session: 'London',   setup: 'Breakout', quality: 8, emotion: 'Neutre',   entryPrice: 2028, stopLoss: 2018, takeProfit: 2048, lotSize: 0.1, exitPrice: 2045, resultR: 1.7,  resultDollar: 170,  status: 'WIN',  duration: 50, entryNote: 'Momentum haussier', exitNote: 'Sortie partielle réussie', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd7',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-07T14:00:00', pair: 'NAS100', direction: 'SELL', session: 'New York', setup: 'Rejet',    quality: 7, emotion: 'Confiant', entryPrice: 17600, stopLoss: 17700, takeProfit: 17400, lotSize: 0.5, exitPrice: 17420, resultR: 1.8,  resultDollar: 210,  status: 'WIN',  duration: 70, entryNote: 'Double top sur résistance', exitNote: 'Excellent timing', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd8',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-10T09:15:00', pair: 'EURUSD', direction: 'BUY',  session: 'London',   setup: 'Breakout', quality: 6, emotion: 'Neutre',   entryPrice: 1.082, stopLoss: 1.079, takeProfit: 1.088, lotSize: 1, exitPrice: 1.087, resultR: 1.7,  resultDollar: 140,  status: 'WIN',  duration: 40, entryNote: 'Breakout avec volume', exitNote: 'TP atteint', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd9',  userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-11T10:30:00', pair: 'XAUUSD', direction: 'SELL', session: 'London',   setup: 'Rejet',    quality: 8, emotion: 'Neutre',   entryPrice: 2042, stopLoss: 2049, takeProfit: 2028, lotSize: 0.1, exitPrice: 2050, resultR: -1,   resultDollar: -130, status: 'LOSS', duration: 25, entryNote: 'Zone de rejet claire', exitNote: 'News NFP imprévu', tradingViewLink: '', screenshot: '', planRespected: false },
  { id: 'd10', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-12T14:45:00', pair: 'GBPUSD', direction: 'SELL', session: 'New York', setup: 'Breakout', quality: 9, emotion: 'Confiant', entryPrice: 1.270, stopLoss: 1.275, takeProfit: 1.260, lotSize: 1, exitPrice: 1.261, resultR: 1.8,  resultDollar: 185,  status: 'WIN',  duration: 55, entryNote: 'Breakout baissier propre', exitNote: 'TP atteint en 55min', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd11', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-13T09:00:00', pair: 'NAS100', direction: 'BUY',  session: 'London',   setup: 'Breakout', quality: 7, emotion: 'Neutre',   entryPrice: 17450, stopLoss: 17350, takeProfit: 17650, lotSize: 0.5, exitPrice: 17630, resultR: 1.8,  resultDollar: 200,  status: 'WIN',  duration: 65, entryNote: 'Open London gap up', exitNote: 'Sortie manuelle +200$', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd12', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-14T15:00:00', pair: 'XAUUSD', direction: 'BUY',  session: 'New York', setup: 'Rejet',    quality: 5, emotion: 'Stressé',  entryPrice: 2031, stopLoss: 2021, takeProfit: 2051, lotSize: 0.1, exitPrice: 2023, resultR: -1,   resultDollar: -140, status: 'LOSS', duration: 15, entryNote: 'Entrée prématurée', exitNote: 'Patience manquante', tradingViewLink: '', screenshot: '', planRespected: false },
  { id: 'd13', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-17T09:30:00', pair: 'EURUSD', direction: 'SELL', session: 'London',   setup: 'Breakout', quality: 8, emotion: 'Neutre',   entryPrice: 1.088, stopLoss: 1.091, takeProfit: 1.082, lotSize: 1, exitPrice: 1.083, resultR: 1.7,  resultDollar: 160,  status: 'WIN',  duration: 45, entryNote: 'Cassure support', exitNote: 'Bonne exécution', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd14', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-18T14:00:00', pair: 'XAUUSD', direction: 'BUY',  session: 'New York', setup: 'Rejet',    quality: 9, emotion: 'Confiant', entryPrice: 2025, stopLoss: 2015, takeProfit: 2045, lotSize: 0.1, exitPrice: 2043, resultR: 1.8,  resultDollar: 190,  status: 'WIN',  duration: 50, entryNote: 'Rejet zone discount', exitNote: 'TP quasi atteint', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd15', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-19T09:15:00', pair: 'NAS100', direction: 'SELL', session: 'London',   setup: 'Breakout', quality: 7, emotion: 'Neutre',   entryPrice: 17550, stopLoss: 17650, takeProfit: 17350, lotSize: 0.5, exitPrice: 17370, resultR: 1.8,  resultDollar: 215,  status: 'WIN',  duration: 60, entryNote: 'Breakout baissier London', exitNote: 'Excellent R:R', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd16', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-20T15:30:00', pair: 'GBPUSD', direction: 'BUY',  session: 'New York', setup: 'Rejet',    quality: 6, emotion: 'Anxieux',  entryPrice: 1.268, stopLoss: 1.263, takeProfit: 1.278, lotSize: 1, exitPrice: 1.264, resultR: -1,   resultDollar: -110, status: 'LOSS', duration: 20, entryNote: 'Setup limite', exitNote: 'Eviter ce type', tradingViewLink: '', screenshot: '', planRespected: false },
  { id: 'd17', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-21T09:45:00', pair: 'XAUUSD', direction: 'SELL', session: 'London',   setup: 'Breakout', quality: 8, emotion: 'Neutre',   entryPrice: 2038, stopLoss: 2045, takeProfit: 2024, lotSize: 0.1, exitPrice: 2026, resultR: 1.7,  resultDollar: 175,  status: 'WIN',  duration: 55, entryNote: 'Structure baissière', exitNote: 'Sortie propre', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd18', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-24T10:00:00', pair: 'EURUSD', direction: 'BUY',  session: 'London',   setup: 'Rejet',    quality: 7, emotion: 'Confiant', entryPrice: 1.084, stopLoss: 1.081, takeProfit: 1.090, lotSize: 1, exitPrice: 1.089, resultR: 1.7,  resultDollar: 150,  status: 'WIN',  duration: 40, entryNote: 'Rejet support fort', exitNote: 'TP atteint', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd19', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-25T14:30:00', pair: 'NAS100', direction: 'BUY',  session: 'New York', setup: 'Breakout', quality: 8, emotion: 'Neutre',   entryPrice: 17480, stopLoss: 17380, takeProfit: 17680, lotSize: 0.5, exitPrice: 17660, resultR: 1.8,  resultDollar: 205,  status: 'WIN',  duration: 65, entryNote: 'Breakout haussier NY', exitNote: 'Meilleur trade du mois', tradingViewLink: '', screenshot: '', planRespected: true  },
  { id: 'd20', userId: 'demo', accountId: 'demo-account', trading_account_id: 'demo-account', date: '2026-02-26T09:30:00', pair: 'XAUUSD', direction: 'BUY',  session: 'London',   setup: 'Rejet',    quality: 9, emotion: 'Confiant', entryPrice: 2030, stopLoss: 2020, takeProfit: 2050, lotSize: 0.1, exitPrice: 2048, resultR: 1.8,  resultDollar: 195,  status: 'WIN',  duration: 50, entryNote: 'Setup parfait', exitNote: 'Exécution parfaite', tradingViewLink: '', screenshot: '', planRespected: true  },
];

export const DEMO_ANALYSES = [
  { id: 'da1', date: '2026-02-26', title: 'Analyse du jour', pairs: [{ pair: 'XAUUSD', bias: 'Haussier', note: 'Structure haussière sur H4, attente rejet zone discount 2020.' }] },
  { id: 'da2', date: '2026-02-25', title: 'Analyse du jour', pairs: [{ pair: 'NAS100', bias: 'Haussier', note: 'Breakout de range sur H1, momentum fort côté acheteur.' }] },
];

export const DEMO_PLAN_RULES = [
  { id: 'dp1', title: 'Respecter le RR minimum', description: 'Ne jamais prendre un trade avec un RR inférieur à 1:1.5.', images: [], order: 1 },
  { id: 'dp2', title: 'Trader uniquement les sessions London et New York', description: 'Éviter les trades en dehors des sessions principales.', images: [], order: 2 },
  { id: 'dp3', title: 'Max 3 trades par jour', description: 'Limiter les trades pour garder la discipline et éviter le revenge trading.', images: [], order: 3 },
  { id: 'dp4', title: 'Risque max 1% par trade', description: 'Ne jamais risquer plus de 1% du capital sur un seul trade.', images: [], order: 4 },
];

export const DEMO_OBJECTIVES = [
  { id: 'do1', text: 'Atteindre 70% de Win Rate', description: 'Améliorer la sélection des setups', target_date: '2026-06-01', completed: false, image: '' },
  { id: 'do2', text: 'Doubler le capital en 6 mois', description: 'Via une gestion rigoureuse du risque', target_date: '2026-08-01', completed: false, image: '' },
  { id: 'do3', text: 'Tenir le journal chaque jour', description: 'Sans exception pendant 3 mois', target_date: '2026-05-01', completed: true, image: '' },
];

export const DEMO_SUCCESSES = [
  { id: 'ds1', title: 'Premier mois profitable', date: '2026-02-01', note: 'P&L positif sur le mois de février !', images: [], type: 'Performance', badge_key: 'rookie' },
  { id: 'ds2', title: '5 trades gagnants consécutifs', date: '2026-02-13', note: 'Belle série du 10 au 13 février.', images: [], type: 'Série', badge_key: 'fire' },
];

// Décale les trades démo vers le mois en cours
const shiftTradesToCurrentMonth = (trades: any[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  return trades.map(t => {
    const original = new Date(t.date);
    const shifted = new Date(original);
    shifted.setFullYear(currentYear);
    shifted.setMonth(currentMonth);
    // S'assurer que le jour ne dépasse pas la fin du mois
    const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (shifted.getDate() > maxDay) shifted.setDate(maxDay);
    return { ...t, date: shifted.toISOString() };
  });
};

export const DEMO_TRADES_SHIFTED = shiftTradesToCurrentMonth(DEMO_TRADES);

export const isDemo = () => {
  try {
    const u = JSON.parse(localStorage.getItem('mitrad_user') || '{}');
    return u?.isDemo === true;
  } catch { return false; }
};

