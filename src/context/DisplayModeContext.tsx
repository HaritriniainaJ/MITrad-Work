import React, { createContext, useContext, useState, ReactNode } from 'react';

type DisplayMode = 'R' | '%' | '$';

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  formatResult: (resultR: number, resultDollar: number, capital?: number) => string;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>('R');

  const formatResult = (resultR: number, resultDollar: number, capital?: number): string => {
    const sign = resultR >= 0 ? '+' : '';
    switch (mode) {
      case 'R':
        return `${sign}${resultR.toFixed(2)}R`;
      case '$':
        return `${sign}$${resultDollar.toFixed(2)}`;
      case '%':
        const pct = capital && capital > 0 ? (resultDollar / capital) * 100 : resultR;
        return `${sign}${pct.toFixed(2)}%`;
      default:
        return `${sign}${resultR.toFixed(2)}R`;
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
