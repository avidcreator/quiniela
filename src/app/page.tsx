import Link from "next/link";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeLeaderboard, computeMatchPredictions, type LeaderboardEntry } from "@/lib/stats";
import { buildTickerMatches, matchDateKey, todayKey } from "@/lib/ticker";
import { DayCard, type DayCardData } from "@/components/day-card";
import { PerroSays } from "@/components/perro-says";
import { generatePerroQuotes } from "@/lib/perro";
import {
  PlayerStatsExplorer,
  WinnerCelebration,
  type WinnerData,
} from "@/components/winner-banner";
import { bestMatchesForPlayer, playerExtendedStats } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { Podium } from "@/components/podium";
import {
  RecentResultCard,
  UpcomingMatchCard,
} from "@/components/match-card";
import { RankDelta, StrikesBadge } from "@/components/rank-delta";
import { Sparkline } from "@/components/sparkline";
import { Ticker } from "@/components/ticker";
import { Vibes } from "@/components/vibes";
import { PointsRace } from "@/components/points-race";
import { Countdown } from "@/components/countdown";
import { InauguralMatchCard } from "@/components/inaugural-match-card";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snap = await loadSnapshot();
  if (snap.matches.length === 0) return <EmptyHome />;

  const now = Date.now();

  // Before the tournament starts (no match has kicked off and no result has
  // been entered) show the countdown / hype page instead of the dashboard.
  const firstKickoffMs = Math.min(
    ...snap.matches.map((m) => new Date(m.kickoff_at).getTime()),
  );
  const anyCompleted = snap.matches.some(isCompleted);
  if (firstKickoffMs > now && !anyCompleted) {
    return <PreTournament snap={snap} firstKickoffMs={firstKickoffMs} />;
  }

  if (snap.players.length === 0) return <EmptyHome />;
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
  const perroQuotes =
    completedCount > 0 ? generatePerroQuotes(snap, leaderboard, 1) : [];

  const winnerSet = new Set(snap.winner_ids);
  const winnerMatchesAsc = completedAsc.map((m) => ({
    match_number: m.match_number,
    team_a: m.team_a,
    team_b: m.team_b,
  }));

  // Build a spotlight entry for every player so the banner can switch through
  // all of them. Winners share rank 1 when declared.
  const allPlayers: WinnerData[] = leaderboard.map((entry) => ({
    entry: winnerSet.has(entry.player_id) ? { ...entry, rank: 1 } : entry,
    bestMatches: bestMatchesForPlayer(snap, entry.player_id, 3),
    extended: playerExtendedStats(snap, entry.player_id),
  }));
  const hasWinners = snap.winner_ids.length > 0;

  const today = todayKey();
  const hasRecapToday = snap.matches.some(
    (m) => isCompleted(m) && matchDateKey(m.kickoff_at) === today,
  );

  const dayGroups = new Map<string, typeof completedAsc>();
  for (const m of completedAsc) {
    const key = matchDateKey(m.kickoff_at);
    const arr = dayGroups.get(key) ?? [];
    arr.push(m);
    dayGroups.set(key, arr);
  }
  const dayCards: DayCardData[] = Array.from(dayGroups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, matches]) => {
      const tally = new Map<string, { name: string; points: number }>();
      for (const m of matches) {
        for (const p of computeMatchPredictions(snap, m.match_number)) {
          if (p.points && p.points > 0) {
            const cur = tally.get(p.player_id) ?? { name: p.name, points: 0 };
            cur.points += p.points;
            tally.set(p.player_id, cur);
          }
        }
      }
      const scorers = Array.from(tally.entries())
        .map(([player_id, v]) => ({ player_id, ...v }))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"));
      return { date, matches, scorers };
    });

  return (
    <>
      <Ticker matches={tickerMatches} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {hasWinners ? (
          <>
            <section className="mb-6">
              <WinnerCelebration
                winners={allPlayers.filter((p) =>
                  snap.winner_ids.includes(p.entry.player_id),
                )}
              />
            </section>
            <section className="mb-10">
              <PlayerStatsExplorer
                players={allPlayers}
                winnerIds={snap.winner_ids}
                matches={winnerMatchesAsc}
              />
            </section>
          </>
        ) : null}

        {perroQuotes.length > 0 ? (
          <section className="mb-10">
            <PerroSays quotes={perroQuotes} />
          </section>
        ) : null}

        {recent.length > 0 ? (
          <section>
            <SectionHeader
              eyebrow={`Partido ${completedCount}/72`}
              title="Últimos resultados"
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
            <div className="-mx-4 mt-4 overflow-x-auto px-4 py-3 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
              <div className="flex snap-x snap-mandatory items-start gap-8 pr-16 sm:gap-10 sm:pr-24">
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


        <section className={recent.length > 0 ? "mt-12" : ""}>
          <SectionHeader title="Posiciones" />
          <div className="mt-4 rounded-md border-2 border-foreground bg-card p-6 sm:p-8">
            <Podium entries={leaderboard} />
          </div>
        </section>

        {upcoming.length > 0 ? (
          <section className="mt-12">
            <SectionHeader
              title="Próximos partidos"
              action={<HeaderLink href="/partidos">Ver todos</HeaderLink>}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {upcoming.map((m) => (
                <UpcomingMatchCard
                  key={m.match_number}
                  match={m}
                  predictions={computeMatchPredictions(snap, m.match_number)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {dayCards.length > 0 ? (
          <section className="mt-12">
            <SectionHeader title="Resumen del día" />
            <div className="-mx-4 mt-4 overflow-x-auto px-4 py-3 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
              <div className="flex snap-x snap-mandatory items-stretch gap-6 pr-16 sm:gap-8 sm:pr-24">
                {dayCards.map((d) => (
                  <div
                    key={d.date}
                    className="w-[min(78vw,360px)] shrink-0 snap-start"
                  >
                    <DayCard data={d} />
                  </div>
                ))}
              </div>
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

        {completedCount >= 1 ? (
          <section className="mt-12">
            <SectionHeader title="Puntuación" />
            <div className="mt-4 rounded-md border-2 border-foreground bg-card p-4 sm:p-6">
              <PointsRace entries={leaderboard} matchesAsc={completedAsc} />
            </div>
          </section>
        ) : null}
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
          <div className="flex w-12 shrink-0 flex-col items-center gap-1">
            <span className="font-heading text-xl font-black tabular-nums">
              {e.rank}
            </span>
            <RankDelta current={e.rank} prev={e.prev_rank} />
          </div>

          <div className={`rounded-full ring-2 ${podiumRing}`}>
            <Avatar name={e.name} imageUrl={e.avatar_url} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                {e.name}
              </span>
              <Vibes hot={e.hot} cold={e.cold} />
              <StrikesBadge count={e.strikes} />
            </div>
            <div className="mt-1 grid grid-cols-3 gap-3 sm:max-w-md">
              <Stat
                label="Aciertos"
                value={e.strikes}
                ratio={e.matches_played === 0 ? null : e.strikes / e.matches_played}
                tone="primary"
              />
              <Stat
                label="Ganados"
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
      ? "text-emerald-600 dark:text-emerald-400"
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

function PreTournament({
  snap,
  firstKickoffMs,
}: {
  snap: Awaited<ReturnType<typeof loadSnapshot>>;
  firstKickoffMs: number;
}) {
  const firstIso = new Date(firstKickoffMs).toISOString();
  const firstKey = matchDateKey(firstIso);
  const firstDayMatches = snap.matches
    .filter((m) => matchDateKey(m.kickoff_at) === firstKey)
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );
  // Next matches after the inaugural day (those are already shown above).
  const firstDayNumbers = new Set(firstDayMatches.map((m) => m.match_number));
  const upcomingMatches = snap.matches
    .filter((m) => !firstDayNumbers.has(m.match_number))
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    )
    .slice(0, 4);
  const hasPlayers = snap.players.length > 0;
  const dayLabel = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  }).format(new Date(firstIso));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      {/* Hype hero */}
      <section className="relative overflow-hidden rounded-md border-2 border-foreground bg-card px-5 py-12 text-center sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rotate-45 bg-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rotate-45 bg-primary/10"
        />
        <div className="relative">
          <div className="mx-auto inline-flex h-28 items-center justify-center overflow-hidden rounded-md bg-white p-2 shadow-sm ring-1 ring-border sm:h-40">
            <Image
              src="/wc26-logo.png"
              alt="FIFA World Cup 2026"
              width={140}
              height={200}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-black uppercase italic leading-none tracking-tight sm:text-5xl">
            FIFA World Cup 2026
          </h1>
          <div className="mt-2 font-heading text-base font-black uppercase tracking-[0.22em] text-muted-foreground sm:text-xl">
            Arranca en
          </div>

          <div className="mt-8">
            <Countdown targetIso={firstIso} />
          </div>

          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 border border-foreground/15 px-3 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="capitalize">{dayLabel}</span>
            <span className="text-primary">▌</span>
            <span>{snap.matches.length} partidos</span>
            {hasPlayers ? (
              <>
                <span className="text-primary">▌</span>
                <span>{snap.players.length} jugadores</span>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* First day matches + predictions */}
      {firstDayMatches.length > 0 ? (
        <section className="mt-12">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Primer día
          </div>
          <h2 className="mt-1 font-heading text-2xl font-black tracking-tight sm:text-3xl">
            Cómo viene la jornada inaugural
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esto es lo que pronosticó cada quien para los primeros partidos.
          </p>
          <div className="mt-4 space-y-4">
            {firstDayMatches.map((m) => (
              <InauguralMatchCard
                key={m.match_number}
                match={m}
                predictions={computeMatchPredictions(snap, m.match_number)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Próximos partidos (after the inaugural day) */}
      {upcomingMatches.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">
              Próximos partidos
            </h2>
            <Link
              href="/partidos"
              className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              Ver todos
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {upcomingMatches.map((m) => (
              <UpcomingMatchCard
                key={m.match_number}
                match={m}
                predictions={computeMatchPredictions(snap, m.match_number)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Scorecards CTA */}
      {hasPlayers ? (
        <section className="mt-12">
          <Link
            href="/jugadores"
            className="group flex items-center justify-between gap-4 rounded-md border-2 border-foreground bg-card px-5 py-5 transition hover:bg-foreground hover:text-background"
          >
            <div>
              <div className="font-heading text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                Antes de que empiece
              </div>
              <div className="mt-1 font-heading text-xl font-black uppercase tracking-tight">
                Revisa las quinielas de todos
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground group-hover:text-background/70">
                {snap.players.length} jugadores · 72 pronósticos cada uno
              </div>
            </div>
            <span className="font-heading text-3xl font-black transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </section>
      ) : null}
    </div>
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
