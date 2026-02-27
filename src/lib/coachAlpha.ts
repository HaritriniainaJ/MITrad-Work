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

export function generateCoachAdvice(trades: Trade[]): CoachAdvice[] {
  const advice: CoachAdvice[] = [];
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) {
    advice.push({ category: 'Démarrage', emoji: '🚀', message: 'Bienvenue ! Commence à enregistrer tes trades pour recevoir des conseils personnalisés de Mentor-X.', priority: 1, type: 'info' });
    return advice;
  }

  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');
  const winRate = (wins.length / closed.length) * 100;
  const totalR = closed.reduce((s, t) => s + t.resultR, 0);
  const grossProfit = wins.reduce((s, t) => s + t.resultR, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.resultR, 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgRR = wins.length > 0 ? grossProfit / wins.length : 0;
  const maxLossStreak = getMaxLossStreak(closed);
  const maxWinStreak = getMaxWinStreak(closed);

  // ── Performance par paire ─────────────────────────────────────────────
  const pairPerf: Record<string, { r: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!pairPerf[t.pair]) pairPerf[t.pair] = { r: 0, count: 0, wins: 0 };
    pairPerf[t.pair].r += t.resultR;
    pairPerf[t.pair].count++;
    if (t.status === 'WIN') pairPerf[t.pair].wins++;
  });

  // ── Performance par setup ─────────────────────────────────────────────
  const setupPerf: Record<string, { r: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!setupPerf[t.setup]) setupPerf[t.setup] = { r: 0, count: 0, wins: 0 };
    setupPerf[t.setup].r += t.resultR;
    setupPerf[t.setup].count++;
    if (t.status === 'WIN') setupPerf[t.setup].wins++;
  });

  // ── Performance par session ───────────────────────────────────────────
  const sessionPerf: Record<string, { r: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!sessionPerf[t.session]) sessionPerf[t.session] = { r: 0, count: 0, wins: 0 };
    sessionPerf[t.session].r += t.resultR;
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
  const dayPerf: Record<number, { r: number; count: number }> = {};
  closed.forEach(t => {
    const day = new Date(t.date).getDay();
    if (!dayPerf[day]) dayPerf[day] = { r: 0, count: 0 };
    dayPerf[day].r += t.resultR;
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

  // Paires rentables répétées (min 3 trades, win rate > 55%)
  Object.entries(pairPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) > 0.55 && v.r > 0)
    .sort((a, b) => b[1].r - a[1].r)
    .slice(0, 2)
    .forEach(([pair, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Paire forte',
        emoji: '💰',
        message: `${pair} est ta paire la plus régulièrement rentable — ${v.count} trades, ${wr}% WR, +${v.r.toFixed(1)}R. Priorise-la.`,
        priority: 4,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Setups gagnants répétés (min 3 trades, win rate > 55%)
  Object.entries(setupPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) > 0.55 && v.r > 0)
    .sort((a, b) => b[1].r - a[1].r)
    .slice(0, 2)
    .forEach(([setup, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Setup gagnant',
        emoji: '🎯',
        message: `Le setup ${setup} fonctionne régulièrement — ${v.count} trades, ${wr}% WR, +${v.r.toFixed(1)}R. Continue à l'exploiter.`,
        priority: 4,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Sessions fortes répétées (min 3 trades, profitable)
  Object.entries(sessionPerf)
    .filter(([, v]) => v.count >= 3 && v.r > 0 && (v.wins / v.count) > 0.5)
    .sort((a, b) => b[1].r - a[1].r)
    .slice(0, 1)
    .forEach(([session, v]) => {
      advice.push({
        category: 'Session forte',
        emoji: '⏰',
        message: `La session ${session} est régulièrement profitable — ${v.count} trades, +${v.r.toFixed(1)}R. C'est ta fenêtre dorée.`,
        priority: 3,
        type: 'strength',
        repeatCount: v.count,
      });
    });

  // Win rate solide répété
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

  // Bonne série de gains
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
      message: `Profit Factor de ${pf.toFixed(2)} — tu laisses courrir tes gains et coupes tes pertes régulièrement.`,
      priority: 3,
      type: 'strength',
    });
  }

  // Meilleur jour répété
  const bestDay = Object.entries(dayPerf).filter(([, v]) => v.count >= 3 && v.r > 0).sort((a, b) => b[1].r - a[1].r)[0];
  if (bestDay) {
    advice.push({
      category: 'Jour fort',
      emoji: '📅',
      message: `Le ${dayNames[parseInt(bestDay[0])]} est régulièrement ton meilleur jour — ${bestDay[1].count} trades, +${bestDay[1].r.toFixed(1)}R. Maximise cette journée.`,
      priority: 2,
      type: 'strength',
      repeatCount: bestDay[1].count,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // POINTS FAIBLES RÉPÉTÉS
  // ════════════════════════════════════════════════════════════════════

  // Paires perdantes répétées (min 3 trades, win rate < 40%)
  Object.entries(pairPerf)
    .filter(([, v]) => v.count >= 3 && (v.wins / v.count) < 0.40 && v.r < 0)
    .sort((a, b) => a[1].r - b[1].r)
    .slice(0, 2)
    .forEach(([pair, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Paire perdante',
        emoji: '📉',
        message: `${pair} te fait perdre régulièrement — ${v.count} trades, ${wr}% WR, ${v.r.toFixed(1)}R. Évite cette paire ou revois ton approche.`,
        priority: 8,
        type: 'weakness',
        repeatCount: v.count,
      });
    });

  // Setups perdants répétés (min 3 trades, perdant)
  Object.entries(setupPerf)
    .filter(([, v]) => v.count >= 3 && v.r < 0 && (v.wins / v.count) < 0.40)
    .sort((a, b) => a[1].r - b[1].r)
    .slice(0, 2)
    .forEach(([setup, v]) => {
      const wr = ((v.wins / v.count) * 100).toFixed(0);
      advice.push({
        category: 'Setup perdant',
        emoji: '⚠️',
        message: `Le setup ${setup} échoue régulièrement — ${v.count} trades, ${wr}% WR, ${v.r.toFixed(1)}R. Arrête de le prendre ou revois ton entrée.`,
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

  // Série de pertes répétée
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
  const worstDay = Object.entries(dayPerf).filter(([, v]) => v.count >= 3 && v.r < -1).sort((a, b) => a[1].r - b[1].r)[0];
  if (worstDay) {
    advice.push({
      category: 'Jour faible',
      emoji: '📉',
      message: `Le ${dayNames[parseInt(worstDay[0])]} est régulièrement ton pire jour — ${worstDay[1].count} trades, ${worstDay[1].r.toFixed(1)}R. Évite de trader ce jour.`,
      priority: 6,
      type: 'weakness',
      repeatCount: worstDay[1].count,
    });
  }

  // Win rate faible répété
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

  // RR faible répété
  if (avgRR < 1 && wins.length >= 5) {
    advice.push({
      category: 'RR faible',
      emoji: '⚠️',
      message: `RR moyen de ${avgRR.toFixed(1)} sur ${wins.length} trades gagnants — tu coupes tes gains trop tôt régulièrement. Laisse courir tes positions.`,
      priority: 8,
      type: 'weakness',
      repeatCount: wins.length,
    });
  }

  return advice.sort((a, b) => b.priority - a.priority);
}

export function getDisciplineScore(trades: Trade[]): number {
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) return 50;

  let score = 50;
  const wins = closed.filter(t => t.status === 'WIN');
  const winRate = wins.length / closed.length;

  if (winRate > 0.5) score += 15;
  else if (winRate > 0.4) score += 5;
  else score -= 10;

  const fomo = closed.filter(t => t.emotion === 'FOMO').length;
  const revenge = closed.filter(t => t.emotion === 'Revenge Trading').length;
  score -= fomo * 3;
  score -= revenge * 5;

  const disciplined = closed.filter(t => t.emotion === 'Discipliné' || t.emotion === 'Confiant').length;
  score += Math.min(disciplined * 2, 20);

  const aPlus = closed.filter(t => t.quality === 'A+' || t.quality === 'A').length;
  score += Math.min(Math.floor((aPlus / closed.length) * 20), 15);

  return Math.max(0, Math.min(100, Math.round(score)));
}

