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

  // Acierto del día: everyone tied on most aciertos (then most points).
  const aciertoCandidates = dayTally.filter((t) => t.strikes > 0);
  const aciertoBest = aciertoCandidates.reduce<(typeof aciertoCandidates)[number] | null>(
    (best, t) =>
      !best ||
      t.strikes > best.strikes ||
      (t.strikes === best.strikes && t.points > best.points)
        ? t
        : best,
    null,
  );
  const aciertoDelDia = aciertoBest
    ? aciertoCandidates.filter(
        (t) => t.strikes === aciertoBest.strikes && t.points === aciertoBest.points,
      )
    : [];

  const vacios = dayTally.filter((t) => t.zerosOnly && t.points === 0);

  // Día dominante: a small group scored far above the field (at least double
  // the day's average, and a clear minority of players).
  const dayTotal = dayTally.reduce((s, t) => s + t.points, 0);
  const fieldAvg = snap.players.length ? dayTotal / snap.players.length : 0;
  const dayMax = dayTally.reduce((m, t) => Math.max(m, t.points), 0);
  const dayTopGroup = dayTally.filter((t) => t.points === dayMax);
  const dominantDay =
    dayMax >= 4 &&
    dayMax >= 2 * fieldAvg &&
    dayTopGroup.length <= Math.max(1, Math.floor(snap.players.length / 3))
      ? dayTopGroup
      : [];

  // Mayor escalada / caída: everyone tied on the largest move.
  const rises = snap.players
    .map((p) => ({
      player: p,
      delta:
        (beforeRanks.get(p.id) ?? after.length) -
        (afterRanks.get(p.id) ?? after.length),
    }))
    .filter((x) => x.delta > 0);
  const maxRise = rises.reduce((m, x) => Math.max(m, x.delta), 0);
  const biggestRise = rises.filter((x) => x.delta === maxRise);

  const falls = snap.players
    .map((p) => ({
      player: p,
      delta:
        (afterRanks.get(p.id) ?? after.length) -
        (beforeRanks.get(p.id) ?? after.length),
    }))
    .filter((x) => x.delta > 0);
  const maxFall = falls.reduce((m, x) => Math.max(m, x.delta), 0);
  const biggestFall = falls.filter((x) => x.delta === maxFall);

  // New leader(s): when the top changed, show everyone now tied at #1.
  const leaderChanged =
    !!after[0] && !!before[0] && after[0].player_id !== before[0].player_id;
  const newLeaders = leaderChanged ? after.filter((e) => e.rank === 1) : [];

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

      {dominantDay.length > 0 ? (
        <section className="mt-8 rounded-md border-2 border-primary bg-primary/5 p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            {dominantDay.length > 1 ? "Se lucieron" : "Se lució"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {dominantDay.length > 1 ? "Aplastaron al resto" : "Aplastó al resto"}{" "}
            con {dayMax} puntos — más del doble del promedio del día.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {dominantDay.map((t) => (
              <li
                key={t.player.id}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-2.5 py-1 text-sm font-bold"
              >
                <Avatar name={t.player.name} imageUrl={t.player.avatar_url} size="xs" />
                <span>{t.player.name}</span>
                <span className="font-heading text-xs font-black tabular-nums text-primary">
                  {t.points}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Highlights only render when at least one is a single clear standout. */}
      {newLeaders.length === 1 ||
      aciertoDelDia.length === 1 ||
      biggestRise.length === 1 ||
      biggestFall.length === 1 ? (
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* Each highlight shows only when there's a single clear standout —
            a tie among several players isn't noteworthy, so it's hidden. */}
        {newLeaders.length === 1 ? (
          <Headline
            eyebrow="Nuevo líder"
            title={newLeaders[0].name}
            body={`Tomó el #1 con ${newLeaders[0].points} puntos.`}
            avatar={newLeaders[0].name}
            avatarUrl={newLeaders[0].avatar_url}
            crimson
          />
        ) : null}
        {aciertoDelDia.length === 1 ? (
          <Headline
            eyebrow="Acierto del día"
            title={aciertoDelDia[0].player.name}
            body={`${aciertoDelDia[0].strikes} acierto${aciertoDelDia[0].strikes === 1 ? "" : "s"} hoy. ${aciertoDelDia[0].points} puntos en el día.`}
            avatar={aciertoDelDia[0].player.name}
            avatarUrl={aciertoDelDia[0].player.avatar_url}
            crimson={newLeaders.length !== 1}
          />
        ) : null}
        {biggestRise.length === 1 ? (
          <Headline
            eyebrow="Mayor escalada"
            title={biggestRise[0].player.name}
            body={`Subió ${maxRise} lugar${maxRise === 1 ? "" : "es"} en la tabla.`}
            avatar={biggestRise[0].player.name}
            avatarUrl={biggestRise[0].player.avatar_url}
          />
        ) : null}
        {biggestFall.length === 1 ? (
          <Headline
            eyebrow="Mayor caída"
            title={biggestFall[0].player.name}
            body={`Bajó ${maxFall} lugar${maxFall === 1 ? "" : "es"}.`}
            avatar={biggestFall[0].player.name}
            avatarUrl={biggestFall[0].player.avatar_url}
          />
        ) : null}
        </section>
      ) : null}

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
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            · en tu hora local
          </span>
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
