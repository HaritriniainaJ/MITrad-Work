// ─────────────────────────────────────────────────────────────────────────────
// PAGE : Mentor-X (ex Coach Alpha)
// Analyse complète de la performance avec filtres avancés.
// MODIFIÉ v2 : Renommé Mentor-X + filtres par type/session/paire + erreurs fréquentes
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { generateCoachAdvice, getDisciplineScore } from '@/lib/coachAlpha';
import GlassCard from '@/components/GlassCard';
import { Bot, Filter, TrendingDown, Star, History, CheckCircle, Brain, Target, AlertTriangle, Sun, Clock } from 'lucide-react';
import { ALL_PAIRS, ALL_SESSIONS } from '@/types/trading';
import { motion } from 'framer-motion';

const ADVICE_CATEGORIES = ['Tout', 'Erreurs critiques', 'Points forts', 'Psychologie', 'Risk', 'Performance'];

export default function CoachAlphaPage() {
  const { user } = useAuth();
  const trades  = useFilteredTrades();
  const advice  = useMemo(() => generateCoachAdvice(trades), [trades]);
  const score   = useMemo(() => getDisciplineScore(trades), [trades]);

  // ── Filtres avancés ─────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState('Tout');
  const [filterPair, setFilterPair]         = useState('');
  const [filterSession, setFilterSession]   = useState('');

  // Couleur du score selon le niveau
  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';

  const filteredAdvice = useMemo(() => {
    if (filterCategory === 'Erreurs critiques') return [];
    if (filterCategory === 'Points forts') return [];
    return advice.filter(a => {
      if (filterCategory !== 'Tout' && a.category !== filterCategory) return false;
      return true;
    });
  }, [advice, filterCategory]);

  // ── Analyse des erreurs fréquentes depuis les trades ────────
  const frequentErrors = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'RUNNING');
    if (closed.length < 3) return [];

    const errors: { label: string; count: number; severity: 'high' | 'medium' }[] = [];

    // Paire la plus perdante
    const pairPnl: Record<string, number> = {};
    closed.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + t.resultR; });
    const worstPair = Object.entries(pairPnl).sort((a, b) => a[1] - b[1])[0];
    if (worstPair && worstPair[1] < -1) {
      errors.push({ label: `Tu perds trop sur ${worstPair[0]} (${worstPair[1].toFixed(1)}R)`, count: 3, severity: 'high' });
    }

    // Trading émotionnel (FOMO / Revenge)
    const badEmotions = closed.filter(t => ['FOMO', 'Revenge Trading', 'Stressé'].includes(t.emotion));
    if (badEmotions.length >= 2) {
      const lossRate = badEmotions.filter(t => t.status === 'LOSS').length / badEmotions.length;
      if (lossRate > 0.5) {
        errors.push({ label: `${badEmotions.length} trades en état émotionnel négatif (${Math.round(lossRate * 100)}% de LOSS)`, count: badEmotions.length, severity: 'high' });
      }
    }

    // Trades de mauvaise qualité
    const lowQuality = closed.filter(t => {
      const q = typeof t.quality === 'number' ? t.quality : (t.quality === 'C' ? 4 : t.quality === 'B' ? 6 : 8);
      return q <= 5;
    });
    if (lowQuality.length >= 2) {
      errors.push({ label: `${lowQuality.length} trades de qualité faible — t'entrais trop tôt ou sans setup clair`, count: lowQuality.length, severity: 'medium' });
    }

    // Win rate faible
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate < 0.4 && closed.length >= 5) {
      errors.push({ label: `Win Rate de ${Math.round(winRate * 100)}% — revois tes critères de sélection`, count: Math.round((1 - winRate) * closed.length), severity: 'high' });
    }

    return errors.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [trades]);

  // ── Points forts détectés ───────────────────────────────────
  const strengths = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'RUNNING');
    if (closed.length < 3) return [];

    const strengths: string[] = [];
    const winRate = closed.filter(t => t.status === 'WIN').length / closed.length;
    if (winRate > 0.6) strengths.push(`Win Rate solide : ${Math.round(winRate * 100)}%`);

    // Setup le plus rentable
    const setupPnl: Record<string, number> = {};
    closed.forEach(t => { setupPnl[t.setup] = (setupPnl[t.setup] || 0) + t.resultR; });
    const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestSetup && bestSetup[1] > 2) strengths.push(`Meilleur setup : ${bestSetup[0]} (+${bestSetup[1].toFixed(1)}R)`);

    // Paire la plus rentable
    const pairPnl: Record<string, number> = {};
    closed.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair] || 0) + t.resultR; });
    const bestPair = Object.entries(pairPnl).sort((a, b) => b[1] - a[1])[0];
    if (bestPair && bestPair[1] > 1) strengths.push(`Paire forte : ${bestPair[0]} (+${bestPair[1].toFixed(1)}R)`);

    // Score discipline élevé
    if (score >= 70) strengths.push(`Score discipline excellent : ${score}/100`);

    return strengths.slice(0, 4);
  }, [trades, score]);

  // ── Historique des sessions consultées ─────────────────────
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

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Mentor-X</h1>
        <p className="text-muted-foreground text-sm mt-1">Ton coach de trading intelligent — analyse {trades.length} trade{trades.length > 1 ? 's' : ''}</p>
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
      </GlassCard>

      {/* ── FILTRES ─────────────────────────────────────────── */}
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

      {/* ── ERREURS FRÉQUENTES ──────────────────────────────── */}
      {(filterCategory === 'Tout' || filterCategory === 'Erreurs critiques') && frequentErrors.length > 0 && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-destructive" />
            <h3 className="text-sm font-bold text-foreground">Erreurs fréquentes détectées</h3>
          </div>
          <div className="space-y-2">
            {[...frequentErrors].sort((a,b) => b.count - a.count).map((err, i) => {
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
                      animate={{ scale:[1,1.06,1] }}
                      transition={{ repeat:Infinity, duration:1.5, ease:'easeInOut' }}
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0"
                      style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.25)' }}
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

      {/* ── POINTS FORTS ────────────────────────────────────── */}
      {(filterCategory === 'Tout' || filterCategory === 'Points forts') && strengths.length > 0 && (
        <GlassCard className="animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-warning" />
            <h3 className="text-sm font-bold text-foreground">Points forts détectés</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                style={{ border:'1px solid rgba(0,212,170,0.2)', boxShadow:'0 0 20px rgba(0,212,170,0.06)' }}>
                <CheckCircle size={16} style={{ color:'#00D4AA' }} className="shrink-0" />
                <p className="text-sm text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── CONSEILS MENTOR-X ──────────────────────────────── */}
      {(filterCategory === 'Tout' || !['Erreurs critiques','Points forts'].includes(filterCategory)) && (
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
                          animate={{ scale:[1,1.06,1] }}
                          transition={{ repeat:Infinity, duration:1.5, ease:'easeInOut' }}
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                          style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.25)' }}
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

      {/* ── HISTORIQUE RÉCENT ──────────────────────────────── */}
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
                  <span className={`metric-value text-sm ${s.result >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {s.result >= 0 ? '+' : ''}{s.result.toFixed(2)}R
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
