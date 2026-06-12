import { TeamFlag } from "./team-flag";
import type { TickerMatch } from "@/lib/ticker";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  day: "numeric",
});

function shortDate(iso: string): string {
  // "11 jun" → "11 Jun"
  const text = dateFmt.format(new Date(iso)).replace(".", "");
  const [day, month] = text.split(/\s+/);
  if (!month) return text;
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

function Item({ m }: { m: TickerMatch }) {
  return (
    <span className="inline-flex items-center gap-3 px-12 font-heading text-xs font-black uppercase tracking-[0.2em]">
      <span className="text-[10px] font-bold tracking-[0.18em] opacity-70">
        {shortDate(m.kickoff_at)}
      </span>
      <TeamFlag team={m.team_a} size="xs" className="ring-white/20" />
      <span className="font-mono tabular-nums">
        {m.actual_a}–{m.actual_b}
      </span>
      <TeamFlag team={m.team_b} size="xs" className="ring-white/20" />
    </span>
  );
}

export function Ticker({ matches }: { matches: TickerMatch[] }) {
  if (matches.length === 0) return null;

  // Two identical segments scroll seamlessly (translate -50% loops). Each
  // segment is at least a viewport wide, so when the results don't fill the
  // screen they scroll past one at a time instead of the copy sitting
  // statically next to the original.
  const segment = (prefix: string, ariaHidden = false) => (
    <div
      aria-hidden={ariaHidden}
      className="flex min-w-[100vw] shrink-0 items-center whitespace-nowrap"
    >
      {matches.map((m, i) => (
        <Item key={`${prefix}-${m.match_number}-${i}`} m={m} />
      ))}
    </div>
  );

  return (
    <div
      className="group relative overflow-hidden border-y bg-foreground text-background"
      aria-label="Resultados recientes"
    >
      <div className="ticker-track flex w-max items-center py-2.5 will-change-transform">
        {segment("a")}
        {segment("b", true)}
      </div>
      <style>{`
        .ticker-track {
          animation: ticker-scroll 48s linear infinite;
        }
        .group:hover .ticker-track { animation-play-state: paused; }
        @keyframes ticker-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
