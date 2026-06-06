import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"
          >
            Admin
          </Link>
          <Link
            href="/admin/calendario"
            className="rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Calendario
          </Link>
          <Link
            href="/admin/jugadores"
            className="rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Jugadores
          </Link>
          <Link
            href="/admin/resultados"
            className="rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Resultados
          </Link>
          <Link
            href="/admin/en-vivo"
            className="rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            En vivo
          </Link>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Salir
          </Button>
        </form>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
