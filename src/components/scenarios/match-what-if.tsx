"use client";

import { useState } from "react";
import { Avatar } from "../avatar";
import { TeamFlag } from "../team-flag";
import { LiveMinute } from "../live/live-minute";
import { KickoffDate } from "../kickoff-date";
import {
  projectTable,
  scoreSummary,
  top1Objective,
  joinNames,
  type BasePlayer,
  type ScenarioRow,
} from "@/lib/scenarios";

export type LiveInfo = {
  status: string | null;
  elapsed: number | null;
  extra: number | null;
  updatedAt: string | null;
};

/**
 * The interactive "what-if" for a single (live or upcoming) match: a dial
 * scoreboard, a projection chart that re-sorts/resizes with the score, and a
 * per-player "¿Qué necesita?" panel. Designed to sit inside the match-detail
 * slide (no outer border of its own).
 */
export function MatchWhatIf({
  matchNumber,
  group,
  kickoffIso,
  teamA,
  teamB,
  currentScore,
  players,
  live,
  embedded,
}: {
  matchNumber: number;
  group: string | null;
  kickoffIso: string;
  teamA: string;
  teamB: string;
  currentScore: { a: number; b: number };
  players: BasePlayer[];
  live: LiveInfo | null;
  // When true, render without the hero header/border (the surrounding card
  // already provides them) so it reads as the card expanding in place.
  embedded?: boolean;
}) {
  // Initialized from the current score on mount only, so a soft refresh (live
  // polling) doesn't clobber the user's dial.
  const [a, setA] = useState(currentScore.a);
  const [b, setB] = useState(currentScore.b);
  const [focusId, setFocusId] = useState(players[0]?.player_id ?? "");

  const isLive = live !== null;
  const label = `Partido ${String(matchNumber).padStart(2, "0")}${
    group ? ` · Grupo ${group}` : ""
  }`;

  const rows = projectTable(players, a, b);
  const maxPoints = Math.max(1, ...rows.map((r) => r.points));
  const summary = focusId ? scoreSummary(players, focusId, a, b) : null;
  const objective = focusId ? top1Objective(players, focusId, teamA, teamB) : null;
  const focusPlayer = players.find((p) => p.player_id === focusId);

  const clamp = (n: number) => Math.max(0, Math.min(20, n));

  const dial = (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4 px-4 py-5 sm:gap-x-4">
      <TeamInline team={teamA} value={a} onChange={(n) => setA(clamp(n))} />
      <span className="hidden font-heading text-3xl font-black text-muted-foreground/50 sm:inline">
        –
      </span>
      <TeamInline
        team={teamB}
        value={b}
        onChange={(n) => setB(clamp(n))}
        reverse
      />
    </div>
  );

  const body = (
    <>
      <section>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Proyección
            </span>
            <span className="rounded-sm border border-dashed border-foreground/40 px-1.5 py-0.5 font-heading text-[10px] font-black tabular-nums">
              si termina {a}–{b}
            </span>
          </div>
          <ul className="mt-3 space-y-1">
            {rows.map((r) => (
              <BarRow
                key={r.player_id}
                row={r}
                max={maxPoints}
                focus={r.player_id === focusId}
                onPick={() => setFocusId(r.player_id)}
              />
            ))}
          </ul>
        </section>

        <section>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            ¿Qué necesita?
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {players.map((p) => {
              const active = p.player_id === focusId;
              return (
                <button
                  key={p.player_id}
                  type="button"
                  onClick={() => setFocusId(p.player_id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <Avatar name={p.name} imageUrl={p.avatar_url} size="xs" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-md border-2 border-foreground bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar
                name={focusPlayer?.name ?? ""}
                imageUrl={focusPlayer?.avatar_url}
                size="md"
              />
              <div className="min-w-0">
                <div className="truncate font-heading text-lg font-black leading-tight">
                  {focusPlayer?.name ?? ""}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Con marcador {a}–{b}
                </div>
              </div>
            </div>

            {summary ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatPill
                    label="Posición"
                    from={`#${summary.baseRank}`}
                    to={`#${summary.newRank}`}
                    delta={summary.baseRank - summary.newRank}
                    kind="rank"
                  />
                  <StatPill
                    label="Puntos"
                    from={`${summary.basePoints}`}
                    to={`${summary.newPoints}`}
                    delta={summary.delta}
                    kind="points"
                  />
                </div>

                <ul className="mt-4 space-y-2.5">
                  {summary.passes.length > 0 ? (
                    <InsightLine
                      ins={{
                        tone: "good",
                        text: `Pasas a ${joinNames(summary.passes)}.`,
                      }}
                    />
                  ) : null}
                  {summary.overtaken.length > 0 ? (
                    <InsightLine
                      ins={{
                        tone: "bad",
                        text: `Te pasa${summary.overtaken.length > 1 ? "n" : ""} ${joinNames(summary.overtaken)}.`,
                      }}
                    />
                  ) : null}
                  {summary.passes.length === 0 &&
                  summary.overtaken.length === 0 ? (
                    <InsightLine
                      ins={{
                        tone: "neutral",
                        text: "Tu posición no cambia frente a los rivales.",
                      }}
                    />
                  ) : null}
                </ul>
              </>
            ) : null}

            {objective ? (
              <ul className="mt-4 border-t pt-3">
                <InsightLine ins={objective} />
              </ul>
            ) : null}
          </div>
        </section>
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="border-b bg-gradient-to-b from-muted/40 via-card to-card">
          {dial}
        </div>
        <div className="space-y-6 p-4 sm:p-6">{body}</div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 bg-card shadow-sm ${
          isLive ? "border-primary" : "border-foreground"
        }`}
      >
        {isLive ? (
          <div className="flex items-end justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground sm:px-5">
            <div className="pb-1">
              <div className="font-heading text-[9px] font-black uppercase tracking-[0.2em] text-primary-foreground/80">
                {label}
              </div>
              <span className="mt-1 inline-flex items-center gap-1.5 font-heading text-[11px] font-black uppercase tracking-[0.24em]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                </span>
                En vivo
              </span>
            </div>
            <LiveMinute
              elapsed={live?.elapsed ?? null}
              extra={live?.extra ?? null}
              status={live?.status ?? ""}
              updatedAt={live?.updatedAt ?? null}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-3 text-background sm:px-5">
            <span className="font-heading text-[11px] font-black uppercase tracking-[0.22em] text-background/80">
              {label}
            </span>
            <KickoffDate
              iso={kickoffIso}
              variant="short"
              className="font-heading text-[11px] font-black uppercase tracking-[0.18em]"
            />
          </div>
        )}
        {dial}
      </div>
      <div className="mt-6 space-y-6">{body}</div>
    </div>
  );
}

function InsightLine({
  ins,
}: {
  ins: { tone: "good" | "bad" | "neutral"; text: string };
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
          ins.tone === "good"
            ? "bg-emerald-500"
            : ins.tone === "bad"
              ? "bg-red-500"
              : "bg-muted-foreground/50"
        }`}
      />
      <span
        className={
          ins.tone === "good"
            ? "text-emerald-700 dark:text-emerald-300"
            : ins.tone === "bad"
              ? "text-red-700 dark:text-red-300"
              : "text-muted-foreground"
        }
      >
        {ins.text}
      </span>
    </li>
  );
}

function StatPill({
  label,
  from,
  to,
  delta,
  kind,
}: {
  label: string;
  from: string;
  to: string;
  delta: number;
  kind: "rank" | "points";
}) {
  const toClass =
    kind === "rank"
      ? delta > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : delta < 0
          ? "text-red-600 dark:text-red-400"
          : "text-foreground"
      : delta >= 3
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";
  const changed = from !== to;
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={`font-heading text-3xl font-black tabular-nums leading-none ${toClass}`}
        >
          {to}
        </span>
        {kind === "rank" ? (
          delta !== 0 ? (
            <MoveBadge delta={delta} />
          ) : null
        ) : delta > 0 ? (
          <span
            className={`font-heading text-sm font-black tabular-nums ${
              delta >= 3
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground"
            }`}
          >
            +{delta}
          </span>
        ) : null}
      </div>
      <div className="mt-1 h-3.5 text-[10px] font-semibold text-muted-foreground">
        {changed ? `antes ${from}` : "sin cambio"}
      </div>
    </div>
  );
}

function TeamInline({
  team,
  value,
  onChange,
  reverse,
}: {
  team: string;
  value: number;
  onChange: (n: number) => void;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center gap-2 sm:w-auto sm:gap-3 ${
        reverse ? "sm:flex-row-reverse" : ""
      }`}
    >
      <TeamFlag team={team} size="md" />
      <span className="min-w-0 flex-1 truncate font-heading text-xs font-black uppercase tracking-wide sm:max-w-none sm:flex-none sm:text-sm">
        {team}
      </span>
      <BigStepper label={team} value={value} onChange={onChange} />
    </div>
  );
}

function BigStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      <StepBtn aria={`Quitar gol a ${label}`} onClick={() => onChange(value - 1)}>
        −
      </StepBtn>
      <span className="w-11 text-center font-heading text-4xl font-black tabular-nums sm:w-12 sm:text-5xl">
        {value}
      </span>
      <StepBtn aria={`Agregar gol a ${label}`} onClick={() => onChange(value + 1)}>
        +
      </StepBtn>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  aria,
}: {
  children: React.ReactNode;
  onClick: () => void;
  aria: string;
}) {
  return (
    <button
      type="button"
      aria-label={aria}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md border-2 border-foreground font-heading text-lg font-black leading-none transition-colors hover:bg-foreground hover:text-background"
    >
      {children}
    </button>
  );
}

function MoveBadge({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="font-heading text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
        ▲{delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="font-heading text-xs font-black tabular-nums text-red-600 dark:text-red-400">
        ▼{Math.abs(delta)}
      </span>
    );
  return <span className="text-xs font-black text-muted-foreground/40">—</span>;
}

function BarRow({
  row,
  max,
  focus,
  onPick,
}: {
  row: ScenarioRow;
  max: number;
  focus: boolean;
  onPick: () => void;
}) {
  const pct = Math.max(2, Math.round((row.points / max) * 100));
  const fill =
    row.delta >= 3
      ? "bg-emerald-500 animate-live"
      : row.delta === 1
        ? "bg-foreground"
        : "bg-muted-foreground/35";
  return (
    <li
      className={`flex items-center gap-2 rounded-md px-1.5 py-1 ${
        focus ? "bg-primary/5 ring-1 ring-primary/40" : ""
      }`}
    >
      <span className="w-5 text-center font-heading text-sm font-black tabular-nums">
        {row.rank}
      </span>
      <span className="w-7 text-center">
        <MoveBadge delta={row.rankDelta} />
      </span>
      <Avatar name={row.name} imageUrl={row.avatar_url} size="xs" />
      <button
        type="button"
        onClick={onPick}
        className="w-16 shrink-0 truncate text-left text-xs font-semibold hover:underline sm:w-24"
      >
        {row.name}
      </button>
      <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted">
        <div
          className={`absolute inset-y-0 left-0 rounded transition-[width] duration-300 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {row.delta > 0 ? (
        <span
          className={`font-heading text-[10px] font-black tabular-nums ${
            row.delta >= 3
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          }`}
        >
          +{row.delta}
        </span>
      ) : null}
      <span className="w-5 text-right font-heading text-sm font-black tabular-nums">
        {row.points}
      </span>
    </li>
  );
}
