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
const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);

type ServiceClient = ReturnType<typeof createServiceClient>;

type MappedMatch = {
  match_number: number;
  api_fixture_id: number | null;
  api_home_is_a: boolean | null;
  live_status: string | null;
  completed_at: string | null;
};

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
  const isFinal = FINAL_STATUSES.has(status);

  const patch: {
    live_status: string;
    live_elapsed: number | null;
    live_home: number;
    live_away: number;
    live_updated_at: string;
    actual_a?: number;
    actual_b?: number;
    completed_at?: string;
  } = {
    live_status: status,
    live_elapsed: fx.fixture.status.elapsed,
    live_home: home,
    live_away: away,
    live_updated_at: new Date().toISOString(),
  };
  if (isFinal) {
    patch.actual_a = homeIsA ? home : away;
    patch.actual_b = homeIsA ? away : home;
    if (!match.completed_at) patch.completed_at = new Date().toISOString();
  }
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
  }
}

export async function pollLive(): Promise<{ updated: number }> {
  const supabase = createServiceClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("match_number, api_fixture_id, api_home_is_a, live_status, completed_at")
    .not("api_fixture_id", "is", null);

  if (!matches || matches.length === 0) return { updated: 0 };

  const live = await fetchLiveFixtures();
  const liveById = new Map(live.map((f) => [f.fixture.id, f]));

  let updated = 0;
  for (const m of matches as MappedMatch[]) {
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
