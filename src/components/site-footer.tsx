import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-background/60">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <span>FIFA World Cup 2026 · Quiniela</span>
        <Link
          href="/admin/login"
          className="text-muted-foreground transition hover:text-foreground"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
