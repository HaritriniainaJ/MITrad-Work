import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const BADGE_MAP: Record<string, { emoji: string; name: string }> = {
  sniper: { emoji: '🎯', name: 'Sniper' }, diamond: { emoji: '💎', name: 'Diamond Hands' },
  fire: { emoji: '🔥', name: 'On Fire' }, speed: { emoji: '⚡', name: 'Speed Trader' },
  lion: { emoji: '🦁', name: 'Lion' }, strategist: { emoji: '🧠', name: 'Strategist' },
  consistent: { emoji: '📅', name: 'Consistent' }, rookie: { emoji: '🚀', name: 'Rookie Star' },
  icecold: { emoji: '❄️', name: 'Ice Cold' }, champion: { emoji: '🏆', name: 'Champion' },
};

function BarH({ value, max, color, fmt }: { value: number; max: number; color: string; fmt: (v: number) => string }) {
  const pct = max === 0 ? 0 : Math.abs(value) / max * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 48, textAlign: 'right', fontWeight: 700 }}>
        {fmt(value)}
      </span>
    </div>
  );
}

function BarV({ value, max, label, fmt }: { value: number; max: number; label: string; fmt: (v: number) => string }) {
  const color = value >= 0 ? '#00D4AA' : '#FF3B5C';
  const pct = max === 0 ? 0 : Math.abs(value) / max * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 9, color, fontWeight: 700 }}>{fmt(value)}</span>
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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

  const { trader, avatar, dateFrom, dateTo, accountNames, level, kpis, badges, equity, dayPerf, pairPerf, isPos, mode, capital } = data;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });

  // Valeur selon le mode
  const val = (item: any) => mode === 'R' ? (item.r ?? 0) : (item.d ?? item.r ?? 0);
  const fmtVal = (v: number) => {
    if (mode === 'R') return `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;
    if (mode === '$') return `${v >= 0 ? '+' : ''}$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`;
    if (mode === '%' && capital > 0) return `${v >= 0 ? '+' : ''}${((v / capital) * 100).toFixed(2)}%`;
    return `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`;
  };

  const maxDay  = Math.max(...dayPerf.map((d: any) => Math.abs(val(d))), 0.01);
  const maxPair = Math.max(...pairPerf.map((p: any) => Math.abs(val(p))), 0.01);

  const eqValues = equity.map((e: any) => val(e));
  const eqMin    = Math.min(...eqValues, 0);
  const eqMax    = Math.max(...eqValues, 0.01);
  const eqRange  = eqMax - eqMin || 1;
  const W = 760, H = 160;
  const pts = equity.map((e: any, i: number) => {
    const x = (i / Math.max(equity.length - 1, 1)) * W;
    const y = H - ((val(e) - eqMin) / eqRange) * H;
    return `${x},${y}`;
  }).join(' ');
  const lineColor = isPos ? '#00D4AA' : '#FF3B5C';
  const zeroY = H - ((0 - eqMin) / eqRange) * H;
  const fillPts = `0,${H} ${pts} ${W},${H}`;

  const pad = isMobile ? '24px 16px 32px' : '48px 48px 40px';
  const kpiCols = isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)';
  const chartsGrid = isMobile ? '1fr' : '1fr 1fr';
  const headerDir = isMobile ? 'column' : 'row';
  const headerAlign = isMobile ? 'flex-start' : 'center';

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #060D1A !important;
          color: #fff;
          font-family: -apple-system, 'Inter', sans-serif;
        }
        @media print {
          html, body {
            background: #060D1A !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          @page {
            margin: 0;
            size: A4;
            background: #060D1A;
          }
          #report-root {
            background: #060D1A !important;
            min-height: 0 !important;
          }
          /* Tout tenir sur une page - forcer le zoom */
          #report-root > div {
            padding: 10px 16px 8px !important;
            max-width: 100% !important;
            transform-origin: top left;
          }
          /* Header plus compact */
          #report-root > div > div:first-child {
            margin-bottom: 10px !important;
            padding-bottom: 10px !important;
          }
          /* KPIs plus compacts */
          #kpis-grid {
            gap: 6px !important;
            margin-bottom: 10px !important;
          }
          #kpis-grid > div {
            padding: 8px 10px !important;
            border-radius: 8px !important;
          }
          #kpis-grid > div > div:first-child {
            margin-bottom: 4px !important;
            font-size: 9px !important;
          }
          #kpis-grid > div > div:last-child {
            font-size: 18px !important;
          }
          /* Badges */
          #badges-row {
            margin-bottom: 8px !important;
            gap: 5px !important;
          }
          #badges-row > div {
            padding: 4px 10px !important;
            font-size: 11px !important;
          }
          /* Equity curve */
          #equity-box {
            margin-bottom: 8px !important;
            padding: 10px 12px 8px !important;
          }
          /* Charts grid - forcer côte à côte même sur mobile */
          #charts-grid {
            gap: 8px !important;
            margin-bottom: 10px !important;
            grid-template-columns: 1fr 1fr !important;
          }
          #charts-grid > div {
            padding: 10px 12px 8px !important;
          }
          /* Footer */
          #footer-box {
            padding-top: 10px !important;
          }
          #footer-box > div:first-child {
            margin-bottom: 6px !important;
          }
          #footer-box > div:first-child > div {
            padding: 6px 14px !important;
            font-size: 12px !important;
          }
        }
      `}</style>

      {/* Bouton imprimer */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 8 }}>
        <button onClick={() => window.print()}
          style={{ background: '#1A6BFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,107,255,0.4)' }}>
          ⬇️ Sauvegarder en PDF
        </button>
        <button onClick={() => window.close()}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      {/* RAPPORT */}
      <div id="report-root" style={{ background: '#060D1A', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: pad }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Logo + titre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <img src="/logo.png" alt="MITrad" style={{ height: isMobile ? 36 : 52 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: isMobile ? 18 : 26, fontWeight: 900, color: '#1A6BFF', letterSpacing: '-0.5px' }}>MITrad Journal</div>
                <div style={{ fontSize: 11, color: '#556677', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rapport de Performance</div>
              </div>
            </div>
            {/* Avatar + nom + badge + dates — aligné à droite */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {avatar && <img src={avatar} alt="" style={{ width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: '50%', border: `2px solid ${level.color}`, flexShrink: 0 }} />}
                <div style={{ fontWeight: 800, fontSize: isMobile ? 15 : 20, color: '#fff', lineHeight: 1.2 }}>{trader}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: level.color, background: level.bg, border: `1px solid ${level.border}`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                  {level.emoji} {level.label}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#8899AA', textAlign: 'right' }}>{fmtDate(dateFrom)} → {fmtDate(dateTo)}</div>
              {accountNames.length > 0 && <div style={{ fontSize: 11, color: '#445566', textAlign: 'right' }}>{accountNames.join(' · ')}</div>}
            </div>
          </div>

          {/* ── KPIs ── */}
          <div id="kpis-grid" style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: 14, marginBottom: 28 }}>
            {kpis.map((k: any) => (
              <div key={k.label} style={{ background: `${k.color}12`, border: `1px solid ${k.color}30`, borderLeft: `4px solid ${k.color}`, borderRadius: 14, padding: isMobile ? '14px 16px' : '18px 20px' }}>
                <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: k.value.length > 9 ? 16 : k.value.length > 6 ? 20 : 26, fontWeight: 900, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* ── Badges ── */}
          {badges.length > 0 && (
            <div id="badges-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'center' }}>
              {badges.map((id: string) => BADGE_MAP[id] && (
                <div key={id} style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 14px', color: '#C0CCD8' }}>
                  {BADGE_MAP[id].emoji} {BADGE_MAP[id].name}
                </div>
              ))}
            </div>
          )}

          {/* ── Equity Curve SVG ── */}
          {equity.length > 1 && (
            <div id="equity-box" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📈 Equity Curve</div>
              <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <line key={v} x1={0} y1={H * v} x2={W} y2={H * v} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                ))}
                <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4" />
                <polygon points={fillPts} fill={lineColor} fillOpacity={0.08} />
                <polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {equity.filter((_: any, i: number) => i % Math.ceil(equity.length / 8) === 0).map((e: any, i: number) => {
                  const origIdx = equity.indexOf(e);
                  const x = (origIdx / Math.max(equity.length - 1, 1)) * W;
                  return <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize={9} fill="#556677">{e.date}</text>;
                })}
              </svg>
            </div>
          )}

          {/* ── Par Jour + Par Paire ── */}
          <div id="charts-grid" style={{ display: 'grid', gridTemplateColumns: chartsGrid, gap: 16, marginBottom: 32 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>📅 Par Jour</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                {dayPerf.map((d: any) => (
                  <BarV key={d.day} value={val(d)} max={maxDay} label={d.day} fmt={fmtVal} />
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.12em' }}>💱 Par Paire</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pairPerf.map((p: any) => (
                  <div key={p.pair}>
                    <div style={{ fontSize: 10, color: '#8899AA', marginBottom: 3 }}>{p.pair}</div>
                    <BarH value={val(p)} max={maxPair} color={val(p) >= 0 ? '#00D4AA' : '#FF3B5C'} fmt={fmtVal} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div id="footer-box" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(26,107,255,0.10)', border: '1px solid rgba(26,107,255,0.25)', borderRadius: 24, padding: '10px 24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#1A6BFF"/>
                  <path d="M6 12.5L10 16.5L18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#C0D8FF' }}>Vérifié par Hari Invest</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 0, fontSize: 11, color: '#334455' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A6BFF', flexShrink: 0 }} />
                <span>projournalmitrad.vercel.app</span>
              </div>
              <span>Généré le {new Date().toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
