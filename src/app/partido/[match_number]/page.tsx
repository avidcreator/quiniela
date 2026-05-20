import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted } from "@/lib/data";
import { computeMatchPredictions, type PredictionWithPoints } from "@/lib/stats";
import { Avatar } from "@/components/avatar";
import { KickoffDate } from "@/components/kickoff-date";
import { TeamFlag } from "@/components/team-flag";
import { groupLetter } from "@/lib/groups";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  return { title: `Partido #${match_number} · FIFA World Cup 2026` };
}

export default async function PartidoPage({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  const num = Number(match_number);
  if (!Number.isInteger(num)) notFound();

  const snap = await loadSnapshot();
  const match = snap.matches.find((m) => m.match_number === num);
  if (!match) notFound();

  const completed = isCompleted(match);
  const preds = computeMatchPredictions(snap, num);
  const strikers = preds.filter((p) => p.points === 3);
  const winners = preds.filter((p) => p.points === 1);
  const misses = preds.filter((p) => p.points === 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/partidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Partidos
      </Link>

      <header className="mt-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Partido {String(match.match_number).padStart(2, "0")}
          {groupLetter(match.match_number)
            ? ` · Grupo ${groupLetter(match.match_number)}`
            : ""}{" "}
          · {completed ? "Jugado" : "Por jugarse"}
        </div>
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl border bg-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-8 sm:gap-6 sm:px-8 sm:py-12">
          <TeamColumn
            team={match.team_a}
            highlight={completed && match.actual_a! > match.actual_b!}
            dim={completed && match.actual_a! < match.actual_b!}
          />
          {completed ? (
            <div className="flex items-baseline gap-2 font-heading text-5xl font-black tabular-nums sm:text-6xl">
              <span
                className={
                  match.actual_a! < match.actual_b!
                    ? "text-muted-foreground"
                    : ""
                }
              >
                {match.actual_a}
              </span>
              <span className="text-muted-foreground">-</span>
              <span
                className={
                  match.actual_b! < match.actual_a!
                    ? "text-muted-foreground"
                    : ""
                }
              >
                {match.actual_b}
              </span>
            </div>
          ) : (
            <span className="font-heading text-lg font-bold text-muted-foreground">
              VS
            </span>
          )}
          <TeamColumn
            team={match.team_b}
            align="end"
            highlight={completed && match.actual_b! > match.actual_a!}
            dim={completed && match.actual_b! < match.actual_a!}
          />
        </div>

        <div className="border-t bg-muted/30 px-6 py-3 text-center text-xs text-muted-foreground sm:px-8">
          <KickoffDate iso={match.kickoff_at} variant="long" />
        </div>
      </section>

      {completed ? (
        <section className="mt-8 space-y-4">
          <h2 className="font-heading text-xl font-black tracking-tight">
            Pronósticos
          </h2>
          {strikers.length > 0 ? (
            <PredictionGroup
              icon="🎯"
              label="Acertaron"
              tone="primary"
              players={strikers}
            />
          ) : null}
          {winners.length > 0 ? (
            <PredictionGroup
              icon="✓"
              label="Ganaron"
              tone="accent"
              players={winners}
            />
          ) : null}
          {misses.length > 0 ? (
            <PredictionGroup
              icon="✗"
              label="Fallaron"
              tone="muted"
              players={misses}
            />
          ) : null}
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-black tracking-tight">
            Pronósticos
          </h2>
          {preds.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Aún no hay jugadores en la quiniela.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {preds.map((p) => (
                <li key={p.player_id}>
                  <Link
                    href={`/jugador/${p.player_id}`}
                    className="flex items-center justify-between gap-4 rounded-full border bg-card px-4 py-2.5 transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <span className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <span className="font-medium">{p.name}</span>
                    </span>
                    <span className="font-heading text-base font-black tabular-nums text-muted-foreground">
                      {p.pred_a}–{p.pred_b}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TeamColumn({
  team,
  align = "start",
  highlight,
  dim,
}: {
  team: string;
  align?: "start" | "end";
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 ${align === "end" ? "" : ""}`}
    >
      <TeamFlag team={team} size="xl" />
      <div
        className={`font-heading text-base font-black sm:text-2xl ${
          dim ? "text-muted-foreground" : ""
        } ${highlight ? "text-foreground" : ""} text-center`}
      >
        {team}
      </div>
    </div>
  );
}

function PredictionGroup({
  icon,
  label,
  tone,
  players,
}: {
  icon: string;
  label: string;
  tone: "primary" | "accent" | "muted";
  players: PredictionWithPoints[];
}) {
  const toneStyles =
    tone === "primary"
      ? "border-primary/30 bg-primary/5"
      : tone === "accent"
        ? "border-accent/40 bg-accent/10"
        : "border-border bg-muted/30";
  const labelColor =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles}`}>
      <div
        className={`mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] ${labelColor}`}
      >
        <span>{icon}</span>
        <span>
          {label} · {players.length}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {players.map((p) => (
          <li key={p.player_id} className="flex items-center justify-between gap-3">
            <Link
              href={`/jugador/${p.player_id}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar name={p.name} size="sm" dim={tone === "muted"} />
              <span className="font-medium">{p.name}</span>
            </Link>
            <span className="font-heading text-sm font-bold tabular-nums text-muted-foreground">
              {p.pred_a}–{p.pred_b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
