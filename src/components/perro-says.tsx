import type { PerroQuote } from "@/lib/perro";

export function PerroSays({ quotes }: { quotes: PerroQuote[] }) {
  if (quotes.length === 0) return null;

  return (
    <ul className="space-y-3">
      {quotes.map((q, i) => (
        <li key={i}>
          <PerroBubble quote={q} />
        </li>
      ))}
    </ul>
  );
}

function PerroBubble({ quote }: { quote: PerroQuote }) {
  return (
    <article className="relative flex items-start gap-3 overflow-hidden rounded-md border bg-card py-3 pl-4 pr-4 sm:py-3.5">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-primary"
      />

      <span
        aria-hidden
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm"
      >
        🎙️
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold leading-snug sm:text-base">
          <span aria-hidden className="mr-0.5 text-primary">
            “
          </span>
          {quote.text}
          <span aria-hidden className="ml-0.5 text-primary">
            ”
          </span>
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">El Perro Bermúdez</span>
          {quote.context ? (
            <>
              <span className="opacity-40">·</span>
              <span className="font-mono tracking-[0.18em]">
                {quote.context}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
