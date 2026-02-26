import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/GlassCard';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { getSuccesses, createSuccess, updateSuccess, deleteSuccess } from '@/lib/api';
import {
  Plus, Trash2, ImagePlus, X, Pencil, Save,
  ZoomIn, ChevronLeft, ChevronRight, Trophy,
  CalendarDays, StickyNote, Star, Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmModal';

interface Success {
  id: string;
  title: string;
  date: string;
  note: string;
  images: string[];
}

// â”€â”€ CSS injectÃ© une seule fois â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STYLES = `
@keyframes su-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes su-scaleIn {
  from { opacity: 0; transform: scale(.93); }
  to   { opacity: 1; transform: scale(1); }
}
.su-fade-up  { animation: su-fadeUp  .38s cubic-bezier(.16,1,.3,1) both; }
.su-scale-in { animation: su-scaleIn .26s cubic-bezier(.16,1,.3,1) both; }
.su-s1 { animation-delay: .04s; }
.su-s2 { animation-delay: .09s; }
.su-s3 { animation-delay: .14s; }
.su-s4 { animation-delay: .19s; }
`;
if (typeof document !== 'undefined' && !document.getElementById('su-styles')) {
  const s = document.createElement('style');
  s.id = 'su-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

// â”€â”€ Lightbox â€” rendue via Portal directement dans document.body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Raison : si rendue Ã  l'intÃ©rieur d'un parent avec overflow:hidden ou
// z-index limitÃ©, la lightbox sera clippÃ©e/bloquÃ©e dans ce conteneur.
// createPortal() l'Ã©chappe complÃ¨tement du DOM parent.
function Lightbox({ images, index, onClose }: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    background: 'rgba(0,0,0,.88)',
    backdropFilter: 'blur(14px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const btnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,.15)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', flexShrink: 0,
    transition: 'background .18s, transform .15s',
  };

  const content = (
    <div style={overlayStyle} onClick={onClose}>
      {/* Fermer */}
      <button
        onClick={onClose}
        style={{ ...btnStyle, position: 'absolute', top: 16, right: 16 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.28)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; }}
      >
        <X size={18} />
      </button>

      {/* Zone image â€” stopPropagation pour ne pas fermer en cliquant l'image */}
      <div
        className="su-scale-in"
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', maxWidth: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button onClick={prev} style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.28)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Image : max 78vw Ã— 78vh â€” jamais plein Ã©cran, jamais dans le box */}
        <img
          src={images[current]}
          alt=""
          style={{
            maxWidth: '78vw',
            maxHeight: '78vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 14,
            boxShadow: '0 30px 70px rgba(0,0,0,.7)',
            display: 'block',
          }}
        />

        {images.length > 1 && (
          <button onClick={next} style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.28)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)',
          borderRadius: 999, padding: '3px 14px', fontSize: 12, color: '#fff',
        }}>
          {current + 1} / {images.length}
        </div>
      )}
    </div>
  );

  // Portal â†’ rendu directement dans body, Ã©chappe tout parent DOM
  return createPortal(content, document.body);
}

// â”€â”€ Galerie compacte cÃ´tÃ© droit de la carte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CompactGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div
        style={{
          flexShrink: 0,
          width: images.length === 1 ? 100 : 152,
          borderRadius: 12,
          overflow: 'hidden', // overflow:hidden ici â€” mais Lightbox Ã©chappe via Portal
          boxShadow: '0 4px 20px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.15)',
          border: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${images.length === 1 ? 1 : 2}, 1fr)`,
          gap: 2,
        }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setLightbox(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <img
                src={img}
                alt=""
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  background: 'rgba(0,0,0,.22)',
                  display: 'block',
                  transform: hoveredIdx === idx ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform .22s',
                }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hoveredIdx === idx ? 1 : 0,
                transition: 'opacity .18s',
              }}>
                <ZoomIn size={15} color="#fff" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portal lightbox â€” rendu dans body, pas dans ce div */}
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

// â”€â”€ Galerie dans le modal (pleine largeur) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalGallery({
  images,
  onRemove,
  onAdd,
}: {
  images: string[];
  onRemove: (idx: number) => void;
  onAdd: (b64: string) => void;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo par image'); return; }
      const reader = new FileReader();
      reader.onload = () => onAdd(reader.result as string);
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-2 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group/mi rounded-xl overflow-hidden border border-border/20 shadow-md hover:shadow-lg transition-all"
              style={{ aspectRatio: '4 / 3' }}
            >
              <img
                src={img}
                alt=""
                onClick={() => setLightbox(idx)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(0,0,0,.1)', cursor: 'pointer', display: 'block' }}
              />
              <div
                onClick={() => setLightbox(idx)}
                className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover/mi:opacity-100 transition-opacity cursor-pointer"
              >
                <ZoomIn size={18} className="text-white" />
              </div>
              <button
                onClick={e => { e.stopPropagation(); onRemove(idx); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover/mi:opacity-100 transition-opacity z-10 hover:scale-110"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/50 cursor-pointer hover:bg-accent/30 hover:border-primary/40 transition-all w-full">
        <ImagePlus size={15} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          {images.length === 0 ? 'Ajouter des images (max 5 Mo)' : "Ajouter d'autres images"}
        </span>
        <input type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
      </label>

      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// â”€â”€ Modal formulaire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BUG MODAL FERMETURE : handleSubmit appelle onSave() PUIS onClose().
// onClose() est appelÃ© ici-mÃªme, pas dÃ©lÃ©guÃ© au parent â€” garanti de toujours
// se fermer aprÃ¨s la sauvegarde, quelle que soit la logique parent.
function SuccessModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Success;
  onSave: (data: Omit<Success, 'id'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle]   = useState(initial?.title  ?? '');
  const [date, setDate]     = useState(initial?.date   ?? new Date().toISOString().split('T')[0]);
  const [note, setNote]     = useState(initial?.note   ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  // Refs pour lire les valeurs les plus rÃ©centes sans recrÃ©er handleSubmit
  const rTitle  = useRef(title);  rTitle.current  = title;
  const rDate   = useRef(date);   rDate.current   = date;
  const rNote   = useRef(note);   rNote.current   = note;
  const rImages = useRef(images); rImages.current = images;

  const handleSubmit = () => {
    if (!rTitle.current.trim()) { toast.error('Le titre est requis'); return; }
    // 1. Sauvegarder
    onSave({
      title:  rTitle.current.trim(),
      date:   rDate.current,
      note:   rNote.current.trim(),
      images: rImages.current,
    });
    // 2. Fermer â€” appelÃ© ICI, toujours, aprÃ¨s onSave
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 max-w-lg w-full mx-4 max-h-[92vh] overflow-y-auto su-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Trophy size={16} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg">
              {initial ? 'Modifier le succÃ¨s' : 'Nouveau succÃ¨s'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
              <Star size={11} className="text-primary/70" /> Titre *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="input-dark w-full"
              placeholder="Ex : Premier mois rentable"
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
              <CalendarDays size={11} className="text-primary/70" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input-dark w-full"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
              <StickyNote size={11} className="text-primary/70" /> Notes
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input-dark w-full min-h-[88px] resize-none"
              placeholder="DÃ©cris ce que tu as accompli, comment tu te sens..."
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
              <ImageIcon size={11} className="text-primary/70" /> Images
            </label>
            <ModalGallery
              images={images}
              onRemove={idx => setImages(prev => prev.filter((_, i) => i !== idx))}
              onAdd={b64 => setImages(prev => [...prev, b64])}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground hover:bg-accent/30 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 gradient-btn py-2.5 text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Save size={14} />
            {initial ? 'Enregistrer' : 'Ajouter le succÃ¨s'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Carte succÃ¨s â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SuccessCard({ item, onEdit, onDelete, index }: {
  item: Success; onEdit: () => void; onDelete: () => void; index: number;
}) {
  const stagger = ['su-s1', 'su-s2', 'su-s3', 'su-s4'][Math.min(index, 3)];
  return (
    <GlassCard className={`su-fade-up ${stagger} overflow-visible`}>
      <div className="flex gap-4 items-start">
        {/* Colonne gauche â€” texte */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Trophy size={14} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-foreground text-base leading-snug">{item.title}</h4>
                <p className="flex items-center gap-1 text-xs text-primary/60 mt-0.5">
                  <CalendarDays size={11} />
                  {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} title="Modifier"
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all hover:scale-110">
                <Pencil size={14} />
              </button>
              <button onClick={onDelete} title="Supprimer"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-110">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {item.note && (
            <p className="text-sm text-muted-foreground leading-relaxed ml-9">{item.note}</p>
          )}
        </div>

        {/* Colonne droite â€” galerie compacte */}
        {item.images.length > 0 && <CompactGallery images={item.images} />}
      </div>
    </GlassCard>
  );
}

// â”€â”€ Page principale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ DÃ©finition des badges automatiques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AUTO_BADGES = [
  { key: 'first_win',      emoji: '🏆', title: 'Premier trade gagnant',          check: (t: any[]) => t.filter(x => x.status === 'WIN').length >= 1 },
  { key: 'win_3',          emoji: '🔥', title: '3 wins consécutifs',              check: (t: any[]) => getMaxStreak(t) >= 3 },
  { key: 'win_5',          emoji: '⚡', title: '5 wins consécutifs',              check: (t: any[]) => getMaxStreak(t) >= 5 },
  { key: 'win_10',         emoji: '💎', title: '10 wins consécutifs',             check: (t: any[]) => getMaxStreak(t) >= 10 },
  { key: 'r10',            emoji: '💰', title: '+10R cumulés',                    check: (t: any[]) => getTotalR(t) >= 10 },
  { key: 'r50',            emoji: '🚀', title: '+50R cumulés',                    check: (t: any[]) => getTotalR(t) >= 50 },
  { key: 'r100',           emoji: '👑', title: '+100R cumulés',                   check: (t: any[]) => getTotalR(t) >= 100 },
  { key: 'winrate_60',     emoji: '🎯', title: 'Win rate > 60% (min 20 trades)',  check: (t: any[]) => t.filter(x=>x.status!=='RUNNING').length >= 20 && getWinRate(t) > 60 },
  { key: 'winrate_70',     emoji: '🌟', title: 'Win rate > 70% (min 20 trades)',  check: (t: any[]) => t.filter(x=>x.status!=='RUNNING').length >= 20 && getWinRate(t) > 70 },
  { key: 'trades_10',      emoji: '📈', title: '10 trades enregistrés',           check: (t: any[]) => t.length >= 10 },
  { key: 'trades_50',      emoji: '📊', title: '50 trades enregistrés',           check: (t: any[]) => t.length >= 50 },
  { key: 'trades_100',     emoji: '🏅', title: '100 trades enregistrés',          check: (t: any[]) => t.length >= 100 },
  { key: 'pf_2',           emoji: '⚖️', title: 'Profit Factor > 2',               check: (t: any[]) => getPF(t) >= 2 },
  { key: 'no_revenge',     emoji: '🧘', title: '10 trades sans Revenge Trading',  check: (t: any[]) => getLast10NoRevenge(t) },
];

function getMaxStreak(trades: any[]) {
  const closed = [...trades].filter(t => t.status !== 'RUNNING').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let max = 0, cur = 0;
  closed.forEach(t => { if (t.status === 'WIN') { cur++; max = Math.max(max, cur); } else cur = 0; });
  return max;
}
function getTotalR(trades: any[]) {
  return trades.filter(t => t.status !== 'RUNNING').reduce((s, t) => s + (t.resultR || 0), 0);
}
function getWinRate(trades: any[]) {
  const closed = trades.filter(t => t.status !== 'RUNNING');
  return closed.length ? (closed.filter(t => t.status === 'WIN').length / closed.length) * 100 : 0;
}
function getPF(trades: any[]) {
  const closed = trades.filter(t => t.status !== 'RUNNING');
  const gross = closed.filter(t => t.status === 'WIN').reduce((s,t) => s + t.resultR, 0);
  const loss  = Math.abs(closed.filter(t => t.status === 'LOSS').reduce((s,t) => s + t.resultR, 0));
  return loss > 0 ? gross / loss : gross > 0 ? 99 : 0;
}
function getLast10NoRevenge(trades: any[]) {
  const last10 = [...trades].filter(t => t.status !== 'RUNNING')
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  return last10.length >= 10 && last10.every(t => t.emotion !== 'Revenge Trading');
}

export default function Successes() {
  const [confirm, ConfirmModal] = useConfirm();
  const { user } = useAuth();
  const trades = useFilteredTrades();

  const [items, setItems]         = useState<Success[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [editTarget, setEditTarget] = useState<Success | null>(null);
  const [addKey, setAddKey]       = useState(0);
  const [editKey, setEditKey]     = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'auto' | 'manual'>('all');

  const fetchSuccesses = async () => {
    try {
      const data = await getSuccesses();
      setItems(Array.isArray(data) ? data.map((s: any) => ({
        ...s,
        images: s.images || [],
      })) : []);
    } catch { setItems([]); }
  };

  useEffect(() => { fetchSuccesses(); }, []);

  // â”€â”€ SuccÃ¨s automatiques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (trades.length === 0 || items.length === 0 && trades.length === 0) return;
    const existingKeys = items.filter(s => s.badge_key).map(s => s.badge_key);

    AUTO_BADGES.forEach(async badge => {
      if (existingKeys.includes(badge.key)) return;
      if (!badge.check(trades)) return;
      try {
        await createSuccess({
          title:     `${badge.emoji} ${badge.title}`,
          date:      new Date().toISOString().split('T')[0],
          note:      'Badge dÃ©bloquÃ© automatiquement par Mentor-X',
          type:      'auto',
          badge_key: badge.key,
        });
        await fetchSuccesses();
      } catch {}
    });
  }, [trades, items.length]);

  const handleAdd = async (data: Omit<Success, 'id'>) => {
    try {
      await createSuccess({ ...data, type: 'manual' });
      await fetchSuccesses();
      toast.success('ðŸ† SuccÃ¨s ajoutÃ© !');
      setShowAdd(false);
    } catch { toast.error('Erreur ajout'); }
  };

const handleUpdate = async (id: string, data: Omit<Success, 'id'>) => {
    try {
      await updateSuccess(id, {
        title:  data.title,
        date:   data.date,
        note:   data.note,
        images: data.images,
      });
      await fetchSuccesses();
      toast.success('âœ… SuccÃ¨s mis Ã  jour');
      setEditTarget(null);
    } catch { toast.error('Erreur mise Ã  jour'); }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ message: 'Supprimer ce succÃ¨s ?', variant: 'danger', confirmText: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteSuccess(id);
      await fetchSuccesses();
      toast.success('SupprimÃ©');
    } catch { toast.error('Erreur suppression'); }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'auto')   return items.filter(s => s.type === 'auto');
    if (activeTab === 'manual') return items.filter(s => s.type !== 'auto');
    return items;
  }, [items, activeTab]);

  const autoCount   = items.filter(s => s.type === 'auto').length;
  const manualCount = items.filter(s => s.type !== 'auto').length;

  // â”€â”€ Badges non encore dÃ©bloquÃ©s â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const lockedBadges = useMemo(() => {
    const existingKeys = items.filter(s => s.badge_key).map(s => s.badge_key);
    return AUTO_BADGES.filter(b => !existingKeys.includes(b.key));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 su-fade-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
            <Trophy size={24} className="text-primary" /> Mes Succes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Célèbre chaque victoire· {items.length} succès enregistré{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { setAddKey(k => k+1); setShowAdd(true); }}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] transition-transform">
          <Plus size={15} /> Ajouter un succes
        </button>
      </div>

      {/* Stats rapides */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: items.length, color: 'text-foreground' },
            { label: 'Badges auto', value: autoCount, color: 'text-primary' },
            { label: 'Manuels', value: manualCount, color: 'text-warning' },
          ].map(s => (
            <GlassCard key={s.label} className="!py-3 !px-4 text-center su-fade-up">
              <p className={`text-2xl font-bold metric-value ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Tabs */}
      {items.length > 0 && (
        <div className="flex gap-2">
          {([['all','Tous'], ['auto','Badges auto'], ['manual','Manuels']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === v ? 'gradient-primary text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}>
              {l}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filtered.filter(item => item.type !== "auto").map((item, idx) => (

          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-4 shrink-0 ${item.type === 'auto' ? 'bg-primary' : 'bg-warning'}`} />
              {idx < filtered.length - 1 && <div className="w-0.5 flex-1 bg-border/30 mt-1" />}
            </div>
            <div className="flex-1 pb-2">
              <SuccessCard
                item={item}
                index={idx}
                onEdit={() => { setEditKey(k => k+1); setEditTarget(item); }}
                onDelete={() => handleDelete(String(item.id))}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tous les badges auto */}
      <div className='su-fade-up'>
        <h3 className='text-sm font-bold text-foreground mb-4'>🏆 Badges automatiques</h3>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
          {AUTO_BADGES.map(b => {
            const unlocked = items.some(s => s.badge_key === b.key);
            return (
              <div key={b.key} className={`flex items-center gap-2 p-3 rounded-xl border ${unlocked ? "bg-primary/10 border-primary/30" : "bg-accent/20 border-border/30 opacity-40 grayscale"}`}>
                <span className='text-xl'>{b.emoji}</span>
                <span className={`text-xs ${unlocked ? "text-foreground font-medium" : "text-muted-foreground"}`}>{b.title}</span>
              </div>
            );
          })}
        </div>
      </div>
      {items.length === 0 && (
        <GlassCard className="text-center py-16 su-fade-up su-s2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-primary" />
          </div>
          <p className="text-foreground font-semibold text-base">Aucun succÃ¨s enregistrÃ©</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            CÃ©lÃ¨bre tes victoires, mÃªme les petites â€” elles comptent toutes.
          </p>
          <button onClick={() => { setAddKey(k => k+1); setShowAdd(true); }}
            className="gradient-btn px-5 py-2 text-sm mt-5 inline-flex items-center gap-2">
            <Star size={14} /> Mon premier succÃ¨s
          </button>
        </GlassCard>
      )}

      {showAdd && <SuccessModal key={`add-${addKey}`} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <SuccessModal key={`edit-${editTarget.id}-${editKey}`} initial={editTarget}
          onSave={data => handleUpdate(String(editTarget.id), data)}
          onClose={() => setEditTarget(null)} />
      )}
      {ConfirmModal}
    </div>
  );
}
