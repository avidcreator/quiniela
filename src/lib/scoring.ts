export type Points = 0 | 1 | 3;

export function pointsFor(
  predA: number,
  predB: number,
  actualA: number,
  actualB: number,
): Points {
  if (predA === actualA && predB === actualB) return 3;
  const predOutcome = Math.sign(predA - predB);
  const actualOutcome = Math.sign(actualA - actualB);
  return predOutcome === actualOutcome ? 1 : 0;
}
