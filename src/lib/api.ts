// ─────────────────────────────────────────────────────────────────────────────
// API — MITrad Journal
// ─────────────────────────────────────────────────────────────────────────────
import NProgress from 'nprogress';
import { isDemo, DEMO_ANALYSES, DEMO_PLAN_RULES, DEMO_OBJECTIVES, DEMO_SUCCESSES } from './demoData';

// ── Demo toast ───────────────────────────────────────────────────────────────
function demoToast() {
  const id = 'demo-readonly-toast';
  if (document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  el.textContent = '🔒 Mode démo — lecture seule';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(30,30,40,0.95)',
    color: '#fff', padding: '10px 22px',
    borderRadius: '12px', fontSize: '14px',
    fontWeight: '600', zIndex: '99999',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

const API_URL = import.meta.env.VITE_API_URL || 'https://mitrad-backend.onrender.com/api';
const getToken = () => localStorage.getItem('mitrad_token');
const headers = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

let _loadingCount = 0;
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  _loadingCount++;
  if (_loadingCount === 1) NProgress.start();
  try {
    const res = await fetch(url, options);
    return res;
  } finally {
    _loadingCount--;
    if (_loadingCount === 0) NProgress.done();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSES DU JOUR
// ─────────────────────────────────────────────────────────────────────────────
export async function getAnalyses() {
  if (isDemo()) return DEMO_ANALYSES;
  const res = await apiFetch(`${API_URL}/analyses`, { headers: headers() });
  return res.json();
}

export async function createAnalysis(data: { date: string; title?: string; pairs: any[] }) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/analyses`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur création analyse');
  return res.json();
}

export async function updateAnalysis(id: string, data: { pairs: any[]; title?: string }) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/analyses/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur mise à jour analyse');
  return res.json();
}

export async function deleteAnalysis(id: string) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/analyses/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Erreur suppression analyse');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPTES DE TRADING
// ─────────────────────────────────────────────────────────────────────────────
export const getAccounts = async () => {
  if (isDemo()) return [{ id: 'demo-account', name: 'Compte Démo', type: 'Démo', capital: 10000, currency: 'USD' }];
  const res = await apiFetch(`${API_URL}/accounts`, { headers: headers() });
  return res.json();
};

export const createAccount = async (name: string, capital: number = 10000) => {
  const res = await apiFetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, capital }),
  });
  return res.json();
};

export const deleteAccount = async (id: number) => {
  const res = await apiFetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// TRADES
// ─────────────────────────────────────────────────────────────────────────────
export async function createTrade(accountId: string, trade: any) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/accounts/${accountId}/trades`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error('Erreur création trade');
  return res.json();
}

export async function updateTrade(accountId: number, tradeId: number, trade: any) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/accounts/${accountId}/trades/${tradeId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error('Erreur mise à jour trade');
  return res.json();
}

export async function deleteTrade(accountId: number, tradeId: number) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/accounts/${accountId}/trades/${tradeId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Erreur suppression trade');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DE TRADING — RÈGLES
// ─────────────────────────────────────────────────────────────────────────────
export async function getPlanRules() {
  if (isDemo()) return DEMO_PLAN_RULES;
  const res = await apiFetch(`${API_URL}/plan`, { headers: headers() });
  if (!res.ok) throw new Error('Erreur chargement plan');
  return res.json();
}

export async function createPlanRule(rule: {
  title: string;
  description: string;
  images: string[];
}) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/plan`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Erreur création règle');
  return res.json();
}

export async function updatePlanRule(id: string, rule: {
  title?: string;
  description?: string;
  images?: string[];
  order?: number;
}) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/plan/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Erreur mise à jour règle');
  return res.json();
}

export async function deletePlanRule(id: string) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/plan/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Erreur suppression règle');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DE TRADING — CHECKLIST QUOTIDIENNE
// ─────────────────────────────────────────────────────────────────────────────
export async function getDailyChecklist(date: string) {
  const res = await apiFetch(`${API_URL}/plan/checklist/${date}`, { headers: headers() });
  if (!res.ok) return { checkedIds: [] };
  return res.json(); // { date: string, checkedIds: string[] }
}

export async function saveDailyChecklist(date: string, checkedIds: string[]) {
  const res = await apiFetch(`${API_URL}/plan/checklist`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ date, checkedIds }),
  });
  if (!res.ok) throw new Error('Erreur sauvegarde checklist');
  return res.json();
}

// Objectifs
export async function getObjectives() {
  if (isDemo()) return DEMO_OBJECTIVES;
  const res = await apiFetch(`${API_URL}/objectives`, { headers: headers() });
  return res.json();
}
export async function updateObjective(id: string, data: any) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/objectives/${id}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur création objectif');
  return res.json();
}

export async function deleteObjective(id: string) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/objectives/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  if (!res.ok) throw new Error('Erreur suppression objectif');
  return res.json();
}

// Succès
export async function getSuccesses() {
  if (isDemo()) return DEMO_SUCCESSES;
  const res = await apiFetch(`${API_URL}/successes`, { headers: headers() });
  return res.json();
}

export async function createSuccess(data: {
  title: string;
  date: string;
  note?: string;
  images?: string[];
  type?: string;
  badge_key?: string;
}) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/successes`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur création succès');
  return res.json();
}

export async function updateSuccess(id: string, data: any) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/successes/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur mise à jour succès');
  return res.json();
}

export async function deleteSuccess(id: string) {
  if (isDemo()) { demoToast(); return null; }
  const res = await apiFetch(`${API_URL}/successes/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Erreur suppression succès');
  return res.json();
}

// ── PROFIL ──────────────────────────────────────────────────────────────────
export async function getProfile() {
  const res = await apiFetch(`${API_URL}/profile`, { headers: headers() });
  if (!res.ok) throw new Error('Erreur chargement profil');
  return res.json();
}

export async function updateProfile(data: any) {
  const res = await apiFetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur mise à jour profil');
  return res.json();
}

export async function updatePassword(data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  const res = await apiFetch(`${API_URL}/profile/password`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erreur changement mot de passe');
  }
  return res.json();
}
// IMPORT BULK TRADES
export async function importTrades(accountId: string, trades: any[]) {
  const res = await apiFetch(`${API_URL}/accounts/${accountId}/trades/import`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ trades }),
  });
  if (!res.ok) throw new Error('Erreur import trades');
  return res.json();
}



