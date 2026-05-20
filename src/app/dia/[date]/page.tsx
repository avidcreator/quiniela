import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted, type Match } from "@/lib/data";
import {
  commentatorLine,
  computeLeaderboard,
  computeMatchPredictions,
  leaderboardFromMatches,
} from "@/lib/stats";
import { matchDateKey } from "@/lib/ticker";
import { Avatar } from "@/components/avatar";
import { RecentResultCard } from "@/components/match-card";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return { title: `${date} · Resumen del día · FIFA World Cup 2026` };
}

export default async function DiaPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const snap = await loadSnapshot();

  const dayMatches = snap.matches.filter(
    (m) => isCompleted(m) && matchDateKey(m.kickoff_at) === date,
  );

  const completedAsc = snap.matches
    .filter(isCompleted)
    .sort(
      (a, b) =>
        new Date(a.completed_at ?? a.kickoff_at).getTime() -
        new Date(b.completed_at ?? b.kickoff_at).getTime(),
    );
  const beforeDay = completedAsc.filter(
    (m) => matchDateKey(m.kickoff_at) !== date,
  );
  const through = completedAsc.filter((m) => {
    const k = matchDateKey(m.kickoff_at);
    return k <= date;
  });

  const before = leaderboardFromMatches(
    snap,
    snap.matches.filter((m) => {
      if (!isCompleted(m)) return false;
      return beforeDay.some((b) => b.match_number === m.match_number);
    }),
  );
  const after = leaderboardFromMatches(
    snap,
    snap.matches.filter((m) => {
      if (!isCompleted(m)) return false;
      return through.some((b) => b.match_number === m.match_number);
    }),
  );

  const allTime = computeLeaderboard(snap);
  const beforeRanks = new Map(before.map((e) => [e.player_id, e.rank]));
  const afterRanks = new Map(after.map((e) => [e.player_id, e.rank]));

  const formatted = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date(`${date}T12:00:00`));

  if (dayMatches.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Resumen del día
        </div>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight sm:text-4xl">
          {formatted}
        </h1>
        <p className="mt-3 text-muted-foreground">
          No hubo partidos terminados este día.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-bold text-primary hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  // Day-level player tally for acierto/vacío
  const dayTally = snap.players.map((p) => {
    let points = 0;
    let strikes = 0;
    let zerosOnly = true;
    for (const m of dayMatches) {
      const pred = snap.predictions.find(
        (x) => x.player_id === p.id && x.match_number === m.match_number,
      );
      if (!pred) continue;
      const got =
        pred.pred_a === m.actual_a && pred.pred_b === m.actual_b
          ? 3
          : Math.sign(pred.pred_a - pred.pred_b) ===
              Math.sign((m.actual_a as number) - (m.actual_b as number))
            ? 1
            : 0;
      points += got;
      if (got === 3) strikes += 1;
      if (got !== 0) zerosOnly = false;
    }
    return { player: p, points, strikes, zerosOnly };
  });

  const aciertoDelDia = [...dayTally]
    .filter((t) => t.strikes > 0)
    .sort((a, b) => b.strikes - a.strikes || b.points - a.points)[0];

  const vacios = dayTally.filter((t) => t.zerosOnly && t.points === 0);

  const biggestRise = snap.players
    .map((p) => {
      const b = beforeRanks.get(p.id) ?? after.length;
      const a = afterRanks.get(p.id) ?? after.length;
      return { player: p, delta: b - a };
    })
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)[0];

  const biggestFall = snap.players
    .map((p) => {
      const b = beforeRanks.get(p.id) ?? after.length;
      const a = afterRanks.get(p.id) ?? after.length;
      return { player: p, delta: a - b };
    })
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)[0];

  const newLeader =
    after[0] && before[0] && after[0].player_id !== before[0].player_id
      ? after[0]
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Inicio
      </Link>

      <header className="mt-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Resumen del día
        </div>
        <h1 className="mt-1 font-heading text-3xl font-black uppercase tracking-tight sm:text-5xl">
          {formatted}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dayMatches.length} partido{dayMatches.length === 1 ? "" : "s"} ·{" "}
          {dayTally.reduce((s, t) => s + t.points, 0)} puntos repartidos
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {newLeader ? (
          <Headline
            eyebrow="Nuevo líder"
            title={newLeader.name}
            body={`Tomó el #1 con ${newLeader.points} puntos.`}
            avatar={newLeader.name}
            avatarUrl={newLeader.avatar_url}
            crimson
          />
        ) : null}
        {aciertoDelDia ? (
          <Headline
            eyebrow="Acierto del día"
            title={aciertoDelDia.player.name}
            body={`${aciertoDelDia.strikes} acierto${aciertoDelDia.strikes === 1 ? "" : "s"} hoy. ${aciertoDelDia.points} puntos en el día.`}
            avatar={aciertoDelDia.player.name}
            avatarUrl={aciertoDelDia.player.avatar_url}
            crimson={!newLeader}
          />
        ) : null}
        {biggestRise ? (
          <Headline
            eyebrow="Mayor escalada"
            title={biggestRise.player.name}
            body={`Subió ${biggestRise.delta} lugar${biggestRise.delta === 1 ? "" : "es"} en la tabla.`}
            avatar={biggestRise.player.name}
            avatarUrl={biggestRise.player.avatar_url}
          />
        ) : null}
        {biggestFall ? (
          <Headline
            eyebrow="Mayor caída"
            title={biggestFall.player.name}
            body={`Bajó ${biggestFall.delta} lugar${biggestFall.delta === 1 ? "" : "es"}.`}
            avatar={biggestFall.player.name}
            avatarUrl={biggestFall.player.avatar_url}
          />
        ) : null}
      </section>

      {vacios.length > 0 ? (
        <section className="mt-8 rounded-md border border-dashed bg-muted/30 p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Vacío del día
          </div>
          <p className="mt-2 text-sm">
            Cero puntos en todos los partidos del día:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {vacios.map((v) => (
              <li
                key={v.player.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-1 text-xs font-medium"
              >
                <Avatar name={v.player.name} imageUrl={v.player.avatar_url} size="xs" dim />
                <span>{v.player.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Partidos del día
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {dayMatches.map((m) => (
            <RecentResultCard
              key={m.match_number}
              match={m}
              predictions={computeMatchPredictions(snap, m.match_number)}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Tabla al cierre del día
        </div>
        <ul className="mt-4 divide-y rounded-md border bg-card">
          {after.map((e) => {
            const before = beforeRanks.get(e.player_id);
            const delta = before === undefined ? null : before - e.rank;
            return (
              <li
                key={e.player_id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 text-center font-heading text-sm font-black tabular-nums">
                    {e.rank}
                  </span>
                  <Avatar name={e.name} imageUrl={e.avatar_url} size="sm" />
                  <Link
                    href={`/jugador/${e.player_id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {e.name}
                  </Link>
                  {delta !== null && delta !== 0 ? (
                    <span
                      className={`text-[10px] font-bold tabular-nums ${
                        delta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}
                    </span>
                  ) : null}
                </div>
                <span className="font-heading text-lg font-black tabular-nums">
                  {e.points}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Posición global actual: #{allTime[0]?.rank ?? "—"} es {allTime[0]?.name ?? "—"}.
        </p>
      </section>
    </div>
  );
}

function Headline({
  eyebrow,
  title,
  body,
  avatar,
  avatarUrl,
  crimson,
}: {
  eyebrow: string;
  title: string;
  body: string;
  avatar: string;
  avatarUrl?: string | null;
  crimson?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border-2 p-5 ${
        crimson
          ? "border-primary bg-primary/5"
          : "border-foreground bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={avatar} imageUrl={avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div
            className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
              crimson ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {eyebrow}
          </div>
          <div className="mt-0.5 font-heading text-xl font-black truncate">
            {title}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
