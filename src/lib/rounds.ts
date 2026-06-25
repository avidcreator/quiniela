/**
 * Phase 2 (knockout) round model.
 *
 * Phase 2 matches use the official tournament match numbers, which continue from
 * the 72 group-stage matches. Each round is a contiguous block; `base` is the
 * number just before the round's first match (first = base + 1).
 *
 *   R32 → 73..88   R16 → 89..96   QF → 97..100   SF → 101..102   3RD → 103   FINAL → 104
 */

export const ROUND_KEYS = ["R32", "R16", "QF", "SF", "3RD", "FINAL"] as const;
export type RoundKey = (typeof ROUND_KEYS)[number];

export type RoundDef = {
  key: RoundKey;
  /** Spanish display name. */
  label: string;
  /** Number of matches in the round. */
  count: number;
  /** Global match_number offset; first match of the round is `base + 1`. */
  base: number;
};

export const ROUNDS: RoundDef[] = [
  { key: "R32", label: "Dieciseisavos de final", count: 16, base: 72 },
  { key: "R16", label: "Octavos de final", count: 8, base: 88 },
  { key: "QF", label: "Cuartos de final", count: 4, base: 96 },
  { key: "SF", label: "Semifinales", count: 2, base: 100 },
  { key: "3RD", label: "Tercer lugar", count: 1, base: 102 },
  { key: "FINAL", label: "Final", count: 1, base: 103 },
];

export const TOTAL_PHASE_TWO_MATCHES = ROUNDS.reduce((n, r) => n + r.count, 0); // 32

const BY_KEY = new Map(ROUNDS.map((r) => [r.key, r]));

export function isRoundKey(value: unknown): value is RoundKey {
  return typeof value === "string" && BY_KEY.has(value as RoundKey);
}

export function roundDef(key: RoundKey): RoundDef {
  const def = BY_KEY.get(key);
  if (!def) throw new Error(`Ronda desconocida: ${key}`);
  return def;
}

/** The round a global match_number belongs to (or null if out of range). */
export function roundForMatch(matchNumber: number): RoundDef | null {
  for (const r of ROUNDS) {
    if (matchNumber > r.base && matchNumber <= r.base + r.count) return r;
  }
  return null;
}

/** First (lowest) official match number in the round. */
export function roundFirst(round: RoundDef): number {
  return round.base + 1;
}

/** Last (highest) official match number in the round. */
export function roundLast(round: RoundDef): number {
  return round.base + round.count;
}
