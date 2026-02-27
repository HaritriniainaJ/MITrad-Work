import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'blue' | 'gold' | 'success' | 'none';
}

export default function GlassCard({ children, className, onClick, glow = 'none' }: GlassCardProps) {
  const glowStyles = {
    none:    '',
    blue:    'shadow-[0_0_25px_rgba(26,107,255,0.35)] border-blue-500/20',
    gold:    'shadow-[0_0_25px_rgba(255,184,0,0.35)]  border-yellow-400/20',
    success: 'shadow-[0_0_25px_rgba(0,212,170,0.35)]  border-emerald-400/20',
  };

  return (
    <div
      className={cn(
        'glass p-6 transition-all duration-300',
        glowStyles[glow],
        onClick && 'cursor-pointer glass-hover',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

