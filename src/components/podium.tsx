import Link from "next/link";
import { Avatar } from "./avatar";
import { playerColor } from "@/lib/palette";
import type { LeaderboardEntry } from "@/lib/stats";

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  const maxPts = Math.max(1, ...entries.map((e) => e.points));
  const maxBarPx = 120;

  return (
    <div
      className="grid items-end gap-3 sm:gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(72px, 1fr))`,
      }}
    >
      {entries.map((e, idx) => {
        const color = playerColor(idx);
        const barH = Math.round((e.points / maxPts) * maxBarPx);
        const isFirst = e.rank === 1;
        return (
          <Link
            key={e.player_id}
            href={`/jugador/${e.player_id}`}
            className="group flex flex-col items-center"
          >
            {/* Bar area — labels sit right above each bar */}
            <div
              className="flex w-full flex-col items-center justify-end"
              style={{ height: maxBarPx + 32 }}
            >
              <span className="font-heading text-base font-black leading-none tabular-nums">
                {e.points}
              </span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                pts
              </span>
              <div
                className="mt-1 w-full rounded-t-sm"
                style={{
                  height: Math.max(2, barH),
                  background: color,
                }}
                aria-hidden
              />
            </div>

            {/* Rank · avatar · name */}
            <span
              className={`mt-2 font-heading text-xs font-black tabular-nums ${isFirst ? "text-primary" : "text-muted-foreground"}`}
            >
              {e.rank}
            </span>
            <div
              className="mt-1 flex items-center justify-center"
              style={{ height: 40 }}
            >
              <div
                className={`rounded-full ring-2 ${isFirst ? "ring-primary" : "ring-transparent"}`}
              >
                <Avatar name={e.name} size={isFirst ? "md" : "sm"} />
              </div>
            </div>
            <span className="mt-1 max-w-full truncate text-center text-[11px] font-semibold group-hover:underline">
              {e.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
