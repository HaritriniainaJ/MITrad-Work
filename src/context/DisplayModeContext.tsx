import React, { createContext, useContext, useState, ReactNode } from 'react';

type DisplayMode = 'R' | '%' | '$';

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  formatResult: (resultR: number, resultDollar: number, capital?: number) => string;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>('%');

  const formatResult = (resultR: number | null, resultDollar: number, capital?: number): string => {
    const sign = (resultDollar ?? 0) >= 0 ? '+' : '';
    switch (mode) {
      case 'R':
        if (resultR == null || resultR === 0) return 'À définir';
        return `${resultR >= 0 ? '+' : ''}${resultR.toFixed(2)}R`;
      case '$':
        return `${sign}$${(resultDollar ?? 0).toFixed(2)}`;
      case '%':
        if (capital && capital > 0) {
          const pct = ((resultDollar ?? 0) / capital) * 100;
          return `${sign}${pct.toFixed(2)}%`;
        }
        return `${sign}${(resultDollar ?? 0).toFixed(2)}$`;
      default:
        if (resultR == null || resultR === 0) return 'À définir';
        return `${resultR >= 0 ? '+' : ''}${resultR.toFixed(2)}R`;
    }
  };

  return (
    <DisplayModeContext.Provider value={{ mode, setMode, formatResult }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) throw new Error('useDisplayMode must be used within DisplayModeProvider');
  return ctx;
}

export function DisplayModeToggle() {
  const { mode, setMode } = useDisplayMode();
  const modes: DisplayMode[] = ['R', '%', '$'];

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-accent/60 border border-border/50">
      {modes.map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
            mode === m
              ? 'gradient-primary text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}



