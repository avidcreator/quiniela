import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot, isCompleted, type Match } from "@/lib/data";
import { computeMatchPredictions } from "@/lib/stats";
import { TeamFlag } from "@/components/team-flag";
import {
  MatchPager,
  MatchPanelView,
  type MatchView,
} from "@/components/match-pager";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  return { title: `Partido #${match_number} · FIFA World Cup 2026` };
}

export default async function PartidoPage({
  params,
}: {
  params: Promise<{ match_number: string }>;
}) {
  const { match_number } = await params;
  const num = Number(match_number);
  if (!Number.isInteger(num)) notFound();

  const snap = await loadSnapshot();
  const sorted = [...snap.matches].sort(
    (a, b) => a.match_number - b.match_number,
  );
  const startIndex = sorted.findIndex((m) => m.match_number === num);
  if (startIndex < 0) notFound();

  // Preload every match's prediction view so paging is instant.
  const views: MatchView[] = sorted.map((m) => {
    const preds = computeMatchPredictions(snap, m.match_number);
    return {
      match_number: m.match_number,
      team_a: m.team_a,
      team_b: m.team_b,
      group: m.group,
      kickoff_at: m.kickoff_at,
      completed: isCompleted(m),
      actual_a: m.actual_a,
      actual_b: m.actual_b,
      rootA: preds.filter((p) => p.pred_a > p.pred_b),
      rootDraw: preds.filter((p) => p.pred_a === p.pred_b),
      rootB: preds.filter((p) => p.pred_b > p.pred_a),
    };
  });

  const prevMatch = startIndex > 0 ? sorted[startIndex - 1] : null;
  const nextMatch =
    startIndex < sorted.length - 1 ? sorted[startIndex + 1] : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Navigator */}
      <div className="flex items-center justify-between gap-3">
        <div className="hidden sm:block">
          {prevMatch ? (
            <MatchNavButton match={prevMatch} dir="prev" />
          ) : (
            <span className="block w-20" />
          )}
        </div>
        <Link
          href="/partidos"
          className="font-heading text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
        >
          Todos
        </Link>
        <div className="hidden sm:block">
          {nextMatch ? (
            <MatchNavButton match={nextMatch} dir="next" />
          ) : (
            <span className="block w-20" />
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
        Desliza para cambiar de partido
      </p>

      {/* Mobile: native paged scroll */}
      <div className="mt-4 sm:hidden">
        <MatchPager views={views} startIndex={startIndex} />
      </div>

      {/* Desktop: current match only */}
      <div className="mt-4 hidden sm:block">
        <MatchPanelView view={views[startIndex]} />
      </div>
    </div>
  );
}

function MatchNavButton({
  match,
  dir,
}: {
  match: Match;
  dir: "prev" | "next";
}) {
  return (
    <Link
      href={`/partido/${match.match_number}`}
      title={`${match.team_a} vs ${match.team_b}`}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1.5 transition hover:border-foreground/40 hover:shadow-sm"
    >
      {dir === "prev" ? (
        <span className="font-heading text-base font-black leading-none">
          ‹
        </span>
      ) : null}
      <span className="flex items-center gap-1">
        <TeamFlag team={match.team_a} size="xs" />
        <TeamFlag team={match.team_b} size="xs" />
      </span>
      <span className="font-heading text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        {String(match.match_number).padStart(2, "0")}
      </span>
      {dir === "next" ? (
        <span className="font-heading text-base font-black leading-none">
          ›
        </span>
      ) : null}
    </Link>
  );
}
