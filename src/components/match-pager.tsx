"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import { TeamFlag } from "./team-flag";
import type { PredictionWithPoints } from "@/lib/stats";

export type MatchView = {
  match_number: number;
  team_a: string;
  team_b: string;
  group: string | null;
  kickoff_at: string;
  completed: boolean;
  actual_a: number | null;
  actual_b: number | null;
  rootA: PredictionWithPoints[];
  rootDraw: PredictionWithPoints[];
  rootB: PredictionWithPoints[];
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
}: {
  views: MatchView[];
  startIndex: number;
}) {
  // Render a buffer of slides on each side so fast flicks can carry across
  // several without hitting the edge of what's rendered.
  const RADIUS = 4;
  const total = views.length;
  const [index, setIndex] = useState(startIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lo = Math.max(0, index - RADIUS);
  const hi = Math.min(total - 1, index + RADIUS);
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

  // Centre the current slide before paint (no flicker when the window shifts).
  useLayoutEffect(() => {
    const c = containerRef.current;
    const el = slideEls.current.get(index);
    if (c && el) {
      c.scrollLeft = el.offsetLeft - (c.clientWidth - el.clientWidth) / 2;
    }
    applyOpacity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Keep the URL in sync without a navigation / reload.
  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      `/partido/${views[index].match_number}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
      if (best >= 0 && best !== index) setIndex(best);
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
          <MatchPanelView view={views[gi]} />
        </div>
      ))}
    </div>
  );
}

export function MatchPanelView({ view }: { view: MatchView }) {
  const completed = view.completed;
  const a = view.actual_a;
  const b = view.actual_b;

  return (
    <div>
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Partido {String(view.match_number).padStart(2, "0")}
          {view.group ? ` · Grupo ${view.group}` : ""} ·{" "}
          {completed ? "Jugado" : "Por jugarse"}
        </div>
      </header>

      <section className="mt-3 overflow-hidden rounded-3xl border bg-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-8 sm:gap-6 sm:px-8 sm:py-12">
          <TeamColumn
            team={view.team_a}
            highlight={completed && a! > b!}
            dim={completed && a! < b!}
          />
          {completed ? (
            <div className="flex items-baseline gap-2 font-heading text-5xl font-black tabular-nums sm:text-6xl">
              <span className={a! < b! ? "text-muted-foreground" : ""}>{a}</span>
              <span className="text-muted-foreground">-</span>
              <span className={b! < a! ? "text-muted-foreground" : ""}>{b}</span>
            </div>
          ) : (
            <span className="font-heading text-lg font-bold text-muted-foreground">
              VS
            </span>
          )}
          <TeamColumn
            team={view.team_b}
            align="end"
            highlight={completed && b! > a!}
            dim={completed && b! < a!}
          />
        </div>

        <div className="border-t bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground sm:px-8">
          <KickoffDate iso={view.kickoff_at} variant="long" />
        </div>
      </section>

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

function TeamColumn({
  team,
  align = "start",
  highlight,
  dim,
}: {
  team: string;
  align?: "start" | "end";
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <TeamFlag team={team} size="xl" />
      <div
        className={`font-heading text-sm font-black sm:text-2xl ${
          dim ? "text-muted-foreground" : ""
        } ${highlight ? "text-foreground" : ""} text-center`}
      >
        {team}
      </div>
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
