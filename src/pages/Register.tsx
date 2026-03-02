import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, TrendingUp, Shield, Zap, BarChart2, Target,
  ArrowRight, Mail, Lock, User, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const CHART_DATA = [{ v:0 },{ v:1.2 },{ v:0.8 },{ v:2.1 },{ v:1.9 },{ v:3.4 },{ v:2.8 },{ v:4.1 },{ v:3.7 },{ v:5.2 }];
const FEATURES = [
  { icon: BarChart2, title: 'Analytiques avancées', desc: 'KPIs, equity curve, drawdown, profit factor en temps réel.', color: '#1A6BFF' },
  { icon: Target,    title: 'Plan de trading',      desc: 'Définis tes règles, illustre-les, suivi rigoureux.', color: '#7C3AED' },
  { icon: Shield,    title: 'Discipline de fer',    desc: 'Score de discipline, alertes émotionnelles, Mentor-X.', color: '#00D4AA' },
  { icon: Zap,       title: 'Multi-comptes',        desc: 'Personnel, Funded, Démo, Propfirm — tout en un.', color: '#F59E0B' },
  { icon: TrendingUp,title: 'Suivi de croissance',  desc: 'Capital réel, P&L cumulé, progression visuelle.', color: '#EC4899' },
];

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const ps = Array.from({ length:60 }, () => ({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.5+0.5, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3,
      alpha:Math.random()*0.4+0.1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      ps.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0) p.x=c.width; if(p.x>c.width) p.x=0;
        if(p.y<0) p.y=c.height; if(p.y>c.height) p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(26,107,255,${p.alpha})`; ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

function FloatingChart({ delay=0, style }: { delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:1 }} style={style} className="absolute pointer-events-none">
      <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:4+delay, ease:'easeInOut' }} className="glass rounded-2xl p-3 border border-white/8" style={{ backdropFilter:'blur(16px)', minWidth:200 }}>
        <div style={{ height:80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA} margin={{ top:4, right:4, left:4, bottom:0 }}>
              <defs>
                <linearGradient id={`rg${delay}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2} fill={`url(#rg${delay})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">Performance</span>
          <span className="text-[10px] font-bold text-emerald-400">+18.7%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

const API_URL = import.meta.env.VITE_API_URL || 'https://mitrad-backend.onrender.com/api';

export default function Register() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [nameFoc,  setNameFoc]  = useState(false);
  const [emailFoc, setEmailFoc] = useState(false);
  const [passFoc,  setPassFoc]  = useState(false);
  const [confFoc,  setConfFoc]  = useState(false);
  const [featIdx,  setFeatIdx]  = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setFeatIdx(i => (i+1)%FEATURES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const mx = useMotionValue(0); const my = useMotionValue(0);
  const rotX = useTransform(my, [-200,200], [4,-4]);
  const rotY = useTransform(mx, [-200,200], [-4,4]);
  const sRotX = useSpring(rotX, { stiffness:120, damping:20 });
  const sRotY = useSpring(rotY, { stiffness:120, damping:20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX-r.left-r.width/2); my.set(e.clientY-r.top-r.height/2);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  const inputStyle = (foc: boolean) => ({
    boxShadow: foc ? '0 0 0 2px rgba(124,58,237,0.4), 0 0 16px rgba(124,58,237,0.15)' : 'none',
    borderColor: foc ? '#7C3AED' : undefined,
    transition: 'all 0.2s ease',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, password, password_confirmation: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.errors?.email?.[0] || data?.errors?.password?.[0] || 'Erreur lors de l\'inscription.';
        setError(msg);
      } else {
        if (data.token) {
          localStorage.setItem('mitrad_token', data.token);
          localStorage.setItem('mitrad_user', JSON.stringify(data.user));
          window.location.href = '/analytics';
        } else {
          setSuccess(true);
          setTimeout(() => navigate('/login'), 2500);
        }
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    }
    setLoading(false);
  };

  const feat = FEATURES[featIdx];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background:'radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.18) 0%, rgba(9,11,20,1) 55%), hsl(218 65% 6%)' }}>
      <ParticleCanvas />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 65%)', filter:'blur(40px)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(26,107,255,0.12) 0%,transparent 65%)', filter:'blur(40px)' }} />

      <div className="hidden xl:block" style={{ position:'fixed', top:0, left:0, width:'22%', height:'100vh', pointerEvents:'none', zIndex:5, overflow:'visible' }}>
        <FloatingChart delay={0.2} style={{ top:'10%', left:'8px' }} />
        <FloatingChart delay={0.5} style={{ bottom:'14%', left:'4px' }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-4 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center py-16 px-12">

        {/* Colonne gauche */}
        <motion.div initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7, ease:'easeOut' }}
          className="hidden lg:flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="text-xl font-black gradient-text tracking-tight">Pro MITrad</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Journal actif</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight">
              <span className="gradient-text">Rejoins</span> <span className="text-foreground">la</span><br />
              <span className="text-foreground">communauté</span><br />
              <span className="gradient-text">MITrad.</span>
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed max-w-xl">
              Crée ton compte et commence à suivre tes performances dès aujourd'hui.
            </p>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/6 relative overflow-hidden" style={{ background:'rgba(255,255,255,0.03)' }}>
            <div className="absolute top-0 left-0 w-full h-px" style={{ background:`linear-gradient(90deg,transparent,${feat.color}60,transparent)` }} />
            <div className="flex items-center gap-2 mb-4">
              {FEATURES.map((_,i) => (
                <button key={i} onClick={() => setFeatIdx(i)} className="transition-all duration-300 rounded-full"
                  style={{ width:i===featIdx?20:6, height:6, background:i===featIdx?feat.color:'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={featIdx} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.3 }} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${feat.color}18`, border:`1px solid ${feat.color}30` }}>
                  <feat.icon size={20} style={{ color:feat.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Colonne droite - Formulaire */}
        <motion.div style={{ rotateX:sRotX, rotateY:sRotY, transformPerspective:1200 }}
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} className="w-full">
          <div className="glass rounded-3xl p-8 md:p-10 border border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.2) 0%,transparent 70%)' }} />

            <div className="text-center mb-7 relative">
              <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-4">
                <motion.div className="absolute w-20 h-20 rounded-full pointer-events-none"
                  style={{ border:'1px solid rgba(124,58,237,0.2)' }}
                  animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:8, ease:'linear' }} />
                <motion.div className="absolute w-28 h-28 rounded-full pointer-events-none"
                  style={{ border:'1px solid rgba(26,107,255,0.15)' }}
                  animate={{ rotate:-360 }} transition={{ repeat:Infinity, duration:12, ease:'linear' }} />
                <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  transition={{ duration:0.6, type:'spring', bounce:0.3 }} className="relative z-10"
                  style={{ borderRadius:'50%', boxShadow:'0 0 0 1px rgba(124,58,237,0.3),0 0 32px rgba(124,58,237,0.25)' }}>
                  <img src="/logo.png" alt="Logo" className="w-18 h-18 object-cover rounded-full"
                    style={{ width:72, height:72, filter:'drop-shadow(0 0 20px rgba(124,58,237,0.6))', boxShadow:'0 0 0 2px rgba(124,58,237,0.4)' }} />
                </motion.div>
              </div>
              <h2 className="text-2xl font-black" style={{ background:'linear-gradient(135deg,#7C3AED,#1A6BFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Créer un compte</h2>
              <p className="text-muted-foreground text-sm mt-1">Rejoins Pro MITrad Journal</p>
            </div>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:'rgba(0,212,170,0.15)', border:'1px solid rgba(0,212,170,0.3)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">Compte créé !</p>
                  <p className="text-muted-foreground text-sm mt-1">Redirection vers la connexion...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Nom complet</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      onFocus={() => setNameFoc(true)} onBlur={() => setNameFoc(false)}
                      className="input-dark pl-10" placeholder="Jean Dupont" required style={inputStyle(nameFoc)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFoc(true)} onBlur={() => setEmailFoc(false)}
                      className="input-dark pl-10" placeholder="votre@email.com" required style={inputStyle(emailFoc)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input type={showPw?'text':'password'} value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPassFoc(true)} onBlur={() => setPassFoc(false)}
                      className="input-dark pl-10 pr-10" placeholder="••••••••" required style={inputStyle(passFoc)} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input type={showCf?'text':'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                      onFocus={() => setConfFoc(true)} onBlur={() => setConfFoc(false)}
                      className="input-dark pl-10 pr-10" placeholder="••••••••" required style={inputStyle(confFoc)} />
                    <button type="button" onClick={() => setShowCf(!showCf)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showCf ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg border border-destructive/20">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  className="w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 mt-2 rounded-xl text-white"
                  style={{ background:'linear-gradient(135deg,#7C3AED,#1A6BFF)', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création...</>
                  ) : (
                    <>Créer mon compte <ArrowRight size={16} /></>
                  )}
                </motion.button>
              </form>
            )}

            <div className="h-px bg-white/8 my-5" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link to="/login" className="font-semibold hover:text-foreground transition-colors" style={{ color:'#7C3AED' }}>
                  Se connecter
                </Link>
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={13} /> Retour à la connexion
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}