// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : CoachAlphaFloat (renommé Mentor-X en v2)
// Bouton flottant + panel de conseils rapides
// MODIFIÉ v2 : "Coach Alpha" → "Mentor-X" dans tous les textes
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { generateCoachAdvice, getDisciplineScore } from '@/lib/coachAlpha';
import { Bot, X, ArrowRight } from 'lucide-react';

export default function CoachAlphaFloat() {
  const { user, activeAccount } = useAuth();
  const [open, setOpen] = useState(false);

  // Génère les conseils depuis les trades de l'utilisateur
  const trades  = useMemo(() => StorageManager.getUserTrades(user!.email, activeAccount?.id), [user, activeAccount]);
  const advice  = useMemo(() => generateCoachAdvice(trades), [trades]);
  const score   = useMemo(() => getDisciplineScore(trades), [trades]);

  // Couleur du score selon le niveau de discipline
  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg glow-pulse hover:scale-110 transition-transform"
        title="Mentor-X"
      >
        {open ? <X size={22} className="text-foreground" /> : <Bot size={24} className="text-foreground" />}
      </button>

      {/* Panel de conseils */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent" onClick={() => setOpen(false)} />
          <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] max-h-[70vh] glass rounded-2xl shadow-2xl flex flex-col animate-fade-up overflow-hidden">

            {/* En-tête du panel */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <Bot size={20} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm">Mentor-X</h3>
                <p className="text-xs text-muted-foreground">
                  Score discipline : <span className={`font-bold ${scoreColor}`}>{score}/100</span>
                </p>
              </div>
            </div>

            {/* Liste des conseils */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {advice.slice(0, 6).map((a, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${a.priority >= 8 ? 'bg-destructive/10 border border-destructive/20' : 'bg-accent/40'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">{a.category}</span>
                    {a.priority >= 8 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-bold">URGENT</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.message}</p>
                </div>
              ))}
              {advice.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Enregistre tes premiers trades pour recevoir l'analyse de Mentor-X.
                </p>
              )}
            </div>

            {/* Lien vers la page complète */}
            <div className="p-3 border-t border-border">
              <Link
                to="/coach"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 text-primary text-sm font-medium hover:underline py-1"
              >
                Analyse complète Mentor-X <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
