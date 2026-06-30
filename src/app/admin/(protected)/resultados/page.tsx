import { getActivePhase, getTables } from "@/lib/phase";
import { ROUNDS } from "@/lib/rounds";
import { createServiceClient } from "@/lib/supabase/server";
import { loadSnapshot, loadMatchEvents, liveScore, type Match } from "@/lib/data";
import { computeLeaderboard } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { KickoffDate } from "@/components/kickoff-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearScoreAction,
  endMatchAction,
  resumeMatchAction,
  setScoreAction,
} from "./actions";
import { WinnerDialog } from "./winner-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultados · Admin" };

export default async function ResultadosPage() {
  const phase = await getActivePhase();
  const isTwo = phase === "phase_two";
  const supabase = createServiceClient();
  const TABLES = await getTables();
  const columns = isTwo
    ? "match_number, kickoff_at, team_a, team_b, actual_a, actual_b, completed_at, round, final_a, final_b, pen_a, pen_b, live_home, live_away, api_home_is_a, live_status"
    : "match_number, kickoff_at, team_a, team_b, actual_a, actual_b";
  const { data: matchesData } = await supabase
    .from(TABLES.matches)
    .select(columns)
    .order("kickoff_at", { ascending: true });
  const matches = (matchesData ?? []) as unknown as Match[];

  // Phase 2: suggest the final (extra-time) and penalty scores from the live
  // feed, so the admin usually just confirms. Already-entered values win.
  const pkEvents = isTwo
    ? await loadMatchEvents(
        matches.filter((m) => m.live_status === "PEN").map((m) => m.match_number),
      )
    : [];
  const suggestFor = (m: Match): PkSuggestion => {
    const etOrPen = m.live_status === "AET" || m.live_status === "PEN";
    const total = etOrPen ? liveScore(m) : null;
    let penA = m.pen_a;
    let penB = m.pen_b;
    if (penA == null && m.live_status === "PEN") {
      const ev = pkEvents.filter(
        (e) =>
          e.match_number === m.match_number &&
          (e.comments ?? "").toLowerCase().includes("penalty shootout"),
      );
      const miss = (e: { detail: string | null }) =>
        /(missed|saved|fallad)/i.test(e.detail ?? "");
      penA = ev.filter((e) => e.side === "a" && !miss(e)).length;
      penB = ev.filter((e) => e.side === "b" && !miss(e)).length;
    }
    return {
      finalA: m.final_a ?? total?.a ?? null,
      finalB: m.final_b ?? total?.b ?? null,
      penA: penA ?? null,
      penB: penB ?? null,
    };
  };

  const snap = await loadSnapshot();
  const leaderboard = computeLeaderboard(snap);
  const winnerSet = new Set(snap.winner_ids);

  const pending = matches.filter((m) => m.actual_a === null);
  const completed = matches
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
          <MatchListing
            matches={pending}
            completed={false}
            grouped={isTwo}
            knockout={isTwo}
            suggestFor={suggestFor}
          />
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
          <MatchListing
            matches={completed}
            completed={true}
            grouped={isTwo}
            knockout={isTwo}
            suggestFor={suggestFor}
          />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay marcadores ingresados.
          </p>
        )}
      </section>
    </div>
  );
}

type PkSuggestion = {
  finalA: number | null;
  finalB: number | null;
  penA: number | null;
  penB: number | null;
};

/** Flat list in phase 1; grouped under round subheadings in phase 2. */
function MatchListing({
  matches,
  completed,
  grouped,
  knockout = false,
  suggestFor,
}: {
  matches: Match[];
  completed: boolean;
  grouped: boolean;
  knockout?: boolean;
  suggestFor?: (m: Match) => PkSuggestion;
}) {
  const row = (m: Match) => (
    <MatchRow
      key={m.match_number}
      match={m}
      completed={completed}
      knockout={knockout}
      suggest={suggestFor?.(m)}
    />
  );
  if (!grouped) {
    return <ul className="mt-4 space-y-3">{matches.map(row)}</ul>;
  }
  return (
    <div className="mt-4 space-y-6">
      {ROUNDS.map((round) => {
        const sub = matches.filter((m) => m.round === round.key);
        if (sub.length === 0) return null;
        return (
          <div key={round.key} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {round.label}
            </h3>
            <ul className="space-y-3">{sub.map(row)}</ul>
          </div>
        );
      })}
    </div>
  );
}

function MatchRow({
  match,
  completed,
  knockout = false,
  suggest,
}: {
  match: Match;
  completed: boolean;
  knockout?: boolean;
  suggest?: PkSuggestion;
}) {
  const ended = match.completed_at != null;
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
        {knockout ? (
          ended ? (
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
              Terminado
            </span>
          ) : completed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              En vivo · 90&apos; guardado
            </span>
          ) : null
        ) : completed ? (
          <span className="rounded-full bg-accent/40 px-3 py-1 text-xs font-semibold text-accent-foreground">
            Completado
          </span>
        ) : null}
      </div>

      <form action={setScoreAction} className="mt-3 space-y-3">
        <input type="hidden" name="match_number" value={match.match_number} />
        <div className="flex flex-wrap items-end gap-3">
          {knockout ? (
            <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-primary">
              Marcador 90' · cuenta para puntos
            </span>
          ) : null}
          <ScoreField
            label={match.team_a}
            name="actual_a"
            defaultValue={match.actual_a}
            required
          />
          <span className="pb-2 text-muted-foreground">–</span>
          <ScoreField
            label={match.team_b}
            name="actual_b"
            defaultValue={match.actual_b}
            required
          />
          {!knockout ? (
            <Button type="submit" size="sm">
              {completed ? "Actualizar" : "Guardar"}
            </Button>
          ) : null}
        </div>

        {knockout ? (
          <>
            <div className="flex flex-wrap items-end gap-3 border-t border-dashed pt-3">
              <span className="w-full text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Final con tiempo extra (opcional)
              </span>
              <ScoreField label={match.team_a} name="final_a" defaultValue={suggest?.finalA ?? null} />
              <span className="pb-2 text-muted-foreground">–</span>
              <ScoreField label={match.team_b} name="final_b" defaultValue={suggest?.finalB ?? null} />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <span className="w-full text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Penales (opcional)
              </span>
              <ScoreField label={match.team_a} name="pen_a" defaultValue={suggest?.penA ?? null} />
              <span className="pb-2 text-muted-foreground">–</span>
              <ScoreField label={match.team_b} name="pen_b" defaultValue={suggest?.penB ?? null} />
            </div>
            <Button type="submit" size="sm">
              {completed ? "Actualizar" : "Guardar"}
            </Button>
          </>
        ) : null}
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {knockout && completed ? (
          ended ? (
            <form action={resumeMatchAction}>
              <input type="hidden" name="match_number" value={match.match_number} />
              <Button type="submit" variant="outline" size="sm">
                Reanudar (volver a en vivo)
              </Button>
            </form>
          ) : (
            <form action={endMatchAction}>
              <input type="hidden" name="match_number" value={match.match_number} />
              <Button type="submit" size="sm">
                Finalizar partido
              </Button>
            </form>
          )
        ) : null}

        {completed ? (
          <form action={clearScoreAction}>
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
      </div>
    </li>
  );
}

function ScoreField({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: number | null;
  required?: boolean;
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
        required={required}
        className="w-20 text-center"
      />
    </label>
  );
}
