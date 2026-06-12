import Link from "next/link";
import { TeamFlag } from "../team-flag";
import { Avatar } from "../avatar";
import { LiveMinute } from "./live-minute";
import { isLiveFinal, type Match, type MatchEvent } from "@/lib/data";
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
  const isShootoutKick = (e: MatchEvent) =>
    (e.comments ?? "").toLowerCase().includes("penalty shootout");
  const pk = events.filter(isShootoutKick);
  const feedEvents = pk.length ? events.filter((e) => !isShootoutKick(e)) : events;
  const pkA = pk.filter((e) => e.side === "a");
  const pkB = pk.filter((e) => e.side === "b");
  const pkSlots = pk.length ? Math.max(5, pkA.length, pkB.length) : 0;
  const hasFeed = feedEvents.length > 0;
  const maxForecast = Math.max(1, ...forecast.map((f) => f.points));
  const isFinal = isLiveFinal(match);
  const finalLabel =
    match.live_status === "PEN"
      ? "Penales"
      : match.live_status === "AET"
        ? "Tiempo extra"
        : "Concluido";

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {/* Minute-by-minute — borderless, pills, scrollable, matched height.
            When empty, keep the column on desktop (balances the layout) but
            drop it entirely on mobile. */}
        <div
          className={`h-[212px] min-w-0 flex-col opacity-80 transition-opacity duration-200 hover:opacity-100 ${
            hasFeed ? "flex" : "hidden sm:flex"
          }`}
        >
          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            Minuto a minuto
          </div>
          {hasFeed ? (
            <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {feedEvents.map((e) => (
                <EventPill
                  key={e.id}
                  event={e}
                  teamA={match.team_a}
                  teamB={match.team_b}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-1 items-center justify-center rounded-md border border-dashed border-foreground/15">
              <span className="px-3 text-center text-[11px] font-medium text-muted-foreground">
                Sin jugadas todavía
              </span>
            </div>
          )}
        </div>

        {/* Score card — fixed size, centered */}
        <div
          className={`relative z-10 mx-auto flex w-full flex-col overflow-hidden rounded-md border-2 bg-card shadow-xl sm:-ml-8 sm:-mr-3 sm:w-[420px] ${
            pk.length ? "h-[268px]" : "h-[212px]"
          } ${isFinal ? "border-foreground/20" : "border-primary"}`}
        >
          <div
            className={`flex items-end justify-between gap-2 px-4 py-2.5 ${
              isFinal
                ? "bg-foreground text-background"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isFinal ? (
              <>
                <span className="pb-1 font-heading text-[11px] font-black uppercase tracking-[0.24em]">
                  Resultado
                </span>
                <span className="font-heading text-2xl font-black uppercase leading-none tracking-[0.08em] sm:text-3xl">
                  Finalizado
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 pb-1 font-heading text-[11px] font-black uppercase tracking-[0.24em]">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
                  </span>
                  En vivo
                </span>
                <LiveMinute
                  elapsed={match.live_elapsed}
                  extra={match.live_elapsed_extra}
                  status={match.live_status ?? ""}
                  updatedAt={match.live_updated_at}
                />
              </>
            )}
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
                <div
                  className={`flex items-baseline gap-2 font-heading text-5xl font-extrabold tabular-nums sm:text-7xl ${
                    isFinal ? "" : "animate-live"
                  }`}
                >
                  <span>{scoreA}</span>
                  <span className="text-muted-foreground/70">-</span>
                  <span>{scoreB}</span>
                </div>
                <span
                  className={`mt-1 font-heading text-[9px] font-black uppercase tracking-[0.28em] ${
                    isFinal ? "text-muted-foreground" : "text-primary"
                  }`}
                >
                  {isFinal ? finalLabel : "En juego"}
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

          {pk.length > 0 ? (
            <div className="border-t-2 border-primary/15 px-4 py-2">
              <div className="text-center font-heading text-[8px] font-black uppercase tracking-[0.24em] text-primary">
                Tanda de penales
              </div>
              <div className="mt-1.5 space-y-1.5">
                <PkRow team={match.team_a} kicks={pkA} slots={pkSlots} />
                <PkRow team={match.team_b} kicks={pkB} slots={pkSlots} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Tabla proyectada — vertical dashed, pulsing bars */}
        <div className="flex h-[212px] min-w-0 flex-col opacity-80 transition-opacity duration-200 hover:opacity-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Tabla proyectada
            </span>
            <span className="rounded-sm border border-dashed border-foreground/40 px-1 font-heading text-[9px] font-black tabular-nums">
              si termina {scoreA}–{scoreB}
            </span>
          </div>
          <div className="mt-auto flex items-end gap-2 overflow-x-auto pb-1">
            {forecast.length === 0 ? (
              <span className="text-[10px] font-medium text-muted-foreground">
                Nadie suma puntos con este marcador.
              </span>
            ) : null}
            {forecast.map((e) => {
              const barH = Math.max(4, Math.round((e.points / maxForecast) * 84));
              return (
                <div
                  key={e.player_id}
                  className="flex w-11 shrink-0 flex-col items-center"
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

function PkRow({
  team,
  kicks,
  slots,
}: {
  team: string;
  kicks: MatchEvent[];
  slots: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <TeamFlag team={team} size="sm" />
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {Array.from({ length: slots }).map((_, i) => {
          const k = kicks[i];
          const state = !k
            ? "pending"
            : /(missed|saved|fallad)/i.test(k.detail ?? "")
              ? "missed"
              : "scored";
          return <PkDot key={i} state={state} />;
        })}
      </div>
    </div>
  );
}

function PkDot({ state }: { state: "scored" | "missed" | "pending" }) {
  if (state === "scored") {
    return (
      <span className="inline-flex size-4 items-center justify-center rounded-full border-2 border-emerald-500">
        <span className="size-2 rounded-full bg-emerald-500" />
      </span>
    );
  }
  if (state === "missed") {
    return <span className="inline-flex size-4 rounded-full border-2 border-red-500" />;
  }
  return (
    <span className="inline-flex size-4 rounded-full border-2 border-muted-foreground/25" />
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
  const isGoal = event.type.toLowerCase() === "goal";
  // API-Football substitutions: `player` is who came OFF, `assist` who came ON.
  const isSub = event.type.toLowerCase() === "subst";
  const minute =
    event.elapsed != null
      ? event.elapsed_extra
        ? `${event.elapsed}+${event.elapsed_extra}'`
        : `${event.elapsed}'`
      : "";

  // Full text for the hover tooltip, since the pill truncates (e.g. a cambio's
  // "sale" name gets cut off).
  const fullText = [
    minute,
    eventTitle(event),
    isSub && event.assist
      ? `Entra ${event.assist}, Sale ${event.player ?? ""}`.trim()
      : event.player,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <div
        title={fullText}
        className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 ${
          isGoal
            ? "animate-live border-emerald-500/70 bg-emerald-500/10 shadow-sm shadow-emerald-500/20 dark:bg-emerald-500/15"
            : "bg-background"
        }`}
      >
        <span
          className={`w-9 shrink-0 text-right font-heading text-xs font-black tabular-nums ${
            isGoal
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-muted-foreground"
          }`}
        >
          {minute}
        </span>
        {team ? <TeamFlag team={team} size="xs" /> : null}
        <span className={`shrink-0 leading-none ${isGoal ? "text-xl" : "text-base"}`}>
          {icon}
        </span>
        <span className="min-w-0 truncate">
          <span
            className={`font-heading text-[11px] font-black uppercase tracking-wide ${accent}`}
          >
            {eventTitle(event)}
          </span>
          {isSub && event.assist ? (
            <span className="ml-1.5 text-xs font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">
                ↑ {event.assist}
              </span>
              <span className="mx-1 text-muted-foreground/50">·</span>
              <span className="text-red-600 dark:text-red-400">
                ↓ {event.player}
              </span>
            </span>
          ) : event.player ? (
            <span
              className={`ml-1.5 text-xs font-medium ${
                isGoal
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-muted-foreground"
              }`}
            >
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

