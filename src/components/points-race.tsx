"use client";

import { useMemo, useRef, useState } from "react";
import { TeamFlag } from "./team-flag";
import { Avatar } from "./avatar";
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

type Hover = { playerId: string; matchIdx: number };

export function PointsRace({
  entries,
  matchesAsc,
  height = 320,
}: {
  entries: LeaderboardEntry[];
  matchesAsc: Match[];
  height?: number;
}) {
  const players = useMemo(
    () => entries.filter((e) => e.history.length > 0),
    [entries],
  );

  const n = matchesAsc.length;
  const maxPts = Math.max(1, ...players.flatMap((p) => p.history));

  const padding = { top: 16, right: 28, bottom: 16, left: 36 };
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

  const chartRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  if (players.length === 0) return null;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vbX = (x / rect.width) * vbWidth;
    const vbY = (y / rect.height) * vbHeight;

    if (n <= 0) return;
    const ratio =
      n === 1 ? 0 : (vbX - padding.left) / innerW;
    let matchIdx = Math.round(ratio * (n - 1));
    matchIdx = Math.max(0, Math.min(n - 1, matchIdx));

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const p of players) {
      if (matchIdx >= p.history.length) continue;
      const py = yFor(p.history[matchIdx]);
      const d = Math.abs(py - vbY);
      if (d < bestDist) {
        bestDist = d;
        bestId = p.player_id;
      }
    }
    if (bestId) setHover({ playerId: bestId, matchIdx });
  }

  function handleLeave() {
    setHover(null);
  }

  const hoveredPlayer = hover
    ? players.find((p) => p.player_id === hover.playerId)
    : null;
  const hoveredMatch = hover ? matchesAsc[hover.matchIdx] : null;
  const hoveredPoints =
    hoveredPlayer && hover ? hoveredPlayer.history[hover.matchIdx] : null;

  return (
    <div className="w-full">
      <div
        ref={chartRef}
        className="relative cursor-crosshair select-none"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
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
              opacity={hover?.matchIdx === i ? 0.25 : 0.05}
            />
          ))}

          {/* Lines */}
          {players.map((p, idx) => {
            const color = playerColor(idx);
            const pointArr = p.history.map(
              (v, i) => [xFor(i), yFor(v)] as const,
            );
            const path = pointArr
              .map(([x, y], i) =>
                `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
              )
              .join(" ");
            const dimmed = hover && hover.playerId !== p.player_id;
            return (
              <g key={p.player_id} style={{ color }}>
                <path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={hover?.playerId === p.player_id ? 3 : 2.25}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={dimmed ? 0.2 : 0.9}
                />
                {pointArr.slice(0, -1).map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={hover?.matchIdx === i && hover.playerId === p.player_id ? 4 : 2}
                    fill="currentColor"
                    opacity={dimmed ? 0.2 : 0.7}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Avatars at end of each line */}
        {players.map((p) => {
          const lastIdx = p.history.length - 1;
          if (lastIdx < 0) return null;
          const lastX = xFor(lastIdx);
          const lastY = yFor(p.history[lastIdx]);
          const leftPct = (lastX / vbWidth) * 100;
          const topPct = (lastY / vbHeight) * 100;
          const dimmed = hover && hover.playerId !== p.player_id;
          return (
            <div
              key={p.player_id}
              className="pointer-events-none absolute transition-opacity"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
                opacity: dimmed ? 0.25 : 1,
              }}
            >
              <Avatar
                name={p.name}
                imageUrl={p.avatar_url}
                size="xs"
              />
            </div>
          );
        })}

        {/* Tooltip */}
        {hoveredPlayer && hoveredMatch && hoveredPoints !== null ? (
          <Tooltip
            leftPct={(xFor(hover!.matchIdx) / vbWidth) * 100}
            topPct={(yFor(hoveredPoints) / vbHeight) * 100}
            name={hoveredPlayer.name}
            avatarUrl={hoveredPlayer.avatar_url}
            points={hoveredPoints}
            match={hoveredMatch}
            color={playerColor(
              players.findIndex((p) => p.player_id === hoveredPlayer.player_id),
            )}
          />
        ) : null}
      </div>

      {/* Flag axis — vertical labels */}
      <div
        className="relative mt-2"
        style={{
          height: 52,
          marginLeft: `${(padding.left / vbWidth) * 100}%`,
          marginRight: `${(padding.right / vbWidth) * 100}%`,
        }}
      >
        {matchesAsc.map((m, i) => {
          const x = n <= 1 ? 50 : (i / (n - 1)) * 100;
          const active = hover?.matchIdx === i;
          return (
            <div
              key={m.match_number}
              className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 transition-opacity"
              style={{ left: `${x}%`, top: 0, opacity: hover ? (active ? 1 : 0.35) : 1 }}
              title={`Partido ${m.match_number}: ${m.team_a} vs ${m.team_b}`}
            >
              <TeamFlag team={m.team_a} size="xs" />
              <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground">
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
          const dimmed = hover && hover.playerId !== p.player_id;
          return (
            <li
              key={p.player_id}
              className="inline-flex items-center gap-2 transition-opacity"
              style={{ opacity: dimmed ? 0.4 : 1 }}
            >
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

function Tooltip({
  leftPct,
  topPct,
  name,
  avatarUrl,
  points,
  match,
  color,
}: {
  leftPct: number;
  topPct: number;
  name: string;
  avatarUrl: string | null;
  points: number;
  match: Match;
  color: string;
}) {
  // Flip to the left side if cursor is past 70% of chart width
  const onRightSide = leftPct > 70;
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: onRightSide
          ? "translate(calc(-100% - 16px), -50%)"
          : "translate(16px, -50%)",
      }}
    >
      <div
        className="rounded-md border-2 bg-background px-3 py-2 shadow-lg"
        style={{ borderColor: color }}
      >
        <div className="flex items-center gap-2">
          <Avatar name={name} imageUrl={avatarUrl} size="xs" />
          <div className="min-w-0">
            <div className="font-heading text-xs font-black uppercase tracking-tight">
              {name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {match.team_a}–{match.team_b}
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="font-heading text-lg font-black tabular-nums">
            {points}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            pts
          </span>
        </div>
      </div>
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
