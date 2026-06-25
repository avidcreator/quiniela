import { getActivePhase, getTables } from "@/lib/phase";
import { TOTAL_PHASE_TWO_MATCHES } from "@/lib/rounds";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · FIFA World Cup 2026" };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const phase = await getActivePhase();
  const supabase = createServiceClient();
  const TABLES = await getTables();
  const totalTarget = phase === "phase_two" ? TOTAL_PHASE_TWO_MATCHES : 72;

  const [matchesRes, playersRes] = await Promise.all([
    supabase
      .from(TABLES.matches)
      .select("match_number, actual_a", { count: "exact", head: false }),
    supabase.from(TABLES.players).select("id", { count: "exact", head: true }),
  ]);

  const totalMatches = matchesRes.data?.length ?? 0;
  const completed =
    matchesRes.data?.filter((m) => m.actual_a !== null).length ?? 0;
  const playerCount = playersRes.count ?? 0;

  const cards: Array<{
    href: string;
    title: string;
    desc: string;
    accent: string;
  }> = [
    {
      href: "/admin/calendario",
      title: "Calendario",
      desc: `${totalMatches}/${totalTarget} partidos cargados`,
      accent: "from-primary/15",
    },
    {
      href: "/admin/jugadores",
      title: "Jugadores",
      desc: `${playerCount} ${playerCount === 1 ? "jugador" : "jugadores"} en la quiniela`,
      accent: "from-accent/30",
    },
    {
      href: "/admin/resultados",
      title: "Resultados",
      desc: `${completed} marcador${completed === 1 ? "" : "es"} ingresado${completed === 1 ? "" : "s"}`,
      accent: "from-chart-3/20",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Hola, admin.
      </h1>
      <p className="mt-1 text-muted-foreground">
        Desde aquí manejas el calendario, los jugadores y los marcadores.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.accent} via-card to-card p-6 transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="font-heading text-xl font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            <span className="mt-4 inline-block text-sm font-medium text-primary transition group-hover:translate-x-0.5">
              Abrir →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
