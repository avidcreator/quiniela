import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { computeLeaderboard } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { RecentStrikes } from "@/components/rank-delta";

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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {leaderboard.length} {leaderboard.length === 1 ? "jugador" : "jugadores"}
        </div>
        <h1 className="mt-1 font-heading text-3xl font-black tracking-tight sm:text-4xl">
          Jugadores
        </h1>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {leaderboard.map((e) => (
          <li key={e.player_id}>
            <Link
              href={`/jugador/${e.player_id}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={e.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading text-base font-bold">
                      {e.name}
                    </span>
                    <RecentStrikes count={e.recent_strikes} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lugar #{e.rank} · {e.strikes} cantada
                    {e.strikes === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-heading text-xl font-black tabular-nums">
                  {e.points}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  pts
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
