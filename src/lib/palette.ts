export const PLAYER_PALETTE = [
  "var(--player-1)",
  "var(--player-2)",
  "var(--player-3)",
  "var(--player-4)",
  "var(--player-5)",
  "var(--player-6)",
  "var(--player-7)",
  "var(--player-8)",
  "var(--player-9)",
  "var(--player-10)",
  "var(--player-11)",
  "var(--player-12)",
  "var(--player-13)",
  "var(--player-14)",
  "var(--player-15)",
  "var(--player-16)",
  "var(--player-17)",
  "var(--player-18)",
  "var(--player-19)",
  "var(--player-20)",
] as const;

export function playerColor(index: number): string {
  return PLAYER_PALETTE[index % PLAYER_PALETTE.length];
}
