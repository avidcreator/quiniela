import Link from "next/link";
import { loadSnapshot, isCompleted, type Match } from "@/lib/data";
import { computeMatchPredictions } from "@/lib/stats";
import { KickoffDate } from "@/components/kickoff-date";
import { ScorePill } from "@/components/score-pill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partidos · Quiniela 26" };

export default async function PartidosPage() {
  const snap = await loadSnapshot();

  if (snap.matches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Partidos</h1>
        <p className="mt-2 text-muted-foreground">
          Aún no hay calendario cargado.
        </p>
      </div>
    );
  }

  const now = Date.now();
  const completed = snap.matches
    .filter(isCompleted)
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    );
  const upcoming = snap.matches
    .filter((m) => !isCompleted(m) && new Date(m.kickoff_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Partidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed.length} jugados · {upcoming.length} por jugarse
        </p>
      </header>

      {upcoming.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">Por jugarse</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((m) => (
              <UpcomingRow key={m.match_number} match={m} />
            ))}
          </ul>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold">Resultados</h2>
          <ul className="mt-3 space-y-2">
            {completed.map((m) => (
              <CompletedRow key={m.match_number} match={m} snap={snap} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function UpcomingRow({ match }: { match: Match }) {
  return (
    <li>
      <Link
        href={`/partido/${match.match_number}`}
        className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {match.match_number}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium">
              {match.team_a}{" "}
              <span className="text-muted-foreground">vs</span> {match.team_b}
            </div>
            <KickoffDate iso={match.kickoff_at} className="text-xs text-muted-foreground" />
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Pendiente
        </span>
      </Link>
    </li>
  );
}

function CompletedRow({
  match,
  snap,
}: {
  match: Match;
  snap: Awaited<ReturnType<typeof loadSnapshot>>;
}) {
  if (!isCompleted(match)) return null;
  const preds = computeMatchPredictions(snap, match.match_number);
  const strikers = preds.filter((p) => p.points === 3).length;

  return (
    <li>
      <Link
        href={`/partido/${match.match_number}`}
        className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {match.match_number}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium">
              {match.team_a}{" "}
              <span className="text-muted-foreground">vs</span> {match.team_b}
            </div>
            <div className="text-xs text-muted-foreground">
              <KickoffDate iso={match.kickoff_at} /> ·{" "}
              {strikers > 0
                ? `${strikers} cantada${strikers === 1 ? "" : "s"}`
                : "Sin cantadas"}
            </div>
          </div>
        </div>
        <ScorePill
          a={match.actual_a}
          b={match.actual_b}
          highlight="primary"
        />
      </Link>
    </li>
  );
}
