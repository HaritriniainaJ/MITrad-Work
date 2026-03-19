// Mini graphiques pour les KPI cards Analytics

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = '#00D4AA', width = 80, height = 40 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface GaugeProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
}

export function Gauge({ value, max = 100, color = '#00D4AA', size = 60 }: GaugeProps) {
  const pct = Math.min(value / max, 1);
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const startAngle = Math.PI;
  const endAngle = startAngle + pct * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      )}
    </svg>
  );
}

interface MiniBarProps {
  value: number;
  max: number;
  color?: string;
  negColor?: string;
}

export function MiniBar({ value, max, color = '#00D4AA', negColor = '#FF3B5C' }: MiniBarProps) {
  const pct = Math.min(Math.abs(value) / (max || 1) * 100, 100);
  const c = value >= 0 ? color : negColor;
  return (
    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}