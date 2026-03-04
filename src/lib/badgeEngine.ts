import { Trade, Badge } from '@/types/trading';

export const ALL_BADGES: Badge[] = [
  { id: 'sniper', name: 'Sniper', emoji: '🎯', description: 'Win Rate ≥ 70%' },
  { id: 'diamond', name: 'Diamond Hands', emoji: '💎', description: 'Profit Factor ≥ 3' },
  { id: 'fire', name: 'On Fire', emoji: '🔥', description: 'Win streak ≥ 5' },
  { id: 'speed', name: 'Speed Trader', emoji: '⚡', description: 'Avg duration < 30min' },
  { id: 'lion', name: 'Lion', emoji: '🦁', description: 'Total P&L ≥ +20R' },
  { id: 'strategist', name: 'Strategist', emoji: '🧠', description: 'Avg RR ≥ 2.5' },
  { id: 'consistent', name: 'Consistent', emoji: '📅', description: 'Trades every week for 4 weeks' },
  { id: 'rookie', name: 'Rookie Star', emoji: '🚀', description: 'First profitable month' },
  { id: 'icecold', name: 'Ice Cold', emoji: '❄️', description: 'No revenge trading detected' },
  { id: 'champion', name: 'Champion', emoji: '🏆', description: '#1 on leaderboard' },
];

export function calculateBadges(trades: Trade[]): Badge[] {
  if (trades.length === 0) return [];
  const earned: Badge[] = [];
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) return [];

  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');
  const winRate = wins.length / closed.length;
  const totalR = closed.reduce((s, t) => s + t.resultR, 0);
  const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgDuration = closed.reduce((s, t) => s + t.duration, 0) / closed.length;
  const avgRR = wins.length > 0 ? wins.reduce((s, t) => s + t.resultR, 0) / wins.length : 0;

  if (winRate >= 0.70) earned.push(ALL_BADGES[0]);
  if (pf >= 3) earned.push(ALL_BADGES[1]);

  // Win streak
  let maxStreak = 0, streak = 0;
  const sorted = [...closed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sorted.forEach(t => {
    if (t.status === 'WIN') { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  });
  if (maxStreak >= 5) earned.push(ALL_BADGES[2]);

  if (avgDuration < 30) earned.push(ALL_BADGES[3]);
  if (totalR >= 20) earned.push(ALL_BADGES[4]);
  if (avgRR >= 2.5) earned.push(ALL_BADGES[5]);

  // Consistent: trades in at least 4 consecutive weeks
  const weeks = new Set(closed.map(t => {
    const d = new Date(t.date);
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  }));
  if (weeks.size >= 4) earned.push(ALL_BADGES[6]);

  // Rookie star: any month with positive total R
  const byMonth: Record<string, number> = {};
  closed.forEach(t => {
    const m = t.date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + t.resultR;
  });
  if (Object.values(byMonth).some(v => v > 0)) earned.push(ALL_BADGES[7]);

  // Ice cold: no revenge trading emotion
  if (!closed.some(t => t.emotion === 'Revenge Trading')) earned.push(ALL_BADGES[8]);

  return earned;
}

export function getMaxWinStreak(trades: Trade[]): number {
  let max = 0, cur = 0;
  const sorted = [...trades].filter(t => t.status !== 'RUNNING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sorted.forEach(t => {
    if (t.status === 'WIN') { cur++; max = Math.max(max, cur); }
    else cur = 0;
  });
  return max;
}

export function getMaxLossStreak(trades: Trade[]): number {
  let max = 0, cur = 0;
  const sorted = [...trades].filter(t => t.status !== 'RUNNING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  sorted.forEach(t => {
    if (t.status === 'LOSS') { cur++; max = Math.max(max, cur); }
    else cur = 0;
  });
  return max;
}

export function getMaxDrawdown(trades: Trade[], capital = 0): { r: number, dollar: number, pct: number } {
  const sorted = [...trades].filter(t => t.status !== 'RUNNING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (sorted.length === 0) return { r: 0, dollar: 0, pct: 0 };

  let cumD = capital;
  let peakD = capital;
  let maxDDD = 0;
  let cumR = 0;
  let peakR = 0;
  let maxDDR = 0;

  sorted.forEach(t => {
    cumD += t.resultDollar ?? 0;
    if (cumD > peakD) peakD = cumD;
    const ddD = cumD - peakD;
    if (Math.abs(ddD) > maxDDD) maxDDD = Math.abs(ddD);

    const r = (t.resultR ?? 0) !== 0 ? (t.resultR ?? 0) : capital > 0 ? (t.resultDollar / (capital * 0.01)) : 0;
    cumR += r;
    if (cumR > peakR) peakR = cumR;
    const ddR = cumR - peakR;
    if (Math.abs(ddR) > maxDDR) maxDDR = Math.abs(ddR);
  });

  const dollar = Math.round(maxDDD * 100) / 100;
  const pct = peakD > 0 ? Math.round((maxDDD / peakD) * 10000) / 100 : 0;
  const r = Math.round(maxDDR * 100) / 100;
  return { r, dollar, pct };
}
}
