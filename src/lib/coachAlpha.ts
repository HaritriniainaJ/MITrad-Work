import { Trade } from '@/types/trading';
import { getMaxLossStreak, getMaxWinStreak } from './badgeEngine';

export interface CoachAdvice {
  category: string;
  emoji: string;
  message: string;
  priority: number;
  type: 'strength' | 'weakness' | 'info';
  repeatCount?: number;
}

// ── Helpers mode ─────────────────────────────────────────────────────────
function getPnl(t: Trade, mode: string, capital: number): number {
  if (mode === 'R') return t.resultR ?? 0;
  const d = t.resultDollar ?? 0;
  if (mode === '%' && capital > 0) return (d / capital) * 100;
  return d;
}

function fmtPnl(v: number, mode: string): string {
  const sign = v >= 0 ? '+' : '';
  if (mode === 'R') return `${sign}${v.toFixed(2)}R`;
  if (mode === '%') return `${sign}${v.toFixed(2)}%`;
  if (Math.abs(v) >= 1000) return `${sign}$${(v / 1000).toFixed(1)}k`;
  return `${sign}$${v.toFixed(0)}`;
}

export function generateCoachAdvice(
  trades: Trade[],
  mode: string = '%',
  capital: number = 10000
): CoachAdvice[] {
  const advice: CoachAdvice[] = [];
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) {
    advice.push({ category: 'Démarrage', emoji: '🚀', message: 'Bienvenue ! Commence à enregistrer tes trades pour recevoir des conseils personnalisés de Mentor-X.', priority: 1, type: 'info' });
    return advice;
  }

  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');
  const winRate = (wins.length / closed.length) * 100;

  const grossProfit = wins.reduce((s, t) => s + getPnl(t, mode, capital), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + getPnl(t, mode, capital), 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgPnl = wins.length > 0 ? grossProfit / wins.length : 0;
  const maxLossStreak = getMaxLossStreak(closed);
  const maxWinStreak = getMaxWinStreak(closed);

  // ── Performance par paire ─────────────────────────────────────────────
  const pairPerf: Record<string, { pnl: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!pairPerf[t.pair]) pairPerf[t.pair] = { pnl: 0, count: 0, wins: 0 };
    pairPerf[t.pair].pnl += getPnl(t, mode, capital);
    pairPerf[t.pair].count++;
    if (t.status === 'WIN') pairPerf[t.pair].wins++;
  });

  // ── Performance par setup ─────────────────────────────────────────────
  const setupPerf: Record<string, { pnl: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!setupPerf[t.setup]) setupPerf[t.setup] = { pnl: 0, count: 0, wins: 0 };
    setupPerf[t.setup].pnl += getPnl(t, mode, capital);
    setupPerf[t.setup].count++;
    if (t.status === 'WIN') setupPerf[t.setup].wins++;
  });

  // ── Performance par session ───────────────────────────────────────────
  const sessionPerf: Record<string, { pnl: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!sessionPerf[t.session]) sessionPerf[t.session] = { pnl: 0, count: 0, wins: 0 };
    sessionPerf[t.session].pnl += getPnl(t, mode, capital);
    sessionPerf[t.session].count++;
    if (t.status === 'WIN') sessionPerf[t.session].wins++;
  });

  // ── Émotions négatives répétées ───────────────────────────────────────
  const emotionCounts: Record<string, number> = {};
  closed.forEach(t => {
    if (['FOMO', 'Revenge Trading', 'Stressé', 'Anxieux'].includes(t.emotion)) {
      emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
    }
  });

  // ── Performance par jour ──────────────────────────────────────────────
  const dayPerf: Record<number, { pnl: number; count: number }> = {};
  closed.forEach(t => {
    const day = new Date(t.date).getDay();
    if (!dayPerf[day]) dayPerf[day] = { pnl: 0, count: 0 };
    dayPerf[day].pnl += getPnl(t, mode, capital);
    dayPerf[day].count++;
  });
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // ── Overtrading par jour ──────────────────────────────────────────────
  const dailyCounts: Record<string, number> = {};
  closed.forEach(t => {
    const d = t.date.slice(0, 10);
    dailyCounts[d] = (dailyCounts[d] || 0) + 1;
  });
  const overtradingDays = Object.values(dailyCounts).filter(c => c > 5).length;

  // ════════════════════════════════════════════════════════════════════
  // POINTS FORTS RÉPÉTÉS
  // ════════════════════════════════════════════════════════════════════

  // Paires rentables répétées
  Object.entries(pairPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) > 0.55 && v.pnl > 0)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 2)
    .forEach(([pair, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Paire forte',
        emoji: '💰',
        message: `${pair} est ta paire la plus régulièrement rentable — ${v.count} trades, ${wr}% WR, ${fmtPnl(v.pnl, mode)}. Priorise-la.`,
        priority: 4,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Setups gagnants répétés
  Object.entries(setupPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) > 0.55 && v.pnl > 0)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 2)
    .forEach(([setup, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Setup gagnant',
        emoji: '🎯',
        message: `Le setup ${setup} fonctionne régulièrement — ${v.count} trades, ${wr}% WR, ${fmtPnl(v.pnl, mode)}. Continue à l'exploiter.`,
        priority: 4,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Sessions fortes répétées
  Object.entries(sessionPerf)
    .filter(([, v]) => v.count >= 3 && v.pnl > 0 && (v.wins / v.count) > 0.5)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 1)
    .forEach(([session, v]) => {
      advice.push({
        category: 'Session forte',
        emoji: '⏰',
        message: `La session ${session} est régulièrement profitable — ${v.count} trades, ${fmtPnl(v.pnl, mode)}. C'est ta fenêtre dorée.`,
        priority: 3,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Win rate solide
  if (winRate > 60 && closed.length >= 10) {
    advice.push({
      category: 'Win Rate',
      emoji: '📈',
      message: `Win rate de ${winRate.toFixed(0)}% sur ${closed.length} trades — tu sélectionnes régulièrement des setups de qualité. Continue.`,
      priority: 3,
      type: 'strength',
      repeatCount: closed.length,
    });
  }

  // Série de gains
  if (maxWinStreak >= 4) {
    advice.push({
      category: 'Série de gains',
      emoji: '🔥',
      message: `Série de ${maxWinStreak} wins consécutifs détectée — tu as une régularité mentale solide.`,
      priority: 2,
      type: 'strength',
      repeatCount: maxWinStreak,
    });
  }

  // Profit Factor solide
  if (pf > 1.8 && closed.length >= 10) {
    advice.push({
      category: 'Profit Factor',
      emoji: '⚖️',
      message: `Profit Factor de ${pf.toFixed(2)} — tu laisses courir tes gains et coupes tes pertes régulièrement.`,
      priority: 3,
      type: 'strength',
    });
  }

  // Meilleur jour répété
  const bestDay = Object.entries(dayPerf).filter(([, v]) => v.count >= 3 && v.pnl > 0).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestDay) {
    advice.push({
      category: 'Jour fort',
      emoji: '📅',
      message: `Le ${dayNames[parseInt(bestDay[0])]} est régulièrement ton meilleur jour — ${bestDay[1].count} trades, ${fmtPnl(bestDay[1].pnl, mode)}. Maximise cette journée.`,
      priority: 2,
      type: 'strength',
      repeatCount: bestDay[1].count,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // POINTS FAIBLES RÉPÉTÉS
  // ════════════════════════════════════════════════════════════════════

  // Paires perdantes répétées
  Object.entries(pairPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) < 0.40 && v.pnl < 0)
    .sort((a, b) => a[1].pnl - b[1].pnl)
    .slice(0, 2)
    .forEach(([pair, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Paire perdante',
        emoji: '📉',
        message: `${pair} te fait perdre régulièrement — ${v.count} trades, ${wr}% WR, ${fmtPnl(v.pnl, mode)}. Évite cette paire ou revois ton approche.`,
        priority: 8,
        type: 'weakness',
        repeatCount: v.count,
      });
    });

  // Setups perdants répétés
  Object.entries(setupPerf)
    .filter(([, v]) => v.count >= 3 && v.pnl < 0 && (v.wins / v.count) < 0.40)
    .sort((a, b) => a[1].pnl - b[1].pnl)
    .slice(0, 2)
    .forEach(([setup, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Setup perdant',
        emoji: '⚠️',
        message: `Le setup ${setup} échoue régulièrement — ${v.count} trades, ${wr}% WR, ${fmtPnl(v.pnl, mode)}. Arrête de le prendre ou revois ton entrée.`,
        priority: 8,
        type: 'weakness',
        repeatCount: v.count,
      });
    });

  // Émotions négatives répétées
  Object.entries(emotionCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .forEach(([emotion, count]) => {
      const emotionTrades = closed.filter(t => t.emotion === emotion);
      const lossRate = emotionTrades.filter(t => t.status === 'LOSS').length / emotionTrades.length;
      advice.push({
        category: 'Émotion récurrente',
        emoji: '🧠',
        message: `${emotion} apparaît ${count} fois dans ton journal — ${(lossRate * 100).toFixed(0)}% de LOSS dans cet état. C'est un pattern destructeur à corriger.`,
        priority: 9,
        type: 'weakness',
        repeatCount: count,
      });
    });

  // Overtrading répété
  if (overtradingDays >= 2) {
    advice.push({
      category: 'Overtrading',
      emoji: '🔴',
      message: `Overtrading détecté ${overtradingDays} jours (plus de 5 trades/jour). Ce pattern récurrent détruit les comptes. Fixe une limite de 3 trades/jour.`,
      priority: 8,
      type: 'weakness',
      repeatCount: overtradingDays,
    });
  }

  // Série de pertes
  if (maxLossStreak >= 3) {
    advice.push({
      category: 'Série de pertes',
      emoji: '🛑',
      message: `${maxLossStreak} pertes consécutives détectées. Ce pattern signale un problème de setup ou de psychologie. Pause et analyse obligatoires.`,
      priority: 9,
      type: 'weakness',
      repeatCount: maxLossStreak,
    });
  }

  // Jour perdant répété
  const worstDay = Object.entries(dayPerf).filter(([, v]) => v.count >= 3 && v.pnl < 0).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstDay) {
    advice.push({
      category: 'Jour faible',
      emoji: '📉',
      message: `Le ${dayNames[parseInt(worstDay[0])]} est régulièrement ton pire jour — ${worstDay[1].count} trades, ${fmtPnl(worstDay[1].pnl, mode)}. Évite de trader ce jour.`,
      priority: 6,
      type: 'weakness',
      repeatCount: worstDay[1].count,
    });
  }

  // Win rate faible
  if (winRate < 40 && closed.length >= 10) {
    advice.push({
      category: 'Win Rate faible',
      emoji: '🚨',
      message: `Win rate de ${winRate.toFixed(0)}% sur ${closed.length} trades — pattern de pertes répétitif. Revois tes critères d'entrée et sois plus sélectif.`,
      priority: 9,
      type: 'weakness',
      repeatCount: closed.length,
    });
  }

  // Avg PnL faible sur les gagnants
  if (avgPnl > 0 && avgPnl < (mode === 'R' ? 1 : mode === '%' ? 0.5 : 50) && wins.length >= 5) {
    advice.push({
      category: 'RR faible',
      emoji: '⚠️',
      message: `Gain moyen de ${fmtPnl(avgPnl, mode)} sur ${wins.length} trades gagnants — tu coupes tes gains trop tôt régulièrement. Laisse courir tes positions.`,
      priority: 8,
      type: 'weakness',
      repeatCount: wins.length,
    });
  }

  return advice.sort((a, b) => b.priority - a.priority);
}

// ── Note sur 10 basée sur 4 critères ────────────────────────────────────────
// Chaque critère vaut 2.5 points → total max = 10
//
// 1. Win Rate
//    ≥60%      → 2.5
//    50-60%    → 2.0
//    40-50%    → 1.5
//    30-40%    → 0.5
//    <30%      → 0
//
// 2. Drawdown max (en % du capital, calculé sur la courbe des capitaux cumulés)
//    <1%       → 2.5
//    1-2%      → 2.0
//    2-5%      → 1.0
//    ≥5%       → 0
//
// 3. Croissance du capital (PnL total en % du capital)
//    ≥5%       → 2.5
//    2-5%      → 2.0
//    0-2%      → 1.0
//    <0%       → 0
//
// 4. Profit Factor
//    ≥2.0      → 2.5
//    1.5-2.0   → 2.0
//    1.0-1.5   → 1.0
//    <1.0      → 0

export function getDisciplineScore(trades: Trade[], capital: number = 10000): number {
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) return 0;

  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');

  // ── 1. Win Rate (2.5 pts) ─────────────────────────────────────────────
  const winRate = (wins.length / closed.length) * 100;
  let scoreWR = 0;
  if (winRate >= 60) scoreWR = 2.5;
  else if (winRate >= 50) scoreWR = 2.0;
  else if (winRate >= 40) scoreWR = 1.5;
  else if (winRate >= 30) scoreWR = 0.5;
  else scoreWR = 0;

  // ── 2. Drawdown max en % du capital (2.5 pts) ─────────────────────────
  // On reconstruit la courbe du capital cumulé pour trouver le drawdown max
  let peak = capital;
  let currentCapital = capital;
  let maxDrawdownPct = 0;

  closed.forEach(t => {
    currentCapital += t.resultDollar ?? 0;
    if (currentCapital > peak) peak = currentCapital;
    const dd = peak > 0 ? ((peak - currentCapital) / peak) * 100 : 0;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
  });

  let scoreDD = 0;
  if (maxDrawdownPct < 1) scoreDD = 2.5;
  else if (maxDrawdownPct < 2) scoreDD = 2.0;
  else if (maxDrawdownPct < 5) scoreDD = 1.0;
  else scoreDD = 0;

  // ── 3. Croissance du capital en % (2.5 pts) ───────────────────────────
  const totalPnlDollar = closed.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const growthPct = capital > 0 ? (totalPnlDollar / capital) * 100 : 0;

  let scoreGrowth = 0;
  if (growthPct >= 5) scoreGrowth = 2.5;
  else if (growthPct >= 2) scoreGrowth = 2.0;
  else if (growthPct >= 0) scoreGrowth = 1.0;
  else scoreGrowth = 0;

  // ── 4. Profit Factor (2.5 pts) ────────────────────────────────────────
  const grossProfit = wins.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.resultDollar ?? 0), 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  let scorePF = 0;
  if (pf >= 2.0) scorePF = 2.5;
  else if (pf >= 1.5) scorePF = 2.0;
  else if (pf >= 1.0) scorePF = 1.0;
  else scorePF = 0;

  // ── Total sur 10 ──────────────────────────────────────────────────────
  const total = scoreWR + scoreDD + scoreGrowth + scorePF;
  return Math.round(total * 10) / 10; // arrondi à 1 décimale ex: 7.5
}
