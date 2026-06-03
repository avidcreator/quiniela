"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // On mobile we render the chart at a real pixel size (wide enough that each
  // match gets room, tall enough to read) and let it scroll horizontally. The
  // viewBox then maps 1:1 to pixels, so nothing is stretched. On desktop the
  // chart fills the container width with an aspect-derived height.
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = { top: 16, right: 28, bottom: 16, left: 36 };
  // On mobile fill the visible scroll area (containerW is its clientWidth, which
  // already excludes the 6px side padding); only grow wider — and scroll — when
  // there are enough matches that each needs ~48px of room.
  const availW = containerW > 0 ? containerW - 12 : 348;
  const vbWidth = isMobile ? Math.max(availW, n * 48) : 720;
  const vbHeight = isMobile ? 300 : height;
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
  // Selected player (tap a chip below). Powers the mobile scrubber.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrubIdx, setScrubIdx] = useState<number>(0);

  if (players.length === 0) return null;

  const selectedPlayer = selectedId
    ? players.find((p) => p.player_id === selectedId) ?? null
    : null;
  const selectedColorIdx = selectedPlayer
    ? players.findIndex((p) => p.player_id === selectedPlayer.player_id)
    : -1;

  // Line emphasis: live hover wins, else the selected player.
  const activeId = hover?.playerId ?? selectedId;
  // The match index of the on-chart marker.
  const markIdx =
    hover?.matchIdx ??
    (selectedPlayer
      ? Math.min(scrubIdx, selectedPlayer.history.length - 1)
      : null);
  const markPlayerId = hover?.playerId ?? selectedId;

  function selectPlayer(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    const p = players.find((x) => x.player_id === id);
    setSelectedId(id);
    setScrubIdx(p ? p.history.length - 1 : 0);
  }

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vbX = (x / rect.width) * vbWidth;
    const vbY = (y / rect.height) * vbHeight;

    if (n <= 0) return;
    const ratio = n === 1 ? 0 : (vbX - padding.left) / innerW;
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

  const hoveredPlayer = hover
    ? players.find((p) => p.player_id === hover.playerId)
    : null;
  const hoveredMatch = hover ? matchesAsc[hover.matchIdx] : null;
  const hoveredPoints =
    hoveredPlayer && hover ? hoveredPlayer.history[hover.matchIdx] : null;

  const maxScrub = selectedPlayer ? selectedPlayer.history.length - 1 : 0;
  const clampedScrub = Math.min(scrubIdx, maxScrub);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="-mx-4 overflow-x-auto px-1.5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 [scrollbar-width:thin]"
      >
        <div style={{ width: isMobile ? `${vbWidth}px` : undefined }}>
          <div
            ref={chartRef}
            className="relative cursor-crosshair select-none"
            onPointerMove={handleMove}
            onPointerLeave={() => setHover(null)}
          >
            <svg
              viewBox={`0 0 ${vbWidth} ${vbHeight}`}
              className="block w-full h-auto"
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
                  opacity={markIdx === i ? 0.2 : 0.05}
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
                const dimmed = activeId != null && activeId !== p.player_id;
                const emphasized = activeId === p.player_id;
                return (
                  <g key={p.player_id} style={{ color }}>
                    <path
                      d={path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={emphasized ? 3 : 2.25}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={dimmed ? 0.12 : 0.9}
                    />
                    {pointArr.slice(0, -1).map(([x, y], i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={emphasized ? 3 : 2}
                        fill="currentColor"
                        opacity={dimmed ? 0.12 : 0.7}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Scrub / hover marker for the focused player */}
              {markPlayerId != null && markIdx != null
                ? (() => {
                    const fp = players.find(
                      (p) => p.player_id === markPlayerId,
                    );
                    if (!fp || markIdx >= fp.history.length) return null;
                    const mx = xFor(markIdx);
                    const my = yFor(fp.history[markIdx]);
                    const color = playerColor(
                      players.findIndex((p) => p.player_id === markPlayerId),
                    );
                    return (
                      <g style={{ color }}>
                        <line
                          x1={mx}
                          x2={mx}
                          y1={padding.top}
                          y2={padding.top + innerH}
                          stroke="currentColor"
                          strokeOpacity={0.4}
                          strokeDasharray="3 3"
                        />
                        <circle
                          cx={mx}
                          cy={my}
                          r={6}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        />
                        <circle cx={mx} cy={my} r={3} fill="currentColor" />
                      </g>
                    );
                  })()
                : null}
            </svg>

            {/* Avatars at end of each line */}
            {players.map((p) => {
              const lastIdx = p.history.length - 1;
              if (lastIdx < 0) return null;
              const lastX = xFor(lastIdx);
              const lastY = yFor(p.history[lastIdx]);
              const leftPct = (lastX / vbWidth) * 100;
              const topPct = (lastY / vbHeight) * 100;
              const dimmed = activeId != null && activeId !== p.player_id;
              return (
                <div
                  key={p.player_id}
                  className="pointer-events-none absolute transition-opacity"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: "translate(-50%, -50%)",
                    opacity: dimmed ? 0.2 : 1,
                  }}
                >
                  <Avatar name={p.name} imageUrl={p.avatar_url} size="xs" />
                </div>
              );
            })}

            {/* Desktop hover tooltip */}
            {hoveredPlayer && hoveredMatch && hoveredPoints !== null ? (
              <Tooltip
                leftPct={(xFor(hover!.matchIdx) / vbWidth) * 100}
                topPct={(yFor(hoveredPoints) / vbHeight) * 100}
                name={hoveredPlayer.name}
                avatarUrl={hoveredPlayer.avatar_url}
                points={hoveredPoints}
                match={hoveredMatch}
                color={playerColor(
                  players.findIndex(
                    (p) => p.player_id === hoveredPlayer.player_id,
                  ),
                )}
              />
            ) : null}
          </div>

          {/* Flag axis */}
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
              const active = markIdx === i;
              return (
                <div
                  key={m.match_number}
                  className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 transition-opacity"
                  style={{
                    left: `${x}%`,
                    top: 0,
                    opacity: markIdx != null ? (active ? 1 : 0.35) : 1,
                  }}
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
              <span>
                {lastDate && lastDate !== firstDate ? shortDate(lastDate) : ""}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Scrubber for the selected player */}
      {selectedPlayer ? (
        <ScrubCard
          player={selectedPlayer}
          color={playerColor(selectedColorIdx)}
          match={matchesAsc[clampedScrub]}
          idx={clampedScrub}
          total={n}
          points={selectedPlayer.history[clampedScrub] ?? 0}
          onPrev={() => setScrubIdx((i) => Math.max(0, i - 1))}
          onNext={() => setScrubIdx((i) => Math.min(maxScrub, i + 1))}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {/* Player selector */}
      <div className="mt-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {selectedPlayer ? "Jugador" : "Toca un jugador para seguir su línea"}
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:thin]">
          {players.map((p, idx) => {
            const color = playerColor(idx);
            const selected = selectedId === p.player_id;
            return (
              <button
                key={p.player_id}
                type="button"
                onClick={() => selectPlayer(p.player_id)}
                aria-pressed={selected}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2 py-1 text-xs transition ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <Avatar name={p.name} imageUrl={p.avatar_url} size="xs" />
                <span className="font-medium">{p.name}</span>
                <span
                  className={`font-mono tabular-nums ${selected ? "text-background/70" : "text-muted-foreground"}`}
                >
                  {p.points}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScrubCard({
  player,
  color,
  match,
  idx,
  total,
  points,
  onPrev,
  onNext,
  onClose,
}: {
  player: LeaderboardEntry;
  color: string;
  match: Match | undefined;
  idx: number;
  total: number;
  points: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="mt-4 rounded-md border-2 bg-card p-3"
      style={{ borderColor: color }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={player.name} imageUrl={player.avatar_url} size="sm" />
          <span className="truncate font-heading text-sm font-black uppercase tracking-tight">
            {player.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted"
        >
          Cerrar ✕
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={idx <= 0}
          aria-label="Partido anterior"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border text-lg font-black transition enabled:hover:bg-muted disabled:opacity-30"
        >
          ‹
        </button>

        <div className="min-w-0 flex-1 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Partido {match ? String(match.match_number).padStart(2, "0") : "—"}{" "}
            <span className="opacity-50">· {idx + 1}/{total}</span>
          </div>
          {match ? (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
              <TeamFlag team={match.team_a} size="xs" />
              <span className="font-mono font-bold uppercase text-muted-foreground">
                vs
              </span>
              <TeamFlag team={match.team_b} size="xs" />
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span
              className="font-heading text-2xl font-black tabular-nums"
              style={{ color }}
            >
              {points}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              pts acum.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={idx >= total - 1}
          aria-label="Partido siguiente"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border text-lg font-black transition enabled:hover:bg-muted disabled:opacity-30"
        >
          ›
        </button>
      </div>
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
  const onRightSide = leftPct > 70;
  return (
    <div
      className="pointer-events-none absolute z-10 hidden sm:block"
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
