import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { StorageManager } from '@/lib/storage';
import { TradingAccount, ACCOUNT_TYPES } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { Download, Upload, Trash2, LogOut, Plus, X, AlertTriangle, Pencil, Sun, Moon } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user, updateProfile, logout, accounts, refreshAccounts } = useAuth();
  const { theme, setTheme } = useTheme();
  const [capital, setCapital] = useState(String(user!.capital));
  const [goalR, setGoalR] = useState(String(user!.monthlyGoalR));
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TradingAccount | null>(null);
  const [editForm, setEditForm] = useState({ name: '', broker: '', type: 'Personnel' as TradingAccount['type'], capital: '' });
  // Modale de confirmation glassmorphism
  const [confirmDel, ConfirmModalDel] = useConfirm();
  const [confirmReset, ConfirmModalReset] = useConfirm();
  const [confirmLogout, ConfirmModalLogout] = useConfirm();

  const [newAccount, setNewAccount] = useState({
    name: '',
    broker: '',
    type: 'Personnel' as TradingAccount['type'],
    capital: '10000',
  });

  const saveCapital = () => {
    const val = parseFloat(capital);
    if (isNaN(val) || val <= 0) { toast.error('Capital invalide'); return; }
    updateProfile({ capital: val });
    toast.success('Capital mis à jour');
  };

  const saveGoal = () => {
    const val = parseFloat(goalR);
    if (isNaN(val) || val <= 0) { toast.error('Objectif invalide'); return; }
    updateProfile({ monthlyGoalR: val });
    toast.success('Objectif mis à jour');
  };

  const addAccount = () => {
    if (!newAccount.name || !newAccount.broker) { toast.error('Nom et broker requis'); return; }
    const account: TradingAccount = {
      id: `${user!.email}-account-${Date.now()}`,
      userId: user!.email,
      name: newAccount.name,
      broker: newAccount.broker,
      type: newAccount.type,
      capital: parseFloat(newAccount.capital) || 10000,
    };
    StorageManager.addAccount(account);
    refreshAccounts();
    setShowAddAccount(false);
    setNewAccount({ name: '', broker: '', type: 'Personnel', capital: '10000' });
    toast.success('Compte ajouté');
  };

  const openEdit = (acc: TradingAccount) => {
    setEditTarget(acc);
    setEditForm({
      name: acc.name,
      broker: acc.broker,
      type: acc.type,
      capital: String(acc.capital),
    });
  };

  const saveEdit = () => {
    if (!editTarget) return;
    if (!editForm.name || !editForm.broker) { toast.error('Nom et broker requis'); return; }
    const cap = parseFloat(editForm.capital);
    if (isNaN(cap) || cap <= 0) { toast.error('Capital invalide'); return; }
    StorageManager.updateAccount(editTarget.id, {
      name: editForm.name,
      broker: editForm.broker,
      type: editForm.type,
      capital: cap,
    });
    refreshAccounts();
    setEditTarget(null);
    toast.success('Compte mis à jour');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    StorageManager.deleteAccount(deleteTarget);
    refreshAccounts();
    setDeleteTarget(null);
    toast.success('Compte supprimé');
  };

  const exportBackup = () => {
    const data = StorageManager.exportData(user!.email);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mitrad-backup-${user!.name}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Sauvegarde exportée');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        StorageManager.importData(reader.result as string, user!.email);
        toast.success('Données importées');
      } catch { toast.error('Fichier de sauvegarde invalide'); }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const trades = StorageManager.getUserTrades(user!.email);
    const csv = StorageManager.tradesToCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trades.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exporté');
  };

  const resetData = async () => {
    const ok = await confirmReset({ title: '⚠️ Réinitialiser les données', message: 'Cela supprimera TOUS tes trades et analyses. Cette action est irréversible.', confirmText: 'Oui, tout supprimer', variant: 'danger' });
    if (ok) {
      StorageManager.resetUserData(user!.email);
      toast.success('Données réinitialisées');
    }
  };

  const handleLogout = async () => {
    const ok = await confirmLogout({ title: 'Se déconnecter', message: 'Tu vas être redirigé vers la page de connexion.', confirmText: 'Déconnexion', variant: 'warning' });
    if (ok) logout();
  };

  const deleteTargetAccount = accounts.find(a => a.id === deleteTarget);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Gère ton compte et tes données</p>
      </div>

      {/* Apparence */}
      <GlassCard className="animate-fade-up">
        <h3 className="text-sm font-bold text-foreground mb-3">Apparence</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-warning" />}
            <div>
              <p className="text-sm font-medium text-foreground">Mode sombre</p>
              <p className="text-xs text-muted-foreground">Basculer entre l'interface claire et sombre</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-accent/60'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </GlassCard>

      {/* Compte utilisateur */}
      <GlassCard className="animate-fade-up">
        <h3 className="text-sm font-bold text-foreground mb-3">Compte utilisateur</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold">
            {user!.name.charAt(0)}
          </div>
          <div>
            <p className="text-foreground font-medium">{user!.name}</p>
            <p className="text-xs text-muted-foreground">{user!.email}</p>
          </div>
        </div>
      </GlassCard>

      {/* Comptes de trading */}
      <GlassCard className="animate-fade-up stagger-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Comptes de trading</h3>
          <button
            onClick={() => setShowAddAccount(true)}
            className="gradient-btn px-3 py-1.5 text-xs flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>

        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{acc.name}</p>
                  {acc.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {acc.broker} · {acc.type} · ${acc.capital.toLocaleString()}
                </p>
              </div>
              {/* Boutons Modifier + Supprimer */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(acc)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 rounded transition-colors"
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(acc.id)}
                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddAccount && (
          <div className="mt-4 p-4 rounded-lg bg-accent/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Nouveau compte</span>
              <button onClick={() => setShowAddAccount(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nom du compte *</label>
                <input
                  value={newAccount.name}
                  onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))}
                  className="input-dark mt-1"
                  placeholder="Ex: FTMO Challenge"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Broker / PropFirm *</label>
                <input
                  value={newAccount.broker}
                  onChange={e => setNewAccount(p => ({ ...p, broker: e.target.value }))}
                  className="input-dark mt-1"
                  placeholder="Ex: FTMO"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount(p => ({ ...p, type: e.target.value as TradingAccount['type'] }))}
                  className="select-dark mt-1"
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Capital ($)</label>
                <input
                  type="number"
                  value={newAccount.capital}
                  onChange={e => setNewAccount(p => ({ ...p, capital: e.target.value }))}
                  className="input-dark mt-1"
                />
              </div>
            </div>
            <button onClick={addAccount} className="gradient-btn px-4 py-2 text-sm">
              Ajouter le compte
            </button>
          </div>
        )}
      </GlassCard>

      {/* Capital */}
      <GlassCard className="animate-fade-up stagger-2">
        <h3 className="text-sm font-bold text-foreground mb-3">Capital de référence</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Capital ($)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              className="input-dark mt-1"
            />
          </div>
          <button onClick={saveCapital} className="gradient-btn px-4 py-2.5 text-sm">Enregistrer</button>
        </div>
      </GlassCard>

      {/* Objectif mensuel */}
      <GlassCard className="animate-fade-up stagger-3">
        <h3 className="text-sm font-bold text-foreground mb-3">Objectif mensuel</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Objectif (R)</label>
            <input
              type="number"
              value={goalR}
              onChange={e => setGoalR(e.target.value)}
              className="input-dark mt-1"
            />
          </div>
          <button onClick={saveGoal} className="gradient-btn px-4 py-2.5 text-sm">Enregistrer</button>
        </div>
      </GlassCard>

      {/* Gestion des données */}
      <GlassCard className="animate-fade-up stagger-4">
        <h3 className="text-sm font-bold text-foreground mb-4">Gestion des données</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={exportBackup}
            className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-foreground text-sm hover:bg-accent transition-colors"
          >
            <Download size={16} className="text-primary" /> Exporter sauvegarde (JSON)
          </button>
          <label className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-foreground text-sm hover:bg-accent transition-colors cursor-pointer">
            <Upload size={16} className="text-primary" /> Importer sauvegarde (JSON)
            <input type="file" accept=".json" onChange={importBackup} className="hidden" />
          </label>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-foreground text-sm hover:bg-accent transition-colors"
          >
            <Download size={16} className="text-success" /> Exporter trades CSV
          </button>
          <button
            onClick={resetData}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm hover:bg-destructive/20 transition-colors"
          >
            <Trash2 size={16} /> Réinitialiser les données
          </button>
        </div>
      </GlassCard>

      {/* Déconnexion */}
      <GlassCard className="animate-fade-up">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-destructive text-sm hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors w-full"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </GlassCard>

      {/* ═══ MODALE MODIFIER COMPTE ═══ */}
      <AnimatePresence>
        {editTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setEditTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-[0_4px_40px_rgba(0,0,0,0.6)] p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Modifier le compte</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editTarget.name}</p>
                </div>
                <button
                  onClick={() => setEditTarget(null)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulaire */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nom du compte *</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="input-dark mt-1"
                    placeholder="Ex: FTMO Challenge"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Broker / PropFirm *</label>
                  <input
                    value={editForm.broker}
                    onChange={e => setEditForm(p => ({ ...p, broker: e.target.value }))}
                    className="input-dark mt-1"
                    placeholder="Ex: FTMO"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select
                      value={editForm.type}
                      onChange={e => setEditForm(p => ({ ...p, type: e.target.value as TradingAccount['type'] }))}
                      className="select-dark mt-1"
                    >
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Capital ($)</label>
                    <input
                      type="number"
                      value={editForm.capital}
                      onChange={e => setEditForm(p => ({ ...p, capital: e.target.value }))}
                      className="input-dark mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 gradient-btn px-4 py-2.5 text-sm font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODALE CONFIRMATION SUPPRESSION ═══ */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-[0_4px_40px_rgba(0,0,0,0.6)] p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/15 border border-destructive/30 mx-auto mb-4">
                <AlertTriangle size={22} className="text-destructive" />
              </div>
              <h2 className="text-center text-lg font-bold text-foreground mb-1">
                Supprimer ce compte ?
              </h2>
              {deleteTargetAccount && (
                <p className="text-center text-xs text-primary font-medium mb-3">
                  {deleteTargetAccount.name} — {deleteTargetAccount.broker}
                </p>
              )}
              <p className="text-center text-sm text-muted-foreground mb-6 leading-relaxed">
                Tous les trades liés à ce compte resteront dans ton historique,
                mais le compte sera définitivement supprimé.{' '}
                <span className="text-destructive font-medium">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-bold hover:bg-destructive/80 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {ConfirmModalDel}
      {ConfirmModalReset}
      {ConfirmModalLogout}
    </div>
  );
}