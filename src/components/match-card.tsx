import Link from "next/link";
import { TeamFlag } from "./team-flag";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import type { Match } from "@/lib/data";
import type { PredictionWithPoints } from "@/lib/stats";

export function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/partido/${match.match_number}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Partido {String(match.match_number).padStart(2, "0")}</span>
        <KickoffDate iso={match.kickoff_at} variant="short" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
        <TeamSide team={match.team_a} align="start" />
        <span className="font-heading text-sm font-bold text-muted-foreground">
          VS
        </span>
        <TeamSide team={match.team_b} align="end" />
      </div>
    </Link>
  );
}

export function RecentResultCard({
  match,
  predictions,
}: {
  match: Match;
  predictions: PredictionWithPoints[];
}) {
  if (match.actual_a === null || match.actual_b === null) return null;
  const strikers = predictions.filter((p) => p.points === 3);
  const winners = predictions.filter((p) => p.points === 1);

  return (
    <Link
      href={`/partido/${match.match_number}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Partido {String(match.match_number).padStart(2, "0")} · Final</span>
        <KickoffDate iso={match.kickoff_at} variant="short" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
        <TeamSide
          team={match.team_a}
          align="start"
          highlight={match.actual_a > match.actual_b}
        />
        <div className="flex items-center gap-2 font-heading text-3xl font-black tabular-nums">
          <span
            className={
              match.actual_a > match.actual_b
                ? ""
                : match.actual_a < match.actual_b
                  ? "text-muted-foreground"
                  : ""
            }
          >
            {match.actual_a}
          </span>
          <span className="text-muted-foreground">-</span>
          <span
            className={
              match.actual_b > match.actual_a
                ? ""
                : match.actual_b < match.actual_a
                  ? "text-muted-foreground"
                  : ""
            }
          >
            {match.actual_b}
          </span>
        </div>
        <TeamSide
          team={match.team_b}
          align="end"
          highlight={match.actual_b > match.actual_a}
        />
      </div>

      {strikers.length + winners.length > 0 ? (
        <div className="space-y-2 border-t bg-muted/20 px-4 py-3 text-xs">
          {strikers.length > 0 ? (
            <ScorerRow
              label="Cantaron"
              icon="🎯"
              players={strikers}
              accent
            />
          ) : null}
          {winners.length > 0 ? (
            <ScorerRow label="Acertaron" icon="✓" players={winners} dim />
          ) : null}
        </div>
      ) : (
        <div className="border-t bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
          Nadie le atinó.
        </div>
      )}
    </Link>
  );
}

function TeamSide({
  team,
  align,
  highlight,
}: {
  team: string;
  align: "start" | "end";
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${align === "end" ? "flex-row-reverse text-right" : ""}`}
    >
      <TeamFlag team={team} size="lg" />
      <div className="min-w-0">
        <div
          className={`truncate font-heading text-base font-bold sm:text-lg ${
            highlight === false ? "text-muted-foreground" : ""
          }`}
        >
          {team}
        </div>
      </div>
    </div>
  );
}

function ScorerRow({
  label,
  icon,
  players,
  accent,
  dim,
}: {
  label: string;
  icon: string;
  players: PredictionWithPoints[];
  accent?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {players.map((p) => (
          <span key={p.player_id} className="flex items-center gap-1.5">
            <Avatar name={p.name} size="xs" dim={dim} />
            <span className="text-xs font-medium">{p.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
