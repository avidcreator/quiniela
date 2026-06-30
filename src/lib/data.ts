import "server-only";
import { getActivePhase, getTables, tablesForPhase, type Phase, type TableMap } from "@/lib/phase";
import { createClient } from "./supabase/server";
import { pointsFor, type Points } from "./scoring";

export type Match = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  /** Group stage label (phase 1 only). */
  group: string | null;
  /** Knockout round label: R32 | R16 | QF | SF | 3RD | FINAL (phase 2 only). */
  round: string | null;
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
  // Phase 2 knockouts (admin-entered, display-only): final score incl. extra
  // time, and penalty-shootout score. Null = decided in regulation.
  final_a: number | null;
  final_b: number | null;
  pen_a: number | null;
  pen_b: number | null;
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
  // `completed_at` (admin marked the match ended) is the authoritative "done"
  // signal — never show it as live. For phase 2 the 90' score can be entered
  // while the match plays on (extra time / penalties), so this is keyed on
  // ended, not on whether a score exists. Phase 1 sets both together.
  if (m.completed_at != null) return false;
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

// Live statuses that mean a knockout match has gone PAST regulation: extra time
// (incl. its break), or penalties. In these, the running total includes goals
// that don't count toward points — only the 90' (incl. stoppage) score does.
const EXTRA_TIME_STATUSES = new Set(["ET", "BT", "P", "AET", "PEN"]);

export function isExtraTimePhase(status: string | null): boolean {
  return status != null && EXTRA_TIME_STATUSES.has(status);
}

/**
 * Reconstruct the regulation score (90' + stoppage) from the event feed, for
 * phase 2 knockout matches. Counts goals at `elapsed <= 90` (stoppage time is
 * recorded as elapsed 45/90 with an `extra` value, so it's included); excludes
 * extra-time goals (elapsed > 90), the penalty shootout, and missed/saved
 * penalties. Own goals are credited to the other side.
 */
export function regulationGoals(events: MatchEvent[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const e of events) {
    if (e.type.toLowerCase() !== "goal") continue;
    const detail = (e.detail ?? "").toLowerCase();
    const comments = (e.comments ?? "").toLowerCase();
    if (comments.includes("penalty shootout")) continue; // shootout kick
    if (detail.includes("missed") || detail.includes("saved")) continue; // no goal
    if (e.elapsed == null || e.elapsed > 90) continue; // extra time / unknown
    const own = detail.includes("own");
    const side = own ? (e.side === "a" ? "b" : e.side === "b" ? "a" : null) : e.side;
    if (side === "a") a++;
    else if (side === "b") b++;
  }
  return { a, b };
}

export type KnockoutResult = {
  /** How the match was ultimately decided. */
  decidedBy: "reg" | "et" | "pen";
  /** Final score including extra time (penalties shown separately). */
  finalA: number;
  finalB: number;
  /** Penalty-shootout score (scored kicks per side). */
  penA: number;
  penB: number;
  /** Side that advanced, or null if undetermined. */
  winner: "a" | "b" | null;
};

/**
 * Summarize how a COMPLETED knockout match was decided, from the admin-entered
 * columns, for display alongside the points-counting (regulation) score.
 *   - `actual_a/actual_b` — regulation score (the only thing that awards points)
 *   - `final_a/final_b`    — final score incl. extra time (null = no extra time)
 *   - `pen_a/pen_b`        — penalty-shootout score (null = no shootout)
 * Blank ET/penalty fields mean the match was decided in regulation.
 */
export function knockoutResult(m: Match): KnockoutResult | null {
  if (!isCompleted(m)) return null;
  const reg = { a: m.actual_a, b: m.actual_b };

  const wentToPens = m.pen_a != null && m.pen_b != null;
  const wentToEt =
    m.final_a != null &&
    m.final_b != null &&
    (m.final_a !== reg.a || m.final_b !== reg.b);
  const decidedBy = wentToPens ? "pen" : wentToEt ? "et" : "reg";

  const finalA = m.final_a ?? reg.a;
  const finalB = m.final_b ?? reg.b;
  const penA = m.pen_a ?? 0;
  const penB = m.pen_b ?? 0;

  const winner = wentToPens
    ? penA === penB
      ? null
      : penA > penB
        ? "a"
        : "b"
    : finalA === finalB
      ? null
      : finalA > finalB
        ? "a"
        : "b";

  return { decidedBy, finalA, finalB, penA, penB, winner };
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
  predictionsTable: TableMap["predictions"],
): Promise<Prediction[]> {
  const all: Prediction[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(predictionsTable)
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

const COMMON_MATCH_COLUMNS =
  "match_number, kickoff_at, team_a, team_b, actual_a, actual_b, completed_at, api_fixture_id, api_home_is_a, live_status, live_elapsed, live_elapsed_extra, live_home, live_away, live_updated_at";

/**
 * Match columns differ by phase: phase 1 matches carry a `group`, phase 2
 * matches carry a `round`. Selecting a column the table doesn't have errors,
 * so the list is phase-aware.
 */
function matchColumns(phase: Phase): string {
  return phase === "phase_two"
    ? `${COMMON_MATCH_COLUMNS}, round, final_a, final_b, pen_a, pen_b`
    : `${COMMON_MATCH_COLUMNS}, group`;
}

export async function loadSnapshot(): Promise<Snapshot> {
  const supabase = await createClient();
  const phase = await getActivePhase();
  const TABLES = tablesForPhase(phase);
  const [matchesRes, playersRes, predictions, winnersRes] = await Promise.all([
    supabase
      .from(TABLES.matches)
      .select(matchColumns(phase))
      .order("match_number", { ascending: true }),
    supabase
      .from(TABLES.players)
      .select("id, name, avatar_url")
      .order("name", { ascending: true }),
    loadAllPredictions(supabase, TABLES.predictions),
    supabase.from(TABLES.winners).select("player_id"),
  ]);

  return {
    // `matchColumns()` is resolved at runtime (phase-dependent), so the select
    // result isn't statically typed — the row shape is known to be Match.
    matches: (matchesRes.data ?? []) as unknown as Match[],
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
  const TABLES = await getTables();
  const { data } = await supabase
    .from(TABLES.matchEvents)
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
