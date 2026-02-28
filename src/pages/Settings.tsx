import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { TradingAccount, ACCOUNT_TYPES } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { LogOut, Plus, X, AlertTriangle, Pencil, Sun, Moon, Trash2, Eye, EyeOff } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user, logout, accounts, refreshAccounts } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
const [deletePassword, setDeletePassword] = useState('');
const [showDeletePassword, setShowDeletePassword] = useState(false);
const [showSetPassword, setShowSetPassword] = useState(false);
const [newPassword, setNewPassword] = useState('');
const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [editTarget, setEditTarget] = useState<TradingAccount | null>(null);
  const [editForm, setEditForm] = useState({ name: '', broker: '', type: 'Personnel' as TradingAccount['type'], capital: '' });
  const [confirmDel, ConfirmModalDel] = useConfirm();
  const [confirmReset, ConfirmModalReset] = useConfirm();
  const [confirmLogout, ConfirmModalLogout] = useConfirm();
  const [newAccount, setNewAccount] = useState({ name: '', broker: '', type: 'Personnel' as TradingAccount['type'], capital: '10000' });

  const deleteTargetAccount = accounts.find(a => a.id === deleteTarget);

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.broker) { toast.error('Nom et broker requis'); return; }
    try {
      const res = await fetch('http://localhost:8000/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('mitrad_token') },
        body: JSON.stringify({ name: newAccount.name, broker: newAccount.broker, type: newAccount.type, capital: parseFloat(newAccount.capital) || 10000 }),
      });
      if (res.ok) {
        refreshAccounts();
        setShowAddAccount(false);
        setNewAccount({ name: '', broker: '', type: 'Personnel', capital: '10000' });
        toast.success('Compte ajouté');
      } else { toast.error('Erreur lors de l\'ajout'); }
    } catch { toast.error('Erreur réseau'); }
  };

  const openEdit = (acc: TradingAccount) => {
    setEditTarget(acc);
    setEditForm({ name: acc.name, broker: acc.broker, type: acc.type, capital: String(acc.capital) });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name || !editForm.broker) { toast.error('Nom et broker requis'); return; }
    const cap = parseFloat(editForm.capital);
    if (isNaN(cap) || cap <= 0) { toast.error('Capital invalide'); return; }
    try {
      const res = await fetch(`http://localhost:8000/api/accounts/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('mitrad_token') },
        body: JSON.stringify({ name: editForm.name, broker: editForm.broker, type: editForm.type, capital: cap }),
      });
      if (res.ok) { refreshAccounts(); setEditTarget(null); toast.success('Compte mis à jour'); }
      else { toast.error('Erreur lors de la mise à jour'); }
    } catch { toast.error('Erreur réseau'); }
  };

const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`http://localhost:8000/api/accounts/${deleteTarget}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('mitrad_token'), 'Content-Type': 'application/json' },
      });
      if (res.ok) { refreshAccounts(); setDeleteTarget(null); setDeletePassword(''); toast.success('Compte supprimé'); }
      else { toast.error('Erreur lors de la suppression'); }
    } catch { toast.error('Erreur réseau'); }
  };

  const [currentPassword, setCurrentPassword] = useState('');
const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error('Mot de passe trop court (min 8 caractères)'); return; }
    if (newPassword !== newPasswordConfirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (user?.password_set && !currentPassword) { toast.error('Ancien mot de passe requis'); return; }
    try {
      const url = user?.password_set ? 'http://localhost:8000/api/profile/password' : 'http://localhost:8000/api/profile/set-password';
      const body = user?.password_set 
        ? { current_password: currentPassword, password: newPassword, password_confirmation: newPasswordConfirm }
        : { password: newPassword, password_confirmation: newPasswordConfirm };
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('mitrad_token') },
        body: JSON.stringify(body),
      });
      if (res.ok) { 
        toast.success(user?.password_set ? 'Mot de passe changé !' : 'Mot de passe défini !'); 
        setShowSetPassword(false); setNewPassword(''); setNewPasswordConfirm(''); setCurrentPassword('');
        // Mettre à jour le user local
        const updatedUser = { ...user, password_set: true };
        localStorage.setItem('mitrad_user', JSON.stringify(updatedUser));
      }
      else { toast.error('Erreur'); }
    } catch { toast.error('Erreur réseau'); }
  };

  const handleLogout = async () => {
    const ok = await confirmLogout({ title: 'Se déconnecter', message: 'Tu vas être redirigé vers la page de connexion.', confirmText: 'Déconnexion', variant: 'warning' });
    if (ok) logout();
  };

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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold">
            {user!.name.charAt(0)}
          </div>
          <div>
            <p className="text-foreground font-medium">{user!.name}</p>
            <p className="text-xs text-muted-foreground">{user!.email}</p>
          </div>
        </div>
        <button onClick={() => setShowSetPassword(true)} className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
          🔑 {user?.password_set ? 'Changer le mot de passe' : 'Définir un mot de passe'}
        </button>
        {showSetPassword && (
          <div className="mt-3 space-y-2">
            {user?.password_set && (
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Ancien mot de passe" className="input-dark w-full" />
            )}
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe (min 8 car.)" className="input-dark w-full" />
            <input type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="Confirmer le mot de passe" className="input-dark w-full" />
            <div className="flex gap-2">
              <button onClick={handleSetPassword} className="flex-1 gradient-btn px-3 py-1.5 text-xs">Enregistrer</button>
              <button onClick={() => setShowSetPassword(false)} className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">Annuler</button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Comptes de trading */}
      <GlassCard className="animate-fade-up stagger-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Comptes de trading</h3>
          <button onClick={() => setShowAddAccount(true)} className="gradient-btn px-3 py-1.5 text-xs flex items-center gap-1">
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Principal</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{acc.broker} · {acc.type} · ${acc.capital.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(acc)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 rounded transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(acc.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Déconnexion */}
      <GlassCard className="animate-fade-up">
        <button onClick={handleLogout} className="flex items-center gap-2 text-destructive text-sm hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors w-full">
          <LogOut size={16} /> Déconnexion
        </button>
      </GlassCard>

      {/* MODALE AJOUTER COMPTE */}
      <AnimatePresence>
        {showAddAccount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowAddAccount(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-[0_4px_40px_rgba(0,0,0,0.6)] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Nouveau compte</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ajoute un compte de trading</p>
                </div>
                <button onClick={() => setShowAddAccount(false)} className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nom du compte *</label>
                  <input value={newAccount.name} onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))} className="input-dark mt-1" placeholder="Ex: FTMO Challenge" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Broker / PropFirm *</label>
                  <input value={newAccount.broker} onChange={e => setNewAccount(p => ({ ...p, broker: e.target.value }))} className="input-dark mt-1" placeholder="Ex: FTMO" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select value={newAccount.type} onChange={e => setNewAccount(p => ({ ...p, type: e.target.value as TradingAccount['type'] }))} className="select-dark mt-1">
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Capital ($)</label>
                    <input type="number" value={newAccount.capital} onChange={e => setNewAccount(p => ({ ...p, capital: e.target.value }))} className="input-dark mt-1" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddAccount(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Annuler</button>
                <button onClick={addAccount} className="flex-1 gradient-btn px-4 py-2.5 text-sm font-bold">Ajouter</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE MODIFIER COMPTE */}
      <AnimatePresence>
        {editTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setEditTarget(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-[0_4px_40px_rgba(0,0,0,0.6)] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Modifier le compte</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editTarget.name}</p>
                </div>
                <button onClick={() => setEditTarget(null)} className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nom du compte *</label>
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input-dark mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Broker / PropFirm *</label>
                  <input value={editForm.broker} onChange={e => setEditForm(p => ({ ...p, broker: e.target.value }))} className="input-dark mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as TradingAccount['type'] }))} className="select-dark mt-1">
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Capital ($)</label>
                    <input type="number" value={editForm.capital} onChange={e => setEditForm(p => ({ ...p, capital: e.target.value }))} className="input-dark mt-1" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditTarget(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Annuler</button>
                <button onClick={saveEdit} className="flex-1 gradient-btn px-4 py-2.5 text-sm font-bold">Enregistrer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE CONFIRMATION SUPPRESSION */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => { setDeleteTarget(null); setDeletePassword(''); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-[0_4px_40px_rgba(0,0,0,0.6)] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/15 border border-destructive/30 mx-auto mb-4">
                <AlertTriangle size={22} className="text-destructive" />
              </div>
              <h2 className="text-center text-lg font-bold text-foreground mb-1">Supprimer ce compte ?</h2>
              {deleteTargetAccount && (
                <p className="text-center text-xs text-primary font-medium mb-3">{deleteTargetAccount.name} — {deleteTargetAccount.broker}</p>
              )}
              <p className="text-center text-sm text-muted-foreground mb-4 leading-relaxed">
                Tous les trades liés à ce compte resteront dans ton historique, mais le compte sera définitivement supprimé.{' '}
                <span className="text-destructive font-medium">Cette action est irréversible.</span>
              </p>
              <div className="mb-4">
                <label className="text-xs text-muted-foreground">Confirmez avec votre mot de passe</label>
                <div className="relative mt-1">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="input-dark w-full pr-10"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setDeleteTarget(null); setDeletePassword(''); }} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Annuler</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-bold hover:bg-destructive/80 transition-colors">Supprimer</button>
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

