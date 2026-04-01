import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trade } from '@/types/trading';
import { isDemo, DEMO_TRADES_SHIFTED } from '@/lib/demoData';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mitradacademy.mg/api';
const getToken = () => localStorage.getItem('mitrad_token');

let globalRefreshFn: (() => void) | null = null;
export const refreshTrades = () => globalRefreshFn?.();

export function useFilteredTrades(refreshKey?: number): Trade[] {
  const { activeAccounts, accounts } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tick, setTick] = useState(0);

  const fetchTrades = useCallback(() => {
    if (isDemo()) {
      setTrades(DEMO_TRADES_SHIFTED as any);
      return;
    }
    const targetAccounts = activeAccounts.length > 0 ? activeAccounts : accounts;
    if (targetAccounts.length === 0) return;
    Promise.all(
      targetAccounts.map(acc =>
        fetch(`${API_URL}/accounts/${acc.id}/trades`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
          }
        }).then(res => res.json())
      )
    ).then(results => {
      const all = results.flat().map((t: any) => ({
        ...t,
        resultR:       Number(t.result_r ?? 0),
        resultDollar:  Number(t.result_dollar ?? 0),
        entryPrice:    Number(t.entry_price ?? 0),
        stopLoss:      Number(t.stop_loss ?? 0),
        takeProfit:    Number(t.take_profit ?? 0),
        lotSize:       Number(t.lot_size ?? 0),
        exitPrice:     t.exit_price ?? null,
        entryNote:     t.entry_note ?? '',
        exitNote:      t.exit_note ?? '',
        planRespected: t.plan_respected ?? null,
      }));
      setTrades(all);
    }).catch(() => setTrades([]));
  }, [activeAccounts, accounts]);

  useEffect(() => {
    globalRefreshFn = () => setTick(t => t + 1);
    return () => { globalRefreshFn = null; };
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades, tick, refreshKey]);

  return trades;
}
