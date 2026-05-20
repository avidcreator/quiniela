export const PLAYER_PALETTE = [
  "#FF3B1F", // crimson (#1)
  "#0A0A0A", // ink
  "#1D4ED8", // blue
  "#16A34A", // green
  "#9333EA", // purple
  "#EAB308", // amber
  "#0891B2", // teal
  "#BE185D", // magenta
  "#EA580C", // orange
  "#475569", // slate
  "#7C3AED", // violet
  "#059669", // emerald
] as const;

export function playerColor(index: number): string {
  return PLAYER_PALETTE[index % PLAYER_PALETTE.length];
}
