"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import { TeamFlag } from "./team-flag";
import { MatchWhatIf, type LiveInfo } from "./scenarios/match-what-if";
import type { PredictionWithPoints } from "@/lib/stats";
import type { BasePlayer } from "@/lib/scenarios";

export type MatchView = {
  match_number: number;
  team_a: string;
  team_b: string;
  group: string | null;
  kickoff_at: string;
  completed: boolean;
  actual_a: number | null;
  actual_b: number | null;
  isLive: boolean;
  currentScore: { a: number; b: number };
  live: LiveInfo | null;
  rootA: PredictionWithPoints[];
  rootDraw: PredictionWithPoints[];
  rootB: PredictionWithPoints[];
};

/** Current standings (from completed matches) shared across all slides. */
export type BaseStanding = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  basePoints: number;
  baseRank: number;
};

/**
 * Native-style paged scroll over the whole calendar. All match data is preloaded,
 * so paging is instant (no navigation / server round-trip). Only a 3-slide window
 * is rendered at a time; the window shifts and re-centers as you swipe. Opacity is
 * driven by scroll position: neighbours sit at 30% and fade to 100% as they centre.
 */
export function MatchPager({
  views,
  startIndex,
  base,
}: {
  views: MatchView[];
  startIndex: number;
  base: BaseStanding[];
}) {
  // `anchor` drives the rendered window; it only changes when the centred slide
  // nears the window edge. The live centred slide is tracked in a ref so the URL
  // can update without a re-render — meaning normal scrolling never touches the
  // DOM (no flashing). RADIUS buffers each side so fast flicks don't stall.
  const RADIUS = 4;
  const total = views.length;
  const [anchor, setAnchor] = useState(startIndex);
  const centeredRef = useRef(startIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lo = Math.max(0, anchor - RADIUS);
  const hi = Math.min(total - 1, anchor + RADIUS);
  const windowIdx: number[] = [];
  for (let i = lo; i <= hi; i++) windowIdx.push(i);

  function applyOpacity() {
    const c = containerRef.current;
    if (!c) return;
    const center = c.scrollLeft + c.clientWidth / 2;
    slideEls.current.forEach((el) => {
      const mid = el.offsetLeft + el.clientWidth / 2;
      const t = Math.min(1, Math.abs(mid - center) / el.clientWidth);
      el.style.opacity = String(1 - 0.7 * t);
    });
  }

  // Re-centre only when the window actually shifts (rare, at rest near the edge).
  useLayoutEffect(() => {
    const c = containerRef.current;
    const el = slideEls.current.get(anchor);
    if (c && el) {
      c.scrollLeft = el.offsetLeft - (c.clientWidth - el.clientWidth) / 2;
    }
    applyOpacity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  function onScroll() {
    applyOpacity();
    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const c = containerRef.current;
      if (!c) return;
      const center = c.scrollLeft + c.clientWidth / 2;
      let best = -1;
      let bestDist = Infinity;
      slideEls.current.forEach((el, gi) => {
        const mid = el.offsetLeft + el.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = gi;
        }
      });
      if (best < 0) return;
      if (best !== centeredRef.current) {
        centeredRef.current = best;
        window.history.replaceState(
          null,
          "",
          `/partido/${views[best].match_number}`,
        );
      }
      // Only re-buffer (which shifts the DOM) when near the rendered edge.
      if (Math.abs(best - anchor) >= RADIUS - 1) setAnchor(best);
    }, 70);
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-[8vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {windowIdx.map((gi) => (
        <div
          key={views[gi].match_number}
          ref={(el) => {
            if (el) slideEls.current.set(gi, el);
            else slideEls.current.delete(gi);
          }}
          className="w-[84vw] shrink-0 snap-center px-1.5"
        >
          <MatchPanelView view={views[gi]} base={base} />
        </div>
      ))}
    </div>
  );
}

export function MatchPanelView({
  view,
  base,
}: {
  view: MatchView;
  base: BaseStanding[];
}) {
  const completed = view.completed;

  const total = view.rootA.length + view.rootDraw.length + view.rootB.length;
  const pct = (x: number) => (total > 0 ? Math.round((x / total) * 100) : 0);
  const pctA = pct(view.rootA.length);
  const pctDraw = pct(view.rootDraw.length);
  const pctB = pct(view.rootB.length);

  // Players for the what-if: current standings (base) merged with this match's
  // predictions. Only built/used for live or upcoming matches.
  const predMap = new Map<string, { a: number; b: number }>();
  for (const p of [...view.rootA, ...view.rootDraw, ...view.rootB]) {
    predMap.set(p.player_id, { a: p.pred_a, b: p.pred_b });
  }
  const whatIfPlayers: BasePlayer[] = base.map((e) => ({
    player_id: e.player_id,
    name: e.name,
    avatar_url: e.avatar_url,
    basePoints: e.basePoints,
    baseRank: e.baseRank,
    pred: predMap.get(e.player_id) ?? null,
  }));

  const live = !completed && view.isLive;
  // Upcoming matches default to the plain card; the what-if is opt-in via a CTA
  // so players aren't overwhelmed. Live matches always show it (highly relevant).
  const [open, setOpen] = useState(false);
  return (
    <div>
      {completed ? (
        <MatchCardShell view={view}>
          <Scoreboard
            view={view}
            total={total}
            pctA={pctA}
            pctDraw={pctDraw}
            pctB={pctB}
          />
        </MatchCardShell>
      ) : live ? (
        <MatchWhatIf
          matchNumber={view.match_number}
          group={view.group}
          kickoffIso={view.kickoff_at}
          teamA={view.team_a}
          teamB={view.team_b}
          currentScore={view.currentScore}
          players={whatIfPlayers}
          live={view.live}
        />
      ) : (
        <MatchCardShell
          view={view}
          footer={
            open ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 border-t bg-card px-4 py-3 font-heading text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-muted"
              >
                ← Ocultar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex w-full items-center gap-3 border-t-2 border-primary/20 bg-primary/5 px-4 py-4 text-left transition-colors hover:bg-primary/10 sm:px-6"
              >
                <span className="flex size-10 shrink-0 items-end justify-center gap-0.5 rounded-full bg-primary pb-3">
                  <span className="h-2 w-1 rounded-sm bg-primary-foreground" />
                  <span className="h-3 w-1 rounded-sm bg-primary-foreground" />
                  <span className="h-4 w-1 rounded-sm bg-primary-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-sm font-black uppercase tracking-wide text-primary">
                    Simula el partido
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    Prueba cualquier marcador y mira cómo quedaría la tabla y qué
                    necesita cada quien.
                  </span>
                </span>
                <span className="font-heading text-xl font-black text-primary transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            )
          }
        >
          {open ? (
            <MatchWhatIf
              embedded
              matchNumber={view.match_number}
              group={view.group}
              kickoffIso={view.kickoff_at}
              teamA={view.team_a}
              teamB={view.team_b}
              currentScore={view.currentScore}
              players={whatIfPlayers}
              live={null}
            />
          ) : (
            <Scoreboard
              view={view}
              total={total}
              pctA={pctA}
              pctDraw={pctDraw}
              pctB={pctB}
            />
          )}
        </MatchCardShell>
      )}

      <section className="mt-6 space-y-4">
        <h2 className="font-heading text-xl font-black tracking-tight">
          Pronósticos
        </h2>

        {view.rootA.length + view.rootDraw.length + view.rootB.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Aún no hay jugadores en la quiniela.
          </p>
        ) : (
          <div className="space-y-4">
            {view.rootA.length > 0 ? (
              <RootingGroup
                heading={`Gana ${view.team_a}`}
                team={view.team_a}
                players={view.rootA}
                completed={completed}
              />
            ) : null}
            {view.rootDraw.length > 0 ? (
              <RootingGroup
                heading="Empate"
                players={view.rootDraw}
                completed={completed}
              />
            ) : null}
            {view.rootB.length > 0 ? (
              <RootingGroup
                heading={`Gana ${view.team_b}`}
                team={view.team_b}
                players={view.rootB}
                completed={completed}
              />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

/** The card frame: black header, kickoff band, a body, and an optional footer. */
function MatchCardShell({
  view,
  footer,
  children,
}: {
  view: MatchView;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-sm">
      {/* Black header bar */}
      <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-heading text-[11px] font-black uppercase tracking-[0.24em] text-background/70">
            Partido {String(view.match_number).padStart(2, "0")}
          </span>
          {view.group ? (
            <span className="rounded-sm bg-background/15 px-1.5 py-0.5 font-heading text-[10px] font-black uppercase tracking-[0.18em]">
              Grupo {view.group}
            </span>
          ) : null}
        </div>
        {view.completed ? (
          <span className="font-heading text-[10px] font-black uppercase tracking-[0.22em] text-background/70">
            Jugado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-heading text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Por jugarse
          </span>
        )}
      </div>

      {/* Highlighted date / time band */}
      <div className="flex flex-col items-center justify-center border-b bg-muted/40 px-4 py-2.5 text-center sm:px-6">
        <KickoffDate
          iso={view.kickoff_at}
          variant="long"
          className="font-heading text-sm font-black uppercase tracking-tight sm:text-base"
        />
        <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
          en tu hora local
        </span>
      </div>

      {children}
      {footer}
    </section>
  );
}

/** The score (or VS) board with the prediction sentiment bar. */
function Scoreboard({
  view,
  total,
  pctA,
  pctDraw,
  pctB,
}: {
  view: MatchView;
  total: number;
  pctA: number;
  pctDraw: number;
  pctB: number;
}) {
  const completed = view.completed;
  const a = view.actual_a;
  const b = view.actual_b;
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-muted/40 via-card to-card">
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-10 sm:gap-6 sm:px-8 sm:py-12">
        <TeamColumn
          team={view.team_a}
          pct={total > 0 ? pctA : null}
          highlight={completed && a! > b!}
          dim={completed && a! < b!}
        />
        {completed ? (
          <div className="flex items-baseline gap-2 font-heading text-6xl font-black tabular-nums sm:text-7xl">
            <span className={a! < b! ? "text-muted-foreground" : ""}>{a}</span>
            <span className="text-muted-foreground">-</span>
            <span className={b! < a! ? "text-muted-foreground" : ""}>{b}</span>
          </div>
        ) : (
          <span className="font-heading text-xl font-black text-muted-foreground">
            VS
          </span>
        )}
        <TeamColumn
          team={view.team_b}
          align="end"
          pct={total > 0 ? pctB : null}
          highlight={completed && b! > a!}
          dim={completed && b! < a!}
        />
      </div>

      {/* Sentiment bar */}
      {total > 0 ? (
        <div className="relative px-4 pb-7 pt-1 sm:px-8">
          <div className="flex h-[14px] w-full overflow-hidden rounded-full bg-muted">
            {view.rootA.length > 0 ? (
              <div className="h-full bg-foreground" style={{ width: `${pctA}%` }} />
            ) : null}
            {view.rootDraw.length > 0 ? (
              <div
                className="h-full bg-muted-foreground/40"
                style={{ width: `${pctDraw}%` }}
              />
            ) : null}
            {view.rootB.length > 0 ? (
              <div className="h-full bg-primary" style={{ width: `${pctB}%` }} />
            ) : null}
          </div>
          <div className="relative mt-2 h-3 font-heading text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            {pctA > 0 ? (
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${pctA / 2}%` }}
              >
                {pctA}% Gana
              </span>
            ) : null}
            {pctDraw > 0 ? (
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${pctA + pctDraw / 2}%` }}
              >
                {pctDraw}% Empate
              </span>
            ) : null}
            {pctB > 0 ? (
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${pctA + pctDraw + pctB / 2}%` }}
              >
                {pctB}% Gana
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamColumn({
  team,
  align = "start",
  highlight,
  dim,
  pct,
}: {
  team: string;
  align?: "start" | "end";
  highlight?: boolean;
  dim?: boolean;
  pct?: number | null;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <TeamFlag team={team} size="xl" />
      <div
        className={`font-heading text-sm font-black uppercase tracking-wide sm:text-2xl ${
          dim ? "text-muted-foreground" : ""
        } ${highlight ? "text-foreground" : ""} text-center`}
      >
        {team}
      </div>
      {pct != null ? (
        <div className="font-heading text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          {pct}%
        </div>
      ) : null}
    </div>
  );
}


function RootingGroup({
  heading,
  team,
  players,
  completed,
}: {
  heading: string;
  team?: string;
  players: PredictionWithPoints[];
  completed: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {team ? <TeamFlag team={team} size="xs" /> : null}
        <span>
          {heading} · {players.length}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {players.map((p) => (
          <li
            key={p.player_id}
            className="flex items-center justify-between gap-3"
          >
            <Link
              href={`/jugador/${p.player_id}`}
              className="flex min-w-0 items-center gap-2 hover:underline"
            >
              <Avatar
                name={p.name}
                imageUrl={p.avatar_url}
                size="sm"
                dim={completed && p.points === 0}
              />
              <span className="truncate font-medium">{p.name}</span>
            </Link>
            <span className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center rounded-full border bg-muted/60 px-2 py-0.5 font-heading text-xs font-black tabular-nums">
                {p.pred_a}–{p.pred_b}
              </span>
              {completed ? <InlinePointsPill points={p.points} /> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InlinePointsPill({ points }: { points: 0 | 1 | 3 | null }) {
  if (points === 3) {
    return (
      <span className="inline-flex w-7 justify-center rounded-md bg-emerald-600 px-1 text-[10px] font-bold text-white dark:bg-emerald-500">
        +3
      </span>
    );
  }
  if (points === 1) {
    return (
      <span className="inline-flex w-7 justify-center rounded-md bg-foreground px-1 text-[10px] font-bold text-background">
        +1
      </span>
    );
  }
  return (
    <span className="inline-flex w-7 justify-center rounded-md bg-muted px-1 text-[10px] font-bold text-muted-foreground">
      0
    </span>
  );
}
