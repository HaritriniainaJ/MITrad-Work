import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const tooltipStyle = {
  background: '#0A1628',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
};

interface ReportData {
  trader: string;
  avatar: string | null;
  dateFrom: string;
  dateTo: string;
  accountNames: string[];
  stats: {
    trades: number; wins: number; losses: number;
    winRate: number; totalR: number; totalDollar: number;
    pf: number; avgR: number; croissance: number; capital: number;
  };
  badges: string[];
  equity: { date: string; r: number }[];
  dayPerf: { day: string; r: number }[];
  pairPerf: { pair: string; r: number }[];
}

const BADGE_MAP: Record<string, { emoji: string; name: string }> = {
  sniper:     { emoji: '🎯', name: 'Sniper' },
  diamond:    { emoji: '💎', name: 'Diamond Hands' },
  fire:       { emoji: '🔥', name: 'On Fire' },
  speed:      { emoji: '⚡', name: 'Speed Trader' },
  lion:       { emoji: '🦁', name: 'Lion' },
  strategist: { emoji: '🧠', name: 'Strategist' },
  consistent: { emoji: '📅', name: 'Consistent' },
  rookie:     { emoji: '🚀', name: 'Rookie Star' },
  icecold:    { emoji: '❄️', name: 'Ice Cold' },
  champion:   { emoji: '🏆', name: 'Champion' },
};

export default function ShareReport() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const isPrint = searchParams.get('print') === '1';
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Rapport introuvable.'); return; }
    try {
      const raw = sessionStorage.getItem(token);
      if (!raw) { setError('Le rapport a expiré ou est introuvable.\nLes rapports sont disponibles uniquement sur votre appareil.'); return; }
      setData(JSON.parse(raw));
    } catch {
      setError('Rapport invalide.');
    }
  }, [token]);

  useEffect(() => {
    if (isPrint && data) {
      document.title = `MITrad — ${data.trader} — Rapport`;
    }
  }, [isPrint, data]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });

  const S: React.CSSProperties = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  };

  if (error) return (
    <div style={{ ...S, minHeight: '100vh', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', color: '#8899AA', maxWidth: 400 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
        <p style={{ fontSize: 18, color: '#fff', marginBottom: 12, whiteSpace: 'pre-line' }}>{error}</p>
        <p style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Pour partager un rapport, exportez-le depuis votre Dashboard et envoyez le fichier PDF directement.
        </p>
        <a href="/" style={{ color: '#1A6BFF', fontSize: 14 }}>Retour à MITrad Journal</a>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ ...S, minHeight: '100vh', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8899AA', fontSize: 14 }}>Chargement...</div>
    </div>
  );

  const { stats, equity, dayPerf, pairPerf, badges } = data;
  const isPos = stats.totalR >= 0;

  const kpis = [
    { label: 'Win Rate',      value: `${stats.winRate}%`,                                            color: stats.winRate >= 50 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Profit Factor', value: stats.pf.toFixed(2),                                             color: stats.pf >= 1.5 ? '#00D4AA' : stats.pf >= 1 ? '#F59E0B' : '#FF3B5C' },
    { label: 'R Total',       value: `${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`,   color: isPos ? '#00D4AA' : '#FF3B5C' },
    { label: 'R Moyen',       value: `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`,       color: stats.avgR >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Croissance',    value: `${stats.croissance >= 0 ? '+' : ''}${stats.croissance.toFixed(2)}%`, color: stats.croissance >= 0 ? '#00D4AA' : '#FF3B5C' },
    { label: 'Trades',        value: `${stats.wins}W / ${stats.losses}L`,                            color: '#C0CCD8' },
  ];

  return (
    <div style={{ ...S, minHeight: '100vh', background: '#060D1A', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media print {
          body { background: #060D1A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isPrint ? '32px 40px' : '28px 24px' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/logo.png" alt="MITrad" style={{ height: 44, width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(90deg,#1A6BFF,#6C3AFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MITrad Journal
              </div>
              <div style={{ fontSize: 11, color: '#8899AA', marginTop: 2 }}>Rapport de Performance</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{data.trader}</div>
              <div style={{ fontSize: 11, color: '#8899AA', marginTop: 3 }}>
                {fmtDate(data.dateFrom)} → {fmtDate(data.dateTo)}
              </div>
              {data.accountNames?.length > 0 && (
                <div style={{ fontSize: 11, color: '#556677', marginTop: 2 }}>
                  {data.accountNames.join(' · ')}
                </div>
              )}
              {badges.length > 0 && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
                  {badges.map(id => BADGE_MAP[id] && (
                    <span key={id} style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '2px 7px' }}>
                      {BADGE_MAP[id].emoji} {BADGE_MAP[id].name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {data.avatar && (
              <img src={data.avatar} alt={data.trader} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(26,107,255,0.4)' }} />
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* ── EQUITY CURVE ── */}
        {equity.length > 1 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 18px 10px', marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equity Curve</div>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isPos ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'Cumul']} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="r" stroke={isPos ? '#00D4AA' : '#FF3B5C'} strokeWidth={2.5} fill="url(#grad)" isAnimationActive={!isPrint} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── PAR JOUR + PAR PAIRE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          {dayPerf.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8899AA', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par Jour</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={dayPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[4,4,0,0]} isAnimationActive={!isPrint}>
                    {dayPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {pairPerf.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8899AA', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Par Paire</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={pairPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="pair" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[0,4,4,0]} isAnimationActive={!isPrint}>
                    {pairPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#445566' }}>
          <span>Généré avec MITrad Journal · projournalmitrad.vercel.app</span>
          <span>Rapport du {new Date().toLocaleDateString('fr')}</span>
        </div>

        {!isPrint && (
          <div className="no-print" style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg,#1A6BFF,#6C3AFF)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Accéder à MITrad Journal
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
