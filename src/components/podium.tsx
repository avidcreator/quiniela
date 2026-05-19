import Link from "next/link";
import { Avatar } from "./avatar";
import type { LeaderboardEntry } from "@/lib/stats";

const SLOT_STYLES = {
  1: {
    ring: "ring-amber-400",
    bg: "bg-gradient-to-b from-amber-400/30 via-amber-200/10 to-transparent",
    height: "h-28",
    rank: "text-amber-500",
  },
  2: {
    ring: "ring-slate-300",
    bg: "bg-gradient-to-b from-slate-300/30 via-slate-200/10 to-transparent",
    height: "h-20",
    rank: "text-slate-400",
  },
  3: {
    ring: "ring-orange-400",
    bg: "bg-gradient-to-b from-orange-400/30 via-orange-200/10 to-transparent",
    height: "h-16",
    rank: "text-orange-500",
  },
} as const;

function Slot({
  place,
  entry,
}: {
  place: 1 | 2 | 3;
  entry: LeaderboardEntry | undefined;
}) {
  const s = SLOT_STYLES[place];
  return (
    <div className="flex flex-col items-center gap-2">
      {entry ? (
        <Link
          href={`/jugador/${entry.player_id}`}
          className="group flex flex-col items-center"
        >
          <div className={`relative rounded-full ring-4 ${s.ring}`}>
            <Avatar name={entry.name} size={place === 1 ? "xl" : "lg"} />
            <span
              className={`absolute -top-1 -right-1 inline-flex size-6 items-center justify-center rounded-full bg-background font-heading text-xs font-black ring-2 ring-background ${s.rank}`}
            >
              {place}
            </span>
          </div>
          <span className="mt-2 max-w-[7rem] truncate text-center text-sm font-semibold group-hover:underline">
            {entry.name}
          </span>
          <span className="font-heading text-2xl font-black tabular-nums">
            {entry.points}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            pts
          </span>
        </Link>
      ) : (
        <div className="flex flex-col items-center opacity-30">
          <div
            className={`flex items-center justify-center rounded-full ring-4 ${s.ring} ${
              place === 1 ? "size-20" : "size-14"
            } bg-muted`}
          >
            <span className={`font-heading text-2xl font-black ${s.rank}`}>
              {place}
            </span>
          </div>
        </div>
      )}
      <div className={`w-full rounded-t-xl ${s.bg} ${s.height}`} />
    </div>
  );
}

export function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-6">
        <Slot place={2} entry={second} />
        <Slot place={1} entry={first} />
        <Slot place={3} entry={third} />
      </div>
    </div>
  );
}
