export function Vibes({
  hot,
  cold,
}: {
  hot: boolean;
  cold: boolean;
}) {
  if (hot) {
    return (
      <span
        title="On fire — 2+ aciertos en sus últimos 4 partidos"
        className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary"
      >
        🔥 ON FIRE
      </span>
    );
  }
  if (cold) {
    return (
      <span
        title="En sequía — 0 puntos en sus últimos 6 partidos"
        className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
      >
        🧊 EN SEQUÍA
      </span>
    );
  }
  return null;
}
