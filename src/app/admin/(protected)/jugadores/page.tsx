import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getActivePhase } from "@/lib/phase";
import { ROUNDS } from "@/lib/rounds";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { removePlayerAction } from "./actions";
import { RemovePlayerButton } from "./remove-button";
import { RoundScorecardControl } from "./round-scorecard-control";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores · Admin" };

type PlayerRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

function PlayerList({ players }: { players: PlayerRow[] }) {
  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        Aún no hay jugadores. Agrega el primero.
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={p.name} imageUrl={p.avatar_url} size="md" />
            <div className="min-w-0">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                Agregado el{" "}
                {new Intl.DateTimeFormat("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(p.created_at))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/jugadores/${p.id}`}>Editar</Link>
            </Button>
            <form action={removePlayerAction}>
              <input type="hidden" name="id" value={p.id} />
              <RemovePlayerButton name={p.name} />
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function PlayersPage() {
  const phase = await getActivePhase();
  const supabase = createServiceClient();

  const playersTable = phase === "phase_two" ? "phase_two_players" : "phase_one_players";
  const { data: playersData } = await supabase
    .from(playersTable)
    .select("id, name, avatar_url, created_at")
    .order("name", { ascending: true });
  const players = (playersData ?? []) as PlayerRow[];

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Jugadores
        </h1>
        <p className="mt-1 text-muted-foreground">
          Agrega, edita o quita jugadores en cualquier momento del torneo.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin/jugadores/nuevo">+ Nuevo jugador</Link>
      </Button>
    </header>
  );

  if (phase !== "phase_two") {
    return (
      <div className="space-y-8">
        {header}
        <PlayerList players={players} />
      </div>
    );
  }

  // ---- Phase 2: per-round scorecards. ----
  const [matchesRes, predsRes] = await Promise.all([
    supabase.from("phase_two_matches").select("round"),
    supabase.from("phase_two_predictions").select("player_id, match_number"),
  ]);

  // How many matches are loaded per round (a round is uploadable once its
  // schedule is complete).
  const matchesPerRound = new Map<string, number>();
  for (const m of matchesRes.data ?? []) {
    matchesPerRound.set(m.round, (matchesPerRound.get(m.round) ?? 0) + 1);
  }

  // Predictions each player has, by global match_number.
  const predsByPlayer = new Map<string, Set<number>>();
  for (const p of predsRes.data ?? []) {
    let set = predsByPlayer.get(p.player_id);
    if (!set) {
      set = new Set<number>();
      predsByPlayer.set(p.player_id, set);
    }
    set.add(p.match_number);
  }

  function loadedForRound(
    playerId: string,
    base: number,
    count: number,
  ): boolean {
    const set = predsByPlayer.get(playerId);
    if (!set) return false;
    let n = 0;
    for (let i = base + 1; i <= base + count; i++) if (set.has(i)) n++;
    return n === count;
  }

  return (
    <div className="space-y-8">
      {header}
      <PlayerList players={players} />

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Quinielas por ronda
        </h2>
        <p className="text-sm text-muted-foreground">
          Sube la quiniela de cada jugador conforme se juega cada ronda. CSV con
          columnas{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            match_number, date, team_a, team_b, predicted_team_a, predicted_team_b
          </code>{" "}
          (match_number es el número oficial del torneo, igual que en el
          calendario).
        </p>
      </section>

      {ROUNDS.map((round) => {
        const scheduleLoaded = (matchesPerRound.get(round.key) ?? 0) === round.count;
        return (
          <section key={round.key} className="rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-heading text-lg font-semibold">{round.label}</h3>
              {!scheduleLoaded ? (
                <span className="text-sm text-muted-foreground">
                  Calendario pendiente
                </span>
              ) : null}
            </div>

            {!scheduleLoaded ? (
              <p className="mt-3 rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                Sube primero el calendario de esta ronda en la pestaña Calendario.
              </p>
            ) : players.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Agrega jugadores para subir sus quinielas.
              </p>
            ) : (
              <ul className="mt-4 divide-y">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={p.name} imageUrl={p.avatar_url} size="sm" />
                      <span className="truncate font-medium">{p.name}</span>
                    </div>
                    <RoundScorecardControl
                      playerId={p.id}
                      round={round.key}
                      loaded={loadedForRound(p.id, round.base, round.count)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
