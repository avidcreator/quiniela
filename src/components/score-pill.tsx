export function ScorePill({
  a,
  b,
  highlight,
}: {
  a: number;
  b: number;
  highlight?: "primary" | "accent" | "muted";
}) {
  const styles =
    highlight === "primary"
      ? "bg-primary text-primary-foreground"
      : highlight === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-foreground";
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center gap-1 rounded-full px-3 py-1 font-mono text-sm font-semibold tabular-nums ${styles}`}
    >
      <span>{a}</span>
      <span className="opacity-50">–</span>
      <span>{b}</span>
    </span>
  );
}

export function PointsBadge({ points }: { points: 0 | 1 | 3 | null }) {
  if (points === null) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Pendiente
      </span>
    );
  }
  if (points === 3) {
    return (
      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
        Acierto · 3
      </span>
    );
  }
  if (points === 1) {
    return (
      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
        1 pt
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      0 pts
    </span>
  );
}
