import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeLeaderboard, computePlayerStats } from "@/lib/stats";
import { pointsFor } from "@/lib/scoring";
import { Avatar } from "@/components/avatar";
import { KickoffDate } from "@/components/kickoff-date";
import { TeamFlag } from "@/components/team-flag";
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

  const losses = Math.max(0, stats.matches_played - stats.wins);
  const podiumRing =
    rank === 1
      ? "ring-primary"
      : rank === 2
        ? "ring-foreground"
        : rank === 3
          ? "ring-muted-foreground/60"
          : "ring-border";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jugadores"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Jugadores
        </Link>
        <PlayerSwitcher players={snap.players} currentId={id} />
      </div>

      <header className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6">
        <div className={`rounded-full ring-4 ${podiumRing}`}>
          <Avatar name={player.name} size="xl" />
        </div>
        <div className="min-w-0">
          {rank ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Lugar #{rank}
            </div>
          ) : null}
          <h1 className="mt-1 font-heading text-3xl font-black tracking-tight sm:text-4xl">
            {player.name}
          </h1>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-4xl font-black tabular-nums sm:text-5xl">
              {stats.points}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              pts
            </span>
          </div>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Cantadas"
          value={stats.strikes}
          ratio={stats.matches_played === 0 ? null : stats.strike_ratio}
          tone="primary"
        />
        <Stat
          label="Aciertos"
          value={stats.wins}
          ratio={stats.matches_played === 0 ? null : stats.win_ratio}
          tone="accent"
        />
        <Stat label="Fallidos" value={losses} ratio={null} tone="muted" />
        <Stat
          label="Jugados"
          value={`${stats.matches_played}`}
          sub={`de 72`}
          tone="muted"
        />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-black tracking-tight">
          Quiniela completa
        </h2>
        <ul className="mt-4 space-y-2">
          {snap.matches.map((m) => {
            const pred = snap.predictions.find(
              (p) => p.player_id === id && p.match_number === m.match_number,
            );
            const completed = isCompleted(m);
            const points =
              completed && pred
                ? pointsFor(pred.pred_a, pred.pred_b, m.actual_a, m.actual_b)
                : null;

            const tone =
              points === 3
                ? "border-primary/40 bg-primary/5"
                : points === 1
                  ? "border-accent/50 bg-accent/10"
                  : points === 0
                    ? "border-border bg-muted/30 opacity-70"
                    : "border-border bg-card";

            return (
              <li key={m.match_number}>
                <Link
                  href={`/partido/${m.match_number}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:border-primary/40 hover:shadow-sm sm:px-4 ${tone}`}
                >
                  <span className="w-7 text-center font-heading text-xs font-black tabular-nums text-muted-foreground">
                    {String(m.match_number).padStart(2, "0")}
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamFlag team={m.team_a} size="sm" />
                      <span className="truncate text-sm font-medium">
                        {m.team_a}
                      </span>
                    </div>
                    {completed ? (
                      <span className="font-heading text-sm font-black tabular-nums text-muted-foreground">
                        {m.actual_a}–{m.actual_b}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        vs
                      </span>
                    )}
                    <div className="flex min-w-0 flex-row-reverse items-center gap-2">
                      <TeamFlag team={m.team_b} size="sm" />
                      <span className="truncate text-right text-sm font-medium">
                        {m.team_b}
                      </span>
                    </div>
                  </div>
                  <div className="flex w-20 shrink-0 items-center justify-end gap-2">
                    <span className="font-heading text-sm font-black tabular-nums">
                      {pred ? `${pred.pred_a}–${pred.pred_b}` : "—"}
                    </span>
                    <PointsPill points={points} />
                  </div>
                </Link>
                <KickoffDate
                  iso={m.kickoff_at}
                  className="ml-12 mt-0.5 block text-[10px] text-muted-foreground"
                />
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
  ratio,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  ratio?: number | null;
  sub?: string;
  tone: "primary" | "accent" | "muted";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-foreground"
        : "text-foreground";
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-heading text-3xl font-black tabular-nums ${color}`}
        >
          {value}
        </span>
        {ratio != null ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(ratio * 100)}%
          </span>
        ) : null}
      </div>
      {sub ? (
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

function PointsPill({ points }: { points: 0 | 1 | 3 | null }) {
  if (points === null) {
    return (
      <span className="inline-flex w-7 justify-center rounded-md border border-dashed border-border px-1 text-[10px] font-bold text-muted-foreground">
        —
      </span>
    );
  }
  if (points === 3) {
    return (
      <span className="inline-flex w-7 justify-center rounded-md bg-primary px-1 text-[10px] font-bold text-primary-foreground">
        +3
      </span>
    );
  }
  if (points === 1) {
    return (
      <span className="inline-flex w-7 justify-center rounded-md bg-accent px-1 text-[10px] font-bold text-accent-foreground">
        +1
      </span>
    );
  }
  return (
    <span className="inline-flex w-7 justify-center rounded-md bg-muted px-1 text-[10px] font-bold text-muted-foreground">
      0
    </span>
  );
}
