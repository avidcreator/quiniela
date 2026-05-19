import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeMatchPredictions } from "@/lib/stats";
import {
  RecentResultCard,
  UpcomingMatchCard,
} from "@/components/match-card";

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
  const completed = snap.matches.filter(isCompleted).sort((a, b) => {
    const at = new Date(a.completed_at ?? a.kickoff_at).getTime();
    const bt = new Date(b.completed_at ?? b.kickoff_at).getTime();
    return bt - at;
  });
  const upcoming = snap.matches
    .filter((m) => !isCompleted(m) && new Date(m.kickoff_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Mundial 2026
        </div>
        <h1 className="mt-1 font-heading text-3xl font-black tracking-tight sm:text-4xl">
          Partidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed.length} jugados · {upcoming.length} por jugarse
        </p>
      </header>

      {completed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-black tracking-tight">
            Resultados
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {completed.map((m) => (
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
        <section className="mt-10">
          <h2 className="font-heading text-xl font-black tracking-tight">
            Por jugarse
          </h2>
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
