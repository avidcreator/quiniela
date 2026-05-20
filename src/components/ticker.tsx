export function Ticker({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  // duplicate the list so the marquee loops seamlessly
  const stream = [...items, ...items];

  return (
    <div
      className="group relative overflow-hidden border-y bg-foreground text-background"
      aria-label="Resumen en vivo"
    >
      <div className="ticker-track flex w-max items-center gap-12 whitespace-nowrap py-2 will-change-transform">
        {stream.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 font-heading text-[11px] font-bold uppercase tracking-[0.22em]"
          >
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            {text}
          </span>
        ))}
      </div>
      <style>{`
        .ticker-track {
          animation: ticker-scroll 38s linear infinite;
        }
        .group:hover .ticker-track { animation-play-state: paused; }
        @keyframes ticker-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
