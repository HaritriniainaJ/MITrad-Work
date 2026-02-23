import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/GlassCard';
import { Plus, Trash2, ImagePlus, X, GripVertical, Pencil, Save, ZoomIn, BookOpen, ShieldCheck } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingRule {
  id: string;
  title: string;
  description: string;
  images: string[];
}

export default function TradingPlan() {
  const { user } = useAuth();
  const storageKey = `mitrad_plan_${user?.email ?? 'demo'}`;

  const [rules, setRules] = useState<TradingRule[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showForm, setShowForm]   = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newDesc, setNewDesc]     = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc]   = useState('');
  const [lightbox, setLightbox]   = useState<string | null>(null);
  const [confirm, ConfirmModal]   = useConfirm();

  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  const save = (updated: TradingRule[]) => {
    setRules(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addRule = () => {
    if (!newTitle.trim()) { toast.error('Titre requis'); return; }
    save([...rules, {
      id: `rule-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      images: [],
    }]);
    setNewTitle(''); setNewDesc(''); setShowForm(false);
    toast.success('Règle ajoutée !');
  };

  const deleteRule = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cette règle',
      message: 'Définitivement supprimée de ton plan de trading.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    save(rules.filter(r => r.id !== id));
    toast.success('Règle supprimée');
  };

  const startEdit = (rule: TradingRule) => {
    setEditingId(rule.id);
    setEditTitle(rule.title);
    setEditDesc(rule.description);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) { toast.error('Titre requis'); return; }
    save(rules.map(r => r.id === id ? { ...r, title: editTitle.trim(), description: editDesc.trim() } : r));
    setEditingId(null);
    toast.success('Règle mise à jour !');
  };

  const handleImageUpload = (ruleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Taille max : 5 Mo'); return; }
    const reader = new FileReader();
    reader.onload = () => save(rules.map(r =>
      r.id === ruleId ? { ...r, images: [...r.images, reader.result as string] } : r
    ));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (ruleId: string, imgIdx: number) =>
    save(rules.map(r =>
      r.id === ruleId ? { ...r, images: r.images.filter((_, i) => i !== imgIdx) } : r
    ));

  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); overIdx.current = idx; };
  const onDrop = () => {
    const from = dragIdx.current;
    const to   = overIdx.current;
    if (from === null || to === null || from === to) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    save(reordered);
    dragIdx.current = null;
    overIdx.current = null;
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
            {rules.length} règle{rules.length !== 1 ? 's' : ''} définie{rules.length !== 1 ? 's' : ''} · glisse pour réordonner
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

      {/* Formulaire ajout */}
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

      {/* Liste des règles */}
      <div className="space-y-4">
        <AnimatePresence>
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.96 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={onDrop}
              className="group"
            >
              <GlassCard className="hover:border-primary/20 hover:shadow-[0_0_24px_rgba(26,107,255,0.1)] transition-all duration-300">
                <div className="flex items-start gap-3">

                  {/* Handle drag */}
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

      {/* Empty state */}
      <AnimatePresence>
        {rules.length === 0 && !showForm && (
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-xl"
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
