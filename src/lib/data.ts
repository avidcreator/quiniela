import "server-only";
import { createClient } from "./supabase/server";
import { pointsFor, type Points } from "./scoring";

export type Match = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  group: string | null;
  actual_a: number | null;
  actual_b: number | null;
  completed_at: string | null;
  // Live (API-Football) fields
  api_fixture_id: number | null;
  api_home_is_a: boolean | null;
  live_status: string | null;
  live_elapsed: number | null;
  live_elapsed_extra: number | null;
  live_home: number | null;
  live_away: number | null;
  live_updated_at: string | null;
};

export type MatchEvent = {
  id: string;
  match_number: number;
  sort_index: number;
  elapsed: number | null;
  elapsed_extra: number | null;
  type: string;
  detail: string | null;
  side: string | null; // 'a' | 'b' | null
  player: string | null;
  assist: string | null;
  comments: string | null;
};

// API-Football live statuses considered "in progress".
const LIVE_STATUSES = new Set([
  "1H",
  "2H",
  "HT",
  "ET",
  "BT",
  "P",
  "SUSP",
  "INT",
  "LIVE",
]);

export function isLive(m: Match): boolean {
  return m.live_status != null && LIVE_STATUSES.has(m.live_status);
}

const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);

/** A live match that has reached a final whistle (full time / extra time /
 *  penalties), as reported by the live feed. */
export function isLiveFinal(m: Match): boolean {
  return m.live_status != null && FINAL_STATUSES.has(m.live_status);
}

/** How long a just-finished live match keeps showing in the "En vivo"
 *  section (as a finalized card) before it drops off. */
export const LIVE_FINAL_GRACE_MS = 5 * 60 * 1000;

/** A genuinely in-progress match is refreshed by the feed every minute. If its
 *  last update is older than this, the feed has stopped (the match ended or was
 *  abandoned) and it should no longer count as live. */
export const LIVE_STALE_MS = 20 * 60 * 1000;

/** Whether to render this match in the "En vivo" section: it's currently
 *  live (and still being updated), or it ended within the last 5 minutes. */
export function isLiveVisible(m: Match, now: number): boolean {
  // A registered result (admin only enters one once a match is over) is the
  // authoritative "this match is done" signal — never show it as live.
  if (isCompleted(m)) return false;
  if (isLive(m)) {
    // Guard against matches stuck in a live status (clock ticking forever): if
    // the feed hasn't touched it recently, it's not actually live anymore.
    if (!m.live_updated_at) return true;
    return now - new Date(m.live_updated_at).getTime() < LIVE_STALE_MS;
  }
  // Just-finished matches linger for a few minutes. Use the most stable finish
  // time: `completed_at` when set (authoritative, never re-bumped), else the
  // feed's last update. Using `live_updated_at` alone is unreliable — the cron
  // can re-touch a finished fixture and keep the grace window from expiring.
  if (isLiveFinal(m)) {
    const finishedAt = m.completed_at ?? m.live_updated_at;
    if (finishedAt) {
      return now - new Date(finishedAt).getTime() < LIVE_FINAL_GRACE_MS;
    }
  }
  return false;
}

/** The live score mapped to our team_a/team_b orientation. */
export function liveScore(
  m: Match,
): { a: number; b: number } | null {
  if (m.live_home == null || m.live_away == null) return null;
  const homeIsA = m.api_home_is_a !== false; // default home == team_a
  return homeIsA
    ? { a: m.live_home, b: m.live_away }
    : { a: m.live_away, b: m.live_home };
}

export type Player = { id: string; name: string; avatar_url: string | null };

export type Prediction = {
  player_id: string;
  match_number: number;
  pred_a: number;
  pred_b: number;
};

export type Snapshot = {
  matches: Match[];
  players: Player[];
  predictions: Prediction[];
  winner_ids: string[];
};

// Supabase caps a single select at 1000 rows. With up to 20 players × 72
// matches = 1440 predictions, so we page through to fetch them all.
const PAGE_SIZE = 1000;

async function loadAllPredictions(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Prediction[]> {
  const all: Prediction[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("predictions")
      .select("player_id, match_number, pred_a, pred_b")
      .order("player_id", { ascending: true })
      .order("match_number", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}

const MATCH_COLUMNS =
  "match_number, kickoff_at, team_a, team_b, group, actual_a, actual_b, completed_at, api_fixture_id, api_home_is_a, live_status, live_elapsed, live_elapsed_extra, live_home, live_away, live_updated_at";

export async function loadSnapshot(): Promise<Snapshot> {
  const supabase = await createClient();
  const [matchesRes, playersRes, predictions, winnersRes] = await Promise.all([
    supabase
      .from("matches")
      .select(MATCH_COLUMNS)
      .order("match_number", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, avatar_url")
      .order("name", { ascending: true }),
    loadAllPredictions(supabase),
    supabase.from("winners").select("player_id"),
  ]);

  return {
    matches: matchesRes.data ?? [],
    players: playersRes.data ?? [],
    predictions,
    winner_ids: (winnersRes.data ?? []).map((w) => w.player_id),
  };
}

/** Load the event feed for one or more matches (most-recent first). */
export async function loadMatchEvents(
  matchNumbers: number[],
): Promise<MatchEvent[]> {
  if (matchNumbers.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_events")
    .select(
      "id, match_number, sort_index, elapsed, elapsed_extra, type, detail, side, player, assist, comments",
    )
    .in("match_number", matchNumbers)
    .order("sort_index", { ascending: false });
  return data ?? [];
}

export function isCompleted(m: Match): m is Match & { actual_a: number; actual_b: number } {
  return m.actual_a !== null && m.actual_b !== null;
}

export function pointsForMatch(
  match: Match,
  pred: { pred_a: number; pred_b: number },
): Points | null {
  if (!isCompleted(match)) return null;
  return pointsFor(pred.pred_a, pred.pred_b, match.actual_a, match.actual_b);
}
