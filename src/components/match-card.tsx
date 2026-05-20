import Link from "next/link";
import { TeamFlag } from "./team-flag";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import { commentatorLine } from "@/lib/stats";
import type { Match } from "@/lib/data";
import type { PredictionWithPoints } from "@/lib/stats";

export function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/partido/${match.match_number}`}
      className="group block overflow-hidden rounded-md border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
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
  const soloStriker = strikers.length === 1 ? strikers[0] : null;
  const winners = predictions.filter((p) => p.points === 1);
  const quote = commentatorLine(match, predictions);

  return (
    <Link
      href={`/partido/${match.match_number}`}
      className="group relative block overflow-hidden rounded-md border-2 border-foreground bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Scoreboard top bar */}
      <div className="flex items-center justify-between bg-foreground px-4 py-1.5 font-heading text-[11px] font-black uppercase tracking-[0.28em] text-background">
        <span>Partido {String(match.match_number).padStart(2, "0")} · Final</span>
        <KickoffDate iso={match.kickoff_at} variant="short" className="font-mono" />
      </div>

      {/* Jumbotron */}
      <div className="relative">
        <ScanlinesOverlay />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-6 sm:px-6 sm:py-8">
          <BigTeam
            team={match.team_a}
            score={match.actual_a}
            dim={match.actual_a < match.actual_b}
            align="start"
          />
          <div className="flex items-center font-heading font-black leading-none tabular-nums">
            <span
              className={`text-5xl sm:text-7xl ${
                match.actual_a < match.actual_b ? "text-muted-foreground" : ""
              }`}
            >
              {match.actual_a}
            </span>
            <span className="mx-1 text-2xl text-muted-foreground sm:mx-2 sm:text-3xl">
              –
            </span>
            <span
              className={`text-5xl sm:text-7xl ${
                match.actual_b < match.actual_a ? "text-muted-foreground" : ""
              }`}
            >
              {match.actual_b}
            </span>
          </div>
          <BigTeam
            team={match.team_b}
            score={match.actual_b}
            dim={match.actual_b < match.actual_a}
            align="end"
          />
        </div>

        {soloStriker ? <SoloStamp player={soloStriker} /> : null}
      </div>

      {/* Commentator tagline */}
      {quote ? (
        <div className="border-t border-dashed bg-card px-4 py-2 text-center font-heading text-xs font-bold uppercase tracking-[0.22em] text-foreground">
          {quote}
        </div>
      ) : null}

      {/* Cantaron / Acertaron footer */}
      {!soloStriker && strikers.length + winners.length > 0 ? (
        <div className="space-y-1.5 border-t bg-muted/30 px-4 py-3 text-xs">
          {strikers.length > 0 ? (
            <ScorerRow label="Cantaron" icon="🎯" players={strikers} accent />
          ) : null}
          {winners.length > 0 ? (
            <ScorerRow label="Acertaron" icon="✓" players={winners} dim />
          ) : null}
        </div>
      ) : null}
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

function BigTeam({
  team,
  align,
  dim,
}: {
  team: string;
  score: number;
  align: "start" | "end";
  dim?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-${align === "end" ? "end text-right" : "start text-left"} gap-2`}
    >
      <TeamFlag team={team} size="lg" />
      <div
        className={`max-w-full truncate font-heading text-sm font-black uppercase tracking-wider sm:text-base ${dim ? "text-muted-foreground" : ""}`}
      >
        {team}
      </div>
    </div>
  );
}

function SoloStamp({ player }: { player: PredictionWithPoints }) {
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 -rotate-6 sm:right-4 sm:top-4"
      aria-hidden
    >
      <div className="rounded-sm border-2 border-primary bg-background/95 px-2.5 py-1 shadow-md">
        <div className="font-heading text-[9px] font-black uppercase tracking-[0.22em] text-primary">
          Solo la cantó
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Avatar name={player.name} size="xs" />
          <span className="font-heading text-xs font-black">{player.name}</span>
        </div>
      </div>
    </div>
  );
}

function ScanlinesOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 4px)",
      }}
    />
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
