import Link from "next/link";
import { TeamFlag } from "../team-flag";
import { Avatar } from "../avatar";
import { LiveMinute } from "./live-minute";
import type { Match, MatchEvent } from "@/lib/data";
import type { ForecastEntry } from "@/lib/stats";

export function LiveMatchCard({
  match,
  scoreA,
  scoreB,
  events,
  forecast,
}: {
  match: Match;
  scoreA: number;
  scoreB: number;
  events: MatchEvent[];
  forecast: ForecastEntry[];
}) {
  const hasFeed = events.length > 0;
  const maxForecast = Math.max(1, ...forecast.map((f) => f.points));

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {/* Minute-by-minute — borderless, pills, scrollable, matched height */}
        {hasFeed ? (
          <div className="flex h-[212px] flex-col opacity-80 transition-opacity duration-200 hover:opacity-100">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Minuto a minuto
            </div>
            <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {events.map((e) => (
                <EventPill
                  key={e.id}
                  event={e}
                  teamA={match.team_a}
                  teamB={match.team_b}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {/* Score card — fixed size, centered */}
        <div className="relative z-10 mx-auto flex h-[212px] w-full flex-col overflow-hidden rounded-md border-2 border-primary bg-card shadow-xl sm:-ml-8 sm:-mr-3 sm:w-[420px]">
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-2 text-primary-foreground">
            <span className="inline-flex items-center gap-1.5 font-heading text-[11px] font-black uppercase tracking-[0.24em]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
              </span>
              En vivo
            </span>
            <span className="font-heading text-[11px] font-black uppercase tracking-[0.24em] tabular-nums">
              <LiveMinute
                elapsed={match.live_elapsed}
                extra={match.live_elapsed_extra}
                status={match.live_status ?? ""}
                updatedAt={match.live_updated_at}
              />
            </span>
          </div>

          <Link
            href={`/partido/${match.match_number}`}
            className="flex flex-1 items-center"
          >
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamFlag team={match.team_a} size="lg" />
                <span className="font-heading text-sm font-black uppercase tracking-wide">
                  {match.team_a}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="animate-live flex items-baseline gap-2 font-heading text-5xl font-extrabold tabular-nums sm:text-7xl">
                  <span>{scoreA}</span>
                  <span className="text-muted-foreground/70">-</span>
                  <span>{scoreB}</span>
                </div>
                <span className="mt-1 font-heading text-[9px] font-black uppercase tracking-[0.28em] text-primary">
                  En juego
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <TeamFlag team={match.team_b} size="lg" />
                <span className="font-heading text-sm font-black uppercase tracking-wide">
                  {match.team_b}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tabla proyectada — vertical dashed, pulsing bars */}
        <div className="flex h-[212px] flex-col opacity-80 transition-opacity duration-200 hover:opacity-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Tabla proyectada
            </span>
            <span className="rounded-sm border border-dashed border-foreground/40 px-1 font-heading text-[9px] font-black tabular-nums">
              si termina {scoreA}–{scoreB}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-1.5">
            {forecast.map((e) => {
              const barH = Math.max(4, Math.round((e.points / maxForecast) * 84));
              return (
                <div
                  key={e.player_id}
                  className="flex min-w-0 flex-1 flex-col items-center"
                >
                  <span className="font-heading text-sm font-black leading-none tabular-nums">
                    {e.points}
                  </span>
                  {e.delta > 0 ? (
                    <span className="mt-0.5 font-heading text-[8px] font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{e.delta}
                    </span>
                  ) : null}
                  <div
                    className="mt-1 flex w-full items-end justify-center"
                    style={{ height: 84 }}
                  >
                    <div
                      className="animate-live w-full rounded-t-sm border border-b-0 border-dashed border-primary/70 bg-primary/15"
                      style={{ height: barH }}
                      aria-hidden
                    />
                  </div>
                  <span className="mt-1 font-heading text-[10px] font-black tabular-nums text-muted-foreground">
                    {e.rank}
                  </span>
                  <Avatar name={e.name} imageUrl={e.avatar_url} size="xs" />
                  <span className="mt-1 w-full truncate text-center text-[10px] font-medium">
                    {e.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}

function EventPill({
  event,
  teamA,
  teamB,
}: {
  event: MatchEvent;
  teamA: string;
  teamB: string;
}) {
  const team = event.side === "a" ? teamA : event.side === "b" ? teamB : null;
  const { icon, accent } = eventIcon(event);
  const minute =
    event.elapsed != null
      ? event.elapsed_extra
        ? `${event.elapsed}+${event.elapsed_extra}'`
        : `${event.elapsed}'`
      : "";

  return (
    <li>
      <div className="flex items-center gap-2.5 rounded-md border bg-background px-2.5 py-2">
        <span className="w-9 shrink-0 text-right font-heading text-xs font-black tabular-nums text-muted-foreground">
          {minute}
        </span>
        {team ? <TeamFlag team={team} size="xs" /> : null}
        <span className="shrink-0 text-base leading-none">{icon}</span>
        <span className="min-w-0 truncate">
          <span
            className={`font-heading text-[11px] font-black uppercase tracking-wide ${accent}`}
          >
            {eventTitle(event)}
          </span>
          {event.player ? (
            <span className="ml-1.5 text-xs font-medium text-muted-foreground">
              {event.player}
            </span>
          ) : null}
        </span>
      </div>
    </li>
  );
}

function eventIcon(e: MatchEvent): { icon: string; accent: string } {
  const t = e.type.toLowerCase();
  const d = (e.detail ?? "").toLowerCase();
  if (t === "goal")
    return { icon: "⚽", accent: "text-emerald-600 dark:text-emerald-400" };
  if (t === "card")
    return d.includes("red")
      ? { icon: "🟥", accent: "text-red-600 dark:text-red-400" }
      : { icon: "🟨", accent: "" };
  if (t === "subst") return { icon: "🔁", accent: "" };
  if (t === "var") return { icon: "📺", accent: "text-primary" };
  return { icon: "•", accent: "" };
}

function eventTitle(e: MatchEvent): string {
  const t = e.type.toLowerCase();
  const d = (e.detail ?? "").toLowerCase();
  if (t === "goal") {
    if (d.includes("penalty")) return "Gol penal";
    if (d.includes("own")) return "Autogol";
    return "Gol";
  }
  if (t === "card") {
    return d.includes("red") ? "Roja" : "Amarilla";
  }
  if (t === "subst") return "Cambio";
  if (t === "var") return "VAR";
  return e.detail || e.type;
}

