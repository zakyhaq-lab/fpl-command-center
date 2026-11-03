import { fmtInt } from "@/lib/fpl/derive";
import type { EventHistory } from "@/lib/fpl/types";

const W = 336;
const H = 168;
const PAD = { top: 12, right: 12, bottom: 22, left: 48 };

function niceShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Overall rank by gameweek; better ranks plot higher, so the axis runs from worst at the foot to best at the top. */
export function RankChart({ history }: { history: EventHistory[] }) {
  const pts = history.filter((h) => h.overallRank != null) as (EventHistory & { overallRank: number })[];
  if (pts.length < 2) {
    return <p className="py-10 text-center text-[12px] text-muted">The rank line starts after two gameweeks.</p>;
  }
  const ranks = pts.map((p) => p.overallRank);
  const lo = Math.min(...ranks);
  const hi = Math.max(...ranks);
  const span = Math.max(1, hi - lo);
  const min = Math.max(1, lo - span * 0.1);
  const max = hi + span * 0.1;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const first = pts[0].event;
  const last = pts[pts.length - 1].event;
  const x = (ev: number) => PAD.left + ((ev - first) / Math.max(1, last - first)) * iw;
  const y = (r: number) => PAD.top + ((r - min) / (max - min)) * ih;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.event).toFixed(1)},${y(p.overallRank).toFixed(1)}`).join("");
  const ticks = [min, (min + max) / 2, max];
  const end = pts[pts.length - 1];
  const best = pts.reduce((a, b) => (b.overallRank < a.overallRank ? b : a));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Overall rank from GW${first} to GW${last}, now ${fmtInt(end.overallRank)}, best ${fmtInt(best.overallRank)} in GW${best.event}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
            {niceShort(Math.round(t))}
          </text>
        </g>
      ))}
      {pts.map((p) => (
        <text key={p.event} x={x(p.event)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">
          {p.event}
        </text>
      ))}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(best.event)} cy={y(best.overallRank)} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx={x(end.event)} cy={y(end.overallRank)} r="3.5" fill="var(--accent)" />
    </svg>
  );
}
