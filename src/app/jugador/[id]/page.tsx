import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeLeaderboard, computePlayerStats } from "@/lib/stats";
import { KickoffDate } from "@/components/kickoff-date";
import { PointsBadge, ScorePill } from "@/components/score-pill";
import { PlayerSwitcher } from "./player-switcher";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await loadSnapshot();
  const player = snap.players.find((p) => p.id === id);
  return { title: player ? `${player.name} · Quiniela 26` : "Jugador" };
}

export default async function JugadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const snap = await loadSnapshot();
  const player = snap.players.find((p) => p.id === id);
  if (!player) notFound();

  const stats = computePlayerStats(snap, id);
  const rank = computeLeaderboard(snap).find((e) => e.player_id === id)?.rank;
  if (!stats) notFound();

  const matchPredictions = snap.matches.map((m) => {
    const pred = snap.predictions.find(
      (p) => p.player_id === id && p.match_number === m.match_number,
    );
    return { match: m, pred };
  });

  const percent = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jugadores"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Jugadores
        </Link>
        <PlayerSwitcher
          players={snap.players}
          currentId={id}
        />
      </div>

      <header className="mt-4 flex items-center gap-4">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-accent/40 font-heading text-2xl font-bold text-accent-foreground">
          {player.name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {player.name}
          </h1>
          {rank ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Lugar #{rank} en la tabla
            </p>
          ) : null}
        </div>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Puntos" value={stats.points} accent="primary" />
        <Stat
          label="Cantadas"
          value={`${stats.strikes}`}
          sub={percent(stats.strike_ratio)}
        />
        <Stat
          label="Aciertos"
          value={`${stats.wins}`}
          sub={percent(stats.win_ratio)}
        />
      </section>
      <p className="mt-2 text-xs text-muted-foreground">
        {stats.matches_played} de 72 partidos jugados.
      </p>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Quiniela</h2>
        <ul className="mt-3 divide-y rounded-2xl border bg-card">
          {matchPredictions.map(({ match, pred }) => {
            const completed = isCompleted(match);
            const points =
              completed && pred
                ? (() => {
                    if (pred.pred_a === match.actual_a && pred.pred_b === match.actual_b)
                      return 3 as const;
                    const po = Math.sign(pred.pred_a - pred.pred_b);
                    const ao = Math.sign(match.actual_a - match.actual_b);
                    return po === ao ? (1 as const) : (0 as const);
                  })()
                : null;

            return (
              <li
                key={match.match_number}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {match.match_number}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/partido/${match.match_number}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {match.team_a}{" "}
                      <span className="text-muted-foreground">vs</span>{" "}
                      {match.team_b}
                    </Link>
                    <KickoffDate
                      iso={match.kickoff_at}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScorePill
                    a={pred?.pred_a ?? 0}
                    b={pred?.pred_b ?? 0}
                    highlight={
                      points === 3
                        ? "primary"
                        : points === 1
                          ? "accent"
                          : "muted"
                    }
                  />
                  <PointsBadge points={points} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary";
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-heading text-3xl font-bold tabular-nums ${
          accent === "primary" ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}
