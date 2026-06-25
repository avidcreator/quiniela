import { getTables } from "@/lib/phase";
import { createServiceClient } from "@/lib/supabase/server";
import { apiConfigured } from "@/lib/live/api-football";
import { getLiveEnabled } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { autoMapAction, pollNowAction, toggleLiveAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "En vivo · Admin" };

export default async function EnVivoPage() {
  const configured = apiConfigured();
  const liveEnabled = await getLiveEnabled();
  const supabase = createServiceClient();
  const TABLES = await getTables();
  const { data: matches } = await supabase
    .from(TABLES.matches)
    .select("match_number, api_fixture_id, live_status")
    .order("match_number", { ascending: true });

  const all = matches ?? [];
  const mapped = all.filter((m) => m.api_fixture_id != null);
  const live = all.filter(
    (m) =>
      m.live_status &&
      ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(m.live_status),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          En vivo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Conecta el calendario con API-Football para mostrar los partidos en
          vivo con su minuto a minuto.
        </p>
      </header>

      {/* Feature flag */}
      <section className="rounded-2xl border-2 border-foreground bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight">
              Sección “En vivo”
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {liveEnabled
                ? "Visible en la portada. Los partidos en vivo se muestran y el cron actualiza el marcador."
                : "Oculta. No se muestra ningún partido en vivo y el cron deja de consultar la API."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                liveEnabled
                  ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {liveEnabled ? "Activada" : "Desactivada"}
            </span>
            <form action={toggleLiveAction}>
              <input
                type="hidden"
                name="enabled"
                value={liveEnabled ? "false" : "true"}
              />
              <Button
                type="submit"
                size="sm"
                variant={liveEnabled ? "outline" : "default"}
              >
                {liveEnabled ? "Desactivar" : "Activar"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* API status */}
      <section className="rounded-2xl border-2 border-foreground bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight">
              Conexión
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {configured
                ? "API-Football conectada."
                : "Falta la API key. Agrega API_FOOTBALL_KEY en .env / Vercel."}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
              configured
                ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {configured ? "Conectada" : "Sin configurar"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={autoMapAction}>
            <Button type="submit" size="sm" disabled={!configured}>
              Mapear partidos automáticamente
            </Button>
          </form>
          <form action={pollNowAction}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={!configured}
            >
              Actualizar en vivo ahora
            </Button>
          </form>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {mapped.length}/{all.length} partidos vinculados ·{" "}
          {live.length} en vivo ahora
        </div>
      </section>
    </div>
  );
}
