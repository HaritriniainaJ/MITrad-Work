// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAGE : Mentor-X (ex Coach Alpha)
// Analyse complète de la performance avec filtres avancés.
// MODIFIÉ v3 : Rapport Hebdomadaire Automatique ajouté
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { generateCoachAdvice, getDisciplineScore } from '@/lib/coachAlpha';
import GlassCard from '@/components/GlassCard';
import {
  Bot, Filter, TrendingDown, Star, History, CheckCircle,
  Brain, Target, AlertTriangle, Clock, FileText, X,
  TrendingUp, Award, Zap, ChevronRight, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADVICE_CATEGORIES = ['Tout', 'Points forts', 'Points faibles'];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPER : obtenir lundi et dimanche de la semaine courante
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon "¦ 6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr', { day: 'numeric', month: 'long' });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPOSANT : Modal Rapport Hebdomadaire
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface WeeklyReportModalProps {
  trades: any[];
  score: number;
  onClose: () => void;
}

function WeeklyReportModal({ trades, score, onClose }: WeeklyReportModalProps) {
  const { monday, sunday } = getCurrentWeekBounds();

  // Trades de la semaine courante
  const weekTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.date);
      return d >= monday && d <= sunday && t.status !== 'RUNNING';
    });
  }, [trades]);

  // â”€â”€ Statistiques de base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(() => {
    if (weekTrades.length === 0) return null;
    const wins   = weekTrades.filter(t => t.status === 'WIN').length;
    const losses = weekTrades.filter(t => t.status === 'LOSS').length;
    const be     = weekTrades.filter(t => t.status === 'BE').length;
    const totalR = weekTrades.reduce((acc, t) => acc + (t.resultR || 0), 0);
    const winRate = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;
    const avgRR  = weekTrades.filter(t => t.status === 'WIN' && t.rr).reduce((acc, t) => acc + t.rr, 0)
                  / (wins || 1);

    // Meilleur / Pire trade
    const bestTrade  = [...weekTrades].sort((a, b) => b.resultR - a.resultR)[0];
    const worstTrade = [...weekTrades].sort((a, b) => a.resultR - b.resultR)[0];

    // Paire dominante
    const pairPnl: Record<string, number> = {};
    weekTrades.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + t.resultR; });
    const bestPair  = Object.entries(pairPnl).sort((a, b) => b[1] - a[1])[0];
    const worstPair = Object.entries(pairPnl).sort((a, b) => a[1] - b[1])[0];

    // Setup dominant
    const setupPnl: Record<string, number> = {};
    weekTrades.forEach(t => { setupPnl[t.setup] = (setupPnl[t.setup] || 0) + t.resultR; });
    const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0];

    // Trades émotionnels négatifs
    const badEmotions = weekTrades.filter(t => ['FOMO', 'Revenge Trading', 'Stressé'].includes(t.emotion));

    return {
      total: weekTrades.length, wins, losses, be, totalR, winRate, avgRR,
      bestTrade, worstTrade, bestPair, worstPair, bestSetup, badEmotions,
    };
  }, [weekTrades]);

  // â”€â”€ Erreurs de la semaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weekErrors = useMemo(() => {
    if (!stats || weekTrades.length < 1) return [];
    const errors: string[] = [];
    if (stats.winRate < 40 && weekTrades.length >= 3)
      errors.push(`Win Rate faible cette semaine : ${Math.round(stats.winRate)}% "” revois tes critères d'entrée.`);
    if (stats.badEmotions.length >= 2)
      errors.push(`${stats.badEmotions.length} trades pris dans un état émotionnel négatif (FOMO/Revenge).`);
    if (stats.worstPair && stats.worstPair[1] < -1)
      errors.push(`${stats.worstPair[0]} t'a coûté ${stats.worstPair[1].toFixed(1)}R "” évite-la la semaine prochaine.`);
    if (stats.totalR < -3)
      errors.push(`Drawdown important : ${stats.totalR.toFixed(1)}R cette semaine. Réduction de taille conseillée.`);
    return errors;
  }, [stats, weekTrades]);

  // â”€â”€ Points forts de la semaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weekStrengths = useMemo(() => {
    if (!stats || weekTrades.length < 1) return [];
    const s: string[] = [];
    if (stats.winRate >= 60) s.push(`Excellent win rate : ${Math.round(stats.winRate)}% sur ${stats.total} trades.`);
    if (stats.totalR > 0) s.push(`Semaine positive : +${stats.totalR.toFixed(2)}R au total.`);
    if (stats.bestSetup && stats.bestSetup[1] > 1)
      s.push(`Setup ${stats.bestSetup[0]} très efficace (+${stats.bestSetup[1].toFixed(1)}R).`);
    if (stats.badEmotions.length === 0 && weekTrades.length >= 3)
      s.push(`Aucun trade émotionnel "” excellente maîtrise psychologique.`);
    return s;
  }, [stats, weekTrades]);

  // â”€â”€ Objectifs pour la semaine prochaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nextWeekGoals = useMemo(() => {
    if (!stats) return [
      'Enregistre tes trades pour que Mentor-X puisse générer des objectifs personnalisés.',
    ];
    const goals: string[] = [];
    if (stats.winRate < 50)
      goals.push(`Améliore ton win rate au-dessus de 50% (actuellement ${Math.round(stats.winRate)}%).`);
    else
      goals.push(`Maintiens ton win rate au-dessus de 50% "” tu es Ã  ${Math.round(stats.winRate)}%.`);

    if (stats.badEmotions.length > 0)
      goals.push(`Zéro trade FOMO/Revenge la semaine prochaine "” ${stats.badEmotions.length} cette semaine.`);
    else
      goals.push(`Continue Ã  éviter les trades émotionnels "” bravo cette semaine !`);

    if (stats.worstPair && stats.worstPair[1] < -0.5)
      goals.push(`Limite tes trades sur ${stats.worstPair[0]} ou améliore ta stratégie dessus.`);

    goals.push(`Objectif R : ${stats.totalR >= 0 ? `dépasse +${(stats.totalR + 1).toFixed(0)}R` : `revenir en positif (>+1R)`}.`);
    return goals.slice(0, 4);
  }, [stats]);

  // â”€â”€ Verdict global â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const verdict = useMemo(() => {
    if (!stats || weekTrades.length === 0)
      return { emoji: 'ðŸ“­', label: 'Aucun trade cette semaine', color: 'text-muted-foreground', bg: 'bg-accent/20' };
    if (stats.totalR >= 3 && stats.winRate >= 60)
      return { emoji: 'ðŸ†', label: 'Semaine exceptionnelle', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (stats.totalR >= 1 && stats.winRate >= 50)
      return { emoji: 'âœ…', label: 'Bonne semaine', color: 'text-success', bg: 'bg-success/10' };
    if (stats.totalR >= 0)
      return { emoji: 'ðŸ“Š', label: 'Semaine neutre', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (stats.totalR >= -2)
      return { emoji: 'âš ï¸', label: 'Semaine difficile', color: 'text-warning', bg: 'bg-warning/10' };
    return { emoji: 'ðŸ”´', label: 'Semaine critique "” analyse requise', color: 'text-destructive', bg: 'bg-destructive/10' };
  }, [stats, weekTrades]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
        style={{ background: 'rgba(5, 7, 15, 0.92)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl space-y-4"
        >
          {/* â”€â”€ En-tête rapport â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(26,107,255,0.15) 0%, rgba(108,58,255,0.15) 100%)',
              border: '1px solid rgba(26,107,255,0.3)',
            }}>
            {/* Glow décoratif */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #6C3AFF, transparent)' }} />
            <button onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <FileText size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Rapport Hebdomadaire</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(monday)} ←’ {formatDate(sunday)}
                </p>
              </div>
            </div>

            {/* Verdict */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${verdict.bg} ${verdict.color}`}>
              <span>{verdict.emoji}</span>
              <span>{verdict.label}</span>
            </div>
          </div>

          {/* â”€â”€ Statistiques de la semaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {stats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Trades', value: stats.total, icon: Target, color: '#1A6BFF' },
                  { label: 'Win Rate', value: `${Math.round(stats.winRate)}%`, icon: TrendingUp, color: '#00D4AA' },
                  { label: 'Total R', value: `${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`, icon: Award, color: stats.totalR >= 0 ? '#00D4AA' : '#FF3B5C' },
                  { label: 'Score', value: `${score}/100`, icon: Zap, color: score >= 70 ? '#00D4AA' : score >= 40 ? '#F59E0B' : '#FF3B5C' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon size={16} style={{ color }} className="mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* W/L/BE detail */}
              <div className="rounded-xl p-4 flex items-center justify-around"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{stats.wins}</p>
                  <p className="text-xs text-muted-foreground">WIN</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
                  <p className="text-xs text-muted-foreground">LOSS</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats.be}</p>
                  <p className="text-xs text-muted-foreground">BE</p>
                </div>
                {stats.bestPair && (
                  <>
                    <div className="h-8 w-px bg-border/40" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{stats.bestPair[0]}</p>
                      <p className="text-xs text-success">+{stats.bestPair[1].toFixed(1)}R</p>
                      <p className="text-[10px] text-muted-foreground">Meilleure paire</p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl p-8 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Bot size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">Aucun trade clôturé cette semaine.</p>
              <p className="text-xs text-muted-foreground mt-1">Reviens après avoir enregistré des trades !</p>
            </div>
          )}

          {/* â”€â”€ Erreurs de la semaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {weekErrors.length > 0 && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-destructive" />
                <h3 className="text-sm font-bold text-foreground">Points Ã  corriger</h3>
              </div>
              <div className="space-y-2">
                {weekErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 shrink-0">"¢</span>
                    <p className="text-sm text-muted-foreground">{e}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* â”€â”€ Points forts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {weekStrengths.length > 0 && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} className="text-warning" />
                <h3 className="text-sm font-bold text-foreground">Points forts cette semaine</h3>
              </div>
              <div className="space-y-2">
                {weekStrengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={14} style={{ color: '#00D4AA' }} className="mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* â”€â”€ Objectifs semaine prochaine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(26,107,255,0.06)', border: '1px solid rgba(26,107,255,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Objectifs pour la semaine prochaine</h3>
            </div>
            <div className="space-y-2">
              {nextWeekGoals.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{g}</p>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Mot de Mentor-X â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(108,58,255,0.06)', border: '1px solid rgba(108,58,255,0.2)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Message de Mentor-X</p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {!stats || weekTrades.length === 0
                    ? "Commence Ã  enregistrer tes trades cette semaine. Chaque trade est une donnée, chaque donnée est une leçon. Je serai lÃ  pour analyser et t'aider Ã  progresser."
                    : stats.totalR >= 2 && stats.winRate >= 55
                      ? `Excellent travail cette semaine ! ${stats.total} trades, ${Math.round(stats.winRate)}% de win rate et +${stats.totalR.toFixed(1)}R. Garde ce niveau de discipline et continue Ã  appliquer ta stratégie avec rigueur.`
                      : stats.totalR >= 0
                        ? `Semaine correcte avec ${stats.total} trades. Tu es dans le bon, mais il reste de la marge. Concentre-toi sur la qualité plutôt que la quantité la semaine prochaine.`
                        : `Cette semaine a été difficile, mais c'est normal dans ce métier. Ce qui compte, c'est ta réaction : analyse, corrige, reviens plus fort. Le marché sera lÃ  la semaine prochaine.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Fermer le rapport
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAGE PRINCIPALE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CoachAlphaPage() {
  const { user } = useAuth();
  const trades  = useFilteredTrades();
  const advice  = useMemo(() => generateCoachAdvice(trades), [trades]);
  const score   = useMemo(() => getDisciplineScore(trades), [trades]);

  const [filterCategory, setFilterCategory] = useState('Tout');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';

const filteredAdvice = useMemo(() => {
    if (filterCategory === 'Points forts') return advice.filter(a => a.type === 'strength');
    if (filterCategory === 'Points faibles') return advice.filter(a => a.type === 'weakness');
    return advice;
  }, [advice, filterCategory]);

  const frequentErrors = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'RUNNING');
    if (closed.length < 3) return [];
    const errors: { label: string; count: number; severity: 'high' | 'medium' }[] = [];
    const pairPnl: Record<string, number> = {};
    closed.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + t.resultR; });
    const worstPair = Object.entries(pairPnl).sort((a, b) => a[1] - b[1])[0];
    if (worstPair && worstPair[1] < -1)
      errors.push({ label: `Tu perds trop sur ${worstPair[0]} (${worstPair[1].toFixed(1)}R)`, count: 3, severity: 'high' });
    const badEmotions = closed.filter(t => ['FOMO', 'Revenge Trading', 'Stressé'].includes(t.emotion));
    if (badEmotions.length >= 2) {
      const lossRate = badEmotions.filter(t => t.status === 'LOSS').length / badEmotions.length;
      if (lossRate > 0.5)
        errors.push({ label: `${badEmotions.length} trades en état émotionnel négatif (${Math.round(lossRate * 100)}% de LOSS)`, count: badEmotions.length, severity: 'high' });
    }
    const lowQuality = closed.filter(t => {
      const q = typeof t.quality === 'number' ? t.quality : (t.quality === 'C' ? 4 : t.quality === 'B' ? 6 : 8);
      return q <= 5;
    });
    if (lowQuality.length >= 2)
      errors.push({ label: `${lowQuality.length} trades de qualité faible "” t'entrais trop tôt ou sans setup clair`, count: lowQuality.length, severity: 'medium' });
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate < 0.4 && closed.length >= 5)
      errors.push({ label: `Win Rate de ${Math.round(winRate * 100)}% "” revois tes critères de sélection`, count: Math.round((1 - winRate) * closed.length), severity: 'high' });
    return errors.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [trades]);

  const strengths = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'RUNNING');
    if (closed.length < 3) return [];
    const s: string[] = [];
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate > 0.6) s.push(`Win Rate solide : ${Math.round(winRate * 100)}%`);
    const setupPnl: Record<string, number> = {};
    closed.forEach(t => { setupPnl[t.setup] = (setupPnl[t.setup] || 0) + t.resultR; });
    const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestSetup && bestSetup[1] > 2) s.push(`Meilleur setup : ${bestSetup[0]} (+${bestSetup[1].toFixed(1)}R)`);
    const pairPnl: Record<string, number> = {};
    closed.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + t.resultR; });
    const bestPair = Object.entries(pairPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestPair && bestPair[1] > 1) s.push(`Paire forte : ${bestPair[0]} (+${bestPair[1].toFixed(1)}R)`);
    if (score >= 70) s.push(`Score discipline excellent : ${score}/100`);
    return s.slice(0, 4);
  }, [trades, score]);

  const sessionHistory = useMemo(() => {
    return trades
      .filter(t => t.status !== 'RUNNING')
      .slice(0, 5)
      .map(t => ({
        date: new Date(t.date).toLocaleDateString('fr', { day: 'numeric', month: 'short' }),
        pair: t.pair,
        result: t.resultR,
        status: t.status,
      }));
  }, [trades]);

  // Nb de trades cette semaine (pour badge sur le bouton)
  const weekTradeCount = useMemo(() => {
    const { monday, sunday } = getCurrentWeekBounds();
    return trades.filter(t => {
      const d = new Date(t.date);
      return d >= monday && d <= sunday && t.status !== 'RUNNING';
    }).length;
  }, [trades]);

  return (
    <div className="space-y-6">

      {/* Modal rapport */}
      {showWeeklyReport && (
        <WeeklyReportModal
          trades={trades}
          score={score}
          onClose={() => setShowWeeklyReport(false)}
        />
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Mentor-X</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ton coach de trading intelligent "” analyse {trades.length} trade{trades.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* â”€â”€ BOUTON RAPPORT HEBDOMADAIRE â”€â”€ */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowWeeklyReport(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(26,107,255,0.2), rgba(108,58,255,0.2))',
            border: '1px solid rgba(26,107,255,0.4)',
            color: '#a5b4fc',
          }}
        >
          <FileText size={15} />
          <span className="hidden sm:inline">Rapport</span>
          <span className="hidden sm:inline">Semaine</span>
          {weekTradeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #1A6BFF, #6C3AFF)' }}>
              {weekTradeCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Score de discipline */}
      <GlassCard glow="blue" className="animate-fade-up text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto glow-pulse mb-4">
          <Bot size={40} className="text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Mentor-X</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Analyse de {trades.length} trade{trades.length > 1 ? 's' : ''} pour des conseils personnalisés
        </p>
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">Score de discipline</p>
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${score * 2.64} ${264 - score * 2.64}`}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1A6BFF" />
                  <stop offset="100%" stopColor="#6C3AFF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`metric-value text-3xl ${scoreColor}`}>{score}</span>
            </div>
          </div>
        </div>

        {/* Mini résumé semaine dans la card score */}
        {weekTradeCount > 0 && (
          <button
            onClick={() => setShowWeeklyReport(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Calendar size={11} />
            {weekTradeCount} trade{weekTradeCount > 1 ? 's' : ''} cette semaine "” voir le rapport
            <ChevronRight size={11} />
          </button>
        )}
      </GlassCard>

      {/* â”€â”€ FILTRES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <GlassCard className="animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Filtrer les conseils</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {ADVICE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                filterCategory === cat
                  ? 'gradient-primary text-white shadow-sm'
                  : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* â”€â”€ ERREURS FRÉQUENTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {(filterCategory === 'Tout' || filterCategory === 'Points faibles') && frequentErrors.length > 0 && (
          <GlassCard className="animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Points faibles récurrents</h3>
            </div>
            <div className="space-y-2">
              {[...frequentErrors].sort((a, b) => b.count - a.count).map((err, i) => {
                const borderColor = err.count >= 20 ? 'border-l-red-500' : err.count >= 8 ? 'border-l-orange-500' : 'border-l-yellow-500';
                const bgColor = err.count >= 20 ? 'bg-red-500/5' : err.count >= 8 ? 'bg-orange-500/5' : 'bg-yellow-500/5';
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${borderColor} ${bgColor} ${
                    err.severity === 'high' ? 'border-r border-t border-b border-destructive/20' : 'border-r border-t border-b border-warning/20'
                  }`}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 shrink-0 ${
                      err.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                    }`}>
                      {err.count}x
                    </span>
                    <p className="text-sm text-foreground flex-1">{err.label}</p>
                    {err.severity === 'high' && (
                      <motion.span
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                      >
                        RÉCURRENT
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

      {/* â”€â”€ POINTS FORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(filterCategory === 'Tout' || filterCategory === 'Points forts') && strengths.length > 0 && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-warning" />
            <h3 className="text-sm font-bold text-foreground">Points forts détectés</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                style={{ border: '1px solid rgba(0,212,170,0.2)', boxShadow: '0 0 20px rgba(0,212,170,0.06)' }}>
                <CheckCircle size={16} style={{ color: '#00D4AA' }} className="shrink-0" />
                <p className="text-sm text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* â”€â”€ CONSEILS MENTOR-X â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdvice.map((a, i) => {
              const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                'Psychologie':    { icon: Brain,       color: '#7C3AED' },
                'Win Rate':       { icon: Target,      color: '#1A6BFF' },
                'Risk':           { icon: TrendingDown, color: '#FF3B5C' },
                'Performance':    { icon: AlertTriangle, color: '#F59E0B' },
                'Discipline':     { icon: Clock,        color: '#00D4AA' },
                'Paire forte':    { icon: Target,       color: '#00D4AA' },
                'Paire perdante': { icon: TrendingDown, color: '#FF3B5C' },
                'Setup gagnant':  { icon: Target,       color: '#00D4AA' },
                'Setup perdant':  { icon: AlertTriangle, color: '#FF3B5C' },
                'Émotion récurrente': { icon: Brain,    color: '#7C3AED' },
              };
              const iconInfo = iconMap[a.category] || { icon: Bot, color: '#1A6BFF' };
              const IconComp = iconInfo.icon;
              const borderColor = a.type === 'strength' ? 'rgba(0,212,170,0.2)' : a.type === 'weakness' ? 'rgba(255,59,92,0.2)' : 'rgba(26,107,255,0.2)';
              return (
                <GlassCard key={i} className="animate-fade-up" style={{ borderColor }}>
                  <div className="flex items-start gap-3">
                    <IconComp size={18} style={{ color: iconInfo.color }} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{a.category}</span>
                        {a.repeatCount && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: a.type === 'strength' ? 'rgba(0,212,170,0.15)' : 'rgba(255,59,92,0.15)', color: a.type === 'strength' ? '#00D4AA' : '#FF3B5C' }}>
                            {a.repeatCount}x répété
                          </span>
                        )}
                        {a.priority >= 8 && (
                          <motion.span
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                          >
                            RÉCURRENT
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

{filteredAdvice.length === 0 && trades.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    <Bot size={40} className="mx-auto mb-3 opacity-30" />
    <p className="text-sm">Enregistre tes premiers trades. Mentor-X t'analysera.</p>
  </div>
)}

      {/* â”€â”€ HISTORIQUE RÉCENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {sessionHistory.length > 0 && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <History size={14} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Dernières sessions</h3>
          </div>
          <div className="space-y-2">
            {sessionHistory.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{s.date}</span>
                  <span className="text-sm font-medium text-foreground">{s.pair}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`metric-value text-sm ${s.result != null && s.result >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {s.result != null ? (s.result >= 0 ? '+' : '') + s.result.toFixed(2) + 'R' : 'À définir'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    s.status === 'WIN' ? 'badge-win' : s.status === 'LOSS' ? 'badge-loss' : 'badge-be'
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


