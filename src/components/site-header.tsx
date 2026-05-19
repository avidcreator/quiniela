import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
            ⚽
          </span>
          <span>
            Quiniela <span className="text-primary">26</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/tabla"
            className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Tabla
          </Link>
          <Link
            href="/partidos"
            className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Partidos
          </Link>
          <Link
            href="/jugadores"
            className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Jugadores
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
