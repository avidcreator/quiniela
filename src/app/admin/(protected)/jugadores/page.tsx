import { TABLES } from "@/lib/supabase/tables";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { removePlayerAction } from "./actions";
import { RemovePlayerButton } from "./remove-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jugadores · Admin" };

export default async function PlayersPage() {
  const supabase = createServiceClient();
  const { data: players } = await supabase
    .from(TABLES.players)
    .select("id, name, avatar_url, created_at")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Jugadores
          </h1>
          <p className="mt-1 text-muted-foreground">
            Agrega, edita o quita jugadores en cualquier momento del torneo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/jugadores/nuevo">+ Nuevo jugador</Link>
        </Button>
      </header>

      {players && players.length > 0 ? (
        <ul className="divide-y rounded-2xl border bg-card">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={p.name} imageUrl={p.avatar_url} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Agregado el{" "}
                    {new Intl.DateTimeFormat("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(p.created_at))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/jugadores/${p.id}`}>Editar</Link>
                </Button>
                <form action={removePlayerAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <RemovePlayerButton name={p.name} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
          Aún no hay jugadores. Agrega el primero.
        </p>
      )}
    </div>
  );
}
