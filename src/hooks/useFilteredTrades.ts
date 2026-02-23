import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { Trade } from '@/types/trading';

/**
 * Retourne les trades filtrés selon la sélection active dans le sidebar.
 * - activeAccounts.length > 0 → filtre sur ces comptes précis
 * - activeAccounts.length === 0 → tous les comptes (aucun filtre)
 * Accepte un refreshKey optionnel pour forcer le recalcul.
 */
export function useFilteredTrades(refreshKey?: number): Trade[] {
  const { user, activeAccounts } = useAuth();

  return useMemo(() => {
    if (!user) return [];
    const ids = activeAccounts.map(a => a.id);
    return StorageManager.getUserTradesByAccounts(user.email, ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeAccounts, refreshKey]);
}