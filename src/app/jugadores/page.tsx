import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { computeLeaderboard } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores · Quiniela 26" };

export default async function JugadoresPage() {
  const snap = await loadSnapshot();
  const leaderboard = computeLeaderboard(snap);

  if (leaderboard.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Jugadores
        </h1>
        <p className="mt-2 text-muted-foreground">
          Aún no hay jugadores en la quiniela.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Jugadores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {leaderboard.length} jugador{leaderboard.length === 1 ? "" : "es"} en
          el ruedo.
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {leaderboard.map((e) => (
          <li key={e.player_id}>
            <Link
              href={`/jugador/${e.player_id}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent/40 font-heading text-base font-bold text-accent-foreground">
                  {e.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Lugar #{e.rank} · {e.strikes} cantada
                    {e.strikes === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-lg font-bold tabular-nums">
                  {e.points}
                </div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
