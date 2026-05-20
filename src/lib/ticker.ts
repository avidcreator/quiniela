import "server-only";
import { isCompleted, type Snapshot } from "./data";
import type { LeaderboardEntry } from "./stats";

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

export function buildTickerItems(
  snap: Snapshot,
  leaderboard: LeaderboardEntry[],
): string[] {
  const items: string[] = [];
  const today = todayKey();

  const completed = snap.matches.filter(isCompleted);
  const completedCount = completed.length;

  const todaysMatches = snap.matches.filter(
    (m) => mxDateKey(m.kickoff_at) === today,
  );
  if (todaysMatches.length > 0) {
    items.push(
      `Hoy · ${todaysMatches.length} partido${todaysMatches.length === 1 ? "" : "s"}`,
    );
  }

  const mostRecent = completed
    .slice()
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.kickoff_at).getTime() -
        new Date(a.completed_at ?? a.kickoff_at).getTime(),
    )[0];
  if (mostRecent && mostRecent.actual_a !== null && mostRecent.actual_b !== null) {
    items.push(
      `Final · ${mostRecent.team_a} ${mostRecent.actual_a}–${mostRecent.actual_b} ${mostRecent.team_b}`,
    );
  }

  const biggestMover = leaderboard
    .filter((e) => e.prev_rank !== null && e.prev_rank > e.rank)
    .sort(
      (a, b) => (b.prev_rank! - b.rank) - (a.prev_rank! - a.rank),
    )[0];
  if (biggestMover) {
    const delta = biggestMover.prev_rank! - biggestMover.rank;
    items.push(
      `${biggestMover.name} subió ${delta} lugar${delta === 1 ? "" : "es"}`,
    );
  }

  const biggestDrop = leaderboard
    .filter((e) => e.prev_rank !== null && e.prev_rank < e.rank)
    .sort(
      (a, b) => (b.rank - b.prev_rank!) - (a.rank - a.prev_rank!),
    )[0];
  if (biggestDrop) {
    const delta = biggestDrop.rank - biggestDrop.prev_rank!;
    items.push(
      `${biggestDrop.name} bajó ${delta} lugar${delta === 1 ? "" : "es"}`,
    );
  }

  for (const h of leaderboard.filter((e) => e.hot).slice(0, 2)) {
    items.push(`🔥 ${h.name} está on fire`);
  }
  for (const c of leaderboard.filter((e) => e.cold).slice(0, 2)) {
    items.push(`🧊 ${c.name} en sequía`);
  }

  const leader = leaderboard[0];
  if (leader) items.push(`#1 ${leader.name} · ${leader.points} pts`);

  items.push(`Jornada ${completedCount} de 72`);

  return items;
}
