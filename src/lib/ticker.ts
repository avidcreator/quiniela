import "server-only";
import { isCompleted, type Snapshot, type Match } from "./data";

export type TickerMatch = {
  match_number: number;
  team_a: string;
  team_b: string;
  actual_a: number;
  actual_b: number;
  kickoff_at: string;
};

function mxDateKey(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function todayKey(): string {
  return mxDateKey(new Date());
}

export function matchDateKey(iso: string): string {
  return mxDateKey(iso);
}

export function buildTickerMatches(snap: Snapshot): TickerMatch[] {
  return snap.matches
    .filter(isCompleted)
    .sort(
      (a: Match, b: Match) =>
        new Date(b.completed_at ?? b.kickoff_at).getTime() -
        new Date(a.completed_at ?? a.kickoff_at).getTime(),
    )
    .slice(0, 8)
    .map((m) => ({
      match_number: m.match_number,
      team_a: m.team_a,
      team_b: m.team_b,
      actual_a: m.actual_a as number,
      actual_b: m.actual_b as number,
      kickoff_at: m.kickoff_at,
    }));
}
