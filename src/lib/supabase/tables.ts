/**
 * Central registry of phase-scoped table names.
 *
 * Every query against the phase-scoped data goes through these constants instead
 * of inline string literals, so that adding phase 2 is a single switch point here
 * rather than an edit across every file.
 *
 * Phase 1 currently points at the `phase_one_*` duplicates of the original tables.
 * The original (unprefixed) tables are still live in production until the cutover.
 *
 * NOT included here (intentionally global, never phase-scoped):
 *   - `app_settings`  — global key/value settings (e.g. live_enabled)
 *   - `avatars`       — storage bucket for player avatar files
 */
export const TABLES = {
  matches: "phase_one_matches",
  players: "phase_one_players",
  predictions: "phase_one_predictions",
  matchEvents: "phase_one_match_events",
  winners: "phase_one_winners",
} as const;

export type TableKey = keyof typeof TABLES;
