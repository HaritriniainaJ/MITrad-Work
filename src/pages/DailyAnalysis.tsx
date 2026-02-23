import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { DailyAnalysis, AnalyzedPair, ALL_PAIRS, BIAS_OPTIONS, DECISION_OPTIONS } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { Plus, Trash2, Eye, X, Pencil, Save, ImagePlus, ZoomIn, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────────
const emptyPair = (): AnalyzedPair => ({
  pair: 'EURUSD',
  fundamentalBias: 'Neutre',
  technicalBias: 'Neutre',
  decision: 'Surveiller 👀',
  tvLink: '',
  note: '',
  images: [],
});

// ── Lightbox avec navigation ──────────────────────────────────────────────────
function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  // Keyboard nav
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      <div className="modal-content relative flex items-center gap-4" onClick={e => e.stopPropagation()}>
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Image */}
        <img
          src={images[current]}
          alt={`Image ${current + 1}`}
          className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground glass px-3 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Galerie miniatures par paire ─────────────────────────────────────────────
function PairImageGallery({
  images,
  onAdd,
  onRemove,
}: {
  images: string[];
  onAdd: (b64: string) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - images.length;
    const toProcess = files.slice(0, remaining);

    toProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} : max 5 Mo`); return; }
      const reader = new FileReader();
      reader.onload = () => onAdd(reader.result as string);
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground">
        Captures d'écran <span className="text-muted-foreground/60">({images.length}/3 — max 5 Mo chacune)</span>
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group/img">
            <img
              src={img}
              alt={`Capture ${idx + 1}`}
              onClick={() => setLightbox(idx)}
              className="w-24 h-20 object-cover rounded-xl border border-border/40 cursor-pointer transition-transform hover:scale-[1.03]"
            />
            <div
              onClick={() => setLightbox(idx)}
              className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
            >
              <ZoomIn size={18} className="text-white" />
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {images.length < 3 && (
          <label className="w-24 h-20 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-accent/30 hover:border-primary/40 transition-all">
            <ImagePlus size={16} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Ajouter</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ── Formulaire de paire (réutilisé en création + édition) ────────────────────
function PairForm({
  pair,
  idx,
  total,
  onChange,
  onRemove,
  onImageAdd,
  onImageRemove,
}: {
  pair: AnalyzedPair;
  idx: number;
  total: number;
  onChange: (field: keyof AnalyzedPair, value: string) => void;
  onRemove: () => void;
  onImageAdd: (b64: string) => void;
  onImageRemove: (imgIdx: number) => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-accent/30 space-y-3 border border-border/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">Paire {idx + 1}</span>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Paire</label>
          <select value={pair.pair} onChange={e => onChange('pair', e.target.value)} className="select-dark mt-1">
            {ALL_PAIRS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Biais fondamental</label>
          <select value={pair.fundamentalBias} onChange={e => onChange('fundamentalBias', e.target.value)} className="select-dark mt-1">
            {BIAS_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Biais technique</label>
          <select value={pair.technicalBias} onChange={e => onChange('technicalBias', e.target.value)} className="select-dark mt-1">
            {BIAS_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Décision</label>
          <select value={pair.decision} onChange={e => onChange('decision', e.target.value)} className="select-dark mt-1">
            {DECISION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Lien TradingView <span className="text-muted-foreground/60">(optionnel)</span>
          </label>
          <div className="relative mt-1">
            <input
              type="url"
              value={pair.tvLink}
              onChange={e => onChange('tvLink', e.target.value)}
              className="input-dark pr-9"
              placeholder="https://tradingview.com/..."
            />
            {pair.tvLink && (
              <a
                href={pair.tvLink}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Note</label>
        <textarea
          value={pair.note}
          onChange={e => onChange('note', e.target.value)}
          className="input-dark mt-1 min-h-[64px] resize-none"
          placeholder="Contexte, niveaux clés, confluences..."
        />
      </div>

      {/* Upload images */}
      <PairImageGallery
        images={pair.images || []}
        onAdd={onImageAdd}
        onRemove={onImageRemove}
      />
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function DailyAnalysisPage() {
  const { user } = useAuth();
  // Paires combinées défaut + custom utilisateur
  const allPairs = [...new Set([...ALL_PAIRS, ...(user?.customPairs || [])])];
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pairs, setPairs] = useState<AnalyzedPair[]>([emptyPair()]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DailyAnalysis | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<DailyAnalysis | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const analyses = useMemo(
    () => StorageManager.getAnalyses(user!.email),
    [user, tab, refreshKey],
  );

  // ── Helpers pairs (nouvelle analyse) ───────────────────────────────────────
  const addPair = () => setPairs(prev => [...prev, emptyPair()]);
  const removePair = (idx: number) => setPairs(prev => prev.filter((_, i) => i !== idx));

  const updatePair = (idx: number, field: keyof AnalyzedPair, value: string) =>
    setPairs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  const addPairImage = (idx: number, b64: string) =>
    setPairs(prev => prev.map((p, i) =>
      i === idx ? { ...p, images: [...(p.images || []), b64] } : p,
    ));

  const removePairImage = (pairIdx: number, imgIdx: number) =>
    setPairs(prev => prev.map((p, i) =>
      i === pairIdx ? { ...p, images: (p.images || []).filter((_, ii) => ii !== imgIdx) } : p,
    ));

  // ── Helpers pairs (édition) ────────────────────────────────────────────────
  const updateEditPair = (idx: number, field: keyof AnalyzedPair, value: string) => {
    if (!editingAnalysis) return;
    setEditingAnalysis({
      ...editingAnalysis,
      pairs: editingAnalysis.pairs.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    });
  };

  const addEditPairImage = (pairIdx: number, b64: string) => {
    if (!editingAnalysis) return;
    setEditingAnalysis({
      ...editingAnalysis,
      pairs: editingAnalysis.pairs.map((p, i) =>
        i === pairIdx ? { ...p, images: [...(p.images || []), b64] } : p,
      ),
    });
  };

  const removeEditPairImage = (pairIdx: number, imgIdx: number) => {
    if (!editingAnalysis) return;
    setEditingAnalysis({
      ...editingAnalysis,
      pairs: editingAnalysis.pairs.map((p, i) =>
        i === pairIdx
          ? { ...p, images: (p.images || []).filter((_, ii) => ii !== imgIdx) }
          : p,
      ),
    });
  };

  // ── Actions CRUD ───────────────────────────────────────────────────────────
  const save = () => {
    const existing = analyses.find(a => a.date === date);
    if (existing) { toast.error('Une analyse existe déjà pour cette date'); return; }
    const analysis: DailyAnalysis = {
      id: `${user!.email}-analysis-${Date.now()}`,
      userId: user!.email,
      date,
      pairs,
    };
    StorageManager.addAnalysis(analysis);
    toast.success('Analyse enregistrée !');
    setPairs([emptyPair()]);
    setRefreshKey(k => k + 1);
  };

  const deleteAnalysis = (id: string) => {
    if (!confirm('Supprimer cette analyse ?')) return;
    StorageManager.deleteAnalysis(id);
    setSelectedAnalysis(null);
    setEditingAnalysis(null);
    setRefreshKey(k => k + 1);
    toast.success('Analyse supprimée');
  };

  const startEdit = (analysis: DailyAnalysis) => {
    setEditingAnalysis({
      ...analysis,
      pairs: analysis.pairs.map(p => ({ ...p, images: [...(p.images || [])] })),
    });
    setSelectedAnalysis(null);
  };

  const saveEdit = () => {
    if (!editingAnalysis) return;
    StorageManager.updateAnalysis(editingAnalysis.id, editingAnalysis);
    setEditingAnalysis(null);
    setRefreshKey(k => k + 1);
    toast.success('Analyse mise à jour');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Analyse du Jour</h1>
        <p className="text-muted-foreground text-sm mt-1">Planifie ta journée de trading</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['new', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'gradient-primary text-foreground'
                : 'bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'new' ? 'Nouvelle analyse' : `Historique (${analyses.length})`}
          </button>
        ))}
      </div>

      {/* ── Nouvelle analyse ──────────────────────────────────────────────── */}
      {tab === 'new' && (
        <GlassCard className="animate-fade-up">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Date de l'analyse</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-dark mt-1 max-w-[200px]"
              />
            </div>

            {pairs.map((p, idx) => (
              <PairForm
                key={idx}
                pair={p}
                idx={idx}
                total={pairs.length}
                onChange={(field, value) => updatePair(idx, field, value)}
                onRemove={() => removePair(idx)}
                onImageAdd={b64 => addPairImage(idx, b64)}
                onImageRemove={imgIdx => removePairImage(idx, imgIdx)}
              />
            ))}

            <button
              onClick={addPair}
              className="flex items-center gap-2 text-primary text-sm hover:underline"
            >
              <Plus size={14} /> Ajouter une paire
            </button>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPairs([emptyPair()])}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Effacer
              </button>
              <button onClick={save} className="gradient-btn px-6 py-2 text-sm">
                Enregistrer l'analyse
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Historique ───────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <GlassCard className="animate-fade-up overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Paires', 'Images', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.map(a => {
                const totalImgs = a.pairs.reduce((s, p) => s + (p.images?.length || 0), 0);
                return (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">
                      {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {a.pairs.map(p => p.pair).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      {totalImgs > 0 ? (
                        <span className="text-xs px-2 py-0.5 rounded-full glass text-primary">
                          {totalImgs} image{totalImgs > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <button
                        onClick={() => setSelectedAnalysis(a)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <Eye size={12} /> Voir
                      </button>
                      <button
                        onClick={() => startEdit(a)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <Pencil size={12} /> Modifier
                      </button>
                      <button
                        onClick={() => deleteAnalysis(a.id)}
                        className="text-destructive hover:underline text-xs flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
              {analyses.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted-foreground py-12">
                    Aucune analyse enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* ── Modal détail ─────────────────────────────────────────────────── */}
      {selectedAnalysis && !editingAnalysis && (
        <div className="modal-overlay" onClick={() => setSelectedAnalysis(null)}>
          <div
            className="modal-content glass p-6 max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-foreground text-lg">
                Analyse du{' '}
                {new Date(selectedAnalysis.date).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                })}
              </h3>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedAnalysis.pairs.map((p, i) => {
                const [lbIdx, setLbIdx] = useState<number | null>(null);
                return (
                  <div key={i} className="p-4 rounded-xl bg-accent/30 space-y-3 text-sm">
                    <div className="font-bold text-foreground text-base">{p.pair}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Fondamental :</span>{' '}
                        <span className="text-foreground font-medium">{p.fundamentalBias}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Technique :</span>{' '}
                        <span className="text-foreground font-medium">{p.technicalBias}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Décision :</span>{' '}
                        <span className="text-foreground font-medium">{p.decision}</span>
                      </div>
                      {p.tvLink && (
                        <div className="col-span-2">
                          <a
                            href={p.tvLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-xs"
                          >
                            <ExternalLink size={11} /> Voir sur TradingView
                          </a>
                        </div>
                      )}
                    </div>
                    {p.note && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.note}</p>
                    )}
                    {/* Miniatures images */}
                    {(p.images || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(p.images || []).map((img, ii) => (
                          <div key={ii} className="relative group/img">
                            <img
                              src={img}
                              alt=""
                              onClick={() => setLbIdx(ii)}
                              className="w-20 h-16 object-cover rounded-lg border border-border/40 cursor-pointer hover:scale-[1.04] transition-transform"
                            />
                            <div
                              onClick={() => setLbIdx(ii)}
                              className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                            >
                              <ZoomIn size={14} className="text-white" />
                            </div>
                          </div>
                        ))}
                        {lbIdx !== null && (
                          <Lightbox images={p.images || []} index={lbIdx} onClose={() => setLbIdx(null)} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => startEdit(selectedAnalysis)}
                className="flex items-center gap-2 text-primary text-sm hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
              >
                <Pencil size={14} /> Modifier l'analyse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal édition ────────────────────────────────────────────────── */}
      {editingAnalysis && (
        <div className="modal-overlay" onClick={() => setEditingAnalysis(null)}>
          <div
            className="modal-content glass p-6 max-w-2xl w-full mx-4 max-h-[88vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-foreground text-lg">
                Modifier — {new Date(editingAnalysis.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
              </h3>
              <button
                onClick={() => setEditingAnalysis(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {editingAnalysis.pairs.map((p, idx) => (
                <PairForm
                  key={idx}
                  pair={p}
                  idx={idx}
                  total={editingAnalysis.pairs.length}
                  onChange={(field, value) => updateEditPair(idx, field, value)}
                  onRemove={() => setEditingAnalysis({
                    ...editingAnalysis,
                    pairs: editingAnalysis.pairs.filter((_, i) => i !== idx),
                  })}
                  onImageAdd={b64 => addEditPairImage(idx, b64)}
                  onImageRemove={imgIdx => removeEditPairImage(idx, imgIdx)}
                />
              ))}

              <button
                onClick={() => setEditingAnalysis({
                  ...editingAnalysis,
                  pairs: [...editingAnalysis.pairs, emptyPair()],
                })}
                className="flex items-center gap-2 text-primary text-sm hover:underline"
              >
                <Plus size={14} /> Ajouter une paire
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingAnalysis(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 gradient-btn py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Save size={14} /> Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}