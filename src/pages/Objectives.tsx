import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/GlassCard';
import {
  Plus, Trash2, Check, Pencil, X, Save,
  ImagePlus, ZoomIn, Sparkles, Target, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmModal';
import { ZoomableImage } from '@/components/ImageLightbox';
import { Objective } from '@/types/trading';
import { getObjectives, createObjective, updateObjective, deleteObjective } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md"
      style={{ animation: 'overlayIn .2s ease forwards' }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{ animation: 'modalIn .22s cubic-bezier(.34,1.2,.64,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={16} />
        </button>
        <img
          src={src}
          alt="Vision"
          className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISION BOARD — grille responsive adaptive selon nombre d'images remplies
// ─────────────────────────────────────────────────────────────────────────────
function VisionBoard({ email }: { email: string }) {
  const storageKey = `mitrad_visionboard_${email}`;
  const TOTAL_SLOTS = 9;

  const [images, setImages] = useState<(string | null)[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      const arr = Array(TOTAL_SLOTS).fill(null);
      parsed.forEach((v: string | null, i: number) => { if (i < TOTAL_SLOTS) arr[i] = v; });
      return arr;
    } catch { return Array(TOTAL_SLOTS).fill(null); }
  });

  const [lightbox, setLightbox] = useState<string | null>(null);

  const persist = (updated: (string | null)[]) => {
    setImages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...images];
      updated[idx] = reader.result as string;
      persist(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    const updated = [...images];
    updated[idx] = null;
    persist(updated);
  };

  // Indices remplis en premier, puis vides — pour que les images s'affichent toujours en tête
  const orderedSlots = [
    ...images.map((img, i) => ({ img, originalIdx: i })).filter(s => s.img !== null),
    ...images.map((img, i) => ({ img, originalIdx: i })).filter(s => s.img === null),
  ];

  const filledCount = orderedSlots.filter(s => s.img !== null).length;

  // ── Styles de grille selon nombre d'images ────────────────────────────────
  // 0        → grille 3×3 vide (invitation)
  // 1        → 1 image grande (16:9 pleine largeur)
  // 2        → 2 colonnes 1:1
  // 3        → [grande sur 2 cols] + [petite] en ligne, puis 3ème sous
  // 4–5      → [1 grande 2cols] + petites sur 1 col ; ex: 4=[2+1+1], 5=[2+1+1+1]
  // 6–9      → grille 3 cols uniforme

  type SlotConfig = { gridColumn?: string; gridRow?: string; aspectRatio: string };

  const getConfig = (displayIdx: number, count: number): SlotConfig | null => {
    if (count === 0) return null;
    if (count === 1) {
      if (displayIdx === 0) return { gridColumn: '1 / -1', aspectRatio: '21/9' };
      return null;
    }
    if (count === 2) {
      if (displayIdx < 2) return { aspectRatio: '4/5' };
      return null;
    }
    if (count === 3) {
      if (displayIdx === 0) return { gridColumn: '1 / 3', aspectRatio: '16/9' };
      if (displayIdx === 1 || displayIdx === 2) return { aspectRatio: '1/1' };
      return null;
    }
    if (count === 4) {
      if (displayIdx === 0) return { gridColumn: '1 / 3', aspectRatio: '16/9' };
      if (displayIdx < 4) return { aspectRatio: '1/1' };
      return null;
    }
    if (count === 5) {
      if (displayIdx === 0) return { gridColumn: '1 / 3', aspectRatio: '16/9' };
      if (displayIdx < 5) return { aspectRatio: '1/1' };
      return null;
    }
    // 6 à 9 : grille 3 cols uniforme
    if (displayIdx < count) return { aspectRatio: '1/1' };
    return null;
  };

  const cols = filledCount <= 1 ? '1fr' : filledCount === 2 ? '1fr 1fr' : 'repeat(3, 1fr)';

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(26,107,255,0.07) 0%, rgba(108,58,255,0.05) 60%, rgba(0,212,170,0.03) 100%)',
        border: '1px solid rgba(26,107,255,0.14)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(26,107,255,0.25),rgba(108,58,255,0.2))' }}
          >
            <Sparkles size={17} style={{ color: '#a5b4fc' }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Mon Vision Board</h3>
            <p className="text-xs mt-0.5 text-muted-foreground/70">
              {filledCount === 0
                ? "Ajoute tes inspirations · jusqu'à 9 images"
                : `${filledCount} image${filledCount > 1 ? 's' : ''} · Visualise tes ambitions`}
            </p>
          </div>
        </div>

        {/* Dots indicateurs */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i < filledCount ? '8px' : '5px',
                height: i < filledCount ? '8px' : '5px',
                background: i < filledCount
                  ? 'linear-gradient(135deg,#1A6BFF,#6c3aed)'
                  : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Grille images ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        {filledCount === 0 ? (
          /* État vide : 9 cellules en pointillés avec icône */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Array.from({ length: 9 }).map((_, idx) => (
              <label
                key={idx}
                className="flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-xl transition-all duration-200"
                style={{
                  aspectRatio: '1/1',
                  border: '1.5px dashed rgba(99,102,241,0.2)',
                  background: idx === 4 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.45)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
                  (e.currentTarget as HTMLElement).style.background = idx === 4 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)';
                }}
              >
                <ImagePlus size={idx === 4 ? 20 : 14} style={{ color: 'rgba(165,180,252,0.4)' }} />
                {idx === 4 && (
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(165,180,252,0.45)' }}>
                    Ajouter
                  </span>
                )}
                <input type="file" accept="image/*" onChange={e => handleUpload(idx, e)} className="hidden" />
              </label>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '8px' }}>
            {orderedSlots.map(({ img, originalIdx }, displayIdx) => {
              const config = getConfig(displayIdx, filledCount);
              if (!config) return null;

              return img ? (
                /* Cellule remplie */
                <div
                  key={`f-${originalIdx}`}
                  className="relative overflow-hidden group/cell"
                  style={{
                    gridColumn: config.gridColumn,
                    gridRow: config.gridRow,
                    aspectRatio: config.aspectRatio,
                    borderRadius: '14px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={img}
                    alt={`Vision ${displayIdx + 1}`}
                    onClick={() => setLightbox(img)}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover/cell:scale-[1.06]"
                  />

                  {/* Overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.35)' }}
                    onClick={() => setLightbox(img)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
                    >
                      <ZoomIn size={18} className="text-white" />
                    </div>
                  </div>

                  {/* Actions top-right */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200">
                    <label
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                      title="Remplacer"
                    >
                      <Pencil size={11} className="text-white" />
                      <input type="file" accept="image/*" onChange={e => handleUpload(originalIdx, e)} className="hidden" />
                    </label>
                    <button
                      onClick={() => removeImage(originalIdx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.75)', backdropFilter: 'blur(4px)' }}
                      title="Supprimer"
                    >
                      <X size={11} className="text-white" />
                    </button>
                  </div>

                  {/* Compteur discret */}
                  <div
                    className="absolute bottom-2 left-2 opacity-0 group-hover/cell:opacity-100 transition-opacity text-[9px] font-bold"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(4px)',
                      color: 'rgba(255,255,255,0.65)',
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {displayIdx + 1} / {filledCount}
                  </div>
                </div>
              ) : (
                /* Cellule vide */
                <label
                  key={`e-${originalIdx}`}
                  className="flex flex-col items-center justify-center gap-1.5 cursor-pointer rounded-xl transition-all duration-200"
                  style={{
                    gridColumn: config.gridColumn,
                    gridRow: config.gridRow,
                    aspectRatio: config.aspectRatio,
                    border: '1.5px dashed rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.38)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.01)';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.08)' }}
                  >
                    <Plus size={15} style={{ color: 'rgba(165,180,252,0.6)' }} />
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Ajouter</span>
                  <input type="file" accept="image/*" onChange={e => handleUpload(originalIdx, e)} className="hidden" />
                </label>
              );
            })}
          </div>
        )}

        {/* Lien "ajouter une image" discret en bas si des slots sont libres */}
        {filledCount > 0 && filledCount < TOTAL_SLOTS && (
          <div className="mt-3 flex justify-center">
            <label
              className="flex items-center gap-1.5 text-[11px] cursor-pointer px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: 'rgba(148,163,184,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(165,180,252,0.85)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(148,163,184,0.5)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <Plus size={11} />
              {TOTAL_SLOTS - filledCount} emplacement{TOTAL_SLOTS - filledCount > 1 ? 's' : ''} disponible{TOTAL_SLOTS - filledCount > 1 ? 's' : ''}
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const firstEmpty = images.findIndex(img => img === null);
                  if (firstEmpty !== -1) handleUpload(firstEmpty, e);
                }}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────
export default function Objectives() {
  // Modale de confirmation glassmorphism (remplace window.confirm)
  const [confirm, ConfirmModal] = useConfirm();
  const { user } = useAuth();
  const storageKey = `mitrad_objectives_${user!.email}`;

  const [items, setItems] = useState<Objective[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Objective | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setProgressVisible(true), 300);
    return () => clearTimeout(t);
  }, [items]);

  const persist = (updated: Objective[]) => {
    setItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addObjective = (data: Omit<Objective, 'id' | 'completed' | 'createdAt'>) => {
    persist([...items, { id: `obj-${Date.now()}`, completed: false, createdAt: new Date().toISOString(), ...data }]);
    toast.success('Objectif ajouté !');
  };

  const updateObjective = (id: string, data: Omit<Objective, 'id' | 'completed' | 'createdAt'>) => {
    persist(items.map(o => o.id === id ? { ...o, ...data } : o));
    toast.success('Objectif mis à jour');
  };

  const toggleComplete = (id: string) =>
    persist(items.map(o => o.id === id ? { ...o, completed: !o.completed } : o));

  const deleteObjective = async (id: string) => {
    const ok = await confirm({ message: 'Supprimer cet objectif définitivement ?', variant: 'danger', confirmText: 'Supprimer' });
    if (!ok) return;
    persist(items.filter(o => o.id !== id));
    toast.success('Objectif supprimé');
  };

  const pending   = items.filter(o => !o.completed);
  const completed = items.filter(o => o.completed);
  const progress  = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

  // ── Carte objectif ──────────────────────────────────────────────────────────
  const ObjectiveCard = ({ obj }: { obj: Objective }) => (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: obj.completed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${obj.completed ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: obj.completed ? 'none' : '0 2px 12px rgba(0,0,0,0.2)',
        opacity: obj.completed ? 0.55 : 1,
        animation: 'fadeUp .4s ease forwards',
      }}
    >
      {/* Image en haut si présente */}
      {obj.image && (
        <div
          className="relative overflow-hidden cursor-pointer group/thumb"
          style={{ height: '110px' }}
          onClick={() => setLightbox(obj.image!)}
        >
          <img
            src={obj.image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}>
              <ZoomIn size={16} className="text-white" />
            </div>
          </div>
          {/* Dégradé bas */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleComplete(obj.id)}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200"
          style={{
            background: obj.completed ? 'linear-gradient(135deg,#1A6BFF,#6c3aed)' : 'transparent',
            borderColor: obj.completed ? 'transparent' : 'rgba(255,255,255,0.18)',
          }}
        >
          {obj.completed && <Check size={13} className="text-white" />}
        </button>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-semibold leading-snug block"
            style={{
              color: obj.completed ? 'rgba(148,163,184,0.65)' : '#fff',
              textDecoration: obj.completed ? 'line-through' : 'none',
            }}
          >
            {obj.text}
          </span>

          {obj.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{obj.description}</p>
          )}

          {obj.targetDate && (
            <div className="flex items-center gap-1 mt-1.5">
              <Calendar size={10} style={{ color: 'rgba(99,102,241,0.65)' }} />
              <span className="text-[11px]" style={{ color: 'rgba(99,102,241,0.65)' }}>
                {new Date(obj.targetDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditingItem(obj)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => deleteObjective(obj.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Mes Objectifs</h1>
          <p className="text-muted-foreground text-sm mt-1">Visualise tes ambitions et suis ta progression</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-2"
        >
          <Plus size={14} /> Ajouter un objectif
        </button>
      </div>

      {/* Vision Board — toujours visible */}
      <VisionBoard email={user!.email} />

      {/* Barre de progression */}
      {items.length > 0 && (
        <div
          className="rounded-2xl p-4 animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Progression globale</p>
            </div>
            <span className="text-sm font-bold metric-value text-foreground">
              {completed.length}/{items.length}
              <span className="text-muted-foreground font-normal text-xs ml-1">objectifs</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full gradient-primary transition-all duration-1000 ease-out"
              style={{ width: progressVisible ? `${progress}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress}% complété</p>
        </div>
      )}

      {/* Objectifs en cours */}
      {pending.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-foreground">En cours ({pending.length})</h3>
          </div>
          {pending.map(obj => <ObjectiveCard key={obj.id} obj={obj} />)}
        </div>
      )}

      {/* Objectifs complétés */}
      {completed.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <h3 className="text-sm font-bold text-muted-foreground">Complétés ({completed.length})</h3>
          </div>
          {completed.map(obj => <ObjectiveCard key={obj.id} obj={obj} />)}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(26,107,255,0.1)' }}>
            <Target size={24} className="text-primary" />
          </div>
          <p className="text-foreground font-semibold">Aucun objectif défini</p>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-xs mx-auto">
            Fixe-toi des objectifs clairs et mesurables pour progresser.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="gradient-btn px-5 py-2.5 text-sm mt-5 inline-flex items-center gap-2"
          >
            <Plus size={14} /> Mon premier objectif
          </button>
        </div>
      )}

      {showModal && <ObjectiveModal onSave={addObjective} onClose={() => setShowModal(false)} />}
      {editingItem && (
        <ObjectiveModal
          initial={editingItem}
          onSave={data => updateObjective(editingItem.id, data)}
          onClose={() => setEditingItem(null)}
        />
      )}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      {ConfirmModal}
    </div>
  );
}