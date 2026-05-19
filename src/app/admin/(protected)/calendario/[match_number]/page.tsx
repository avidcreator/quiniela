import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMatchAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  const num = Number(match_number);
  if (!Number.isInteger(num)) notFound();

  const supabase = createServiceClient();
  const { data: match } = await supabase
    .from("matches")
    .select("match_number, kickoff_at, team_a, team_b")
    .eq("match_number", num)
    .maybeSingle();

  if (!match) notFound();

  const kickoffLocal = toLocalInputValue(match.kickoff_at);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/calendario"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al calendario
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
        Editar partido #{match.match_number}
      </h1>

      <form action={updateMatchAction} className="mt-6 space-y-5 rounded-2xl border bg-card p-6">
        <input type="hidden" name="match_number" value={match.match_number} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team_a">Equipo A</Label>
            <Input id="team_a" name="team_a" defaultValue={match.team_a} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_b">Equipo B</Label>
            <Input id="team_b" name="team_b" defaultValue={match.team_b} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kickoff_at">Inicio</Label>
          <Input
            id="kickoff_at"
            name="kickoff_at"
            type="datetime-local"
            defaultValue={kickoffLocal}
            required
          />
          <p className="text-xs text-muted-foreground">
            Se guarda en UTC. Se muestra a cada quien en su zona horaria.
          </p>
        </div>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
