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

export function Ticker({ matches }: { matches: TickerMatch[] }) {
  if (matches.length === 0) return null;
  const stream = [...matches, ...matches];

  return (
    <div
      className="group relative overflow-hidden border-y bg-foreground text-background"
      aria-label="Resultados recientes"
    >
      <div className="ticker-track flex w-max items-center whitespace-nowrap py-2.5 will-change-transform">
        {stream.map((m, i) => (
          <span
            key={`${m.match_number}-${i}`}
            className="inline-flex items-center gap-3 px-12 font-heading text-xs font-black uppercase tracking-[0.2em]"
          >
            <span className="text-[10px] font-bold tracking-[0.18em] opacity-70">
              {shortDate(m.kickoff_at)}
            </span>
            <TeamFlag team={m.team_a} size="xs" className="ring-white/20" />
            <span className="font-mono tabular-nums">
              {m.actual_a}–{m.actual_b}
            </span>
            <TeamFlag team={m.team_b} size="xs" className="ring-white/20" />
          </span>
        ))}
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
