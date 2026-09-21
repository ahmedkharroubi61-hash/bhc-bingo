interface Point { label: string; value: number }

/** Smooth monotone-ish path through points using midpoint bezier smoothing. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], n = pts[i + 1];
    const mx = (p.x + n.x) / 2;
    d += ` C${mx},${p.y} ${mx},${n.y} ${n.x},${n.y}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Compact money label for axis: 188000 millimes → "188". Values are millimes → DT. */
function axisLabel(millimes: number): string {
  const dt = millimes / 1000;
  if (dt >= 1000) return `${Math.round(dt / 100) / 10}k`;
  return String(Math.round(dt));
}

/**
 * Revenue area chart. Values are millimes. Smooth terracotta line with a soft
 * gradient fill, dashed gridlines, y-axis (DT) and x-axis (month) labels.
 */
export function AreaChart({ points }: { points: Point[] }) {
  const W = 580, H = 230;
  const padL = 40, padR = 14, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const n = Math.max(1, points.length - 1);

  const xy = points.map((p, i) => ({
    x: padL + (plotW * i) / n,
    y: padT + plotH - (p.value / max) * plotH,
  }));

  const line = smoothPath(xy);
  const area = xy.length
    ? `${line} L${xy[xy.length - 1].x},${padT + plotH} L${xy[0].x},${padT + plotH} Z`
    : "";
  const rows = [0, 0.5, 1];

  return (
    <svg className="achart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly revenue chart">
      <defs>
        <linearGradient id="adm-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--adm-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--adm-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {rows.map((r) => {
        const y = padT + plotH * r;
        return (
          <g key={r}>
            <line className="grid" x1={padL} y1={y} x2={W - padR} y2={y} />
            <text className="axis" x={padL - 8} y={y + 3} textAnchor="end">{axisLabel(max * (1 - r))}</text>
          </g>
        );
      })}
      {area ? <path className="area" d={area} /> : null}
      {line ? <path className="line" d={line} /> : null}
      {xy.map((p, i) => (
        <g key={i}>
          {i === xy.length - 1 ? <circle className="dot" cx={p.x} cy={p.y} r={4} /> : null}
          <text className="axis" x={p.x} y={H - 7} textAnchor="middle">{points[i].label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Half-circle gauge (0–100%). */
export function Gauge({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  const W = 220, H = 128, cx = W / 2, cy = H - 8, r = 92;
  // Semicircle from 180° (left) to 0° (right).
  const start = { x: cx - r, y: cy };
  const end = { x: cx + r, y: cy };
  const track = `M${start.x},${start.y} A${r},${r} 0 0 1 ${end.x},${end.y}`;
  const len = Math.PI * r;
  const offset = len * (1 - pct / 100);

  return (
    <svg className="agauge" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${Math.round(pct)} percent`}>
      <path className="track" d={track} />
      <path className="val" d={track} strokeDasharray={len} strokeDashoffset={offset} />
    </svg>
  );
}
