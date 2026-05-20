import { TeamFlag } from "./team-flag";
import { playerColor } from "@/lib/palette";
import type { LeaderboardEntry } from "@/lib/stats";
import type { Match } from "@/lib/data";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  day: "numeric",
});
function shortDate(iso: string): string {
  const text = dateFmt.format(new Date(iso)).replace(".", "");
  const [day, month] = text.split(/\s+/);
  if (!month) return text;
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

export function PointsRace({
  entries,
  matchesAsc,
  height = 320,
}: {
  entries: LeaderboardEntry[];
  matchesAsc: Match[];
  height?: number;
}) {
  const players = entries.filter((e) => e.history.length > 0);
  if (players.length === 0) return null;

  const n = matchesAsc.length;
  const maxPts = Math.max(1, ...players.flatMap((p) => p.history));

  const padding = { top: 16, right: 16, bottom: 16, left: 36 };
  const vbWidth = 720;
  const vbHeight = height;
  const innerW = vbWidth - padding.left - padding.right;
  const innerH = vbHeight - padding.top - padding.bottom;

  const xFor = (i: number) => {
    if (n <= 1) return padding.left + innerW / 2;
    return padding.left + (i / (n - 1)) * innerW;
  };
  const yFor = (v: number) => padding.top + innerH - (v / maxPts) * innerH;

  const yTicks = niceTicks(maxPts, 6);

  const firstDate = matchesAsc[0]?.kickoff_at;
  const lastDate = matchesAsc[matchesAsc.length - 1]?.kickoff_at;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        className="block w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* Y gridlines + labels */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padding.left}
              x2={vbWidth - padding.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="currentColor"
              opacity={t === 0 ? 0.2 : 0.08}
              strokeWidth={1}
              strokeDasharray={t === 0 ? "" : "2 4"}
            />
            <text
              x={padding.left - 6}
              y={yFor(t) + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono"
              fontSize={10}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Vertical gridlines per match */}
        {Array.from({ length: n }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={xFor(i)}
            x2={xFor(i)}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="currentColor"
            opacity={0.05}
          />
        ))}

        {/* Lines + per-match dots */}
        {players.map((p, idx) => {
          const color = playerColor(idx);
          const points = p.history.map((v, i) => [xFor(i), yFor(v)] as const);
          const path = points
            .map(([x, y], i) =>
              `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
            )
            .join(" ");
          return (
            <g key={p.player_id} style={{ color }}>
              <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
              {points.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i === points.length - 1 ? 3.5 : 2}
                  fill="currentColor"
                  opacity={i === points.length - 1 ? 1 : 0.7}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Flag axis */}
      <div
        className="relative mt-2"
        style={{
          height: 20,
          marginLeft: `${(padding.left / vbWidth) * 100}%`,
          marginRight: `${(padding.right / vbWidth) * 100}%`,
        }}
      >
        {matchesAsc.map((m, i) => {
          const x = n <= 1 ? 50 : (i / (n - 1)) * 100;
          return (
            <div
              key={m.match_number}
              className="absolute flex -translate-x-1/2 items-center gap-1"
              style={{ left: `${x}%`, top: 0 }}
              title={`Partido ${m.match_number}: ${m.team_a} vs ${m.team_b}`}
            >
              <TeamFlag team={m.team_a} size="xs" />
              <span className="text-[8px] font-bold uppercase text-muted-foreground">
                vs
              </span>
              <TeamFlag team={m.team_b} size="xs" />
            </div>
          );
        })}
      </div>

      {/* Date range */}
      {firstDate ? (
        <div
          className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
          style={{
            marginLeft: `${(padding.left / vbWidth) * 100}%`,
            marginRight: `${(padding.right / vbWidth) * 100}%`,
          }}
        >
          <span>{shortDate(firstDate)}</span>
          <span>{lastDate && lastDate !== firstDate ? shortDate(lastDate) : ""}</span>
        </div>
      ) : null}

      {/* Legend */}
      <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {players.map((p, idx) => {
          const color = playerColor(idx);
          return (
            <li key={p.player_id} className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-0.5 w-5"
                style={{ background: color }}
              />
              <span className="font-medium">{p.name}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {p.points}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function niceTicks(max: number, count: number): number[] {
  if (max <= 0) return [0];
  const step = Math.max(1, Math.ceil(max / count));
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(max);
  return out;
}
