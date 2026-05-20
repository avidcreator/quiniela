import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 font-heading text-base font-black uppercase tracking-tight"
        >
          <span className="inline-flex h-10 w-7 items-center justify-center overflow-hidden rounded-sm bg-white p-0.5 ring-1 ring-border">
            <Image
              src="/wc26-logo.png"
              alt="FIFA World Cup 2026"
              width={28}
              height={40}
              priority
              className="h-full w-auto object-contain"
            />
          </span>
          <span className="hidden sm:inline">FIFA World Cup 2026</span>
          <span className="sm:hidden">WC 2026</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
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
