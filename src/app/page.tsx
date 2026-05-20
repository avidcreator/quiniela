import Link from "next/link";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeLeaderboard, computeMatchPredictions, type LeaderboardEntry } from "@/lib/stats";
import { buildTickerMatches, matchDateKey, todayKey } from "@/lib/ticker";
import { Avatar } from "@/components/avatar";
import { Podium } from "@/components/podium";
import {
  RecentResultCard,
  UpcomingMatchCard,
} from "@/components/match-card";
import { RankDelta, RecentStrikes } from "@/components/rank-delta";
import { Sparkline } from "@/components/sparkline";
import { Ticker } from "@/components/ticker";
import { Vibes } from "@/components/vibes";
import { PointsRace } from "@/components/points-race";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snap = await loadSnapshot();
  const hasData = snap.matches.length > 0 && snap.players.length > 0;
  if (!hasData) return <EmptyHome />;

  const now = Date.now();
  const upcoming = snap.matches
    .filter((m) => !isCompleted(m) && new Date(m.kickoff_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    )
    .slice(0, 4);

  const completedAsc = snap.matches.filter(isCompleted).sort((a, b) => {
    const at = new Date(a.completed_at ?? a.kickoff_at).getTime();
    const bt = new Date(b.completed_at ?? b.kickoff_at).getTime();
    return at - bt;
  });
  const recent = [...completedAsc].reverse().slice(0, 6);

  const leaderboard = computeLeaderboard(snap);
  const completedCount = snap.matches.filter(isCompleted).length;
  const tickerMatches = buildTickerMatches(snap);

  const today = todayKey();
  const hasRecapToday = snap.matches.some(
    (m) => isCompleted(m) && matchDateKey(m.kickoff_at) === today,
  );

  return (
    <>
      <Ticker matches={tickerMatches} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionHeader
          eyebrow={`Partido ${completedCount}/72`}
          title="Marcadores"
          action={
            hasRecapToday ? (
              <Link
                href={`/dia/${today}`}
                className="rounded-sm border border-foreground/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] transition hover:bg-foreground hover:text-background"
              >
                Resumen del día
              </Link>
            ) : null
          }
        />

        <div className="mt-4 rounded-md border-2 border-foreground bg-card p-6 sm:p-8">
          <Podium entries={leaderboard} />
        </div>

        {recent.length > 0 ? (
          <section className="mt-12">
            <SectionHeader title="Últimos resultados" />
            <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
              <div className="flex snap-x snap-mandatory items-start gap-8 pb-2 pr-16 sm:gap-10 sm:pr-24">
                {recent.map((m) => (
                  <div
                    key={m.match_number}
                    className="w-[min(86vw,460px)] shrink-0 snap-start"
                  >
                    <RecentResultCard
                      match={m}
                      predictions={computeMatchPredictions(snap, m.match_number)}
                    />
                  </div>
                ))}
                <Link
                  href="/partidos"
                  className="group flex h-[230px] w-[200px] shrink-0 snap-start flex-col items-center justify-center gap-3 self-start rounded-md border-2 border-dashed border-foreground/30 bg-card p-6 text-center transition hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  <span className="font-heading text-lg font-black uppercase tracking-[0.2em]">
                    Ver todos
                  </span>
                  <span className="font-heading text-3xl font-black transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="mt-12">
            <SectionHeader
              title="Próximos partidos"
              action={<HeaderLink href="/partidos">Ver todos</HeaderLink>}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {upcoming.map((m) => (
                <UpcomingMatchCard key={m.match_number} match={m} />
              ))}
            </div>
          </section>
        ) : null}

        {completedCount >= 1 ? (
          <section className="mt-12">
            <SectionHeader
              eyebrow="Carrera por la copa"
              title="Puntos en el tiempo"
            />
            <div className="mt-4 rounded-md border-2 border-foreground bg-card p-4 sm:p-6">
              <PointsRace entries={leaderboard} matchesAsc={completedAsc} />
            </div>
          </section>
        ) : null}

        <section id="tabla" className="mt-12">
          <SectionHeader eyebrow={`${leaderboard.length} jugador${leaderboard.length === 1 ? "" : "es"}`} title="Tabla" />
          <ul className="mt-4 space-y-2">
            {leaderboard.map((e) => (
              <TablaRow key={e.player_id} entry={e} />
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Empates comparten lugar.
          </p>
        </section>
      </div>
    </>
  );
}

function TablaRow({ entry: e }: { entry: LeaderboardEntry }) {
  const losses = Math.max(0, e.matches_played - e.wins);
  const podiumRing =
    e.rank === 1
      ? "ring-primary"
      : e.rank === 2
        ? "ring-foreground"
        : e.rank === 3
          ? "ring-muted-foreground/60"
          : "ring-transparent";

  return (
    <li className="rounded-md border bg-card transition hover:border-primary/40 hover:shadow-sm">
      <Link href={`/jugador/${e.player_id}`} className="block p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-xl font-black tabular-nums">
              {e.rank}
            </span>
            <RankDelta current={e.rank} prev={e.prev_rank} />
          </div>

          <div className={`rounded-full ring-2 ${podiumRing}`}>
            <Avatar name={e.name} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                {e.name}
              </span>
              <Vibes hot={e.hot} cold={e.cold} />
              <RecentStrikes count={e.recent_strikes} />
            </div>
            <div className="mt-1 grid grid-cols-3 gap-3 sm:max-w-md">
              <Stat
                label="Acertaron"
                value={e.strikes}
                ratio={e.matches_played === 0 ? null : e.strikes / e.matches_played}
                tone="primary"
              />
              <Stat
                label="Ganaron"
                value={e.wins}
                ratio={e.matches_played === 0 ? null : e.wins / e.matches_played}
                tone="accent"
              />
              <Stat label="Fallidos" value={losses} ratio={null} tone="muted" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-muted-foreground sm:inline-block">
              <Sparkline values={e.history} width={64} height={22} />
            </span>
            <div className="flex flex-col items-end">
              <span className="font-heading text-2xl font-black tabular-nums sm:text-3xl">
                {e.points}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                pts
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  ratio,
  tone,
}: {
  label: string;
  value: number;
  ratio: number | null;
  tone: "primary" | "accent" | "muted";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-foreground"
        : "text-muted-foreground";
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-heading text-base font-black tabular-nums ${color}`}
        >
          {value}
        </span>
        {ratio !== null ? (
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {Math.round(ratio * 100)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
    >
      {children}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

function EmptyHome() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
      <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        FIFA World Cup 2026
      </span>
      <h1 className="mt-4 font-heading text-4xl font-black tracking-tight sm:text-5xl">
        La quiniela aún no <span className="text-primary">arranca</span>.
      </h1>
      <p className="mt-3 text-muted-foreground">
        En cuanto el admin cargue el calendario y las quinielas, aquí verás
        partidos, tabla y pronósticos de cada jugador.
      </p>
    </div>
  );
}
