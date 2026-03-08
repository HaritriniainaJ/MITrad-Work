// ─────────────────────────────────────────────────────────────────────────────
// PAGE : Mentor-X (ex Coach Alpha)
// Analyse complète de la performance avec filtres avancés.
// MODIFIÉ v3 : Rapport Hebdomadaire Automatique ajouté
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDisplayMode, DisplayModeToggle } from '@/context/DisplayModeContext';

// ── Helpers mode ─────────────────────────────────────────────────────────
function getPnl(t: any, mode: string, capital: number): number {
  if (mode === 'R') return t.resultR ?? 0;
  const d = t.resultDollar ?? 0;
  if (mode === '%' && capital > 0) return (d / capital) * 100;
  return d;
}
function fmtPnl(v: number, mode: string): string {
  const sign = v >= 0 ? '+' : '';
  if (mode === 'R') return sign + v.toFixed(2) + 'R';
  if (mode === '%') return sign + v.toFixed(2) + '%';
  if (Math.abs(v) >= 1000) return sign + '$' + (v / 1000).toFixed(1) + 'k';
  return sign + '$' + v.toFixed(0);
}
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : obtenir lundi et dimanche de la semaine courante
// ─────────────────────────────────────────────────────────────────────────────
function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Modal Rapport Hebdomadaire
// ─────────────────────────────────────────────────────────────────────────────
interface WeeklyReportModalProps {
  trades: any[];
  score: number;
  onClose: () => void;
  mode: string;
  capital: number;
}

function WeeklyReportModal({ trades, score, onClose, mode, capital }: WeeklyReportModalProps) {
  const { monday, sunday } = getCurrentWeekBounds();

  // Trades de la semaine courante
  const weekTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.date);
      return d >= monday && d <= sunday && t.status !== 'RUNNING';
    });
  }, [trades]);

  // ── Statistiques de base ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (weekTrades.length === 0) return null;
    const wins   = weekTrades.filter(t => t.status === 'WIN').length;
    const losses = weekTrades.filter(t => t.status === 'LOSS').length;
    const be     = weekTrades.filter(t => t.status === 'BE').length;
    const totalPnl = weekTrades.reduce((acc, t) => acc + getPnl(t, mode, capital), 0);
    const winRate = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;
    const avgRR  = weekTrades.filter(t => t.status === 'WIN' && t.rr).reduce((acc, t) => acc + t.rr, 0)
                  / (wins || 1);

    // Meilleur / Pire trade
    const bestTrade  = [...weekTrades].sort((a, b) => getPnl(b, mode, capital) - getPnl(a, mode, capital))[0];
    const worstTrade = [...weekTrades].sort((a, b) => getPnl(a, mode, capital) - getPnl(b, mode, capital))[0];

    // Paire dominante
    const pairPnl: Record<string, number> = {};
    weekTrades.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + getPnl(t, mode, capital); });
    const bestPair  = Object.entries(pairPnl).sort((a, b) => b[1] - a[1])[0];
    const worstPair = Object.entries(pairPnl).sort((a, b) => a[1] - b[1])[0];

    // Setup dominant
    const setupPnl: Record<string, number> = {};
    weekTrades.forEach(t => { if (t.setup) setupPnl[t.setup] = (setupPnl[t.setup] || 0) + getPnl(t, mode, capital); });
    const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0];

    // Trades émotionnels négatifs
    const badEmotions = weekTrades.filter(t => ['FOMO', 'Revenge Trading', 'Stressé'].includes(t.emotion));

    return {
      total: weekTrades.length, wins, losses, be, totalPnl, winRate, avgRR,
      bestTrade, worstTrade, bestPair, worstPair, bestSetup, badEmotions,
    };
  }, [weekTrades]);

  // ── Erreurs de la semaine ─────────────────────────────────────────────────
  const weekErrors = useMemo(() => {
    if (!stats || weekTrades.length < 1) return [];
    const errors: string[] = [];
    if (stats.winRate < 40 && weekTrades.length >= 3)
      errors.push(`Win Rate faible cette semaine : ${Math.round(stats.winRate)}% — revois tes critères d'entrée.`);
    if (stats.badEmotions.length >= 2)
      errors.push(`${stats.badEmotions.length} trades pris dans un état émotionnel négatif (FOMO/Revenge).`);
    if (stats.worstPair && stats.worstPair[1] < -1)
      errors.push(`${stats.worstPair[0]} t'a coûté ${fmtPnl(stats.worstPair[1], mode)} — évite-la la semaine prochaine.`);
    if (stats.totalR < -3)
      errors.push(`Drawdown cette semaine : ${fmtPnl(stats.totalPnl, mode)}. Réduction de taille conseillée.`);
    return errors;
  }, [stats, weekTrades]);

  // ── Points forts de la semaine ────────────────────────────────────────────
  const weekStrengths = useMemo(() => {
    if (!stats || weekTrades.length < 1) return [];
    const s: string[] = [];
    if (stats.winRate >= 60) s.push(`Excellent win rate : ${Math.round(stats.winRate)}% sur ${stats.total} trades.`);
    if (stats.totalPnl > 0) s.push(`Semaine positive : ${fmtPnl(stats.totalPnl, mode)} au total.`);
    if (stats.bestSetup && stats.bestSetup[1] > 1)
      s.push(`Setup ${stats.bestSetup[0]} très efficace (${fmtPnl(stats.bestSetup[1], mode)}).`);
    if (stats.badEmotions.length === 0 && weekTrades.length >= 3)
      s.push(`Aucun trade émotionnel — excellente maîtrise psychologique.`);
    return s;
  }, [stats, weekTrades]);

  // ── Objectifs pour la semaine prochaine ──────────────────────────────────
  const nextWeekGoals = useMemo(() => {
    if (!stats) return [
      'Enregistre tes trades pour que Mentor-X puisse générer des objectifs personnalisés.',
    ];
    const goals: string[] = [];
    if (stats.winRate < 50)
      goals.push(`Améliore ton win rate au-dessus de 50% (actuellement ${Math.round(stats.winRate)}%).`);
    else
      goals.push(`Maintiens ton win rate au-dessus de 50% — tu es à ${Math.round(stats.winRate)}%.`);

    if (stats.badEmotions.length > 0)
      goals.push(`Zéro trade FOMO/Revenge la semaine prochaine — ${stats.badEmotions.length} cette semaine.`);
    else
      goals.push(`Continue à éviter les trades émotionnels — bravo cette semaine !`);

    if (stats.worstPair && stats.worstPair[1] < -0.5)
      if (stats.worstPair && stats.worstPair[1] < 0) goals.push(`Limite tes trades sur ${stats.worstPair[0]} ou améliore ta stratégie dessus.`);

    goals.push(`Objectif : ${stats.totalPnl >= 0 ? `dépasse ${fmtPnl(stats.totalPnl * 1.2 + 1, mode)}` : `revenir en positif`}.`);
    return goals.slice(0, 4);
  }, [stats]);

  // ── Verdict global ────────────────────────────────────────────────────────
  const verdict = useMemo(() => {
    if (!stats || weekTrades.length === 0)
      return { emoji: '📭', label: 'Aucun trade cette semaine', color: 'text-muted-foreground', bg: 'bg-accent/20' };
    if (stats.totalPnl > 0 && stats.winRate >= 60)
      return { emoji: '🏆', label: 'Semaine exceptionnelle', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (stats.totalPnl > 0 && stats.winRate >= 50)
      return { emoji: '✅', label: 'Bonne semaine', color: 'text-success', bg: 'bg-success/10' };
    if (stats.totalPnl >= 0)
      return { emoji: '📊', label: 'Semaine neutre', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (stats.totalPnl >= 0)
      return { emoji: '⚠️', label: 'Semaine difficile', color: 'text-warning', bg: 'bg-warning/10' };
    return { emoji: '🔴', label: 'Semaine critique — analyse requise', color: 'text-destructive', bg: 'bg-destructive/10' };
  }, [stats, weekTrades]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 py-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl space-y-4"
        >
          {/* ── En-tête rapport ─────────────────────────────────────────── */}
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
                  {formatDate(monday)} → {formatDate(sunday)}
                </p>
              </div>
            </div>

            {/* Verdict */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${verdict.bg} ${verdict.color}`}>
              <span>{verdict.emoji}</span>
              <span>{verdict.label}</span>
            </div>
          </div>

          {/* ── Statistiques de la semaine ──────────────────────────────── */}
          {stats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Trades', value: stats.total, icon: Target, color: '#1A6BFF' },
                  { label: 'Win Rate', value: `${Math.round(stats.winRate)}%`, icon: TrendingUp, color: '#00D4AA' },
                  { label: mode === '%' ? 'Total %' : mode === '$' ? 'Total $' : 'Total R', value: fmtPnl(stats.totalPnl, mode), icon: Award, color: stats.totalPnl >= 0 ? '#00D4AA' : '#FF3B5C' },
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
                      <p className="text-xs text-success">{fmtPnl(stats.bestPair[1], mode)}</p>
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

          {/* ── Erreurs de la semaine ───────────────────────────────────── */}
          {weekErrors.length > 0 && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-destructive" />
                <h3 className="text-sm font-bold text-foreground">Points à corriger</h3>
              </div>
              <div className="space-y-2">
                {weekErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 shrink-0">•</span>
                    <p className="text-sm text-muted-foreground">{e}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Points forts ────────────────────────────────────────────── */}
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

          {/* ── Objectifs semaine prochaine ─────────────────────────────── */}
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

          {/* ── Mot de Mentor-X ─────────────────────────────────────────── */}
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
                    ? "Commence à enregistrer tes trades cette semaine. Chaque trade est une donnée, chaque donnée est une leçon. Je serai là pour analyser et t'aider à progresser."
                    : stats.totalPnl > 0 && stats.winRate >= 55
                      ? `Excellent travail cette semaine ! ${stats.total} trades, ${Math.round(stats.winRate)}% de win rate et ${fmtPnl(stats.totalPnl, mode)}. Garde ce niveau de discipline et continue à appliquer ta stratégie avec rigueur.`
                      : stats.totalPnl >= 0
                        ? `Semaine correcte avec ${stats.total} trades. Tu es dans le bon, mais il reste de la marge. Concentre-toi sur la qualité plutôt que la quantité la semaine prochaine.`
                        : `Cette semaine a été difficile, mais c'est normal dans ce métier. Ce qui compte, c'est ta réaction : analyse, corrige, reviens plus fort. Le marché sera là la semaine prochaine.`
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachAlphaPage() {
  const { user, accounts, activeAccounts } = useAuth();
  const trades  = useFilteredTrades();
  const { mode } = useDisplayMode();
  const capital = useMemo(() => {
    const targets = activeAccounts.length > 0 ? activeAccounts : accounts;
    return targets.reduce((sum, acc) => sum + Number(acc.capital || 0), 0) || 10000;
  }, [activeAccounts, accounts]);
  console.log('DEBUG Mentor-X mode:', mode, 'capital:', capital, 'trades sample:', trades.slice(0,2).map((t:any)=>({pair:t.pair,resultDollar:t.resultDollar})));
  const advice  = useMemo(() => generateCoachAdvice(trades, mode, capital), [trades, mode, capital]);
  const score   = useMemo(() => getDisciplineScore(trades), [trades]);

  const [filterCategory, setFilterCategory] = useState('Tout');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';

  const filteredAdvice = useMemo(() => {
    if (filterCategory === 'Points faibles') return advice.filter(a => a.type === 'weakness');
    if (filterCategory === 'Points forts') return [];
    return advice.filter(a => {
      if (filterCategory !== 'Tout' && a.category !== filterCategory) return false;
      return true;
    });
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
      errors.push({ label: `${lowQuality.length} trades de qualité faible — t'entrais trop tôt ou sans setup clair`, count: lowQuality.length, severity: 'medium' });
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate < 0.4 && closed.length >= 5)
      errors.push({ label: `Win Rate de ${Math.round(winRate * 100)}% — revois tes critères de sélection`, count: Math.round((1 - winRate) * closed.length), severity: 'high' });
    return errors.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [trades]);

  const strengths = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'RUNNING');
    if (closed.length < 3) return [];
    const s: string[] = [];
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate > 0.6) s.push(`Win Rate solide : ${Math.round(winRate * 100)}%`);
    const setupPnl: Record<string, number> = {};
    closed.forEach(t => { if (t.setup) { setupPnl[t.setup] = (setupPnl[t.setup] || 0) + getPnl(t, mode, capital); } });
    const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestSetup && bestSetup[1] > 0) s.push(`Meilleur setup : ${bestSetup[0]} (${fmtPnl(bestSetup[1], mode)})`);
    const pairPnl: Record<string, number> = {};
    closed.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + getPnl(t, mode, capital); });
    const bestPair = Object.entries(pairPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestPair && bestPair[1] > 0) s.push(`Paire forte : ${bestPair[0]} (${fmtPnl(bestPair[1], mode)})`);
    if (score >= 70) s.push(`Score discipline excellent : ${score}/100`);
    return s.slice(0, 4);
  }, [trades, score, mode, capital]);

  const sessionHistory = useMemo(() => {
    return trades
      .filter(t => t.status !== 'RUNNING')
      .slice(0, 5)
      .map(t => ({
        date: new Date(t.date).toLocaleDateString('fr', { day: 'numeric', month: 'short' }),
        pair: t.pair,
        pnl: getPnl(t, mode, capital),
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
          mode={mode}
          capital={capital}
        />
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Mentor-X</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ton coach de trading intelligent — analyse {trades.length} trade{trades.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* ── BOUTON RAPPORT HEBDOMADAIRE ── */}
        <DisplayModeToggle />
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
            {weekTradeCount} trade{weekTradeCount > 1 ? 's' : ''} cette semaine — voir le rapport
            <ChevronRight size={11} />
          </button>
        )}
      </GlassCard>

      {/* ── FILTRES ─────────────────────────────────────────────────────────── */}
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

      {/* ── ERREURS FRÉQUENTES ──────────────────────────────────────────────── */}
      {(filterCategory === 'Tout' || filterCategory === 'Points faibles') && frequentErrors.length > 0 && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-destructive" />
            <h3 className="text-sm font-bold text-foreground">Erreurs fréquentes détectées</h3>
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
                      URGENT
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ── POINTS FORTS ────────────────────────────────────────────────────── */}
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

      {/* ── CONSEILS MENTOR-X ───────────────────────────────────────────────── */}
      {(filterCategory === 'Tout' || filterCategory === 'Points faibles') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdvice.map((a, i) => {
            const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
              'Psychologie': { icon: Brain, color: '#7C3AED' },
              'Win Rate':    { icon: Target, color: '#1A6BFF' },
              'Risk':        { icon: TrendingDown, color: '#FF3B5C' },
              'Performance': { icon: AlertTriangle, color: '#F59E0B' },
              'Discipline':  { icon: Clock, color: '#00D4AA' },
            };
            const iconInfo = iconMap[a.category] || { icon: Bot, color: '#1A6BFF' };
            const IconComp = iconInfo.icon;
            return (
              <GlassCard key={i} className="animate-fade-up" glow={a.priority >= 8 ? 'blue' : 'none'}>
                <div className="flex items-start gap-3">
                  <IconComp size={18} style={{ color: iconInfo.color }} className="shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">{a.category}</span>
                      {a.priority >= 8 && (
                        <motion.span
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                          URGENT
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
          {filteredAdvice.length === 0 && trades.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Bot size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enregistre tes premiers trades. Mentor-X t'analysera.</p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIQUE RÉCENT ───────────────────────────────────────────────── */}
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
                  <span className={`metric-value text-sm ${s.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fmtPnl(s.pnl, mode)}
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
