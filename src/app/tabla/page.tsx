import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { computeLeaderboard } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tabla · Quiniela 26" };

export default async function TablaPage() {
  const snap = await loadSnapshot();
  const leaderboard = computeLeaderboard(snap);

  if (leaderboard.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Tabla</h1>
        <p className="mt-2 text-muted-foreground">
          Aún no hay jugadores en la quiniela.
        </p>
      </div>
    );
  }

  const matchesPlayed = leaderboard[0].matches_played;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Tabla
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {matchesPlayed} de 72 partidos jugados.
          </p>
        </div>
      </header>

      <ol className="mt-8 divide-y rounded-3xl border bg-card">
        {leaderboard.map((e) => {
          const podium =
            e.rank === 1
              ? "bg-primary text-primary-foreground"
              : e.rank === 2
                ? "bg-accent text-accent-foreground"
                : e.rank === 3
                  ? "bg-chart-3/30 text-foreground"
                  : "bg-muted text-foreground";
          return (
            <li
              key={e.player_id}
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-full font-heading text-sm font-bold tabular-nums ${podium}`}
                >
                  {e.rank}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/jugador/${e.player_id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {e.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {e.strikes} cantada{e.strikes === 1 ? "" : "s"} ·{" "}
                    {e.wins} acierto{e.wins === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-xl font-bold tabular-nums">
                  {e.points}
                </div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-xs text-muted-foreground">
        Empates comparten lugar. Dentro de un empate, orden alfabético.
      </p>
    </div>
  );
}
