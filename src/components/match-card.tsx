import Link from "next/link";
import { TeamFlag } from "./team-flag";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import { commentatorLine } from "@/lib/stats";
import { groupLetter } from "@/lib/groups";
import type { Match } from "@/lib/data";
import type { PredictionWithPoints } from "@/lib/stats";

export function UpcomingMatchCard({ match }: { match: Match }) {
  const group = groupLetter(match.match_number);
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
        <TeamSide team={match.team_a} align="start" group={group} />
        <span className="font-heading text-sm font-bold text-muted-foreground">
          VS
        </span>
        <TeamSide team={match.team_b} align="end" group={group} />
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
  const soloStriker = strikers.length === 1 ? strikers[0] : null;
  const quote = commentatorLine(match, predictions);
  const group = groupLetter(match.match_number);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/partido/${match.match_number}`}
        className="group relative block overflow-hidden rounded-md border-2 border-foreground bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="flex items-center justify-between bg-foreground px-4 py-1.5 font-heading text-[11px] font-black uppercase tracking-[0.28em] text-background">
          <span>Partido {String(match.match_number).padStart(2, "0")}</span>
          <KickoffDate iso={match.kickoff_at} variant="short" className="font-mono" />
        </div>

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-6 sm:px-6 sm:py-8">
          <BigTeam
            team={match.team_a}
            dim={match.actual_a < match.actual_b}
            align="start"
            group={group}
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
            dim={match.actual_b < match.actual_a}
            align="end"
            group={group}
          />

          {soloStriker ? <SoloStamp player={soloStriker} /> : null}
        </div>

        {quote ? (
          <div className="border-t border-dashed bg-card px-4 py-2 text-center font-heading text-xs font-bold uppercase tracking-[0.22em] text-foreground">
            {quote}
          </div>
        ) : null}
      </Link>

      {strikers.length > 0 || winners.length > 0 ? (
        <div className="space-y-2 px-1 text-xs">
          {strikers.length > 0 ? (
            <ScorerRow label="Acertaron" players={strikers} variant="strike" />
          ) : null}
          {winners.length > 0 ? (
            <ScorerRow label="Ganaron" players={winners} variant="winner" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TeamSide({
  team,
  align,
  highlight,
  group,
}: {
  team: string;
  align: "start" | "end";
  highlight?: boolean;
  group?: string | null;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${align === "end" ? "flex-row-reverse text-right" : ""}`}
    >
      <TeamFlag team={team} size="md" />
      <div className="min-w-0">
        <div
          className={`truncate font-heading text-base font-bold sm:text-lg ${
            highlight === false ? "text-muted-foreground" : ""
          }`}
        >
          {team}
        </div>
        {group ? (
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Grupo {group}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BigTeam({
  team,
  align,
  dim,
  group,
}: {
  team: string;
  align: "start" | "end";
  dim?: boolean;
  group?: string | null;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-${align === "end" ? "end text-right" : "start text-left"} gap-2`}
    >
      <TeamFlag team={team} size="lg" />
      <div className="flex w-full flex-col gap-0.5">
        <div
          className={`font-heading text-sm font-black uppercase leading-tight tracking-wider break-words sm:text-base ${dim ? "text-muted-foreground" : ""}`}
        >
          {team}
        </div>
        {group ? (
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Grupo {group}
          </div>
        ) : null}
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
      <div className="rounded-sm border-2 border-emerald-600 bg-background/95 px-2.5 py-1 shadow-md dark:border-emerald-500">
        <div className="font-heading text-[9px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
          Solo acertó
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Avatar name={player.name} imageUrl={player.avatar_url} size="xs" />
          <span className="font-heading text-xs font-black">{player.name}</span>
        </div>
      </div>
    </div>
  );
}

function ScorerRow({
  label,
  players,
  variant,
}: {
  label: string;
  players: PredictionWithPoints[];
  variant: "strike" | "winner";
}) {
  const isStrike = variant === "strike";
  return (
    <div className="flex items-start gap-3">
      <span
        className={`inline-flex w-20 shrink-0 pt-0.5 font-heading text-[10px] font-black uppercase tracking-[0.22em] ${
          isStrike
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {players.map((p) => (
          <span
            key={p.player_id}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-1.5 py-0.5"
          >
            <Avatar name={p.name} imageUrl={p.avatar_url} size="xs" dim={!isStrike} />
            <span className="text-xs font-medium">{p.name}</span>
            <span
              className={`rounded-sm px-1 font-heading text-[10px] font-black tabular-nums ${
                isStrike
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-foreground text-background"
              }`}
            >
              +{isStrike ? 3 : 1}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
