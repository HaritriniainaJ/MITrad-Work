import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import NProgress from 'nprogress';
import { useAuth } from '@/context/AuthContext';
import {
  Eye, EyeOff, TrendingUp, Shield, Zap, BarChart2, Target,
  ArrowRight, Mail, Send, MessageCircle, Lock, Copy, Check,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const FEATURES = [
  { icon: BarChart2, title: 'Analytiques avanc�es', desc: 'KPIs, equity curve, drawdown, profit factor en temps r�el.', color: '#1A6BFF' },
  { icon: Target,    title: 'Plan de trading',      desc: 'D�finis tes r�gles, illustre-les, suivi rigoureux.', color: '#7C3AED' },
  { icon: Shield,    title: 'Discipline de fer',    desc: 'Score de discipline, alertes �motionnelles, Mentor-X.', color: '#00D4AA' },
  { icon: Zap,       title: 'Multi-comptes',        desc: 'Personnel, Funded, D�mo, Propfirm "� tout en un.', color: '#F59E0B' },
  { icon: TrendingUp,title: 'Suivi de croissance',  desc: 'Capital r�el, P&L cumul�, progression visuelle.', color: '#EC4899' },
];
const CONTACTS = [
  { label: 'Email',    icon: Mail,          href: 'https://mail.google.com/mail/?view=cm&to=Investhari04@gmail.com' },
  { label: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/261345628584' },
];
const CHART_DATA = [{ v:0 },{ v:1.2 },{ v:0.8 },{ v:2.1 },{ v:1.9 },{ v:3.4 },{ v:2.8 },{ v:4.1 },{ v:3.7 },{ v:5.2 }];

function FloatingChart({ delay=0, style }: { delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:1 }} style={style} className="absolute pointer-events-none">
      <motion.div animate={{ y:[0,-8,0] }} transition={{ repeat:Infinity, duration:4+delay, ease:'easeInOut' }} className="glass rounded-2xl p-3 border border-white/8" style={{ backdropFilter:'blur(16px)', minWidth:200 }}>
        <div style={{ height:80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA} margin={{ top:4, right:4, left:4, bottom:0 }}>
              <defs>
                <linearGradient id={`fg${delay}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A6BFF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1A6BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#1A6BFF" strokeWidth={2} fill={`url(#fg${delay})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">Equity</span>
          <span className="text-[10px] font-bold text-emerald-400">+12.4%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBadge({ label, value, color, delay=0, style, IconComp }: { label:string; value:string; color:string; delay?:number; style?: React.CSSProperties; IconComp: React.ElementType }) {
  return (
    <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay, duration:0.6, type:'spring' }} style={style} className="absolute pointer-events-none">
      <motion.div animate={{ y:[0,-5,0] }} transition={{ repeat:Infinity, duration:3.5+delay, ease:'easeInOut' }} className="glass rounded-xl px-3 py-2 border flex items-center gap-2" style={{ borderColor:`${color}30`, backdropFilter:'blur(16px)' }}>
        <IconComp size={14} style={{ color }} />
        <div>
          <div className="text-[9px] text-muted-foreground">{label}</div>
          <div className="text-xs font-bold text-foreground">{value}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedCounter({ target, prefix='', suffix='' }: { target:number; prefix?:string; suffix?:string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const frame = (now:number) => {
      const p = Math.min((now - start) / 1500, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target]);
  return <>{prefix}{val}{suffix}</>;
}

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

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [featIdx,  setFeatIdx]  = useState(0);
  const [emailFoc, setEmailFoc] = useState(false);
  const [passFoc,  setPassFoc]  = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass,  setCopiedPass]  = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const { login } = useAuth();
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

useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');
    
    console.log('URL params:', { token, userStr, error });
    
    if (error === 'not_member') {
      setError("? Tu n'es pas membre du serveur MITrad Academy.");
      window.history.replaceState({}, '', '/login');
      return;
    }
    if (error) {
      const msg = params.get('msg');
      setError('? Connexion Discord �chou�e. R�essaie dans quelques instants.');
      return;
    }
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('mitrad_token', token);
        localStorage.setItem('mitrad_user', JSON.stringify(user));
        console.log('Token saved, redirecting...');
        window.location.replace('/analytics');
      } catch(e) { 
        console.error('Parse error:', e);
        setError('Erreur de connexion Discord.'); 
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    setTimeout(async () => {
      const ok = await login(email, password);
      if (ok) { window.location.href = '/analytics'; }
      else { setError('Email ou mot de passe incorrect'); }
      setLoading(false);
    }, 600);
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText('demo@mitrad.com');
    setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 1500);
  };
  const copyPass = async () => {
    await navigator.clipboard.writeText('mitrad123');
    setCopiedPass(true); setTimeout(() => setCopiedPass(false), 1500);
  };
  const fillDemo = () => {
    setEmail('demo@mitrad.com'); setPassword('mitrad123');
    setTimeout(() => submitRef.current?.focus(), 100);
  };

  const inputStyle = (foc: boolean) => ({
    boxShadow: foc ? '0 0 0 2px rgba(26,107,255,0.4), 0 0 16px rgba(26,107,255,0.15)' : 'none',
    borderColor: foc ? '#1A6BFF' : undefined,
    transition: 'all 0.2s ease',
  });

  const feat = FEATURES[featIdx];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background:'radial-gradient(ellipse at 40% 0%, rgba(26,107,255,0.18) 0%, rgba(9,11,20,1) 55%), hsl(218 65% 6%)' }}>
      <ParticleCanvas />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(26,107,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,107,255,0.04) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(26,107,255,0.12) 0%,transparent 65%)', filter:'blur(40px)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background:'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 65%)', filter:'blur(40px)' }} />

      {/* �l�ments flottants "� fix�s dans la zone extr�me gauche du viewport */}
      <div
        className="hidden xl:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '22%',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 5,
          overflow: 'visible',
        }}
      >
        <FloatingChart delay={0.2} style={{ top: '10%', left: '8px' }} />
        <FloatingChart delay={0.5} style={{ bottom: '14%', left: '4px' }} />
        <StatBadge label="Win Rate"    value="67.4%"  color="#00D4AA" delay={0.3} style={{ top: '38%', left: '12px' }} IconComp={Target} />
        <StatBadge label="P&L Mensuel" value="+8.4R"  color="#1A6BFF" delay={0.6} style={{ bottom: '34%', left: '20px' }} IconComp={TrendingUp} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center py-8 lg:py-16 px-4 sm:px-8 lg:px-12">

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
              <span className="gradient-text">Ma�trise</span> <span className="text-foreground">chaque</span><br />
              <span className="text-foreground">trade.</span> <span className="gradient-text">Domine</span><br />
              <span className="text-foreground">chaque session.</span>
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed max-w-xl">
              Le journal de trading professionnel pens� pour les traders africains.
              Analyse, discipline et performance "� <span className="text-foreground font-medium">tout en un.</span>
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

          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Trades suivis',  target:10000, suffix:'+',  prefix:'', color:'#1A6BFF', kLabel:'10K+' },
              { label:'Traders actifs', target:500,   suffix:'+',  prefix:'', color:'#7C3AED', kLabel:'500+' },
              { label:'Gain moyen/mois',target:82,    suffix:'%',  prefix:'+', color:'#00D4AA', kLabel:'+8.2%' },
            ].map(kpi => (
              <div key={kpi.label} className="glass rounded-xl p-3 border text-center" style={{ borderColor:`${kpi.color}20` }}>
                <div className="text-xl font-black" style={{ color:kpi.color }}>
                  <AnimatedCounter target={kpi.target} prefix={kpi.prefix} suffix={kpi.suffix} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {CONTACTS.map(c => (
              <motion.a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale:1.15, y:-2 }} title={c.label}
                className="w-9 h-9 rounded-xl glass border border-white/8 flex items-center justify-center text-muted-foreground transition-colors">
                <c.icon size={16} />
              </motion.a>
            ))}
            <span className="text-xs text-muted-foreground">Nous contacter</span>
          </div>
        </motion.div>

        {/* Colonne droite "� Formulaire */}
        <motion.div style={{ rotateX:sRotX, rotateY:sRotY, transformPerspective:1200 }}
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} className="w-full">
          <div className="glass rounded-3xl p-5 sm:p-8 md:p-10 border border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(26,107,255,0.2) 0%,transparent 70%)' }} />

            {/* Logo anim� avec anneaux */}
            <div className="text-center mb-8 relative">
              <div className="relative flex items-center justify-center w-32 h-32 mx-auto mb-4">
                <motion.div className="absolute w-24 h-24 rounded-full pointer-events-none"
                  style={{ border:'1px solid rgba(26,107,255,0.2)' }}
                  animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:8, ease:'linear' }} />
                <motion.div className="absolute w-32 h-32 rounded-full pointer-events-none"
                  style={{ border:'1px solid rgba(124,58,237,0.15)' }}
                  animate={{ rotate:-360 }} transition={{ repeat:Infinity, duration:12, ease:'linear' }} />
                <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  transition={{ duration:0.6, type:'spring', bounce:0.3 }} className="relative z-10"
                  style={{ borderRadius:'50%', boxShadow:'0 0 0 1px rgba(26,107,255,0.3),0 0 32px rgba(26,107,255,0.25),0 0 64px rgba(124,58,237,0.15)' }}>
                  <img src="/logo.png" alt="Logo" className="w-20 h-20 object-cover rounded-full" style={{ filter: "drop-shadow(0 0 20px rgba(26,107,255,0.6))", boxShadow: "0 0 0 2px rgba(26,107,255,0.4), 0 0 32px rgba(26,107,255,0.3)" }} />
                </motion.div>
              </div>
              <h2 className="text-2xl font-black gradient-text">Pro MITrad Journal</h2>
              <p className="text-muted-foreground text-sm mt-1">Connecte-toi � ton espace de trading</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="input-dark pl-10 pr-10" placeholder="��������" required style={inputStyle(passFoc)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
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

              <motion.button ref={submitRef} type="submit" disabled={loading}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                className="gradient-btn w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connexion...</>
                ) : (
                  <>Se connecter <ArrowRight size={16} /></>
                )}
              </motion.button>
            </form>

            {/* S�parateur */}
            {/* Bouton Discord */}
            <motion.button
              type="button"
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { window.location.href = 'https://api.mitradacademy.mg/api/auth/discord/redirect'; }}
              className="w-full py-3 mt-4 flex items-center justify-center gap-3 rounded-xl font-bold text-sm transition-all"
              style={{ background:'#5865F2', color:'#fff', border:'1px solid #4752C4', boxShadow:'0 4px 20px rgba(88,101,242,0.35)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Se connecter avec Discord
            </motion.button>

            {/* S�parateur */}
            <div className="h-px bg-white/8 my-4" />

            {/* Bloc d�mo */}
            <div className="rounded-xl p-3" style={{ background:'rgba(26,107,255,0.08)', border:'1px solid rgba(26,107,255,0.2)', borderRadius:12 }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={14} style={{ color:'#1A6BFF' }} />
                <span className="text-xs font-semibold text-primary">Acc�s d�mo</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground font-mono">demo@mitrad.com</span>
                <button type="button" onClick={copyEmail} className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0">
                  {copiedEmail ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground font-mono">mitrad123</span>
                <button type="button" onClick={copyPass} className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0">
                  {copiedPass ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <button type="button" onClick={fillDemo}
                className="mt-2 w-full py-2 rounded-xl text-xs font-medium transition-all duration-200 text-primary"
                style={{ background:'rgba(26,107,255,0.1)', border:'1px solid rgba(26,107,255,0.2)' }}>
                Remplir automatiquement ?�
              </button>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-accent/30 border border-border/40 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Link to="/register" className="font-semibold" style={{ color:'#1A6BFF' }}>
                    Cr�er un compte
                  </Link>
                  {' � '}Pour acc�der � ce journal, contacte l'administrateur � ton compte sera activ� sous 24h.
                </p>
              <div className="flex items-center justify-center gap-3 mt-3 lg:hidden">
                {CONTACTS.map(c => (
                  <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <c.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}














