// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAGE : Mon Plan de Trading
// MODIFIé v2 : localStorage ←’ API + Checklist quotidienne + Score de respect
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import GlassCard from '@/components/GlassCard';
import {
  Plus, Trash2, ImagePlus, X, GripVertical, Pencil, Save,
  ZoomIn, BookOpen, ShieldCheck, CheckSquare, Square,
  TrendingUp, Award, Calendar, Loader2, AlertTriangle,
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPlanRules, createPlanRule, updatePlanRule, deletePlanRule,
  getDailyChecklist, saveDailyChecklist,
} from '@/lib/api';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface TradingRule {
  id: string;
  title: string;
  description: string;
  images: string[];
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPER : date du jour YYYY-MM-DD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const today = () => new Date().toISOString().split('T')[0];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPOSANT : Score de respect du plan
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PlanRespectScore({ trades }: { trades: any[] }) {
  const closed = trades.filter(t => t.status !== 'RUNNING');

  const score = useMemo(() => {
    if (closed.length === 0) return null;
    const respected = closed.filter(t => t.planRespected === true).length;
    return Math.round((respected / closed.length) * 100);
  }, [closed]);

  // Stats détaillées
  const stats = useMemo(() => {
    if (closed.length === 0) return null;
    const respected   = closed.filter(t => t.planRespected === true);
    const notRespected = closed.filter(t => t.planRespected === false);
    const unknown     = closed.filter(t => t.planRespected == null);

    // Win rate quand plan respecté vs pas respecté
    const wrRespected = respected.length
      ? Math.round((respected.filter(t => t.status === 'WIN').length / respected.length) * 100) : null;
    const wrNotRespected = notRespected.length
      ? Math.round((notRespected.filter(t => t.status === 'WIN').length / notRespected.length) * 100) : null;

    // PnL total respecté vs pas
    const pnlRespected   = respected.reduce((a, t) => a + (t.resultR || 0), 0);
    const pnlNotRespected = notRespected.reduce((a, t) => a + (t.resultR || 0), 0);

    return { respected: respected.length, notRespected: notRespected.length, unknown: unknown.length,
             wrRespected, wrNotRespected, pnlRespected, pnlNotRespected };
  }, [closed]);

  if (!stats) return null;

  const scoreColor = (score ?? 0) >= 70 ? '#00D4AA' : (score ?? 0) >= 40 ? '#F59E0B' : '#FF3B5C';
  const scoreLabel = (score ?? 0) >= 80 ? 'Excellent' : (score ?? 0) >= 60 ? 'Bien' : (score ?? 0) >= 40 ? 'À améliorer' : 'Critique';

  return (
    <GlassCard className="animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <Award size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">Score de respect du plan</h3>
        <span className="ml-auto text-xs text-muted-foreground">{closed.length} trades analysés</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge circulaire */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(score ?? 0) * 2.64} ${264 - (score ?? 0) * 2.64}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}%</span>
            </div>
          </div>
          <p className="text-center text-xs font-bold mt-2" style={{ color: scoreColor }}>{scoreLabel}</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <p className="text-lg font-bold text-success">{stats.respected}</p>
            <p className="text-[10px] text-muted-foreground">Plan respecté</p>
            {stats.wrRespected !== null && (
              <p className="text-[10px] text-success mt-0.5">{stats.wrRespected}% WR</p>
            )}
          </div>
          <div className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.15)' }}>
            <p className="text-lg font-bold text-destructive">{stats.notRespected}</p>
            <p className="text-[10px] text-muted-foreground">Non respecté</p>
            {stats.wrNotRespected !== null && (
              <p className="text-[10px] text-destructive mt-0.5">{stats.wrNotRespected}% WR</p>
            )}
          </div>
          {stats.pnlRespected !== 0 && (
            <div className="col-span-2 rounded-xl p-2 flex items-center justify-between px-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] text-muted-foreground">PnL plan respecté</span>
              <span className={`text-xs font-bold ${stats.pnlRespected >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.pnlRespected >= 0 ? '+' : ''}{stats.pnlRespected.toFixed(1)}R
              </span>
              <span className="text-[10px] text-muted-foreground">vs non respecté</span>
              <span className={`text-xs font-bold ${stats.pnlNotRespected >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.pnlNotRespected >= 0 ? '+' : ''}{stats.pnlNotRespected.toFixed(1)}R
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message Mentor-X */}
      {(score ?? 0) < 60 && stats.notRespected > 0 && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={13} className="text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {stats.notRespected} trade{stats.notRespected > 1 ? 's' : ''} pris hors plan. 
            Rappel : un trade hors plan, même gagnant, est une mauvaise habitude.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPOSANT : Checklist quotidienne
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DailyChecklist({ rules }: { rules: TradingRule[] }) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const dateStr = today();

  useEffect(() => {
    if (rules.length === 0) { setLoading(false); return; }
    getDailyChecklist(dateStr)
      .then(data => setCheckedIds(data?.checkedIds ?? []))
      .catch(() => setCheckedIds([]))
      .finally(() => setLoading(false));
  }, [dateStr, rules.length]);

  const toggle = async (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter(c => c !== id)
      : [...checkedIds, id];
    setCheckedIds(next);
    setSaving(true);
    try {
      await saveDailyChecklist(dateStr, next);
    } catch {
      toast.error('Erreur sauvegarde checklist');
      setCheckedIds(checkedIds); // rollback
    } finally {
      setSaving(false);
    }
  };

  const progress = rules.length > 0 ? Math.round((checkedIds.length / rules.length) * 100) : 0;
  const allChecked = rules.length > 0 && checkedIds.length === rules.length;

  if (rules.length === 0) return null;

  return (
    <GlassCard className="animate-fade-up">
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={15} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">Checklist du jour</h3>
        {saving && <Loader2 size={12} className="text-primary animate-spin ml-1" />}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date().toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{checkedIds.length}/{rules.length} règles vérifiées</span>
          <span className="text-xs font-bold" style={{ color: allChecked ? '#00D4AA' : '#1A6BFF' }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-accent/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: allChecked ? '#00D4AA' : 'linear-gradient(90deg, #1A6BFF, #6C3AFF)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const checked = checkedIds.includes(rule.id);
            return (
              <motion.button
                key={rule.id}
                layout
                onClick={() => toggle(rule.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                  checked
                    ? 'opacity-70'
                    : 'hover:bg-accent/20'
                }`}
                style={{
                  background: checked ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${checked ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: checked ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {checked
                    ? <CheckSquare size={16} style={{ color: '#00D4AA' }} />
                    : <Square size={16} className="text-muted-foreground" />
                  }
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {rule.title}
                  </p>
                  {rule.description && !checked && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{rule.description}</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Message si tout cochée */}
      <AnimatePresence>
        {allChecked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3 rounded-xl text-center"
            style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}
          >
            <p className="text-sm font-bold" style={{ color: '#00D4AA' }}>✅ Plan 100% vérifié !</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tu peux trader en toute discipline aujourd'hui.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAGE PRINCIPALE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TradingPlan() {
  const trades = useFilteredTrades();

  const [rules, setRules]       = useState<TradingRule[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc]   = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc]   = useState('');
  const [lightbox, setLightbox]   = useState<string | null>(null);
  const [confirm, ConfirmModal]   = useConfirm();

  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  // â”€â”€ Chargement initial depuis l'API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    getPlanRules()
      .then(data => setRules(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Erreur chargement du plan'))
      .finally(() => setLoading(false));
  }, []);

  // â”€â”€ CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addRule = async () => {
    if (!newTitle.trim()) { toast.error('Titre requis'); return; }
    try {
      const created = await createPlanRule({ title: newTitle.trim(), description: newDesc.trim(), images: [] });
      setRules(prev => [...prev, created]);
      setNewTitle(''); setNewDesc(''); setShowForm(false);
      toast.success('Règle ajoutée !');
    } catch { toast.error('Erreur ajout règle'); }
  };

  const deleteRule = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cette règle',
      message: 'Définitivement supprimée de ton plan de trading.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deletePlanRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Règle supprimée');
    } catch { toast.error('Erreur suppression'); }
  };

  const startEdit = (rule: TradingRule) => {
    setEditingId(rule.id); setEditTitle(rule.title); setEditDesc(rule.description);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) { toast.error('Titre requis'); return; }
    try {
      const updated = await updatePlanRule(id, { title: editTitle.trim(), description: editDesc.trim() });
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      setEditingId(null);
      toast.success('Règle mise à jour !');
    } catch { toast.error('Erreur mise à  jour'); }
  };

  const handleImageUpload = async (ruleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5 Mo'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;
      const newImages = [...rule.images, reader.result as string];
      try {
        await updatePlanRule(ruleId, { images: newImages });
        setRules(prev => prev.map(r => r.id === ruleId ? { ...r, images: newImages } : r));
      } catch { toast.error('Erreur upload image'); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = async (ruleId: string, imgIdx: number) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const newImages = rule.images.filter((_, i) => i !== imgIdx);
    try {
      await updatePlanRule(ruleId, { images: newImages });
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, images: newImages } : r));
    } catch { toast.error('Erreur suppression image'); }
  };

  // â”€â”€ Drag & drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); overIdx.current = idx; };
  const onDrop = async () => {
    const from = dragIdx.current; const to = overIdx.current;
    if (from === null || to === null || from === to) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setRules(reordered);
    dragIdx.current = null; overIdx.current = null;
    // Persiste le nouvel ordre
    try {
      await Promise.all(reordered.map((r, i) => updatePlanRule(r.id, { order: i })));
    } catch { toast.error('Erreur sauvegarde ordre'); }
  };

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
            <ShieldCheck size={26} className="text-primary" />
            Mon Plan de Trading
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rules.length} règle{rules.length !== 1 ? 's' : ''} définie{rules.length !== 1 ? 's' : ''} s· glisse pour réordonner
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(26,107,255,0.5)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowForm(p => !p)}
          className="gradient-btn px-5 py-2.5 text-sm flex items-center gap-2"
        >
          <Plus size={14} />
          {showForm ? 'Annuler' : 'Nouvelle règle'}
        </motion.button>
      </motion.div>

      {/* â”€â”€ SCORE DE RESPECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <PlanRespectScore trades={trades} />

      {/* â”€â”€ CHECKLIST DU JOUR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}


      {/* â”€â”€ FORMULAIRE AJOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <GlassCard className="border border-primary/25 shadow-[0_0_30px_rgba(26,107,255,0.12)]">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen size={15} className="text-primary" /> Nouvelle règle
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Titre *</label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRule()}
                    className="input-dark mt-1"
                    placeholder="Ex : Ne jamais trader contre la tendance H4"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="input-dark mt-1 min-h-[80px] resize-none"
                    placeholder="Conditions d'entrée, contexte, exemples..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowForm(false); setNewTitle(''); setNewDesc(''); }}
                    className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground hover:bg-accent transition-colors"
                  >
                    Annuler
                  </button>
                  <button onClick={addRule} className="flex-1 gradient-btn py-2 text-sm flex items-center justify-center gap-2">
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ LOADING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="text-primary animate-spin" />
        </div>
      )}

      {/* â”€â”€ LISTE DES REGLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && (
        <div className="space-y-4">
          <AnimatePresence>
            {rules.map((rule, idx) => (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, scale: 0.96 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={onDrop}
                className="group"
              >
                <GlassCard className="hover:border-primary/20 hover:shadow-[0_0_24px_rgba(26,107,255,0.1)] transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary/50 transition-colors shrink-0 pt-0.5">
                      <GripVertical size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Règle {idx + 1}</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                          </div>
                          {editingId === rule.id ? (
                            <div className="mt-1 space-y-2">
                              <input
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="input-dark text-sm font-bold"
                                autoFocus
                              />
                              <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                className="input-dark text-sm min-h-[60px] resize-none"
                                placeholder="Description..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
                                >
                                  Annuler
                                </button>
                                <button onClick={() => saveEdit(rule.id)} className="gradient-btn text-xs px-3 py-1.5 flex items-center gap-1">
                                  <Save size={11} /> Sauvegarder
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-bold text-foreground">{rule.title}</h4>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rule.description}</p>
                              )}
                            </>
                          )}
                        </div>
                        {editingId !== rule.id && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => startEdit(rule)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => deleteRule(rule.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        )}
                      </div>

                      {/* Galerie images */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        {rule.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative group/img">
                            <img
                              src={img}
                              alt={`Illustration ${imgIdx + 1}`}
                              onClick={() => setLightbox(img)}
                              className="w-32 h-24 object-cover rounded-xl border border-border/40 cursor-pointer transition-all duration-200 hover:scale-[1.04] hover:shadow-lg"
                            />
                            <div
                              onClick={() => setLightbox(img)}
                              className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                            >
                              <ZoomIn size={20} className="text-white drop-shadow" />
                            </div>
                            <button
                              onClick={() => removeImage(rule.id, imgIdx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10 hover:scale-110"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <label className="w-32 h-24 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group/add">
                          <ImagePlus size={18} className="text-muted-foreground group-hover/add:text-primary transition-colors" />
                          <span className="text-[10px] text-muted-foreground group-hover/add:text-primary transition-colors">Ajouter</span>
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(rule.id, e)} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* â”€â”€ EMPTY STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {!loading && rules.length === 0 && !showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard className="text-center py-16">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
              >
                <ShieldCheck size={28} className="text-primary" />
              </motion.div>
              <p className="text-foreground font-bold text-lg">Aucune règle définie</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                Ton plan de trading c'est ta bible. Sans règles, t'es juste un gambler.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowForm(true)}
                className="gradient-btn px-6 py-2.5 text-sm mt-6 inline-flex items-center gap-2"
              >
                <Plus size={14} /> Définir ma première règle
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ LIGHTBOX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-xl"
            style={{ background: 'rgba(5, 7, 15, 0.92)' }}
            onClick={() => setLightbox(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              onClick={() => setLightbox(null)}
            >
              <X size={18} />
            </motion.button>
            <motion.img
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              src={lightbox}
              alt="Illustration"
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {ConfirmModal}
    </div>
  );
}


