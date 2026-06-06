import { createServiceClient } from "@/lib/supabase/server";
import { apiConfigured } from "@/lib/live/api-football";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { autoMapAction, pollNowAction, setFixtureAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "En vivo · Admin" };

export default async function EnVivoPage() {
  const configured = apiConfigured();
  const supabase = createServiceClient();
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "match_number, team_a, team_b, group, api_fixture_id, api_home_is_a, live_status, live_home, live_away, live_elapsed",
    )
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

      {/* Mapping table */}
      <section>
        <h2 className="font-heading text-lg font-semibold">Vinculación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El ID de fixture de API-Football por partido. Marca la casilla si el
          equipo <strong>local</strong> de la API es tu Equipo A (izquierda).
        </p>
        <ul className="mt-4 space-y-2">
          {all.map((m) => (
            <li
              key={m.match_number}
              className="rounded-xl border bg-card p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-heading text-xs font-black tabular-nums text-muted-foreground">
                    {String(m.match_number).padStart(2, "0")}
                  </span>{" "}
                  <span className="font-medium">
                    {m.team_a} <span className="text-muted-foreground">vs</span>{" "}
                    {m.team_b}
                  </span>
                  {m.live_status ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {m.live_status} {m.live_home}-{m.live_away}{" "}
                      {m.live_elapsed != null ? `${m.live_elapsed}'` : ""}
                    </span>
                  ) : null}
                </div>
                <form
                  action={setFixtureAction}
                  className="flex items-center gap-2"
                >
                  <input
                    type="hidden"
                    name="match_number"
                    value={m.match_number}
                  />
                  <Input
                    name="fixture_id"
                    defaultValue={m.api_fixture_id ?? ""}
                    placeholder="fixture id"
                    className="h-8 w-28 text-xs"
                  />
                  <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <input
                      type="checkbox"
                      name="home_is_a"
                      defaultChecked={m.api_home_is_a !== false}
                      className="size-3.5 accent-foreground"
                    />
                    Local = A
                  </label>
                  <Button type="submit" size="sm" variant="ghost">
                    Guardar
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
