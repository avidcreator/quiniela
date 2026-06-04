import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted, type Match, type Snapshot } from "@/lib/data";
import { computeMatchPredictions, type PredictionWithPoints } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { KickoffDate } from "@/components/kickoff-date";
import { TeamFlag } from "@/components/team-flag";
import { MatchSwiper, type PagedSlide } from "@/components/match-swiper";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  return { title: `Partido #${match_number} · FIFA World Cup 2026` };
}

export default async function PartidoPage({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  const num = Number(match_number);
  if (!Number.isInteger(num)) notFound();

  const snap = await loadSnapshot();
  const match = snap.matches.find((m) => m.match_number === num);
  if (!match) notFound();

  // Previous / next match in calendar order.
  const sortedNums = snap.matches
    .map((m) => m.match_number)
    .sort((a, b) => a - b);
  const idx = sortedNums.indexOf(num);
  const prevMatch =
    idx > 0
      ? snap.matches.find((m) => m.match_number === sortedNums[idx - 1]) ?? null
      : null;
  const nextMatch =
    idx >= 0 && idx < sortedNums.length - 1
      ? snap.matches.find((m) => m.match_number === sortedNums[idx + 1]) ?? null
      : null;
  const prevHref = prevMatch ? `/partido/${prevMatch.match_number}` : null;
  const nextHref = nextMatch ? `/partido/${nextMatch.match_number}` : null;

  const currentPanel = <MatchPanel match={match} snap={snap} />;

  const slides: PagedSlide[] = [];
  if (prevMatch)
    slides.push({
      key: `m-${prevMatch.match_number}`,
      href: prevHref,
      current: false,
      node: <MatchPanel match={prevMatch} snap={snap} />,
    });
  slides.push({
    key: `m-${match.match_number}`,
    href: null,
    current: true,
    node: currentPanel,
  });
  if (nextMatch)
    slides.push({
      key: `m-${nextMatch.match_number}`,
      href: nextHref,
      current: false,
      node: <MatchPanel match={nextMatch} snap={snap} />,
    });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Match navigator */}
      <div className="flex items-center justify-between gap-3">
        {prevMatch ? (
          <MatchNavButton match={prevMatch} dir="prev" />
        ) : (
          <span className="w-20" />
        )}
        <Link
          href="/partidos"
          className="font-heading text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
        >
          Todos
        </Link>
        {nextMatch ? (
          <MatchNavButton match={nextMatch} dir="next" />
        ) : (
          <span className="w-20" />
        )}
      </div>
      <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
        Desliza para cambiar de partido
      </p>

      {/* Mobile: native paged scroll with peeking neighbours */}
      <div className="mt-4 sm:hidden">
        <MatchSwiper slides={slides} />
      </div>

      {/* Desktop: just the current match */}
      <div className="mt-4 hidden sm:block">{currentPanel}</div>
    </div>
  );
}

function MatchPanel({ match, snap }: { match: Match; snap: Snapshot }) {
  const completed = isCompleted(match);
  const preds = computeMatchPredictions(snap, match.match_number);
  const teamARooters = preds.filter((p) => p.pred_a > p.pred_b);
  const drawRooters = preds.filter((p) => p.pred_a === p.pred_b);
  const teamBRooters = preds.filter((p) => p.pred_b > p.pred_a);

  return (
    <div>
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Partido {String(match.match_number).padStart(2, "0")}
          {match.group ? ` · Grupo ${match.group}` : ""} ·{" "}
          {completed ? "Jugado" : "Por jugarse"}
        </div>
      </header>

      <section className="mt-3 overflow-hidden rounded-3xl border bg-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-8 sm:gap-6 sm:px-8 sm:py-12">
          <TeamColumn
            team={match.team_a}
            highlight={completed && match.actual_a! > match.actual_b!}
            dim={completed && match.actual_a! < match.actual_b!}
          />
          {completed ? (
            <div className="flex items-baseline gap-2 font-heading text-5xl font-black tabular-nums sm:text-6xl">
              <span
                className={
                  match.actual_a! < match.actual_b!
                    ? "text-muted-foreground"
                    : ""
                }
              >
                {match.actual_a}
              </span>
              <span className="text-muted-foreground">-</span>
              <span
                className={
                  match.actual_b! < match.actual_a!
                    ? "text-muted-foreground"
                    : ""
                }
              >
                {match.actual_b}
              </span>
            </div>
          ) : (
            <span className="font-heading text-lg font-bold text-muted-foreground">
              VS
            </span>
          )}
          <TeamColumn
            team={match.team_b}
            align="end"
            highlight={completed && match.actual_b! > match.actual_a!}
            dim={completed && match.actual_b! < match.actual_a!}
          />
        </div>

        <div className="border-t bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground sm:px-8">
          <KickoffDate iso={match.kickoff_at} variant="long" />
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="font-heading text-xl font-black tracking-tight">
          Pronósticos
        </h2>

        {preds.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Aún no hay jugadores en la quiniela.
          </p>
        ) : (
          <div className="space-y-4">
            {teamARooters.length > 0 ? (
              <RootingGroup
                heading={`Gana ${match.team_a}`}
                team={match.team_a}
                players={teamARooters}
                completed={completed}
              />
            ) : null}
            {drawRooters.length > 0 ? (
              <RootingGroup
                heading="Empate"
                players={drawRooters}
                completed={completed}
              />
            ) : null}
            {teamBRooters.length > 0 ? (
              <RootingGroup
                heading={`Gana ${match.team_b}`}
                team={match.team_b}
                players={teamBRooters}
                completed={completed}
              />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function MatchNavButton({
  match,
  dir,
}: {
  match: Match;
  dir: "prev" | "next";
}) {
  return (
    <Link
      href={`/partido/${match.match_number}`}
      title={`${match.team_a} vs ${match.team_b}`}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1.5 transition hover:border-foreground/40 hover:shadow-sm"
    >
      {dir === "prev" ? (
        <span className="font-heading text-base font-black leading-none">
          ‹
        </span>
      ) : null}
      <span className="flex items-center gap-1">
        <TeamFlag team={match.team_a} size="xs" />
        <TeamFlag team={match.team_b} size="xs" />
      </span>
      <span className="font-heading text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {String(match.match_number).padStart(2, "0")}
      </span>
      {dir === "next" ? (
        <span className="font-heading text-base font-black leading-none">
          ›
        </span>
      ) : null}
    </Link>
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
    <div
      className={`flex flex-col items-center gap-3 ${align === "end" ? "" : ""}`}
    >
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
