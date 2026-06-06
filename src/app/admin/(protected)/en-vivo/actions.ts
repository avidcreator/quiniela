"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceClient } from "@/lib/supabase/server";
import { apiConfigured, fetchSeasonFixtures } from "@/lib/live/api-football";
import { suggestFixture } from "@/lib/live/match-fixtures";
import { pollLive } from "@/lib/live/ingest";

export async function autoMapAction() {
  await requireAdmin();
  if (!apiConfigured()) return;

  const fixtures = await fetchSeasonFixtures();
  const supabase = createServiceClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("match_number, team_a, team_b, kickoff_at");

  for (const m of matches ?? []) {
    const s = suggestFixture(m, fixtures);
    if (s) {
      await supabase
        .from("matches")
        .update({ api_fixture_id: s.fixtureId, api_home_is_a: s.homeIsA })
        .eq("match_number", m.match_number);
    }
  }

  revalidatePath("/admin/en-vivo");
}

export async function pollNowAction() {
  await requireAdmin();
  if (!apiConfigured()) return;
  await pollLive();
  revalidatePath("/admin/en-vivo");
  revalidatePath("/");
}

export async function setFixtureAction(formData: FormData) {
  await requireAdmin();
  const matchNumber = Number(formData.get("match_number"));
  const rawId = String(formData.get("fixture_id") ?? "").trim();
  const homeIsA = formData.get("home_is_a") === "on";
  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");

  const supabase = createServiceClient();
  if (rawId === "") {
    await supabase
      .from("matches")
      .update({
        api_fixture_id: null,
        api_home_is_a: null,
        live_status: null,
        live_elapsed: null,
        live_home: null,
        live_away: null,
      })
      .eq("match_number", matchNumber);
  } else {
    const fixtureId = Number(rawId);
    if (!Number.isInteger(fixtureId)) throw new Error("fixture id inválido");
    await supabase
      .from("matches")
      .update({ api_fixture_id: fixtureId, api_home_is_a: homeIsA })
      .eq("match_number", matchNumber);
  }
  revalidatePath("/admin/en-vivo");
}
