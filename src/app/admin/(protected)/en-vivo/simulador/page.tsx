import Link from "next/link";
import { LiveMatchCard } from "@/components/live/live-match-card";
import type { Match, MatchEvent } from "@/lib/data";
import type { ForecastEntry } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";
export const metadata = { title: "Simulador en vivo · Admin" };

// The phases a knockout match moves through, in order. Each value is the live
// status the card understands.
const PHASES = ["2H", "FT", "ET", "AET", "P", "PEN"] as const;
type Phase = (typeof PHASES)[number];

const STATE_LABEL: Record<Phase, string> = {
  "2H": "En juego · tiempo reglamentario",
  FT: "Final · decidido en los 90'",
  ET: "En juego · tiempo extra",
  AET: "Final · tras tiempo extra",
  P: "En juego · penales",
  PEN: "Final · tras penales",
};

// Buttons offered from each phase (label + the phase they move to).
function transitions(phase: Phase): { label: string; to: Phase; outline?: boolean }[] {
  switch (phase) {
    case "2H":
      return [
        { label: "Ir a tiempo extra →", to: "ET" },
        { label: "Finalizar (90')", to: "FT", outline: true },
      ];
    case "FT":
      return [
        { label: "Reanudar", to: "2H", outline: true },
        { label: "Ir a tiempo extra →", to: "ET" },
      ];
    case "ET":
      return [
        { label: "Ir a penales →", to: "P" },
        { label: "Finalizar en tiempo extra", to: "AET", outline: true },
        { label: "← Quitar tiempo extra", to: "2H", outline: true },
      ];
    case "AET":
      return [
        { label: "Reanudar", to: "ET", outline: true },
        { label: "Ir a penales →", to: "P" },
      ];
    case "P":
      return [
        { label: "Finalizar penales", to: "PEN", outline: true },
        { label: "← Quitar penales", to: "ET", outline: true },
      ];
    case "PEN":
      return [{ label: "Reanudar", to: "P", outline: true }];
  }
}

function num(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

// A penalty sequence: only G (gol) and F (fallo), max 10 kicks.
function cleanSeq(v: string | undefined, def: string): string {
  return (v ?? def).toUpperCase().replace(/[^GF]/g, "").slice(0, 10) || def;
}

type SP = Record<string, string | undefined>;

export default async function SimuladorPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const phase: Phase = (PHASES as readonly string[]).includes(sp.phase ?? "")
    ? (sp.phase as Phase)
    : "2H";
  const hasET = phase === "ET" || phase === "AET" || phase === "P" || phase === "PEN";
  const hasPens = phase === "P" || phase === "PEN";
  const isFinal = phase === "FT" || phase === "AET" || phase === "PEN";

  const teamA = (sp.teamA ?? "Argentina").trim() || "Argentina";
  const teamB = (sp.teamB ?? "México").trim() || "México";
  const regA = num(sp.regA, 1);
  const regB = num(sp.regB, 1);
  const etA = num(sp.etA, 1);
  const etB = num(sp.etB, 0);
  // Penalty shootouts are a sequence of kicks: G = gol (anotado), F = fallo.
  const penAseq = cleanSeq(sp.penAseq, "GGGG");
  const penBseq = cleanSeq(sp.penBseq, "GGFG");

  const totalA = regA + (hasET ? etA : 0);
  const totalB = regB + (hasET ? etB : 0);
  const elapsed = phase === "2H" ? 78 : phase === "ET" ? 105 : 120;

  // Synthesize the event feed: regulation goals (<=90'), extra-time goals
  // (>90'), and penalty kicks for the shootout phases.
  const events: MatchEvent[] = [];
  let n = 0;
  const goal = (side: "a" | "b", min: number) =>
    events.push({
      id: `g${n++}`,
      match_number: 0,
      sort_index: min * 1000,
      elapsed: min,
      elapsed_extra: null,
      type: "Goal",
      detail: "Normal Goal",
      side,
      player: `Jugador ${n}`,
      assist: null,
      comments: null,
    });
  for (let i = 0; i < regA; i++) goal("a", Math.min(90, 18 + i * 17));
  for (let i = 0; i < regB; i++) goal("b", Math.min(90, 27 + i * 17));
  if (hasET) {
    for (let i = 0; i < etA; i++) goal("a", 95 + i * 8);
    for (let i = 0; i < etB; i++) goal("b", 99 + i * 8);
  }
  if (hasPens) {
    const kick = (side: "a" | "b", i: number, scored: boolean) =>
      events.push({
        id: `pk${side}${i}`,
        match_number: 0,
        sort_index: 120000 + i,
        elapsed: 120,
        elapsed_extra: null,
        type: "Goal",
        // The card marks a kick red when its detail says missed/saved.
        detail: scored ? "Penalty" : "Missed Penalty",
        side,
        player: `Tirador ${i + 1}`,
        assist: null,
        comments: "Penalty Shootout",
      });
    [...penAseq].forEach((c, i) => kick("a", i, c === "G"));
    [...penBseq].forEach((c, i) => kick("b", i, c === "G"));
  }

  const match: Match = {
    match_number: 0,
    kickoff_at: new Date().toISOString(),
    team_a: teamA,
    team_b: teamB,
    group: null,
    round: "R16",
    actual_a: null,
    actual_b: null,
    completed_at: null,
    api_fixture_id: null,
    api_home_is_a: true,
    live_status: phase,
    live_elapsed: elapsed,
    live_elapsed_extra: null,
    live_home: totalA,
    live_away: totalB,
    live_updated_at: new Date().toISOString(),
  };

  const forecast: ForecastEntry[] = [
    { player_id: "1", name: "Beto", avatar_url: null, points: 12, delta: 3, rank: 1 },
    { player_id: "2", name: "Caro", avatar_url: null, points: 10, delta: 1, rank: 2 },
    { player_id: "3", name: "Memo", avatar_url: null, points: 9, delta: 0, rank: 3 },
    { player_id: "4", name: "Lupe", avatar_url: null, points: 7, delta: 1, rank: 4 },
  ];

  const ScorePair = ({
    legend,
    nameA,
    nameB,
    valA,
    valB,
  }: {
    legend: string;
    nameA: string;
    nameB: string;
    valA: number;
    valB: number;
  }) => (
    <fieldset className="rounded-xl border bg-background/40 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {legend}
      </legend>
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="max-w-24 truncate text-xs text-muted-foreground">{teamA}</span>
          <Input name={nameA} type="number" min={0} max={20} defaultValue={valA} className="w-16 text-center" />
        </div>
        <span className="pt-5 text-muted-foreground">–</span>
        <div className="flex flex-col items-center gap-1">
          <span className="max-w-24 truncate text-xs text-muted-foreground">{teamB}</span>
          <Input name={nameB} type="number" min={0} max={20} defaultValue={valB} className="w-16 text-center" />
        </div>
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/en-vivo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← En vivo
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">
          Simulador en vivo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Datos ficticios para previsualizar la tarjeta en vivo de fase 2. Solo
          tú (admin) ves esto; no se guarda nada ni aparece en el sitio público.
          El marcador grande es el del tiempo reglamentario (lo que cuenta);
          tiempo extra y penales se muestran como “no cuenta”.
        </p>
      </header>

      {/* Hidden phase preserves the current stage when only editing scores. */}
      <form method="GET" className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="teamA">Equipo A</Label>
            <Input id="teamA" name="teamA" defaultValue={teamA} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="teamB">Equipo B</Label>
            <Input id="teamB" name="teamB" defaultValue={teamB} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScorePair legend="Tiempo reglamentario (90')" nameA="regA" nameB="regB" valA={regA} valB={regB} />
          {hasET ? (
            <ScorePair legend="Goles en tiempo extra" nameA="etA" nameB="etB" valA={etA} valB={etB} />
          ) : null}
        </div>

        {hasPens ? (
          <fieldset className="rounded-xl border bg-background/40 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tanda de penales
            </legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Un carácter por tiro, en orden:{" "}
              <code className="rounded bg-muted px-1 py-0.5">G</code> = gol,{" "}
              <code className="rounded bg-muted px-1 py-0.5">F</code> = fallo (ej.{" "}
              <code className="rounded bg-muted px-1 py-0.5">GGFG</code>).
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs text-muted-foreground">{teamA}</span>
                <Input
                  name="penAseq"
                  defaultValue={penAseq}
                  placeholder="GGFG"
                  className="w-40 font-mono uppercase tracking-[0.3em]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs text-muted-foreground">{teamB}</span>
                <Input
                  name="penBseq"
                  defaultValue={penBseq}
                  placeholder="GGFG"
                  className="w-40 font-mono uppercase tracking-[0.3em]"
                />
              </label>
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <span className="text-sm">
            <span className="text-muted-foreground">Estado: </span>
            <span className="font-medium">{STATE_LABEL[phase]}</span>
          </span>
          <Button type="submit" name="phase" value={phase} size="sm" variant="secondary">
            Actualizar marcador
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {transitions(phase).map((t) => (
            <Button
              key={t.to + t.label}
              type="submit"
              name="phase"
              value={t.to}
              size="sm"
              variant={t.outline ? "outline" : "default"}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </form>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">Vista previa</h2>
        <LiveMatchCard
          match={match}
          scoreA={regA}
          scoreB={regB}
          totalA={totalA}
          totalB={totalB}
          knockout
          events={events}
          forecast={forecast}
        />
      </section>
    </div>
  );
}
