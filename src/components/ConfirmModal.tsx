// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : ConfirmModal — Glassmorphism stylée (remplace window.confirm)
// Usage : const [confirm, ConfirmModal] = useConfirm();
//         await confirm({ title, message }) → true/false
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}

export function useConfirm(): [
  (opts: ConfirmOptions) => Promise<boolean>,
  React.ReactElement | null
] {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  const resolve = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpts(null);
  };

  const modal = (
    <AnimatePresence>
      {opts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => resolve(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-[20px] w-full text-center"
            style={{
              background: 'rgba(10,13,22,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              padding: '28px 32px',
              minWidth: 360,
              maxWidth: 480,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icône */}
            <div className="flex justify-center mb-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                opts.variant === 'warning' ? 'bg-warning/20' : 'bg-destructive/20'
              }`}>
                <AlertTriangle size={28} className={
                  opts.variant === 'warning' ? 'text-warning' : 'text-destructive'
                } />
              </div>
            </div>

            {opts.title && (
              <h3 className="font-bold text-foreground text-lg mt-3">{opts.title}</h3>
            )}
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{opts.message}</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => resolve(false)}
                className="flex-1 py-2.5 rounded-xl text-foreground text-sm font-medium transition-all bg-accent/40 hover:bg-accent/70"
              >
                {opts.cancelText || 'Annuler'}
              </button>
              <button
                onClick={() => resolve(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  opts.variant === 'warning'
                    ? 'bg-warning/80 hover:bg-warning text-black'
                    : opts.variant === 'default'
                    ? 'gradient-btn'
                    : 'bg-destructive hover:bg-destructive/80 text-white'
                }`}
              >
                {(opts.variant !== 'warning' && opts.variant !== 'default') && (
                  <Trash2 size={14} />
                )}
                {opts.confirmText || 'Confirmer'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return [confirm, opts ? modal : null];
}


