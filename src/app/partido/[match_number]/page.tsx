import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeMatchPredictions } from "@/lib/stats";
import { KickoffDate } from "@/components/kickoff-date";
import { PointsBadge, ScorePill } from "@/components/score-pill";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  return { title: `Partido #${match_number} · Quiniela 26` };
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

  const completed = isCompleted(match);
  const preds = completed ? computeMatchPredictions(snap, num) : [];
  const strikers = preds.filter((p) => p.points === 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/partidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Partidos
      </Link>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">
            #{match.match_number}
          </span>
          <KickoffDate iso={match.kickoff_at} variant="long" />
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {match.team_a}{" "}
          <span className="text-muted-foreground">vs</span> {match.team_b}
        </h1>
      </header>

      <section className="mt-6 rounded-3xl border bg-card p-6">
        {completed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Marcador final
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ScorePill
                  a={match.actual_a}
                  b={match.actual_b}
                  highlight="primary"
                />
                <span className="text-sm text-muted-foreground">
                  {match.team_a} {match.actual_a} – {match.actual_b}{" "}
                  {match.team_b}
                </span>
              </div>
            </div>
            {strikers.length > 0 ? (
              <p className="max-w-[18rem] text-right text-sm text-muted-foreground">
                {strikers.length === 1
                  ? `Solo ${strikers[0].name} la cantó. 🎯`
                  : `${strikers.length} la cantaron: ${strikers.map((s) => s.name).join(", ")}.`}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pendiente
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Aún no hay marcador.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Por jugarse
            </span>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Pronósticos</h2>
        {snap.players.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no hay jugadores.
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {(completed
              ? preds
              : snap.players.map((p) => {
                  const pr = snap.predictions.find(
                    (x) => x.player_id === p.id && x.match_number === num,
                  );
                  return {
                    player_id: p.id,
                    name: p.name,
                    pred_a: pr?.pred_a ?? 0,
                    pred_b: pr?.pred_b ?? 0,
                    points: null as 0 | 1 | 3 | null,
                  };
                })
            ).map((row) => (
              <li
                key={row.player_id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
              >
                <Link
                  href={`/jugador/${row.player_id}`}
                  className="font-medium hover:underline"
                >
                  {row.name}
                </Link>
                <div className="flex items-center gap-3">
                  <ScorePill
                    a={row.pred_a}
                    b={row.pred_b}
                    highlight={
                      row.points === 3
                        ? "primary"
                        : row.points === 1
                          ? "accent"
                          : "muted"
                    }
                  />
                  <PointsBadge points={row.points} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
