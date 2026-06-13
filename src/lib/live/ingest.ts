import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchLiveFixtures,
  fetchFixture,
  fetchFixtureEvents,
  type ApiFixture,
  type ApiEvent,
} from "./api-football";

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
type ServiceClient = ReturnType<typeof createServiceClient>;

type MappedMatch = {
  match_number: number;
  kickoff_at: string;
  api_fixture_id: number | null;
  api_home_is_a: boolean | null;
  live_status: string | null;
  completed_at: string | null;
};

// A match is worth polling from `ACTIVE_BEFORE` before kickoff until
// `ACTIVE_AFTER` after it — generous enough to cover halftime, stoppage,
// extra time, penalties and a kickoff delay.
const ACTIVE_BEFORE_MS = 5 * 60 * 1000; // 5 min pre-kickoff
const ACTIVE_AFTER_MS = 3.5 * 60 * 60 * 1000; // 3.5 h after kickoff

/** Whether this match could plausibly be in progress right now, so the cron
 *  should actually hit the API for it. */
const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);

function needsPolling(m: MappedMatch, now: number): boolean {
  if (m.api_fixture_id == null) return false;
  // Already over → never poll again. This freezes `live_updated_at` at the
  // final whistle so the "ended X min ago" grace window can actually expire.
  if (m.completed_at != null) return false;
  if (m.live_status && FINAL_STATUSES.has(m.live_status)) return false;
  // Already in progress per the last poll → keep polling until it finalizes,
  // even if it has run past the nominal window.
  if (m.live_status && LIVE_STATUSES.has(m.live_status)) return true;
  const kickoff = new Date(m.kickoff_at).getTime();
  return now >= kickoff - ACTIVE_BEFORE_MS && now <= kickoff + ACTIVE_AFTER_MS;
}

async function applyFixture(
  supabase: ServiceClient,
  match: MappedMatch,
  fx: ApiFixture,
  events: ApiEvent[],
) {
  const homeIsA = match.api_home_is_a !== false; // default: home == team_a
  const home = fx.goals.home ?? 0;
  const away = fx.goals.away ?? 0;
  const status = fx.fixture.status.short;

  // The live feed only ever writes the `live_*` mirror columns. The official
  // result (`actual_a`/`actual_b` → points) is entered exclusively from the
  // admin portal, so a final whistle here never auto-scores the leaderboard.
  const patch: {
    live_status: string;
    live_elapsed: number | null;
    live_home: number;
    live_away: number;
    live_updated_at: string;
  } = {
    live_status: status,
    live_elapsed: fx.fixture.status.elapsed,
    live_home: home,
    live_away: away,
    live_updated_at: new Date().toISOString(),
  };
  await supabase
    .from("matches")
    .update(patch)
    .eq("match_number", match.match_number);

  if (events.length > 0) {
    const homeId = fx.teams.home.id;
    const rows = events.map((e) => {
      const isHome = e.team.id === homeId;
      const side = isHome === homeIsA ? "a" : "b";
      const elapsed = e.time.elapsed ?? 0;
      const extra = e.time.extra ?? null;
      const signature = `${elapsed}-${extra ?? 0}-${e.type}-${e.detail}-${
        e.player?.name ?? ""
      }-${e.team.id}`;
      return {
        match_number: match.match_number,
        signature,
        sort_index: elapsed * 1000 + (extra ?? 0),
        elapsed,
        elapsed_extra: extra,
        type: e.type,
        detail: e.detail,
        side,
        player: e.player?.name ?? null,
        assist: e.assist?.name ?? null,
        comments: e.comments ?? null,
      };
    });
    await supabase
      .from("match_events")
      .upsert(rows, { onConflict: "match_number,signature", ignoreDuplicates: true });

    // The API returns the full event list each poll, so prune any stored event
    // that's no longer in it. This removes ghosts left when the API revises an
    // event's minute (its signature changes → the old one would otherwise
    // linger as a duplicate) or drops a VAR-disallowed goal.
    const freshSigs = new Set(rows.map((r) => r.signature));
    const { data: stored } = await supabase
      .from("match_events")
      .select("id, signature")
      .eq("match_number", match.match_number);
    const staleIds = (stored ?? [])
      .filter((e) => !freshSigs.has(e.signature))
      .map((e) => e.id);
    if (staleIds.length > 0) {
      await supabase.from("match_events").delete().in("id", staleIds);
    }
  }
}

export async function pollLive(): Promise<{
  updated: number;
  skipped?: string;
}> {
  const supabase = createServiceClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "match_number, kickoff_at, api_fixture_id, api_home_is_a, live_status, completed_at",
    )
    .not("api_fixture_id", "is", null);

  if (!matches || matches.length === 0) return { updated: 0 };

  // Only touch the API when at least one match could be in progress right now.
  // Outside any match window the cron is a no-op (no external request), which
  // keeps us from burning quota 24/7.
  const now = Date.now();
  const active = (matches as MappedMatch[]).filter((m) => needsPolling(m, now));
  if (active.length === 0) return { updated: 0, skipped: "no match in window" };

  const live = await fetchLiveFixtures();
  const liveById = new Map(live.map((f) => [f.fixture.id, f]));

  let updated = 0;
  for (const m of active) {
    if (m.api_fixture_id == null) continue;
    const fx = liveById.get(m.api_fixture_id);
    if (fx) {
      const events = await fetchFixtureEvents(m.api_fixture_id);
      await applyFixture(supabase, m, fx, events);
      updated++;
    } else if (m.live_status && LIVE_STATUSES.has(m.live_status)) {
      // Was live last poll but no longer in the live list → finalize it.
      const single = await fetchFixture(m.api_fixture_id);
      if (single) {
        const events = await fetchFixtureEvents(m.api_fixture_id);
        await applyFixture(supabase, m, single, events);
        updated++;
      }
    }
  }
  return { updated };
}
