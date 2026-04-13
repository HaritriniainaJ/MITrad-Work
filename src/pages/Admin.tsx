import { useState, useEffect } from 'react';
import { Shield, Users, Trash2, ToggleLeft, ToggleRight, Crown, Eye, EyeOff, RefreshCw } from 'lucide-react';

const API_URL = 'https://api.mitradacademy.mg/api';

function getToken() {
  return localStorage.getItem('mitrad_token');
}

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  is_public: boolean;
  provider: string | null;
  avatar: string | null;
  country: string | null;
  broker: string | null;
  experience: string | null;
  trading_style: string | null;
  created_at: string;
}

export default function Admin() {
  const [tab, setTab] = useState<'discord' | 'classic'>('classic');
  const [discord, setDiscord] = useState<User[]>([]);
  const [classic, setClassic] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 403) { setError('Accès refusé — tu n\'es pas admin.'); return; }
      const data = await res.json();
      setDiscord(data.discord || []);
      setClassic(data.classic || []);
    } catch {
      setError('Erreur de connexion à l\'API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const update = async (id: number, payload: object) => {
    await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    });
    fetchUsers();
    setSelected(null);
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return;
    await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchUsers();
    setSelected(null);
  };

  const users = tab === 'discord' ? discord : classic;

  return (
    <div style={{ minHeight: '100vh', background: '#060D1A', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(26,107,255,0.08)', borderBottom: '1px solid rgba(26,107,255,0.2)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Shield size={24} color="#1A6BFF" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff' }}>Panel Admin — MITrad</h1>
          <p style={{ fontSize: 12, color: '#8899AA', margin: 0 }}>Gestion des utilisateurs</p>
        </div>
        <button onClick={fetchUsers} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', color: '#8899AA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {error && <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#FF3B5C' }}>{error}</div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total', value: discord.length + classic.length, color: '#1A6BFF' },
            { label: 'Via Discord', value: discord.length, color: '#5865F2' },
            { label: 'Inscription classique', value: classic.length, color: '#00D4AA' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['classic', 'discord'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: tab === t ? '#1A6BFF' : 'rgba(255,255,255,0.06)', color: tab === t ? '#fff' : '#8899AA', transition: 'all 0.2s' }}>
              {t === 'discord' ? `🟣 Discord (${discord.length})` : `👤 Classique (${classic.length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8899AA' }}>Chargement...</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Utilisateur', 'Email', 'Pays / Broker', 'Inscription', 'Statut', 'Profil', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#8899AA', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.avatar
                          ? <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A6BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{u.name?.charAt(0)}</div>
                        }
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.name}
                            {u.is_admin && <Crown size={12} color="#F59E0B" title="Admin" />}
                          </div>
                          <div style={{ fontSize: 11, color: '#8899AA' }}>{u.trading_style || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#C0CCD8' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px', color: '#8899AA', fontSize: 12 }}>
                      <div>{u.country || '—'}</div>
                      <div style={{ fontSize: 11 }}>{u.broker || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#8899AA', fontSize: 12 }}>
                      {new Date(u.created_at).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: u.is_active ? 'rgba(0,212,170,0.15)' : 'rgba(255,59,92,0.15)', color: u.is_active ? '#00D4AA' : '#FF3B5C' }}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: u.is_public ? 'rgba(26,107,255,0.15)' : 'rgba(255,255,255,0.06)', color: u.is_public ? '#1A6BFF' : '#8899AA' }}>
                        {u.is_public ? 'Public' : 'Privé'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => update(u.id, { is_active: !u.is_active })} title={u.is_active ? 'Désactiver' : 'Activer'}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: u.is_active ? '#FF3B5C' : '#00D4AA' }}>
                          {u.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => update(u.id, { is_public: !u.is_public })} title={u.is_public ? 'Rendre privé' : 'Rendre public'}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#8899AA' }}>
                          {u.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => update(u.id, { is_admin: !u.is_admin })} title={u.is_admin ? 'Retirer admin' : 'Promouvoir admin'}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: u.is_admin ? '#F59E0B' : '#8899AA' }}>
                          <Crown size={16} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} title="Supprimer"
                          style={{ background: 'rgba(255,59,92,0.1)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#FF3B5C' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#8899AA' }}>Aucun utilisateur</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}