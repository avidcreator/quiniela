export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 py-14 sm:px-12 sm:py-20">
        <div className="absolute -top-12 -right-12 size-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            Mundial 2026
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-6xl">
            La quiniela <span className="text-primary">familiar</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            72 partidos. Una predicción por cabeza. Puntos, rachas y mucho
            argüende. Bienvenidos.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Marcador exacto
          </div>
          <div className="mt-2 font-heading text-3xl font-bold text-primary">
            3 pts
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Le atinaste al marcador. Una cantada.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Resultado correcto
          </div>
          <div className="mt-2 font-heading text-3xl font-bold">1 pt</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ganador correcto o empate, pero el marcador no.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Falla
          </div>
          <div className="mt-2 font-heading text-3xl font-bold text-muted-foreground">
            0 pts
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            La libraste. Pa&apos; la próxima.
          </p>
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        El torneo aún no empieza. Pronto verás partidos, tabla y los pronósticos
        de cada jugador.
      </p>
    </div>
  );
}
