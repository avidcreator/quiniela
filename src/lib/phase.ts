import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TOTAL_PHASE_TWO_MATCHES } from "@/lib/rounds";

/**
 * Phase switching.
 *
 * The quiniela runs in two independent phases, each backed by its own
 * `phase_one_*` / `phase_two_*` table set:
 *   - phase 1: the 72-match group stage
 *   - phase 2: the 32-match knockout stage (Round of 32 → Final)
 *
 * Which phase a request reads is resolved here, in two layers:
 *   - The PUBLISHED phase (`app_settings.active_phase`) is what the public sees.
 *   - An admin can set a PREVIEW cookie to view/build the other phase end-to-end
 *     without affecting the public. The cookie only takes effect for an
 *     authenticated admin, so a stray cookie on a normal visitor is ignored.
 *
 * `app_settings` is intentionally global (never phase-scoped), so the published
 * phase and the live-feature flag apply across both phases.
 */

export const PHASES = ["phase_one", "phase_two"] as const;
export type Phase = (typeof PHASES)[number];

/** Cookie an admin uses to preview a phase without publishing it. */
export const PREVIEW_COOKIE = "qp_phase";
/** `app_settings` key holding the publicly-published phase. */
export const ACTIVE_PHASE_KEY = "active_phase";
/** Fallback when nothing is published yet. */
export const DEFAULT_PHASE: Phase = "phase_one";

/** Total matches in each phase (phase 1 = group stage, phase 2 = knockouts). */
export const PHASE_MATCH_COUNT: Record<Phase, number> = {
  phase_one: 72,
  phase_two: TOTAL_PHASE_TWO_MATCHES,
};

/** Human label for each phase (Spanish), for headings/badges. */
export const PHASE_LABEL: Record<Phase, string> = {
  phase_one: "Fase de grupos",
  phase_two: "Eliminatorias",
};

export type TableMap = {
  matches: "phase_one_matches" | "phase_two_matches";
  players: "phase_one_players" | "phase_two_players";
  predictions: "phase_one_predictions" | "phase_two_predictions";
  matchEvents: "phase_one_match_events" | "phase_two_match_events";
  winners: "phase_one_winners" | "phase_two_winners";
};

const PHASE_TABLES: Record<Phase, TableMap> = {
  phase_one: {
    matches: "phase_one_matches",
    players: "phase_one_players",
    predictions: "phase_one_predictions",
    matchEvents: "phase_one_match_events",
    winners: "phase_one_winners",
  },
  phase_two: {
    matches: "phase_two_matches",
    players: "phase_two_players",
    predictions: "phase_two_predictions",
    matchEvents: "phase_two_match_events",
    winners: "phase_two_winners",
  },
};

export function isPhase(value: unknown): value is Phase {
  return value === "phase_one" || value === "phase_two";
}

/** The phase the PUBLIC sees — persisted in `app_settings`, default phase 1. */
export const getPublishedPhase = cache(async (): Promise<Phase> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ACTIVE_PHASE_KEY)
    .maybeSingle();
  return isPhase(data?.value) ? data.value : DEFAULT_PHASE;
});

/**
 * The phase active for THIS request. An authenticated admin with a preview
 * cookie sees their chosen phase; everyone else sees the published phase.
 * Memoized per request so repeated `getTables()` calls hit the DB once.
 */
export const getActivePhase = cache(async (): Promise<Phase> => {
  const store = await cookies();
  const preview = store.get(PREVIEW_COOKIE)?.value;
  if (isPhase(preview) && (await isAdmin())) return preview;
  return getPublishedPhase();
});

/** Table-name map for the request's active phase. */
export async function getTables(): Promise<TableMap> {
  return PHASE_TABLES[await getActivePhase()];
}

/** Table-name map for an explicit phase (e.g. cron, which has no request cookie). */
export function tablesForPhase(phase: Phase): TableMap {
  return PHASE_TABLES[phase];
}

/** Set the admin's preview phase. Server action / route handler only. */
export async function setPreviewPhase(phase: Phase): Promise<void> {
  const store = await cookies();
  store.set(PREVIEW_COOKIE, phase, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clear the admin's preview override (fall back to the published phase). */
export async function clearPreviewPhase(): Promise<void> {
  const store = await cookies();
  store.delete(PREVIEW_COOKIE);
}

/** Publish a phase to the public. Writes via the service-role client (admin only). */
export async function setPublishedPhase(phase: Phase): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("app_settings")
    .upsert(
      { key: ACTIVE_PHASE_KEY, value: phase, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}
