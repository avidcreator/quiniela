import Link from "next/link";
import { getActivePhase } from "@/lib/phase";
import { NewPlayerForm } from "./form";

export const metadata = { title: "Nuevo jugador · Admin" };
export const dynamic = "force-dynamic";

export default async function NewPlayerPage() {
  const phase = await getActivePhase();
  const isTwo = phase === "phase_two";

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/jugadores"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">
        Nuevo jugador
      </h1>
      {isTwo ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Crea al jugador con su nombre y foto. Sus quinielas se suben por ronda
          desde la lista de jugadores, conforme avanza el torneo.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Sube el CSV con sus 72 pronósticos. Columnas:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            match_number, date, team_a, team_b, predicted_team_a, predicted_team_b
          </code>
          . La quiniela queda fija al subirla.
        </p>
      )}
      <NewPlayerForm requireScorecard={!isTwo} />
    </div>
  );
}
