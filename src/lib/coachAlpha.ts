import { Trade } from '@/types/trading';
import { getMaxLossStreak, getMaxWinStreak } from './badgeEngine';

export interface CoachAdvice {
  category: string;
  emoji: string;
  message: string;
  priority: number;
}

export function generateCoachAdvice(trades: Trade[]): CoachAdvice[] {
  const advice: CoachAdvice[] = [];
  const closed = trades.filter(t => t.status !== 'RUNNING');
  if (closed.length === 0) {
    advice.push({ category: 'Démarrage', emoji: '🚀', message: 'Bienvenue ! Commence à enregistrer tes trades pour recevoir des conseils personnalisés de Coach Alpha.', priority: 1 });
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
  const avgDuration = closed.reduce((s, t) => s + t.duration, 0) / closed.length;

  // Performance par jour de la semaine
  const dayPerf: Record<number, { r: number; count: number }> = {};
  closed.forEach(t => {
    const day = new Date(t.date).getDay();
    if (!dayPerf[day]) dayPerf[day] = { r: 0, count: 0 };
    dayPerf[day].r += t.resultR;
    dayPerf[day].count++;
  });
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const bestDay = Object.entries(dayPerf).sort((a, b) => b[1].r - a[1].r)[0];
  const worstDay = Object.entries(dayPerf).sort((a, b) => a[1].r - b[1].r)[0];

  // Performance par session
  const sessionPerf: Record<string, { r: number; count: number }> = {};
  closed.forEach(t => {
    if (!sessionPerf[t.session]) sessionPerf[t.session] = { r: 0, count: 0 };
    sessionPerf[t.session].r += t.resultR;
    sessionPerf[t.session].count++;
  });
  const bestSession = Object.entries(sessionPerf).sort((a, b) => b[1].r - a[1].r)[0];

  // Performance par paire
  const pairPerf: Record<string, { r: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!pairPerf[t.pair]) pairPerf[t.pair] = { r: 0, count: 0, wins: 0 };
    pairPerf[t.pair].r += t.resultR;
    pairPerf[t.pair].count++;
    if (t.status === 'WIN') pairPerf[t.pair].wins++;
  });
  const bestPair = Object.entries(pairPerf).sort((a, b) => b[1].r - a[1].r)[0];

  // Détection FOMO / revenge
  const fomoTrades = closed.filter(t => t.emotion === 'FOMO');
  const revengeTrades = closed.filter(t => t.emotion === 'Revenge Trading');

  // Nombre de trades par jour
  const dailyCounts: Record<string, number> = {};
  closed.forEach(t => {
    const d = t.date.slice(0, 10);
    dailyCounts[d] = (dailyCounts[d] || 0) + 1;
  });
  const overtrading = Object.values(dailyCounts).some(c => c > 5);

  // Meilleur setup
  const setupPerf: Record<string, { r: number; count: number; wins: number }> = {};
  closed.forEach(t => {
    if (!setupPerf[t.setup]) setupPerf[t.setup] = { r: 0, count: 0, wins: 0 };
    setupPerf[t.setup].r += t.resultR;
    setupPerf[t.setup].count++;
    if (t.status === 'WIN') setupPerf[t.setup].wins++;
  });
  const bestSetup = Object.entries(setupPerf).sort((a, b) => b[1].r - a[1].r)[0];

  // 1. Analyse win rate
  if (winRate < 30) {
    advice.push({ category: 'Win Rate', emoji: '🚨', message: `Ton win rate est à ${winRate.toFixed(0)}%. C'est critique — mets le trading en pause, revois tes setups et tes entrées. Qualité avant quantité.`, priority: 10 });
  } else if (winRate < 40) {
    advice.push({ category: 'Win Rate', emoji: '📈', message: `Ton win rate est à ${winRate.toFixed(0)}%. Il est temps de revoir ta sélection de setups. Moins de trades, mieux sélectionnés. Focus sur les A+ uniquement.`, priority: 8 });
  } else if (winRate < 55) {
    advice.push({ category: 'Win Rate', emoji: '📊', message: `Win rate à ${winRate.toFixed(0)}% — base solide. Concentre-toi sur l'amélioration de ton risk/reward pour maximiser la rentabilité.`, priority: 4 });
  } else {
    advice.push({ category: 'Win Rate', emoji: '🎯', message: `Excellent win rate de ${winRate.toFixed(0)}% ! Tu sélectionnes des trades de qualité. Continue à filtrer avec discipline.`, priority: 2 });
  }

  // 2. Analyse RR
  if (avgRR < 1) {
    advice.push({ category: 'Risk/Reward', emoji: '⚠️', message: `Ton RR moyen est trop bas à ${avgRR.toFixed(1)}. Tu as besoin d'un minimum de 1:2 pour rester profitable même avec 40% de win rate.`, priority: 9 });
  } else if (avgRR < 1.5) {
    advice.push({ category: 'Risk/Reward', emoji: '🎯', message: `RR moyen à ${avgRR.toFixed(1)} — améliore tes take profits. Vise minimum 1:2 sur chaque trade.`, priority: 6 });
  } else if (avgRR >= 2) {
    advice.push({ category: 'Risk/Reward', emoji: '💎', message: `RR moyen exceptionnel de ${avgRR.toFixed(1)} ! Ta gestion de trade est excellente. Continue comme ça.`, priority: 1 });
  }

  // 3. Série de pertes
  if (maxLossStreak >= 5) {
    advice.push({ category: 'Série de pertes', emoji: '🛑', message: `${maxLossStreak} pertes consécutives détectées. Pause obligatoire. Éloigne-toi, analyse, et reviens frais.`, priority: 10 });
  } else if (maxLossStreak >= 3) {
    advice.push({ category: 'Série de pertes', emoji: '⏸️', message: `${maxLossStreak} pertes consécutives détectées. Pause recommandée. Les meilleurs traders savent quand s'arrêter.`, priority: 8 });
  }

  // 4. Profit Factor
  if (pf < 1) {
    advice.push({ category: 'Profit Factor', emoji: '📉', message: `Profit Factor à ${pf.toFixed(2)} — tu perds de l'argent globalement. Analyse urgente nécessaire : réduis la taille de position et sois plus sélectif.`, priority: 9 });
  } else if (pf < 1.5) {
    advice.push({ category: 'Profit Factor', emoji: '⚡', message: `PF à ${pf.toFixed(2)} — edge fragile. De petites améliorations en win rate ou RR feront une grande différence.`, priority: 6 });
  } else if (pf > 2) {
    advice.push({ category: 'Profit Factor', emoji: '🔥', message: `Profit Factor de ${pf.toFixed(2)} ! Tu es parmi les meilleurs traders. Continue à respecter tes règles.`, priority: 1 });
  }

  // 5. Meilleur jour
  if (bestDay) {
    advice.push({ category: 'Meilleur jour', emoji: '📅', message: `Ta meilleure performance est le ${dayNames[parseInt(bestDay[0])]} (+${bestDay[1].r.toFixed(1)}R). Concentre plus d'énergie sur cette fenêtre.`, priority: 3 });
  }

  // 6. Pertes le vendredi
  if (dayPerf[5] && dayPerf[5].r < 0) {
    advice.push({ category: 'Alerte Vendredi', emoji: '🚫', message: `Évite de trader le vendredi — tes stats montrent ${dayPerf[5].r.toFixed(1)}R ce jour-là. Ce n'est pas ton jour.`, priority: 7 });
  }

  // 7. FOMO
  if (fomoTrades.length > 0) {
    const fomoR = fomoTrades.reduce((s, t) => s + t.resultR, 0);
    advice.push({ category: 'Alerte FOMO', emoji: '😤', message: `${fomoTrades.length} trades FOMO détectés (${fomoR.toFixed(1)}R). Attention — reste dans ta session et ton setup préférés.`, priority: 8 });
  }

  // 8. Revenge trading
  if (revengeTrades.length > 0) {
    const revR = revengeTrades.reduce((s, t) => s + t.resultR, 0);
    advice.push({ category: 'Psychologie', emoji: '🧠', message: `${revengeTrades.length} trades de revenge détectés (${revR.toFixed(1)}R). C'est ton ennemi n°1. Éloigne-toi après une perte.`, priority: 9 });
  }

  // 9. Meilleure session
  if (bestSession) {
    advice.push({ category: 'Meilleure session', emoji: '⏰', message: `Ta meilleure session est ${bestSession[0]} (+${bestSession[1].r.toFixed(1)}R). Priorise cette fenêtre horaire.`, priority: 3 });
  }

  // 10. Meilleure paire
  if (bestPair) {
    advice.push({ category: 'Meilleure paire', emoji: '💰', message: `${bestPair[0]} est ta paire la plus profitable (+${bestPair[1].r.toFixed(1)}R). Considère de te concentrer dessus.`, priority: 3 });
  }

  // 11. Durée
  if (avgDuration < 5) {
    advice.push({ category: 'Durée', emoji: '⚡', message: `Durée moyenne de trade inférieure à 5 minutes — scalping agressif détecté. Assure-toi que tu ne fais pas du gambling.`, priority: 7 });
  }

  // 12. Overtrading
  if (overtrading) {
    advice.push({ category: 'Overtrading', emoji: '🔴', message: `Plus de 5 trades en une seule journée détecté. L'overtrading tue les comptes. Fixe-toi une limite quotidienne.`, priority: 8 });
  }

  // 13. Meilleur setup
  if (bestSetup) {
    const wr = bestSetup[1].wins / bestSetup[1].count;
    advice.push({ category: 'Meilleur setup', emoji: '🎯', message: `Ton meilleur setup est ${bestSetup[0]} (${(wr * 100).toFixed(0)}% WR, +${bestSetup[1].r.toFixed(1)}R). Mise tout dessus.`, priority: 3 });
  }

  // 14. Série de gains
  if (maxWinStreak >= 5) {
    advice.push({ category: 'Série de gains', emoji: '🔥', message: `${maxWinStreak} gains consécutifs — tu es en feu ! Reste humble et n'augmente pas le risque.`, priority: 2 });
  }

  // 15. P&L total
  if (totalR > 0) {
    advice.push({ category: 'Global', emoji: '✅', message: `P&L total : +${totalR.toFixed(1)}R. Tu es profitable. Protège cet edge avec de la régularité.`, priority: 2 });
  } else {
    advice.push({ category: 'Global', emoji: '📊', message: `P&L total : ${totalR.toFixed(1)}R. Tu es en drawdown. Réduis la taille, concentre-toi sur le processus plutôt que les profits.`, priority: 7 });
  }

  // 16. Pire jour
  if (worstDay && parseFloat(worstDay[0]) !== parseFloat(bestDay?.[0] || '')) {
    if (worstDay[1].r < -2) {
      advice.push({ category: 'Pire jour', emoji: '📉', message: `${dayNames[parseInt(worstDay[0])]} est ton pire jour (${worstDay[1].r.toFixed(1)}R). Considère de l'éviter.`, priority: 5 });
    }
  }

  // 17. Nombre de trades
  if (closed.length < 20) {
    advice.push({ category: 'Échantillon', emoji: '📋', message: `Seulement ${closed.length} trades enregistrés. Continue à logger — 50+ trades donnent des statistiques plus fiables.`, priority: 3 });
  }

  // 18. Analyse qualité
  const aPlus = closed.filter(t => t.quality === 'A+');
  const lowQuality = closed.filter(t => t.quality === 'C');
  if (lowQuality.length > closed.length * 0.3) {
    advice.push({ category: 'Qualité', emoji: '⚠️', message: `${((lowQuality.length / closed.length) * 100).toFixed(0)}% de tes trades sont de qualité C. Ne prends que des setups A+ et A.`, priority: 7 });
  }
  if (aPlus.length > 0) {
    const apWR = aPlus.filter(t => t.status === 'WIN').length / aPlus.length;
    advice.push({ category: 'Setups A+', emoji: '💎', message: `Tes setups A+ ont ${(apWR * 100).toFixed(0)}% de win rate. C'est ton pain quotidien.`, priority: 2 });
  }

  // 19. Régularité
  const tradeWeeks = new Set(closed.map(t => {
    const d = new Date(t.date);
    return `${d.getFullYear()}-W${Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) / 7)}`;
  }));
  if (tradeWeeks.size >= 8) {
    advice.push({ category: 'Régularité', emoji: '📅', message: `Trading régulier depuis ${tradeWeeks.size} semaines. La régularité est la clé du succès long terme.`, priority: 1 });
  }

  // 20. Inactivité
  const lastTrade = new Date(closed[0]?.date || Date.now());
  const daysSince = Math.floor((Date.now() - lastTrade.getTime()) / 86400000);
  if (daysSince >= 7) {
    advice.push({ category: 'Inactivité', emoji: '💪', message: `Pas de trades depuis ${daysSince} jours. C'est le moment de revenir sur les charts ! Revois ta watchlist.`, priority: 5 });
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
