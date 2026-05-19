import Link from "next/link";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeLeaderboard, computeMatchPredictions } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { Podium } from "@/components/podium";
import {
  RecentResultCard,
  UpcomingMatchCard,
} from "@/components/match-card";
import { RankDelta, RecentStrikes } from "@/components/rank-delta";

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

  const recent = snap.matches
    .filter(isCompleted)
    .sort((a, b) => {
      const at = new Date(a.completed_at ?? a.kickoff_at).getTime();
      const bt = new Date(b.completed_at ?? b.kickoff_at).getTime();
      return bt - at;
    })
    .slice(0, 6);

  const leaderboard = computeLeaderboard(snap);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 8);
  const completedCount = snap.matches.filter(isCompleted).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <SectionHeader
        eyebrow={`Jornada ${completedCount}/72`}
        title="Tabla"
        action={<HeaderLink href="/tabla">Ver completa</HeaderLink>}
      />

      <div className="mt-4 rounded-3xl border bg-card p-6 sm:p-8">
        <Podium top3={top3} />

        {rest.length > 0 ? (
          <ul className="mt-8 divide-y border-t pt-4">
            {rest.map((e) => (
              <li
                key={e.player_id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 text-center font-heading text-sm font-black tabular-nums text-muted-foreground">
                    {e.rank}
                  </span>
                  <Avatar name={e.name} size="sm" />
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/jugador/${e.player_id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {e.name}
                    </Link>
                    <RankDelta current={e.rank} prev={e.prev_rank} />
                    <RecentStrikes count={e.recent_strikes} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-lg font-black tabular-nums">
                    {e.points}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    pts
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <section className="mt-12">
          <SectionHeader
            title="Últimos resultados"
            action={<HeaderLink href="/partidos">Ver todos</HeaderLink>}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recent.map((m) => (
              <RecentResultCard
                key={m.match_number}
                match={m}
                predictions={computeMatchPredictions(snap, m.match_number)}
              />
            ))}
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
        Mundial 2026
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
