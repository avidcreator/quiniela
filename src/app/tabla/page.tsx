import Link from "next/link";
import { loadSnapshot } from "@/lib/data";
import { computeLeaderboard, type LeaderboardEntry } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { RankDelta, RecentStrikes } from "@/components/rank-delta";

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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Jornada {matchesPlayed}/72
        </div>
        <h1 className="mt-1 font-heading text-3xl font-black tracking-tight sm:text-4xl">
          Tabla
        </h1>
      </header>

      <ul className="mt-8 space-y-2">
        {leaderboard.map((e) => (
          <PlayerRow key={e.player_id} entry={e} />
        ))}
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">
        Empates comparten lugar.
      </p>
    </div>
  );
}

function PlayerRow({ entry: e }: { entry: LeaderboardEntry }) {
  const losses = Math.max(0, e.matches_played - e.wins);
  const podiumRing =
    e.rank === 1
      ? "ring-primary"
      : e.rank === 2
        ? "ring-foreground"
        : e.rank === 3
          ? "ring-muted-foreground/60"
          : "ring-transparent";

  return (
    <li className="rounded-2xl border bg-card transition hover:border-primary/40 hover:shadow-sm">
      <Link
        href={`/jugador/${e.player_id}`}
        className="block p-3 sm:p-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-xl font-black tabular-nums">
              {e.rank}
            </span>
            <RankDelta current={e.rank} prev={e.prev_rank} />
          </div>

          <div className={`rounded-full ring-2 ${podiumRing}`}>
            <Avatar name={e.name} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-heading text-base font-bold sm:text-lg">
                {e.name}
              </span>
              <RecentStrikes count={e.recent_strikes} />
            </div>
            <div className="mt-1 grid grid-cols-3 gap-3 sm:max-w-md">
              <Stat
                label="Cantadas"
                value={e.strikes}
                ratio={e.matches_played === 0 ? null : e.strikes / e.matches_played}
                tone="primary"
              />
              <Stat
                label="Aciertos"
                value={e.wins}
                ratio={e.matches_played === 0 ? null : e.wins / e.matches_played}
                tone="accent"
              />
              <Stat label="Fallidos" value={losses} ratio={null} tone="muted" />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-heading text-2xl font-black tabular-nums sm:text-3xl">
              {e.points}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              pts
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  ratio,
  tone,
}: {
  label: string;
  value: number;
  ratio: number | null;
  tone: "primary" | "accent" | "muted";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-foreground"
        : "text-muted-foreground";
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-heading text-base font-black tabular-nums ${color}`}>
          {value}
        </span>
        {ratio !== null ? (
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {Math.round(ratio * 100)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
