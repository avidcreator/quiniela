/**
 * Derive a WC 2026 group letter from a match_number, assuming the schedule
 * was uploaded grouping the 6 matches of each group into consecutive numbers
 * (matches 1–6 → Group A, 7–12 → B, ..., 67–72 → L).
 */
export function groupLetter(matchNumber: number): string | null {
  if (!Number.isInteger(matchNumber) || matchNumber < 1 || matchNumber > 72) {
    return null;
  }
  return String.fromCharCode(65 + Math.floor((matchNumber - 1) / 6));
}
