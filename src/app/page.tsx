import Link from "next/link";
import { loadSnapshot, isCompleted, type Match } from "@/lib/data";
import { computeLeaderboard, computeMatchPredictions } from "@/lib/stats";
import { KickoffDate } from "@/components/kickoff-date";
import { ScorePill } from "@/components/score-pill";

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
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    )
    .slice(0, 6);

  const leaderboard = computeLeaderboard(snap);
  const topFive = leaderboard.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Hero
        completed={recent.length === 0 ? 0 : snap.matches.filter(isCompleted).length}
        players={snap.players.length}
      />

      {upcoming.length > 0 ? (
        <Section title="Próximos partidos">
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => (
              <Link
                key={m.match_number}
                href={`/partido/${m.match_number}`}
                className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Partido #{m.match_number}</span>
                  <KickoffDate iso={m.kickoff_at} />
                </div>
                <div className="mt-2 font-heading text-lg font-semibold">
                  {m.team_a}{" "}
                  <span className="text-muted-foreground">vs</span> {m.team_b}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {recent.length > 0 ? (
        <Section
          title="Últimos resultados"
          action={<SectionLink href="/partidos">Ver todos →</SectionLink>}
        >
          <ul className="space-y-3">
            {recent.map((m) => (
              <RecentResultRow key={m.match_number} match={m} snap={snap} />
            ))}
          </ul>
        </Section>
      ) : null}

      {topFive.length > 0 ? (
        <Section
          title="Tabla"
          action={<SectionLink href="/tabla">Ver completa →</SectionLink>}
        >
          <ol className="divide-y rounded-2xl border bg-card">
            {topFive.map((e) => (
              <li
                key={e.player_id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary tabular-nums">
                    {e.rank}
                  </span>
                  <Link
                    href={`/jugador/${e.player_id}`}
                    className="font-medium hover:underline"
                  >
                    {e.name}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="font-heading text-lg font-bold tabular-nums">
                    {e.points}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.strikes} cantada{e.strikes === 1 ? "" : "s"}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
    </div>
  );
}

function Hero({ completed, players }: { completed: number; players: number }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-accent/20 px-6 py-10 sm:px-12 sm:py-14">
      <div className="absolute -top-12 -right-12 size-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-accent/25 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          Mundial 2026
        </span>
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
          Quiniela <span className="text-primary">familiar</span>.
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
          {completed} de 72 partidos jugados · {players} jugador
          {players === 1 ? "" : "es"} en el ruedo.
        </p>
      </div>
    </section>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-primary hover:underline"
    >
      {children}
    </Link>
  );
}

function RecentResultRow({
  match,
  snap,
}: {
  match: Match;
  snap: Awaited<ReturnType<typeof loadSnapshot>>;
}) {
  const preds = computeMatchPredictions(snap, match.match_number);
  const strikers = preds.filter((p) => p.points === 3);
  const winners = preds.filter((p) => p.points === 1).length;

  const callout =
    strikers.length === 1
      ? `Solo ${strikers[0].name} la cantó. 🎯`
      : strikers.length > 1
        ? `${strikers.length} la cantaron.`
        : winners > 0
          ? `${winners} acertó${winners === 1 ? "" : "n"} el resultado.`
          : "Nadie le atinó.";

  return (
    <li>
      <Link
        href={`/partido/${match.match_number}`}
        className="block rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Partido #{match.match_number}</span>
              <span>·</span>
              <KickoffDate iso={match.kickoff_at} />
            </div>
            <div className="mt-1 font-heading text-base font-semibold">
              {match.team_a} <span className="text-muted-foreground">vs</span>{" "}
              {match.team_b}
            </div>
          </div>
          <ScorePill
            a={match.actual_a ?? 0}
            b={match.actual_b ?? 0}
            highlight="primary"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{callout}</p>
      </Link>
    </li>
  );
}

function EmptyHome() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
      <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Mundial 2026
      </span>
      <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        La quiniela aún no <span className="text-primary">arranca</span>.
      </h1>
      <p className="mt-3 text-muted-foreground">
        En cuanto el admin cargue el calendario y las quinielas, aquí verás
        partidos, la tabla y los pronósticos de cada jugador.
      </p>
    </div>
  );
}
