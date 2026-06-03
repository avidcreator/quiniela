import Link from "next/link";
import { TeamFlag } from "./team-flag";
import { Avatar } from "./avatar";
import { KickoffDate } from "./kickoff-date";
import type { Match } from "@/lib/data";
import type { PredictionWithPoints } from "@/lib/stats";

export function InauguralMatchCard({
  match,
  predictions,
}: {
  match: Match;
  predictions: PredictionWithPoints[];
}) {
  const group = match.group;
  const teamA = predictions.filter((p) => p.pred_a > p.pred_b);
  const draw = predictions.filter((p) => p.pred_a === p.pred_b);
  const teamB = predictions.filter((p) => p.pred_b > p.pred_a);
  const total = predictions.length;

  const tally = new Map<string, number>();
  for (const p of predictions) {
    const key = `${p.pred_a}-${p.pred_b}`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  let consensus: { a: number; b: number; count: number } | null = null;
  for (const [key, count] of tally) {
    if (!consensus || count > consensus.count) {
      const [a, b] = key.split("-").map(Number);
      consensus = { a, b, count };
    }
  }
  const avgGoals =
    total > 0
      ? predictions.reduce((s, p) => s + p.pred_a + p.pred_b, 0) / total
      : 0;
  const pct = (x: number) => (total > 0 ? Math.round((x / total) * 100) : 0);

  return (
    <Link
      href={`/partido/${match.match_number}`}
      className="group block overflow-hidden rounded-md border-2 border-foreground bg-card transition hover:shadow-lg"
    >
      {/* Prominent date / time header */}
      <div className="bg-foreground px-4 py-3 text-background sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-[10px] font-black uppercase tracking-[0.24em] text-background/60">
            Partido {String(match.match_number).padStart(2, "0")}
            {group ? ` · Grupo ${group}` : ""}
          </span>
          <span className="rounded-sm bg-primary px-1.5 py-0.5 font-heading text-[9px] font-black uppercase tracking-[0.22em] text-primary-foreground">
            Inaugural
          </span>
        </div>
        <KickoffDate
          iso={match.kickoff_at}
          variant="long"
          className="mt-1 block font-heading text-lg font-black uppercase tracking-tight sm:text-2xl"
        />
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:px-6">
        <div className="flex flex-col items-start gap-2">
          <TeamFlag team={match.team_a} size="xl" />
          <span className="font-heading text-base font-black uppercase tracking-wider sm:text-xl">
            {match.team_a}
          </span>
        </div>
        <span className="font-heading text-base font-bold text-muted-foreground">
          VS
        </span>
        <div className="flex flex-col items-end gap-2 text-right">
          <TeamFlag team={match.team_b} size="xl" />
          <span className="font-heading text-base font-black uppercase tracking-wider sm:text-xl">
            {match.team_b}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="border-t px-4 py-5 text-center text-sm text-muted-foreground">
          Aún no hay pronósticos.
        </div>
      ) : (
        <>
          {/* Sentiment bar */}
          <div className="border-t px-4 pt-4 sm:px-6">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {teamA.length > 0 ? (
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${pct(teamA.length)}%` }}
                />
              ) : null}
              {draw.length > 0 ? (
                <div
                  className="h-full bg-muted-foreground/40"
                  style={{ width: `${pct(draw.length)}%` }}
                />
              ) : null}
              {teamB.length > 0 ? (
                <div
                  className="h-full bg-primary"
                  style={{ width: `${pct(teamB.length)}%` }}
                />
              ) : null}
            </div>
          </div>

          {/* Who's backing whom — avatars + names */}
          <div className="space-y-3 px-4 py-4 sm:px-6">
            <RootingBlock
              flag={match.team_a}
              heading={`Gana ${match.team_a}`}
              pct={pct(teamA.length)}
              players={teamA}
            />
            <RootingBlock
              heading="Empate"
              pct={pct(draw.length)}
              players={draw}
            />
            <RootingBlock
              flag={match.team_b}
              heading={`Gana ${match.team_b}`}
              pct={pct(teamB.length)}
              players={teamB}
            />
          </div>

          {/* Stats footer */}
          <div className="grid grid-cols-2 divide-x border-t bg-muted/30 text-center">
            <div className="px-4 py-2.5">
              <div className="font-heading text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Marcador favorito
              </div>
              {consensus ? (
                <div className="mt-0.5 flex items-center justify-center gap-1.5">
                  <span className="font-heading text-base font-black tabular-nums">
                    {consensus.a}–{consensus.b}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    · {consensus.count}
                  </span>
                </div>
              ) : (
                <div className="mt-0.5 text-sm text-muted-foreground">—</div>
              )}
            </div>
            <div className="px-4 py-2.5">
              <div className="font-heading text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Goles promedio
              </div>
              <div className="mt-0.5 font-heading text-base font-black tabular-nums">
                {avgGoals.toFixed(1)}
              </div>
            </div>
          </div>
        </>
      )}
    </Link>
  );
}

function RootingBlock({
  flag,
  heading,
  pct,
  players,
}: {
  flag?: string;
  heading: string;
  pct: number;
  players: PredictionWithPoints[];
}) {
  if (players.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2">
        {flag ? <TeamFlag team={flag} size="xs" /> : null}
        <span className="font-heading text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
          {heading}
        </span>
        <span className="font-heading text-xs font-black tabular-nums">
          {players.length}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          · {pct}%
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {players.map((p) => (
          <span
            key={p.player_id}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background py-0.5 pl-0.5 pr-2"
          >
            <Avatar name={p.name} imageUrl={p.avatar_url} size="xs" />
            <span className="text-xs font-medium">{p.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
