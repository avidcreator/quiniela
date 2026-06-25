import { TABLES } from "@/lib/supabase/tables";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { EditPlayerForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar jugador · Admin" };

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: player } = await supabase
    .from(TABLES.players)
    .select("id, name, avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!player) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/jugadores"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Jugadores
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
        Editar jugador
      </h1>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border bg-card p-4">
        <Avatar name={player.name} imageUrl={player.avatar_url} size="lg" />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Foto actual
          </div>
          <div className="font-heading text-lg font-black">{player.name}</div>
        </div>
      </div>

      <EditPlayerForm
        id={player.id}
        defaultName={player.name}
        hasAvatar={Boolean(player.avatar_url)}
      />
    </div>
  );
}
