import Link from "next/link";
import { TeamFlag } from "./team-flag";
import type { Match } from "@/lib/data";
import type { PredictionWithPoints } from "@/lib/stats";

const dayNameFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  timeZone: "America/Mexico_City",
});
const dayDateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "America/Mexico_City",
});

function fmt(date: string, formatter: Intl.DateTimeFormat): string {
  // YYYY-MM-DD → noon UTC → format in mexico tz (collapses to that date)
  const t = formatter.format(new Date(`${date}T12:00:00Z`));
  return t.replace(/\./g, "");
}

export type DayCardData = {
  date: string;
  matches: Match[];
  scorers: Array<{ player_id: string; name: string; points: number }>;
};

export function DayCard({ data }: { data: DayCardData }) {
  return (
    <Link
      href={`/dia/${data.date}`}
      className="group flex flex-col gap-3 rounded-md border-2 border-foreground bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="font-heading text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            {fmt(data.date, dayNameFmt)}
          </div>
          <div className="font-heading text-2xl font-black uppercase leading-none">
            {fmt(data.date, dayDateFmt)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading text-xl font-black tabular-nums leading-none">
            {data.matches.length}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            partido{data.matches.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <ul className="space-y-1.5 border-t pt-3 text-sm">
        {data.matches.map((m) => (
          <li
            key={m.match_number}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <TeamFlag team={m.team_a} size="xs" />
              <span
                className={`truncate text-xs ${
                  (m.actual_a ?? 0) < (m.actual_b ?? 0)
                    ? "text-muted-foreground"
                    : "font-semibold"
                }`}
              >
                {m.team_a}
              </span>
            </div>
            <span className="font-heading text-sm font-black tabular-nums">
              {m.actual_a}–{m.actual_b}
            </span>
            <div className="flex min-w-0 flex-row-reverse items-center gap-1.5">
              <TeamFlag team={m.team_b} size="xs" />
              <span
                className={`truncate text-right text-xs ${
                  (m.actual_b ?? 0) < (m.actual_a ?? 0)
                    ? "text-muted-foreground"
                    : "font-semibold"
                }`}
              >
                {m.team_b}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {data.scorers.length > 0 ? (
        <ul className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-3">
          {data.scorers.map((s) => (
            <li
              key={s.player_id}
              className="inline-flex items-baseline gap-1 text-xs"
            >
              <span className="font-medium">{s.name}</span>
              <span className="font-heading font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                +{s.points}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-auto border-t pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Nadie puntuó
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em]">
        <span className="text-primary">Resumen del día</span>
        <span className="text-primary transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}
