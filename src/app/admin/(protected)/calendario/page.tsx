import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getActivePhase } from "@/lib/phase";
import { ROUNDS } from "@/lib/rounds";
import { KickoffDate } from "@/components/kickoff-date";
import { ScheduleUploadForm } from "./upload-form";
import { RoundUploadForm } from "./round-upload-form";
import { RoundClearButton } from "./round-clear-button";
import { removeRoundMatchesAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendario · Admin" };

type MatchRow = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
};

function MatchList({ matches }: { matches: MatchRow[] }) {
  return (
    <ul className="mt-4 divide-y rounded-2xl border bg-card">
      {matches.map((m) => (
        <li
          key={m.match_number}
          className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {m.match_number}
            </span>
            <div>
              <div className="font-medium">
                {m.team_a} <span className="text-muted-foreground">vs</span>{" "}
                {m.team_b}
              </div>
              <KickoffDate
                iso={m.kickoff_at}
                className="text-xs text-muted-foreground"
              />
            </div>
          </div>
          <Link
            href={`/admin/calendario/${m.match_number}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Editar
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function CalendarioPage() {
  const phase = await getActivePhase();
  const supabase = createServiceClient();

  if (phase === "phase_two") {
    const { data: matches } = await supabase
      .from("phase_two_matches")
      .select("match_number, round, kickoff_at, team_a, team_b")
      .order("match_number", { ascending: true });
    const all = matches ?? [];

    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Calendario
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sube cada ronda por separado en CSV. Puedes subir solo los partidos
            que ya se conozcan y completar el resto después. Columnas:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              match_number, date, team_a, team_b
            </code>{" "}
            (match_number es el número oficial del torneo; las eliminatorias van
            del 73 al 104, en orden por ronda).
          </p>
        </header>

        {ROUNDS.map((round) => {
          const roundMatches = all.filter((m) => m.round === round.key);
          return (
            <section key={round.key} className="rounded-2xl border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold">
                  {round.label}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {roundMatches.length}/{round.count} cargados
                  </span>
                  {roundMatches.length > 0 ? (
                    <form action={removeRoundMatchesAction}>
                      <input type="hidden" name="round" value={round.key} />
                      <RoundClearButton
                        label={round.label}
                        count={roundMatches.length}
                      />
                    </form>
                  ) : null}
                </div>
              </div>
              <RoundUploadForm round={round.key} count={round.count} />
              {roundMatches.length > 0 ? (
                <MatchList matches={roundMatches} />
              ) : null}
            </section>
          );
        })}
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("phase_one_matches")
    .select("match_number, kickoff_at, team_a, team_b")
    .order("match_number", { ascending: true });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Calendario
        </h1>
        <p className="mt-1 text-muted-foreground">
          Sube los 72 partidos en CSV. Después puedes editar
          individuales si la FIFA reprograma.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Subir CSV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Columnas:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            match_number, date, team_a, team_b
          </code>
          . La fecha debe ser ISO 8601 con zona horaria (ej.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            2026-06-11T18:00:00-06:00
          </code>
          ).
        </p>
        <ScheduleUploadForm />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Partidos cargados ({matches?.length ?? 0}/72)
          </h2>
        </div>
        {matches && matches.length > 0 ? (
          <MatchList matches={matches} />
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            Aún no hay partidos. Sube el CSV para empezar.
          </p>
        )}
      </section>
    </div>
  );
}
