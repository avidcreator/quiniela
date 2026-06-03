"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { TeamFlag } from "./team-flag";
import type {
  LeaderboardEntry,
  BestMatch,
  PlayerExtendedStats,
} from "@/lib/stats";

export type WinnerData = {
  entry: LeaderboardEntry;
  bestMatches: BestMatch[];
  extended: PlayerExtendedStats;
};

export type WinnerMatch = {
  match_number: number;
  team_a: string;
  team_b: string;
};

// =========================================================
// WinnerCelebration — pure championship card (top section)
// =========================================================

export function WinnerCelebration({ winners }: { winners: WinnerData[] }) {
  if (winners.length === 0) return null;
  const multi = winners.length > 1;

  return (
    <section className="relative overflow-hidden rounded-md border-2 border-foreground bg-card shadow-lg">
      <DiagonalSlash />

      {/* Brand tape */}
      <header className="relative flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-2 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-5 items-center justify-center overflow-hidden rounded-sm bg-foreground p-0.5 ring-1 ring-foreground/20">
            <Image
              src="/icon.png"
              alt=""
              width={20}
              height={28}
              className="h-full w-auto object-contain invert dark:invert-0"
            />
          </span>
          <div className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
            FIFA 2026 · Fase de grupos ·{" "}
            <span className="text-primary">
              {multi ? "Campeones" : "Campeón"}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 border-2 border-primary px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.28em] text-primary">
          🏆 Oficial
        </span>
      </header>

      {/* Champion bodies */}
      <div
        className={`relative grid gap-px bg-foreground/10 ${
          multi ? "sm:grid-cols-2" : ""
        }`}
      >
        {winners.map((w) => (
          <ChampionCard
            key={w.entry.player_id}
            data={w}
            shared={multi}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-foreground/10 bg-primary px-4 py-1.5 sm:px-6">
        <span className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-primary-foreground">
          ★ Champion 2026
        </span>
        <span className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-primary-foreground">
          Fase de grupos · 72 partidos
        </span>
      </div>
    </section>
  );
}

function ChampionCard({
  data,
  shared,
}: {
  data: WinnerData;
  shared: boolean;
}) {
  const e = data.entry;
  const efectividad =
    e.matches_played > 0
      ? Math.round(((e.strikes + e.wins) / e.matches_played) * 100)
      : 0;
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card px-4 py-6 sm:px-6">
      <ChampionDecor name={e.name} />

      <div className="relative grid grid-cols-[auto_1fr] items-center gap-4 sm:gap-6">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/40 blur-2xl"
          />
          <div className="relative rounded-full ring-4 ring-primary ring-offset-2 ring-offset-card">
            <Avatar name={e.name} imageUrl={e.avatar_url} size="xl" />
          </div>
          <span
            aria-hidden
            className="absolute -bottom-2 -right-2 inline-flex size-7 -rotate-6 items-center justify-center rounded-full bg-primary text-base text-primary-foreground shadow-md"
          >
            🏆
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-1.5 bg-primary px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.32em] text-primary-foreground">
            <span>★</span>
            <span>
              {shared ? "Co-Campeón Oficial" : "Campeón Oficial"}
            </span>
            <span>★</span>
          </div>
          <div className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-primary">
            N°01 · Campeón
          </div>
          <h2 className="mt-0.5 flex items-baseline gap-2 font-heading text-3xl font-black uppercase italic leading-none tracking-tight sm:text-4xl">
            <span className="truncate">{e.name}</span>
            <span className="not-italic text-2xl" aria-hidden>
              👑
            </span>
          </h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-4xl font-black leading-none tabular-nums text-primary sm:text-5xl">
                {e.points}
              </span>
              <span className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                pts
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 border border-foreground/15 px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              {e.matches_played}/72 jugados
            </span>
            <span className="inline-flex items-center gap-1.5 border border-foreground/15 px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              {efectividad}% efectividad
            </span>
            <span className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/5 px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.22em] text-primary">
              🎯 {e.strikes} aciertos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// PlayerStatsExplorer — switchable stats deep-dive
// =========================================================

export function PlayerStatsExplorer({
  players,
  winnerIds,
  matches,
}: {
  players: WinnerData[];
  winnerIds: string[];
  matches: WinnerMatch[];
}) {
  const winnerSet = useMemo(() => new Set(winnerIds), [winnerIds]);
  const winners = useMemo(
    () => players.filter((p) => winnerSet.has(p.entry.player_id)),
    [players, winnerSet],
  );
  const others = useMemo(
    () => players.filter((p) => !winnerSet.has(p.entry.player_id)),
    [players, winnerSet],
  );

  const [selectedId, setSelectedId] = useState<string>(
    winners[0]?.entry.player_id ?? players[0]?.entry.player_id ?? "",
  );

  if (players.length === 0) return null;

  const current =
    players.find((w) => w.entry.player_id === selectedId) ?? players[0];
  const e = current.entry;
  const isWinner = winnerSet.has(e.player_id);
  const losses = Math.max(0, e.matches_played - e.wins);
  const winRatio = e.matches_played > 0 ? e.wins / e.matches_played : 0;
  const strikeRatio =
    e.matches_played > 0 ? e.strikes / e.matches_played : 0;
  const lossRatio =
    e.matches_played > 0 ? losses / e.matches_played : 0;

  return (
    <section className="relative overflow-hidden rounded-md border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-2 sm:px-5">
        <div className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
          Stats por jugador
        </div>
        <div className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {players.length} jugadores
        </div>
      </header>

      <PlayerSwitcher
        winners={winners}
        others={others}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Selected player summary */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 px-4 py-4 sm:px-6">
        <div
          className={`rounded-full ring-2 ring-offset-2 ring-offset-card ${
            isWinner ? "ring-primary" : "ring-foreground/30"
          }`}
        >
          <Avatar name={e.name} imageUrl={e.avatar_url} size="lg" />
        </div>
        <div className="min-w-0">
          <div className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
            {isWinner ? "Campeón · N°01" : `Posición · N°${String(e.rank).padStart(2, "0")}`}
          </div>
          <div className="flex items-baseline gap-3">
            <h3 className="truncate font-heading text-2xl font-black uppercase tracking-tight sm:text-3xl">
              {e.name}
            </h3>
            <div className="flex items-baseline gap-1">
              <span
                className={`font-heading text-3xl font-black leading-none tabular-nums sm:text-4xl ${
                  isWinner ? "text-primary" : "text-foreground"
                }`}
              >
                {e.points}
              </span>
              <span className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px border-t border-foreground/10 bg-foreground/10">
        <Stat
          label="Aciertos"
          value={e.strikes}
          sub={`${Math.round(strikeRatio * 100)}%`}
          accent
        />
        <Stat
          label="Ganados"
          value={e.wins}
          sub={`${Math.round(winRatio * 100)}%`}
        />
        <Stat
          label="Fallidos"
          value={losses}
          sub={`${Math.round(lossRatio * 100)}%`}
          muted
        />
        <Stat
          label="Promedio"
          value={current.extended.avg_per_match}
          sub="pts/partido"
        />
        <Stat
          label="Mejor día"
          value={current.extended.best_day_points}
          sub="pts"
          accent
        />
        <Stat
          label="Racha"
          value={current.extended.longest_strike_streak}
          sub="aciertos seg."
          accent
        />
        <Stat
          label="Sequía"
          value={current.extended.longest_dry_streak}
          sub="ceros seg."
          muted
        />
        <Stat
          label="Puntea"
          value={current.extended.total_matches_with_points}
          sub={`de ${e.matches_played}`}
        />
      </div>

      {/* Chart */}
      <div className="border-t border-foreground/10 px-4 py-4 sm:px-6">
        <div className="flex items-baseline justify-between">
          <div className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
            Trayectoria
          </div>
          <div className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Pasa el cursor
          </div>
        </div>
        <PlayerLineChart history={e.history} matches={matches} />
      </div>

      {/* Top plays */}
      {current.bestMatches.length > 0 ? (
        <div className="border-t border-foreground/10 px-4 py-4 sm:px-6">
          <div className="font-heading text-[10px] font-black uppercase tracking-[0.32em] text-primary">
            Top Plays
          </div>
          <ul className="mt-2 space-y-1.5">
            {current.bestMatches.map((m, i) => (
              <li
                key={m.match_number}
                className="flex items-center justify-between gap-3 border border-foreground/10 px-2.5 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2 text-xs">
                  <span className="font-heading text-[10px] font-black tabular-nums text-muted-foreground">
                    0{i + 1}
                  </span>
                  <TeamFlag team={m.team_a} size="xs" />
                  <span className="font-mono font-bold tabular-nums">
                    {m.actual_a}–{m.actual_b}
                  </span>
                  <TeamFlag team={m.team_b} size="xs" />
                  <span className="truncate text-muted-foreground">
                    {m.team_a} vs {m.team_b}
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    pick {m.pred_a}–{m.pred_b}
                  </span>
                  <span
                    className={`inline-flex w-7 justify-center rounded-sm px-1 font-heading text-[10px] font-black tabular-nums ${
                      m.points === 3
                        ? "bg-emerald-600 text-white dark:bg-emerald-500"
                        : "bg-foreground text-background"
                    }`}
                  >
                    +{m.points}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function PlayerSwitcher({
  winners,
  others,
  selectedId,
  onSelect,
}: {
  winners: WinnerData[];
  others: WinnerData[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const showSplit = winners.length > 1;

  return (
    <div className="border-b border-foreground/10 px-4 py-2 sm:px-5">
      {showSplit ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-primary">
            #01 Split
          </span>
          {winners.map((w, i) => (
            <span key={w.entry.player_id} className="flex items-center gap-2">
              <Pill
                player={w}
                active={w.entry.player_id === selectedId}
                isWinner
                onClick={() => onSelect(w.entry.player_id)}
              />
              {i < winners.length - 1 ? (
                <span className="text-primary/40">/</span>
              ) : null}
            </span>
          ))}
          {others.length > 0 ? (
            <>
              <span className="mx-1 h-4 w-px bg-foreground/20" />
              <span className="font-heading text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                Resto
              </span>
              {others.map((p) => (
                <Pill
                  key={p.entry.player_id}
                  player={p}
                  active={p.entry.player_id === selectedId}
                  onClick={() => onSelect(p.entry.player_id)}
                />
              ))}
            </>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {[...winners, ...others].map((p) => (
            <Pill
              key={p.entry.player_id}
              player={p}
              active={p.entry.player_id === selectedId}
              isWinner={winners.includes(p)}
              onClick={() => onSelect(p.entry.player_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({
  player,
  active,
  isWinner,
  onClick,
}: {
  player: WinnerData;
  active: boolean;
  isWinner?: boolean;
  onClick: () => void;
}) {
  const { entry } = player;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-heading text-[9px] font-black uppercase tracking-[0.22em] transition ${
        active
          ? isWinner
            ? "border-primary bg-primary/10 text-primary"
            : "border-foreground bg-foreground text-background"
          : isWinner
            ? "border-primary/40 text-primary hover:bg-primary/5"
            : "border-border text-muted-foreground hover:border-foreground/40"
      }`}
    >
      {isWinner ? <span aria-hidden>🏆</span> : null}
      <span className="tabular-nums">#{String(entry.rank).padStart(2, "0")}</span>
      <Avatar name={entry.name} imageUrl={entry.avatar_url} size="xs" />
      <span>{entry.name}</span>
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  muted,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="font-heading text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 font-heading text-2xl font-black leading-none tabular-nums ${
          accent
            ? "text-primary"
            : muted
              ? "text-muted-foreground"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function PlayerLineChart({
  history,
  matches,
}: {
  history: number[];
  matches: WinnerMatch[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  if (history.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Aún no hay partidos jugados.
      </p>
    );
  }
  const padding = { top: 10, right: 14, bottom: 12, left: 28 };
  const vbW = 720;
  const vbH = 180;
  const innerW = vbW - padding.left - padding.right;
  const innerH = vbH - padding.top - padding.bottom;
  const maxPts = Math.max(1, ...history);

  const xFor = (i: number) =>
    history.length <= 1
      ? padding.left + innerW / 2
      : padding.left + (i / (history.length - 1)) * innerW;
  const yFor = (v: number) => padding.top + innerH - (v / maxPts) * innerH;

  const points = history.map((v, i) => [xFor(i), yFor(v)] as const);
  const linePath = points
    .map(([x, y], i) =>
      `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L${xFor(history.length - 1).toFixed(1)},${(
    padding.top + innerH
  ).toFixed(1)} L${xFor(0).toFixed(1)},${(padding.top + innerH).toFixed(1)} Z`;

  const yTicks = [0, Math.round(maxPts / 2), maxPts];

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const vbX = (xPx / rect.width) * vbW;
    const ratio = history.length === 1 ? 0 : (vbX - padding.left) / innerW;
    let idx = Math.round(ratio * (history.length - 1));
    idx = Math.max(0, Math.min(history.length - 1, idx));
    setHoverIdx(idx);
  }

  const hoverX = hoverIdx !== null ? xFor(hoverIdx) : null;
  const hoverY = hoverIdx !== null ? yFor(history[hoverIdx]) : null;
  const hoverMatch = hoverIdx !== null ? matches[hoverIdx] : null;
  const hoverPoints = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div
      ref={chartRef}
      className="relative mt-2 cursor-crosshair"
      onPointerMove={handleMove}
      onPointerLeave={() => setHoverIdx(null)}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="block w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="winnerLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={vbW - padding.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="currentColor"
              opacity={t === 0 ? 0.2 : 0.08}
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

        <path d={areaPath} fill="url(#winnerLineFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="rgb(255 59 31)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hoverIdx === i ? 5 : i === points.length - 1 ? 4 : 2.5}
            fill="rgb(255 59 31)"
          />
        ))}

        {hoverX !== null && hoverY !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="rgb(255 59 31)"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>

      {hoverIdx !== null && hoverMatch && hoverPoints !== null ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `${(hoverX! / vbW) * 100}%`,
            top: `${(hoverY! / vbH) * 100}%`,
            transform: `translate(${
              (hoverX! / vbW) * 100 > 70 ? "calc(-100% - 12px)" : "12px"
            }, -50%)`,
          }}
        >
          <div className="border-2 border-primary bg-background px-2.5 py-1.5 shadow-md">
            <div className="font-heading text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Partido {String(hoverMatch.match_number).padStart(2, "0")}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              <TeamFlag team={hoverMatch.team_a} size="xs" />
              <span className="font-mono font-bold uppercase">vs</span>
              <TeamFlag team={hoverMatch.team_b} size="xs" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-base font-black tabular-nums text-primary">
                {hoverPoints}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                pts acumulados
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChampionDecor({ name }: { name: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <span className="-rotate-6 select-none whitespace-nowrap font-heading text-[6rem] font-black uppercase italic tracking-tight text-primary/[0.07] sm:text-[8rem]">
          Campeón · {name}
        </span>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-3 text-lg text-primary/40 select-none"
      >
        ★
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-8 bottom-4 text-sm text-primary/40 select-none"
      >
        ★
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-10 bottom-6 text-xs text-primary/40 select-none"
      >
        ★
      </span>
    </>
  );
}

function DiagonalSlash() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rotate-45 bg-primary/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-24 h-48 w-48 rotate-45 bg-primary/10"
      />
    </>
  );
}
