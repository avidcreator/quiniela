import { createServiceClient } from "@/lib/supabase/server";
import { loadSnapshot } from "@/lib/data";
import { computeLeaderboard } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { KickoffDate } from "@/components/kickoff-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearScoreAction, setScoreAction } from "./actions";
import { WinnerDialog } from "./winner-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultados · Admin" };

export default async function ResultadosPage() {
  const supabase = createServiceClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("match_number, kickoff_at, team_a, team_b, actual_a, actual_b")
    .order("kickoff_at", { ascending: true });

  const snap = await loadSnapshot();
  const leaderboard = computeLeaderboard(snap);
  const winnerSet = new Set(snap.winner_ids);

  const pending = (matches ?? []).filter((m) => m.actual_a === null);
  const completed = (matches ?? [])
    .filter((m) => m.actual_a !== null)
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Resultados
        </h1>
        <p className="mt-1 text-muted-foreground">
          Captura el marcador real de cada partido. La tabla y las estadísticas
          se recalculan al instante.
        </p>
      </header>

      <section className="rounded-2xl border-2 border-foreground bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight">
              Ganador(es)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {snap.winner_ids.length === 0
                ? "Aún no hay ganador declarado."
                : "Aparecen como campeones en la portada."}
            </p>
          </div>
          {leaderboard.length > 0 ? (
            <WinnerDialog
              players={leaderboard.map((e) => ({
                player_id: e.player_id,
                name: e.name,
                avatar_url: e.avatar_url,
                rank: e.rank,
                points: e.points,
              }))}
              currentWinnerIds={snap.winner_ids}
            />
          ) : null}
        </div>

        {snap.winner_ids.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {leaderboard
              .filter((e) => winnerSet.has(e.player_id))
              .map((e) => (
                <li
                  key={e.player_id}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-600/5 px-2.5 py-1 dark:border-emerald-500/40"
                >
                  <Avatar name={e.name} imageUrl={e.avatar_url} size="xs" />
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {e.points} pts
                  </span>
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">
          Pendientes ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {pending.map((m) => (
              <MatchRow key={m.match_number} match={m} completed={false} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            No hay partidos pendientes. Si aún no subes el calendario, hazlo
            primero.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold">
          Completados ({completed.length})
        </h2>
        {completed.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {completed.map((m) => (
              <MatchRow key={m.match_number} match={m} completed={true} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay marcadores ingresados.
          </p>
        )}
      </section>
    </div>
  );
}

type Match = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  actual_a: number | null;
  actual_b: number | null;
};

function MatchRow({ match, completed }: { match: Match; completed: boolean }) {
  return (
    <li className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {match.match_number}
          </span>
          <div>
            <div className="font-medium">
              {match.team_a}{" "}
              <span className="text-muted-foreground">vs</span> {match.team_b}
            </div>
            <KickoffDate
              iso={match.kickoff_at}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
        {completed ? (
          <span className="rounded-full bg-accent/40 px-3 py-1 text-xs font-semibold text-accent-foreground">
            Completado
          </span>
        ) : null}
      </div>

      <form
        action={setScoreAction}
        className="mt-3 flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="match_number" value={match.match_number} />
        <ScoreField
          label={match.team_a}
          name="actual_a"
          defaultValue={match.actual_a}
        />
        <span className="pb-2 text-muted-foreground">–</span>
        <ScoreField
          label={match.team_b}
          name="actual_b"
          defaultValue={match.actual_b}
        />
        <Button type="submit" size="sm">
          {completed ? "Actualizar" : "Guardar"}
        </Button>
      </form>

      {completed ? (
        <form action={clearScoreAction} className="mt-2">
          <input type="hidden" name="match_number" value={match.match_number} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            Borrar marcador
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function ScoreField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number | null;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        defaultValue={defaultValue ?? undefined}
        required
        className="w-20 text-center"
      />
    </label>
  );
}
