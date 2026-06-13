import { redirect } from "next/navigation";
import { loadSnapshot, isLiveVisible, isCompleted } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * The what-if experience now lives on each match's `/partido` page. This route
 * is kept as a redirect (for old links) to the live match, else the next
 * upcoming one, else the full schedule.
 */
export default async function EscenariosRedirect() {
  const snap = await loadSnapshot();
  const now = Date.now();

  const live = snap.matches
    .filter((m) => isLiveVisible(m, now))
    .sort((a, b) => a.match_number - b.match_number)[0];
  const next = snap.matches
    .filter((m) => !isCompleted(m) && new Date(m.kickoff_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    )[0];

  const target = live ?? next;
  redirect(target ? `/partido/${target.match_number}` : "/partidos");
}
