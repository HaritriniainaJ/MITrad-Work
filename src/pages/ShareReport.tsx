import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const BADGE_MAP: Record<string, { emoji: string; name: string }> = {
  sniper: { emoji: '🎯', name: 'Sniper' }, diamond: { emoji: '💎', name: 'Diamond Hands' },
  fire: { emoji: '🔥', name: 'On Fire' }, speed: { emoji: '⚡', name: 'Speed Trader' },
  lion: { emoji: '🦁', name: 'Lion' }, strategist: { emoji: '🧠', name: 'Strategist' },
  consistent: { emoji: '📅', name: 'Consistent' }, rookie: { emoji: '🚀', name: 'Rookie Star' },
  icecold: { emoji: '❄️', name: 'Ice Cold' }, champion: { emoji: '🏆', name: 'Champion' },
};

function BarH({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.abs(value) / max * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 48, textAlign: 'right', fontWeight: 700 }}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}R
      </span>
    </div>
  );
}

function BarV({ value, max, label }: { value: number; max: number; label: string }) {
  const color = value >= 0 ? '#00D4AA' : '#FF3B5C';
  const pct = max === 0 ? 0 : Math.abs(value) / max * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value >= 0 ? '+' : ''}{value.toFixed(1)}</span>
      <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ width: '60%', height: `${pct}%`, minHeight: 4, background: color, borderRadius: '3px 3px 0 0' }} />
      </div>
      <span style={{ fontSize: 10, color: '#556677' }}>{label}</span>
    </div>
  );
}

export default function ShareReport() {
  const { token: key } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!key) return setError(true);
    const raw = sessionStorage.getItem(key);
    if (!raw) return setError(true);
    try {
      setData(JSON.parse(raw));
    } catch {
      setError(true);
    }
  }, [key]);

  useEffect(() => {
    if (data) {
      setTimeout(() => window.print(), 800);
    }
  }, [data]);

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#060D1A', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <div style={{ fontSize: 18, color: '#8899AA' }}>Rapport introuvable ou expiré</div>
        <div style={{ fontSize: 13, color: '#445566', marginTop: 8 }}>Retournez sur l'app et regénérez le rapport</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#060D1A', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 14, color: '#8899AA' }}>Chargement...</div>
    </div>
  );

  const { trader, avatar, dateFrom, dateTo, accountNames, level, kpis, badges, equity, dayPerf, pairPerf, isPos } = data;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });

  const maxDay  = Math.max(...dayPerf.map((d: any) => Math.abs(d.r)), 0.01);
  const maxPair = Math.max(...pairPerf.map((p: any) => Math.abs(p.r)), 0.01);

  // Equity curve SVG
  const eqValues = equity.map((e: any) => e.r);
  const eqMin    = Math.min(...eqValues, 0);
  const eqMax    = Math.max(...eqValues, 0.01);
  const eqRange  = eqMax - eqMin || 1;
  const W = 760, H = 160;
  const pts = equity.map((e: any, i: number) => {
    const x = (i / Math.max(equity.length - 1, 1)) * W;
    const y = H - ((e.r - eqMin) / eqRange) * H;
    return `${x},${y}`;
  }).join(' ');
  const lineColor = isPos ? '#00D4AA' : '#FF3B5C';
  const zeroY = H - ((0 - eqMin) / eqRange) * H;
  const fillPts = `0,${H} ${pts} ${W},${H}`;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #060D1A; color: #fff; font-family: -apple-system, 'Inter', sans-serif; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Bouton imprimer - visible seulement à l'écran */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ background: '#1A6BFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          🖨️ Imprimer / Sauvegarder PDF
        </button>
        <button onClick={() => window.close()}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      {/* RAPPORT */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 48px 40px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo.png" alt="MITrad" style={{ height: 52 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#1A6BFF', letterSpacing: '-0.5px' }}>MITrad Journal</div>
              <div style={{ fontSize: 11, color: '#556677', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rapport de Performance</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {avatar && <img src={avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${level.color}` }} />}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>{trader}</div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: level.color, background: level.bg, border: `1px solid ${level.border}`, borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
                {level.emoji} {level.label}
              </div>
              <div style={{ fontSize: 12, color: '#8899AA' }}>{fmtDate(dateFrom)} → {fmtDate(dateTo)}</div>
              {accountNames.length > 0 && <div style={{ fontSize: 11, color: '#445566', marginTop: 3 }}>{accountNames.join(' · ')}</div>}
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {kpis.map((k: any) => (
            <div key={k.label} style={{ background: `${k.color}12`, border: `1px solid ${k.color}30`, borderLeft: `4px solid ${k.color}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{k.label}</div>
              <div style={{ fontSize: k.value.length > 8 ? 20 : 28, fontWeight: 900, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'center' }}>
            {badges.map((id: string) => BADGE_MAP[id] && (
              <div key={id} style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 14px', color: '#C0CCD8' }}>
                {BADGE_MAP[id].emoji} {BADGE_MAP[id].name}
              </div>
            ))}
          </div>
        )}

        {/* ── Equity Curve SVG ── */}
        {equity.length > 1 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📈 Equity Curve</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
              {/* Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map(v => (
                <line key={v} x1={0} y1={H * v} x2={W} y2={H * v} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              ))}
              {/* Zero line */}
              <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4" />
              {/* Fill */}
              <polygon points={fillPts} fill={lineColor} fillOpacity={0.08} />
              {/* Line */}
              <polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {/* Labels X */}
              {equity.filter((_: any, i: number) => i % Math.ceil(equity.length / 8) === 0).map((e: any, i: number, arr: any[]) => {
                const origIdx = equity.indexOf(e);
                const x = (origIdx / Math.max(equity.length - 1, 1)) * W;
                return <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize={9} fill="#556677">{e.date}</text>;
              })}
            </svg>
          </div>
        )}

        {/* ── Par Jour + Par Paire ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Par Jour */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📅 Par Jour</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
              {dayPerf.map((d: any) => (
                <BarV key={d.day} value={d.r} max={maxDay} label={d.day} />
              ))}
            </div>
          </div>
          {/* Par Paire */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>💱 Par Paire</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pairPerf.map((p: any) => (
                <div key={p.pair}>
                  <div style={{ fontSize: 10, color: '#8899AA', marginBottom: 3 }}>{p.pair}</div>
                  <BarH value={p.r} max={maxPair} color={p.r >= 0 ? '#00D4AA' : '#FF3B5C'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(26,107,255,0.10)', border: '1px solid rgba(26,107,255,0.25)', borderRadius: 24, padding: '10px 24px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#1A6BFF"/>
                <path d="M6 12.5L10 16.5L18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#C0D8FF' }}>Vérifié par Hari Invest</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#334455' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A6BFF' }} />
              <span>projournalmitrad.vercel.app</span>
            </div>
            <span>Généré le {new Date().toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

      </div>
    </>
  );
}
