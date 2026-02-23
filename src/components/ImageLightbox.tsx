// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT GLOBAL : ImageLightbox
// Permet d'afficher n'importe quelle image en plein écran au clic.
// Supporte navigation multi-images (gauche/droite) et fermeture clavier (Escape).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ImageLightboxProps {
  images: string[];          // Tableau d'images base64 ou URLs
  initialIndex?: number;     // Index de départ (défaut 0)
  onClose: () => void;       // Callback de fermeture
  alt?: string;              // Texte alternatif
}

// ── Composant Lightbox ────────────────────────────────────────────────────────

export function ImageLightbox({ images, initialIndex = 0, onClose, alt = 'Image' }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  // Navigation clavier (←, →, Escape)
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft')  setCurrent(i => (i - 1 + images.length) % images.length);
    if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % images.length);
  }, [images.length, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Navigation gauche/droite
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  // Rendu via Portal pour échapper tout overflow:hidden parent
  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all"
      >
        <X size={18} />
      </button>

      {/* Compteur si plusieurs images */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Zone image centrale */}
      <div
        className="flex items-center gap-4 px-16 max-w-[100vw]"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modal-in 0.22s cubic-bezier(.34,1.2,.64,1) both' }}
      >
        {/* Bouton précédent */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Image principale */}
        <img
          src={images[current]}
          alt={alt}
          className="max-w-[85vw] max-h-[88vh] object-contain rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        />

        {/* Bouton suivant */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shrink-0"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Points indicateurs (navigation visuelle) */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i); }}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ── Wrapper pratique pour une image simple ─────────────────────────────────

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * ZoomableImage — Image cliquable qui s'ouvre en lightbox au clic.
 * Ajoute une icône loupe au hover pour indiquer l'interactivité.
 */
export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="relative group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt || 'Image'} className={className} />
        {/* Overlay au hover avec icône zoom */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
          <ZoomIn size={28} className="text-white drop-shadow-lg" />
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <ImageLightbox
          images={[src]}
          onClose={() => setOpen(false)}
          alt={alt}
        />
      )}
    </>
  );
}
