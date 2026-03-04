import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageManager } from '@/lib/storage';
import { getAccounts, createAccount, deleteAccount } from '@/lib/api';
import { calculateBadges } from '@/lib/badgeEngine';
import { AFRICAN_COUNTRIES, COUNTRY_FLAGS, EXPERIENCE_OPTIONS, STYLE_OPTIONS } from '@/types/trading';
import GlassCard from '@/components/GlassCard';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Edit2, Save, X, Camera, ImagePlus, Eye, EyeOff,
  TrendingUp, BarChart2, Target, Zap, ChevronDown, ChevronUp,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';


// â”€â”€ Counter animé â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AnimatedCounter({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const from = 0;
    const to = value;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  const formatted = display.toFixed(decimals);
  return <>{(Number(formatted) >= 0 && suffix !== '%' ? '' : '') + formatted + suffix}</>;
}

// â”€â”€ Badge design sans emoji â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BadgeChip({ name, description }: { name: string; description: string }) {
  return (
    <span
      title={description}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/8 text-primary font-medium"
    >
      <Award size={11} />
      {name}
    </span>
  );
}

// â”€â”€ Page Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Profile() {
  const { user, updateProfile, activeAccounts, accounts: authAccounts } = useAuth();
  const [editing, setEditing] = useState(false);
const [form, setForm] = useState({
  bio: "",
  name: "",
  broker: "",
  ...user!,
  experience: user?.experience || "Moins de 1 an",
  tradingStyle: (user as any)?.trading_style || user?.tradingStyle || "Scalping",
  country: user?.country || "",
});

useEffect(() => {
  if (user && !editing) {
    const ts = (user as any).trading_style || user.tradingStyle || "Scalping";
    const exp = user.experience || "Moins de 1 an";
    setForm(prev => ({
      ...prev,
      ...user,
      tradingStyle: ts,
      experience: exp,
      country: user.country || prev.country || "",
    }));
  }
}, [user]);
  const [showAccounts, setShowAccounts] = useState(false);
  const trades = useFilteredTrades();
  const accounts = authAccounts;
  const closed  = trades.filter(t => t.status !== 'RUNNING');
  const wins    = closed.filter(t => t.status === 'WIN');
  const losses  = closed.filter(t => t.status === 'LOSS');
  const winRate = closed.length ? (wins.length / closed.length * 100) : 0;
 const totalDollar = closed.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const grossProfit = wins.reduce((s, t) => s + (t.resultDollar ?? 0), 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.resultDollar ?? 0), 0));
  const pf = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99 : 0;
  const badges = useMemo(() => calculateBadges(closed), [closed]);

  const cumData = useMemo(() => {
    const sorted = [...closed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cum = 0;
    return sorted.map(t => { cum += t.resultR; return { r: Math.round(cum * 100) / 100 }; });
  }, [closed]);

  // â”€â”€ Banner & Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo'); return; }
    const compressed = await compressImage(file, 1200, 0.7);
    setForm(prev => ({ ...prev, banner: compressed }));
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo'); return; }
    const compressed = await compressImage(file, 400, 0.8);
    setForm(prev => ({ ...prev, avatar: compressed }));
  };


const handleSave = () => {
  if (!form.name) {
    toast.error('Le nom est requis');
    return;
  }
  updateProfile(form);
  setEditing(false);
  toast.success('Profil mis à jour !');
};

  // â”€â”€ KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const accountList = Array.isArray(accounts) ? accounts : [];
  const relevantAccounts = activeAccounts.length > 0 ? activeAccounts : accountList;
  const totalCapital = relevantAccounts.reduce((s, a) => s + (Number(a.capital) || 0), 0);
  const pnlPercent = totalCapital > 0 ? (totalDollar / totalCapital) * 100 : null;
  const getLevel = (pct: number | null) => {
    if (pct === null)  return { emoji: "🌱", label: "Starter",   color: "text-muted-foreground" };
    if (pct < 0)       return { emoji: "🌱", label: "Starter",   color: "text-muted-foreground" };
    if (pct < 10)      return { emoji: "⚡", label: "Rising",    color: "text-yellow-400" };
    if (pct < 30)      return { emoji: "🔥", label: "Confirmed", color: "text-orange-400" };
    if (pct < 60)      return { emoji: "💎", label: "Pro",       color: "text-blue-400" };
    if (pct < 100)     return { emoji: "👑", label: "Elite",     color: "text-purple-400" };
    return               { emoji: "🚀", label: "Legend",  color: "text-primary" };
  };
  const level = getLevel(pnlPercent);
  const kpis = [
    { label: 'Win Rate',      value: winRate,  suffix: '%',  decimals: 0, icon: Target,    color: 'text-primary' },
    { label: 'P&L Total', value: totalDollar, suffix: '$', decimals: 0, icon: TrendingUp, color: totalDollar >= 0 ? 'text-success' : 'text-destructive', showSign: true },    { label: 'Profit Factor', value: pf,       suffix: '',   decimals: 2, icon: BarChart2,  color: 'text-foreground' },
    { label: 'Trades',        value: closed.length, suffix: '', decimals: 0, icon: Zap,  color: 'text-foreground' },
  ];

  return (
    <div className="space-y-6">
      {/* â”€â”€ Header actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Mon Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">Ton identité de trader</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
            <Edit2 size={14} /> Modifier le profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setForm({ ...user! }); }}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X size={14} /> Annuler
            </button>
            <button onClick={handleSave} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
              <Save size={14} /> Enregistrer
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ Banner + Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <GlassCard className="relative overflow-hidden animate-fade-up p-0">
        {/* Banner */}
        <div className="relative h-40 overflow-hidden">
          {form.banner ? (
            <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            /* Gradient animé si pas d'image */
            <div
              className="w-full h-full border-glow-animate"
              style={{
                background: 'linear-gradient(135deg, hsl(219 100% 22%), hsl(255 100% 28%), hsl(219 100% 18%))',
                backgroundSize: '200% 200%',
                animation: 'bannerShift 8s ease-in-out infinite',
              }}
            />
          )}
          {/* Overlay sombre dégradé bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/80" />

          {/* Bouton upload banner */}
          {editing && (
            <label className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/70 transition-colors">
              <ImagePlus size={13} /> Changer la bannière
              <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
            </label>
          )}
        </div>

        {/* Avatar + nom sous la banner */}
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-12 relative z-10">
            {/* Avatar */}
            <div className="relative group/avatar shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-card gradient-primary flex items-center justify-center text-3xl font-bold text-foreground overflow-hidden transition-all hover:ring-2 hover:ring-primary/50">
                {form.avatar
                  ? <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  : <span>{user!.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                  <Camera size={13} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                </label>
              )}
            </div>

            <div className="pb-1 w-full">
              <h2 className="text-xl font-bold text-foreground">{user!.name}</h2>
              {/* Roadmap niveaux */}
              {(() => {
                const levels = [
                  { label: 'Starter',   emoji: '🌱', color: '#8B9BB4' },
                  { label: 'Rising',    emoji: '⚡', color: '#FBBF24' },
                  { label: 'Confirmed', emoji: '🔥', color: '#FB923C' },
                  { label: 'Pro',       emoji: '💎', color: '#60A5FA' },
                  { label: 'Elite',     emoji: '👑', color: '#A78BFA' },
                  { label: 'Legend',    emoji: '🚀', color: '#00D4AA' },
                ];
                const currentIdx = levels.findIndex(l => l.label === level.label);
                return (
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      {levels.map((l, i) => {
                        const isPast    = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        const isFuture  = i > currentIdx;
                        return (
                          <div key={l.label} className="flex items-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`text-sm transition-all ${isFuture ? 'grayscale opacity-30' : ''} ${isCurrent ? 'scale-125' : ''}`}
                                title={l.label}
                              >
                                {l.emoji}
                              </span>
                              <span
                                className="text-[9px] font-bold"
                                style={{ color: isFuture ? '#4B5563' : l.color }}
                              >
                                {l.label}
                              </span>
                            </div>
                            {i < levels.length - 1 && (
                              <div className="w-6 h-0.5 mx-0.5 rounded-full mb-3"
                                style={{ background: i < currentIdx ? l.color : '#1F2937' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Toggle public/privé visible */}
            <div className="ml-auto pb-1">
              {editing ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                    className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 ${form.isPublic ? 'gradient-primary' : 'bg-accent'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${form.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{form.isPublic ? 'Public' : 'Privé'}</span>
                </label>
              ) : (
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full glass">
                  {user!.isPublic
                    ? <><Eye size={11} className="text-success" /> <span className="text-success">Public</span></>
                    : <><EyeOff size={11} className="text-muted-foreground" /> <span className="text-muted-foreground">Privé</span></>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* â”€â”€ KPI Cards sous la banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up stagger-1">
        {kpis.map(({ label, value, suffix, decimals, icon: Icon, color, showSign }) => (
          <GlassCard key={label} className="!p-4 text-center">
            <Icon size={16} className={`${color} mx-auto mb-2`} />
            <p className={`text-xl font-bold metric-value ${color}`}>
              {showSign && value >= 0 ? '+' : ''}
              <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* â”€â”€ Badges design â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}


      {/* â”€â”€ Informations profil â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <GlassCard className="animate-fade-up stagger-2">
        {editing ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Informations</h3>
            <div>
              <label className="text-xs text-muted-foreground">Nom complet *</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-dark mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio * <span className="text-muted-foreground/50">(max 300 caractères)</span></label>
              <textarea
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value.slice(0, 300) }))}
                className="input-dark mt-1 min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{(form.bio || "").length}/300</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Expérience *</label>
                <select value={form.experience} onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))} className="select-dark mt-1">
                  {!form.experience && <option value="">-- Sélectionner --</option>}
                  {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Style de trading *</label>
                <select value={form.tradingStyle} onChange={e => setForm(prev => ({ ...prev, tradingStyle: e.target.value }))} className="select-dark mt-1">
                  {STYLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Pays *</label>
                <select value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))} className="select-dark mt-1">
                  {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{COUNTRY_FLAGS[c] || ''} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Broker / PropFirm *</label>
                <input
                  value={form.broker}
                  onChange={e => setForm(prev => ({ ...prev, broker: e.target.value }))}
                  className="input-dark mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">À propos</h3>
            <p className="text-foreground leading-relaxed">{user!.bio}</p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {[
                { label: 'Expérience',    value: user!.experience },
                { label: 'Style',         value: user!.tradingStyle || user!.trading_style },
                { label: 'Broker',        value: user!.broker },
                { label: 'Pays',          value: user!.country },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-xs text-muted-foreground block mb-0.5">{label}</span>
                  <p className="text-foreground font-medium text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* â”€â”€ Comptes liés â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <GlassCard className="animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Comptes liés ({accounts.length})
          </h3>
          <button
            onClick={() => setShowAccounts(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAccounts ? 'Masquer' : 'Afficher'}
          </button>

        </div>

        {showAccounts && (
          <div className="mt-3 space-y-2">
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun compte configuré.</p>
            ) : (
              accounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border border-border/30">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.broker} · {acc.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Capital</p>
                    <p className="text-sm font-bold text-foreground">${acc.capital ? acc.capital.toLocaleString() + " $" : "—"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </GlassCard>

      {/* â”€â”€ Equity curve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <GlassCard className="animate-fade-up stagger-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Performance cumulée (en R)
        </h3>
        {cumData.length > 1 ? (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumData}>
                <Tooltip
                  contentStyle={{
                    background: '#0A1628',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v}R`, 'P&L']}
                />
                <Line
                  type="monotone"
                  dataKey="r"
                  stroke="#1A6BFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Enregistre des trades pour voir ta courbe de performance.
          </p>
        )}
      </GlassCard>

      {/* CSS inline pour l'animation du gradient banner */}
      <style>{`
        @keyframes bannerShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}


