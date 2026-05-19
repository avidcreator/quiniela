export function RankDelta({
  current,
  prev,
}: {
  current: number;
  prev: number | null;
}) {
  if (prev === null) return null;
  const delta = prev - current;

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
        ▲ {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive tabular-nums">
        ▼ {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      =
    </span>
  );
}

export function RecentStrikes({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent/40 px-2 py-0.5 text-[10px] font-bold text-accent-foreground"
      title={`${count} cantada${count === 1 ? "" : "s"} reciente${count === 1 ? "" : "s"}`}
    >
      🎯 ×{count}
    </span>
  );
}
