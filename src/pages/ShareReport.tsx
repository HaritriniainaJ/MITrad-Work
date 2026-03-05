import { useMemo, useEffect, useState } from 'react';
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
  stats: {
    trades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalR: number;
    totalDollar: number;
    pf: number;
    avgR: number;
    croissance: number;
    capital: number;
  };
  badges: string[];
  equity: { date: string; r: number }[];
  dayPerf: { day: string; r: number }[];
  pairPerf: { pair: string; r: number }[];
  expires: number;
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
    if (!token) { setError('Lien invalide.'); return; }
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(token)));
      if (decoded.expires < Date.now()) {
        setError('Ce lien a expiré (valable 24h).');
        return;
      }
      setData(decoded);
    } catch {
      setError('Lien invalide ou corrompu.');
    }
  }, [token]);

  useEffect(() => {
    if (isPrint && data) {
      document.title = `MITrad — ${data.trader} — Rapport de performance`;
    }
  }, [isPrint, data]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' });

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#8899AA' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏱️</div>
          <p style={{ fontSize: 18, color: '#fff', marginBottom: 8 }}>{error}</p>
          <a href="/" style={{ color: '#1A6BFF', fontSize: 14 }}>Retour à MITrad Journal</a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#060D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8899AA', fontSize: 14 }}>Chargement...</div>
      </div>
    );
  }

  const { stats, equity, dayPerf, pairPerf, badges } = data;
  const isPositive = stats.totalR >= 0;

  const kpis = [
    { label: 'Win Rate',      value: `${stats.winRate}%`,                                         color: stats.winRate >= 50 ? '#00D4AA' : '#FF3B5C',  bg: stats.winRate >= 50 ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'Profit Factor', value: stats.pf.toFixed(2),                                          color: stats.pf >= 1.5 ? '#00D4AA' : stats.pf >= 1 ? '#F59E0B' : '#FF3B5C', bg: 'rgba(26,107,255,0.08)' },
    { label: 'R Total',       value: `${stats.totalR >= 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`, color: isPositive ? '#00D4AA' : '#FF3B5C',           bg: isPositive ? 'rgba(0,212,170,0.08)' : 'rgba(255,59,92,0.08)' },
    { label: 'R Moyen',       value: `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`,     color: stats.avgR >= 0 ? '#00D4AA' : '#FF3B5C',      bg: 'rgba(108,58,255,0.08)' },
    { label: 'Croissance',    value: `${stats.croissance >= 0 ? '+' : ''}${stats.croissance.toFixed(2)}%`, color: stats.croissance >= 0 ? '#00D4AA' : '#FF3B5C', bg: 'rgba(0,212,170,0.06)' },
    { label: 'Trades',        value: `${stats.wins}W / ${stats.losses}L`,                         color: '#C0CCD8',                                    bg: 'rgba(136,153,170,0.08)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060D1A',
      color: '#fff',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: isPrint ? '0' : '0',
    }}>
      {/* Print styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media print {
          body { background: #060D1A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isPrint ? '32px 40px' : '32px 24px' }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Logo + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/logo.png"
              alt="MITrad"
              style={{ height: 48, width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg, #1A6BFF, #6C3AFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MITrad Journal
              </div>
              <div style={{ fontSize: 12, color: '#8899AA', marginTop: 2 }}>Rapport de Performance</div>
            </div>
          </div>

          {/* Trader info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{data.trader}</div>
              <div style={{ fontSize: 11, color: '#8899AA', marginTop: 2 }}>
                {fmtDate(data.dateFrom)} → {fmtDate(data.dateTo)}
              </div>
              {badges.length > 0 && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
                  {badges.map(id => BADGE_MAP[id] && (
                    <span key={id} style={{
                      fontSize: 11, background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {BADGE_MAP[id].emoji} {BADGE_MAP[id].name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {data.avatar && (
              <img src={data.avatar} alt={data.trader} style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '2px solid rgba(26,107,255,0.4)',
              }} />
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: k.bg,
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 10, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                {k.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── EQUITY CURVE ── */}
        {equity.length > 1 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '20px 20px 12px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8899AA', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Equity Curve
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isPositive ? '#00D4AA' : '#FF3B5C'} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'Cumul']} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="r" stroke={isPositive ? '#00D4AA' : '#FF3B5C'}
                  strokeWidth={2.5} fill="url(#grad)" isAnimationActive={!isPrint} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Par jour */}
          {dayPerf.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '18px 16px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Par Jour
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={dayPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[4, 4, 0, 0]} isAnimationActive={!isPrint}>
                    {dayPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Par paire */}
          {pairPerf.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '18px 16px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8899AA', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Par Paire
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={pairPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="pair" tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}R`, 'P&L']} />
                  <Bar dataKey="r" radius={[0, 4, 4, 0]} isAnimationActive={!isPrint}>
                    {pairPerf.map((e, i) => <Cell key={i} fill={e.r >= 0 ? '#00D4AA' : '#FF3B5C'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: '#556677',
        }}>
          <span>Généré avec MITrad Journal · projournalmitrad.vercel.app</span>
          <span>Rapport du {new Date().toLocaleDateString('fr')}</span>
        </div>

        {/* Bouton retour (non imprimé) */}
        {!isPrint && (
          <div className="no-print" style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/" style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'linear-gradient(135deg, #1A6BFF, #6C3AFF)',
              color: '#fff', borderRadius: 12, textDecoration: 'none',
              fontSize: 13, fontWeight: 600,
            }}>
              Accéder à MITrad Journal
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
