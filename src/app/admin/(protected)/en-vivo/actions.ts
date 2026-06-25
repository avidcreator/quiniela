"use server";

import { TABLES } from "@/lib/supabase/tables";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceClient } from "@/lib/supabase/server";
import { apiConfigured, fetchSeasonFixtures } from "@/lib/live/api-football";
import { suggestFixture } from "@/lib/live/match-fixtures";
import { pollLive } from "@/lib/live/ingest";
import { setLiveEnabled } from "@/lib/settings";

export async function toggleLiveAction(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("enabled") === "true";
  await setLiveEnabled(enabled);
  revalidatePath("/admin/en-vivo");
  revalidatePath("/");
}

export async function autoMapAction() {
  await requireAdmin();
  if (!apiConfigured()) return;

  const fixtures = await fetchSeasonFixtures();
  const supabase = createServiceClient();
  const { data: matches } = await supabase
    .from(TABLES.matches)
    .select("match_number, team_a, team_b, kickoff_at");

  for (const m of matches ?? []) {
    const s = suggestFixture(m, fixtures);
    if (s) {
      await supabase
        .from(TABLES.matches)
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

