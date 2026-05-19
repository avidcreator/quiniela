import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { ScheduleUploadForm } from "./upload-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendario · Admin" };

export default async function CalendarioPage() {
  const supabase = createServiceClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("match_number, kickoff_at, team_a, team_b")
    .order("match_number", { ascending: true });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Calendario
        </h1>
        <p className="mt-1 text-muted-foreground">
          Sube las 72 jornadas en CSV. Después puedes editar partidos
          individuales si la FIFA reprograma.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Subir CSV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Columnas:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            match_number, date, team_a, team_b
          </code>
          . La fecha debe ser ISO 8601 con zona horaria (ej.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            2026-06-11T18:00:00-06:00
          </code>
          ).
        </p>
        <ScheduleUploadForm />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Partidos cargados ({matches?.length ?? 0}/72)
          </h2>
        </div>
        {matches && matches.length > 0 ? (
          <ul className="mt-4 divide-y rounded-2xl border bg-card">
            {matches.map((m) => (
              <li
                key={m.match_number}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {m.match_number}
                  </span>
                  <div>
                    <div className="font-medium">
                      {m.team_a} <span className="text-muted-foreground">vs</span>{" "}
                      {m.team_b}
                    </div>
                    <KickoffDate iso={m.kickoff_at} />
                  </div>
                </div>
                <Link
                  href={`/admin/calendario/${m.match_number}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            Aún no hay partidos. Sube el CSV para empezar.
          </p>
        )}
      </section>
    </div>
  );
}

function KickoffDate({ iso }: { iso: string }) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div className="text-xs text-muted-foreground">{formatter.format(new Date(iso))}</div>
  );
}
