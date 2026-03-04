import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDisplayMode, DisplayModeToggle } from '@/context/DisplayModeContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { Trade } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPage() {
  const { accounts, activeAccounts } = useAuth();
  const { mode, formatResult } = useDisplayMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const capital = useMemo(() => {
    const targets = activeAccounts.length > 0 ? activeAccounts : accounts;
    if (targets.length === 0) return 0;
    return targets.reduce((sum, acc) => sum + Number(acc.capital || 0), 0);
  }, [activeAccounts, accounts]);

  const trades = useFilteredTrades();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tradesByDay = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [trades, month, year]);

  const closedMonth = useMemo(() =>
    trades.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.status !== 'RUNNING';
    }), [trades, month, year]);

  const monthR = closedMonth.reduce((s, t) => s + t.resultR, 0);
  const monthDollar = closedMonth.reduce((s, t) => s + t.resultDollar, 0);
  const monthWR = closedMonth.length ? (closedMonth.filter(t => t.status === 'WIN').length / closedMonth.length * 100) : 0;
  const tradingDays = Object.keys(tradesByDay).length;

  const weeks = useMemo(() => {
    const result: { label: string; days: number[]; trades: Trade[]; R: number; dollar: number; wins: number; losses: number }[] = [];
    let weekDays: number[] = [];
    let weekNum = 1;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = (firstDay + d - 1) % 7;
      weekDays.push(d);
      if (dayOfWeek === 6 || d === daysInMonth) {
        const weekTrades: Trade[] = [];
        weekDays.forEach(day => {
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (tradesByDay[key]) weekTrades.push(...tradesByDay[key]);
        });
        const closed = weekTrades.filter(t => t.status !== 'RUNNING');
        result.push({
          label: `Semaine ${weekNum}`,
          days: [...weekDays],
          trades: weekTrades,
          R: closed.reduce((s, t) => s + t.resultR, 0),
          dollar: closed.reduce((s, t) => s + t.resultDollar, 0),
          wins: closed.filter(t => t.status === 'WIN').length,
          losses: closed.filter(t => t.status === 'LOSS').length,
        });
        weekDays = [];
        weekNum++;
      }
    }
    return result;
  }, [tradesByDay, firstDay, daysInMonth, month, year]);

  const fmtDay = (dayR: number, dayDollar: number): string => {
    if (mode === 'R') return `${dayR >= 0 ? '+' : ''}${dayR.toFixed(1)}R`;
    if (mode === '$') return `${dayDollar >= 0 ? '+' : '-'}$${Math.abs(dayDollar).toFixed(0)}`;
    const pct = capital > 0 ? (dayDollar / capital) * 100 : dayR;
    return `${pct >= 0 ? '+' : '-'}${Math.abs(pct).toFixed(2)}%`;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const selectedDayTrades = selectedDay ? tradesByDay[selectedDay] || [] : [];
  const selectedDayR = selectedDayTrades.reduce((s, t) => s + t.resultR, 0);
  const selectedDayDollar = selectedDayTrades.reduce((s, t) => s + t.resultDollar, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Calendrier</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de tes journées de trading</p>
        </div>
        <DisplayModeToggle />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="animate-fade-up stagger-1 !p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-transparent pointer-events-none rounded-2xl" />
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2">
            <svg width="14" height="14" fill="none" stroke="#1A6BFF" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Trades</p>
          <p className="metric-value text-2xl text-foreground mt-0.5">{closedMonth.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{tradingDays} jours actifs</p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-2 !p-5 relative overflow-hidden">
          <div className={`absolute inset-0 pointer-events-none rounded-2xl ${monthR >= 0 ? 'bg-gradient-to-br from-success/8 to-transparent' : 'bg-gradient-to-br from-destructive/8 to-transparent'}`} />
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${monthR >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
            <svg width="14" height="14" fill="none" stroke={monthR >= 0 ? '#00D4AA' : '#FF4757'} strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">P&L du mois</p>
          <p className={`metric-value text-2xl mt-0.5 ${monthR >= 0 ? 'text-success' : 'text-destructive'}`}>{formatResult(monthR, monthDollar, capital)}</p>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-3 !p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none rounded-2xl" />
          <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center mb-2">
            <svg width="14" height="14" fill="none" stroke="#00D4AA" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
          <p className="metric-value text-2xl text-success mt-0.5">{monthWR.toFixed(0)}%</p>
          <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-success/50 transition-all duration-1000" style={{ width: `${monthWR}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="animate-fade-up stagger-4 !p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none rounded-2xl" />
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
            <svg width="14" height="14" fill="none" stroke="#6C3AFF" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">R Moyen / Jour</p>
          <p className={`metric-value text-2xl mt-0.5 ${monthR >= 0 ? 'text-success' : 'text-destructive'}`}>
            {tradingDays > 0 ? formatResult(monthR / tradingDays, monthDollar / tradingDays, capital) : '—'}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-accent/60 transition-all text-muted-foreground hover:text-foreground"><ChevronLeft size={16} /></button>
          <h2 className="text-lg font-bold text-foreground capitalize">{currentDate.toLocaleDateString('fr', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-accent/60 transition-all text-muted-foreground hover:text-foreground"><ChevronRight size={16} /></button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-8 gap-1 mb-2 border-b border-white/5 pb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/60 py-1">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.charAt(0)}</span>
            </div>
          ))}
          <div className="text-center text-[9px] sm:text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/60 py-1">Total</div>
        </div>

        {/* Rangées par semaine */}
        <div className="space-y-1.5">
          {weeks.map((week, wIdx) => {
            const weekValue = mode === 'R' ? week.R : week.dollar;
            const hasAnyTrade = week.trades.length > 0;
            const firstDayOfWeekDow = (firstDay + week.days[0] - 1) % 7;
            return (
              <div key={wIdx} className="grid grid-cols-8 gap-1.5 items-stretch">
                {wIdx === 0 && Array.from({ length: firstDayOfWeekDow }, (_, i) => (
                  <div key={`pad-${i}`} className="min-h-[48px] sm:min-h-[90px]" />
                ))}
                {dayNames.map((_, di) => {
                  const dayIdx = wIdx === 0 ? di - firstDayOfWeekDow : di;
                  const day = week.days[dayIdx];
                  const validDay = day !== undefined && day >= 1 && day <= daysInMonth;
                  const key = validDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                  const dayTrades = validDay ? (tradesByDay[key] || []) : [];
                  const dayR = dayTrades.reduce((s, t) => s + t.resultR, 0);
                  const dayDollar = dayTrades.reduce((s, t) => s + t.resultDollar, 0);
                  const hasTrades = dayTrades.length > 0;
                  const isToday = validDay && new Date().toDateString() === new Date(year, month, day).toDateString();
                  const isSelected = selectedDay === key;
                  const isHovered = hoveredDay === key;
                  const dv = mode === 'R' ? dayR : dayDollar;
                  const bgClass = !validDay ? '' : !hasTrades ? 'bg-accent/20 border-transparent' : dv > 0 ? 'bg-success/15 hover:bg-success/25' : dv < 0 ? 'bg-destructive/15 hover:bg-destructive/25' : 'bg-warning/15 hover:bg-warning/25';
                  const borderStyle = validDay && hasTrades ? dv > 0 ? '1px solid rgba(0,212,170,0.4)' : dv < 0 ? '1px solid rgba(255,59,92,0.4)' : '1px solid rgba(245,158,11,0.4)' : undefined;
                  if (!validDay) return <div key={`empty-${wIdx}-${di}`} className="min-h-[48px] sm:min-h-[90px]" />;
                  return (
                    <div key={day} className="relative">
                      <button
                        onClick={() => hasTrades && setSelectedDay(isSelected ? null : key)}
                        onMouseEnter={() => hasTrades && setHoveredDay(key)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`min-h-[48px] sm:min-h-[90px] w-full rounded-xl border p-1 sm:p-1.5 text-xs transition-all duration-200 flex flex-col items-center justify-start relative ${bgClass} ${hasTrades ? 'cursor-pointer hover:scale-[1.04]' : 'cursor-default border-transparent'} ${isSelected ? 'ring-2 ring-primary/60 scale-[1.04]' : ''} ${isToday && !hasTrades ? 'border-primary/30 bg-primary/10' : ''}`}
                        style={{ border: borderStyle }}>
                        <span className={`font-semibold leading-tight self-start text-xs ${isToday ? 'text-primary' : hasTrades ? 'text-foreground' : 'text-muted-foreground/60'}`}>{day}</span>
                        {hasTrades && (
                          <>
                            <span className={`metric-value text-[9px] sm:text-sm font-bold leading-tight mt-auto ${dv > 0 ? 'text-success' : dv < 0 ? 'text-destructive' : 'text-warning'}`}>{fmtDay(dayR, dayDollar)}</span>
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground">{dayTrades.length}T</span>
                          </>
                        )}
                        {!hasTrades && <div className="w-1.5 h-1.5 rounded-full bg-white/10 mx-auto mt-4" />}
                      </button>
                      {isHovered && hasTrades && (
                        <div className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none" style={{ minWidth: 180 }}>
                          <div className="rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]" style={{ background: '#0A0D16', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="text-xs font-semibold text-foreground mb-2">{new Date(key + 'T12:00:00').toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                            {dayTrades.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-3 text-[10px] mb-1">
                                <span className="text-muted-foreground">{t.pair} {t.direction}</span>
                                <span className={t.resultR >= 0 ? 'text-success' : 'text-destructive'}>{t.resultR >= 0 ? '+' : ''}{t.resultR.toFixed(1)}R</span>
                              </div>
                            ))}
                            <div className="border-t border-white/8 mt-2 pt-1.5 flex justify-between">
                              <span className="text-[10px] text-muted-foreground">Total</span>
                              <span className={`text-xs font-bold ${dayR >= 0 ? 'text-success' : 'text-destructive'}`}>{dayR >= 0 ? '+' : ''}{dayR.toFixed(2)}R</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Total semaine */}
                <div className={`min-h-[48px] sm:min-h-[90px] rounded-xl border p-2 flex flex-col items-center justify-center text-center ${!hasAnyTrade ? 'bg-accent/10 border-border/20' : weekValue > 0 ? 'bg-success/10 border-success/25' : weekValue < 0 ? 'bg-destructive/10 border-destructive/25' : 'bg-warning/10 border-warning/25'}`}>
                  <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Sem. {wIdx + 1}</span>
                  {hasAnyTrade ? (
                    <>
                      <span className={`metric-value text-[9px] sm:text-sm font-bold ${weekValue > 0 ? 'text-success' : weekValue < 0 ? 'text-destructive' : 'text-warning'}`}>{fmtDay(week.R, week.dollar)}</span>
                      <span className="text-[8px] text-muted-foreground mt-0.5">{week.trades.length}T</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center flex-wrap gap-3 mt-5 pt-4 border-t border-border/30">
          {[{ bg: 'bg-success/30 border-success/40', label: 'Positif' }, { bg: 'bg-destructive/30 border-destructive/40', label: 'Négatif' }, { bg: 'bg-warning/30 border-warning/40', label: 'Breakeven' }].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${item.bg}`} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] text-muted-foreground">Valeurs en</span>
            <span className="text-[10px] font-bold text-primary">{mode === 'R' ? 'R' : mode === '$' ? 'USD' : '%'}</span>
          </div>
        </div>
      </GlassCard>

      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content glass p-6 max-w-md w-full max-h-[75vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-foreground capitalize">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <p className={`metric-value text-lg mt-1 ${selectedDayR >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {fmtDay(selectedDayR, selectedDayDollar)}
                  <span className="text-xs font-normal text-muted-foreground ml-2">({selectedDayTrades.length} trade{selectedDayTrades.length > 1 ? 's' : ''})</span>
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground mt-1"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'R', val: `${selectedDayR >= 0 ? '+' : ''}${selectedDayR.toFixed(2)}R`, color: selectedDayR >= 0 ? 'text-success' : 'text-destructive' },
                { label: '%', val: (() => { const p = capital > 0 ? (selectedDayDollar / capital) * 100 : 0; return `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`; })(), color: selectedDayR >= 0 ? 'text-success' : 'text-destructive' },
                { label: '$', val: (() => { const d = selectedDayDollar; return `${d >= 0 ? '+' : '-'}$${Math.abs(d).toFixed(0)}`; })(), color: selectedDayR >= 0 ? 'text-success' : 'text-destructive' },
              ].map(item => (
                <div key={item.label} className="text-center py-2 rounded-xl bg-accent/40 border border-border/30">
                  <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                  <p className={`metric-value text-sm ${item.color}`}>{item.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {selectedDayTrades.map(t => (
                <div key={t.id} className="p-3 rounded-xl bg-accent/40 border border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.direction === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.direction}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{t.pair}</p>
                      <p className="text-[10px] text-muted-foreground">{t.setup}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className={`metric-value text-sm ${t.resultR != null && t.resultR >= 0 ? 'text-success' : 'text-destructive'}`}>{t.resultR != null ? (t.resultR >= 0 ? '+' : '') + t.resultR.toFixed(2) + 'R' : 'RR à définir'}</p>
                      <p className="text-[10px] text-muted-foreground">{t.resultDollar != null ? (t.resultDollar >= 0 ? '+' : '-') + '$' + Math.abs(t.resultDollar).toFixed(0) : ''}</p>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.status === 'WIN' ? 'badge-win' : t.status === 'LOSS' ? 'badge-loss' : 'badge-be'}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}