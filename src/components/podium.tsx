import Link from "next/link";
import { Avatar } from "./avatar";
import { playerColor } from "@/lib/palette";
import type { LeaderboardEntry } from "@/lib/stats";

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  const maxPts = Math.max(1, ...entries.map((e) => e.points));

  return (
    <>
      {/* Mobile: horizontal bars, one player per row */}
      <ul className="space-y-2 sm:hidden">
        {entries.map((e, idx) => {
          const color = playerColor(idx);
          const widthPct = Math.max(4, Math.round((e.points / maxPts) * 100));
          const isFirst = e.rank === 1;
          return (
            <li key={e.player_id}>
              <Link
                href={`/jugador/${e.player_id}`}
                className="group flex items-center gap-2.5"
              >
                <span
                  className={`w-5 shrink-0 text-right font-heading text-xs font-black tabular-nums ${isFirst ? "text-primary" : "text-muted-foreground"}`}
                >
                  {e.rank}
                </span>
                <div
                  className={`shrink-0 rounded-full ring-2 ${isFirst ? "ring-primary" : "ring-transparent"}`}
                >
                  <Avatar name={e.name} imageUrl={e.avatar_url} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold group-hover:underline">
                      {e.name}
                    </span>
                    <span className="shrink-0 font-heading text-sm font-black tabular-nums">
                      {e.points}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${widthPct}%`, background: color }}
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: vertical bar chart */}
      <div
        className="hidden items-end gap-4 sm:grid"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(72px, 1fr))`,
        }}
      >
        {entries.map((e, idx) => {
          const color = playerColor(idx);
          const maxBarPx = 120;
          const barH = Math.round((e.points / maxPts) * maxBarPx);
          const isFirst = e.rank === 1;
          return (
            <Link
              key={e.player_id}
              href={`/jugador/${e.player_id}`}
              className="group flex flex-col items-center"
            >
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
                  style={{ height: Math.max(2, barH), background: color }}
                  aria-hidden
                />
              </div>

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
                  <Avatar
                    name={e.name}
                    imageUrl={e.avatar_url}
                    size={isFirst ? "md" : "sm"}
                  />
                </div>
              </div>
              <span className="mt-1 max-w-full truncate text-center text-[11px] font-semibold group-hover:underline">
                {e.name}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
