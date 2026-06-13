import { pointsFor, type Points } from "./scoring";

/**
 * Pure "what-if" engine for the Escenarios page. Decoupled from the DB layer
 * (only imports `scoring`) so it can run in the client and recompute instantly
 * as the user dials a scoreline.
 *
 * The `base*` fields are the player's standing from already-completed matches;
 * `pred` is their prediction for the focus match (null if they didn't predict).
 */
export type BasePlayer = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  basePoints: number;
  baseRank: number;
  pred: { a: number; b: number } | null;
};

export type ScenarioRow = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  delta: Points;
  rank: number;
  rankDelta: number; // baseRank - rank  (>0 = moved up, <0 = dropped)
};

export type Outcome = "a" | "draw" | "b";

export type Insight = { tone: "good" | "bad" | "neutral"; text: string };

function deltaFor(p: BasePlayer, a: number, b: number): Points {
  return p.pred ? pointsFor(p.pred.a, p.pred.b, a, b) : 0;
}

/** Whether F finishes ahead of Q (higher points; name tiebreak, es locale). */
function aheadOf(fPts: number, fName: string, qPts: number, qName: string): boolean {
  if (fPts !== qPts) return fPts > qPts;
  return fName.localeCompare(qName, "es") < 0;
}

export function outcomeClass(a: number, b: number): Outcome {
  return a > b ? "a" : a < b ? "b" : "draw";
}

/** Full projected standings if the focus match ends a–b. Co-placed ranks. */
export function projectTable(
  players: BasePlayer[],
  a: number,
  b: number,
): ScenarioRow[] {
  const rows = players.map((p) => {
    const delta = deltaFor(p, a, b);
    return { p, delta, total: p.basePoints + delta };
  });
  rows.sort((x, y) => y.total - x.total || x.p.name.localeCompare(y.p.name, "es"));

  let lastPoints: number | null = null;
  let lastRank = 0;
  return rows.map((r, idx) => {
    if (r.total !== lastPoints) {
      lastRank = idx + 1;
      lastPoints = r.total;
    }
    return {
      player_id: r.p.player_id,
      name: r.p.name,
      avatar_url: r.p.avatar_url,
      points: r.total,
      delta: r.delta,
      rank: lastRank,
      rankDelta: r.p.baseRank - lastRank,
    };
  });
}

/** Candidate final scorelines to reason over: a 0–5 grid ∪ predicted scores. */
export function candidateScorelines(players: BasePlayer[]): Array<[number, number]> {
  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  const add = (a: number, b: number) => {
    const k = `${a}-${b}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push([a, b]);
    }
  };
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) add(a, b);
  for (const p of players) if (p.pred) add(p.pred.a, p.pred.b);
  return out;
}

/** Turn the set of true outcome-classes into a Spanish phrase. */
function classesPhrase(classes: Outcome[], teamA: string, teamB: string): string {
  const set = new Set(classes);
  if (set.size === 1) {
    const k = classes[0];
    return k === "a"
      ? `si gana ${teamA}`
      : k === "b"
        ? `si gana ${teamB}`
        : "con cualquier empate";
  }
  if (set.size === 2) {
    if (!set.has("a")) return `salvo que gane ${teamA}`;
    if (!set.has("b")) return `salvo que gane ${teamB}`;
    return "salvo que haya empate";
  }
  return "pase lo que pase";
}

/**
 * Characterize a predicate over the candidate scorelines as a Spanish phrase.
 * Returns `none` if never true. Prefers outcome-class phrasing; falls back to
 * listing exact scores when the condition is mixed within a class.
 */
function phraseFor(
  candidates: Array<[number, number]>,
  pred: (i: number) => boolean,
  teamA: string,
  teamB: string,
): { none: boolean; all: boolean; text: string } {
  const byClass: Record<Outcome, { t: number; f: number }> = {
    a: { t: 0, f: 0 },
    draw: { t: 0, f: 0 },
    b: { t: 0, f: 0 },
  };
  const trueScores: Array<[number, number]> = [];
  candidates.forEach((c, i) => {
    const cls = outcomeClass(c[0], c[1]);
    if (pred(i)) {
      byClass[cls].t++;
      trueScores.push(c);
    } else {
      byClass[cls].f++;
    }
  });
  const total = candidates.length;
  const trueCount = trueScores.length;
  if (trueCount === 0) return { none: true, all: false, text: "" };
  if (trueCount === total) return { none: false, all: true, text: "pase lo que pase" };

  const uniform = (["a", "draw", "b"] as Outcome[]).every(
    (k) => byClass[k].t === 0 || byClass[k].f === 0,
  );
  if (uniform) {
    const trueClasses = (["a", "draw", "b"] as Outcome[]).filter(
      (k) => byClass[k].t > 0,
    );
    return { none: false, all: false, text: classesPhrase(trueClasses, teamA, teamB) };
  }
  if (trueScores.length <= 4) {
    const list = trueScores.map(([a, b]) => `${a}-${b}`).join(" o ");
    return { none: false, all: false, text: `solo si termina ${list}` };
  }
  return { none: false, all: false, text: "en ciertos resultados" };
}

export function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  if (names.length <= 4)
    return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  return `${names.slice(0, 3).join(", ")} y ${names.length - 3} más`;
}

export type ScoreSummary = {
  basePoints: number;
  newPoints: number;
  delta: Points;
  baseRank: number;
  newRank: number;
  passes: string[]; // players the focus moves ahead of
  overtaken: string[]; // players that move ahead of the focus
};

/**
 * Structured outcome for one player AT the dialed scoreline: their points and
 * rank now vs projected, and exactly who they pass / who passes them. Updates
 * as the score changes.
 */
export function scoreSummary(
  players: BasePlayer[],
  focusId: string,
  a: number,
  b: number,
): ScoreSummary | null {
  const focus = players.find((p) => p.player_id === focusId);
  if (!focus) return null;
  const others = players.filter((p) => p.player_id !== focus.player_id);

  const delta = deltaFor(focus, a, b);
  const ft = focus.basePoints + delta;
  let ahead = 0;
  const passes: string[] = [];
  const overtaken: string[] = [];
  for (const q of others) {
    const qt = q.basePoints + deltaFor(q, a, b);
    const nowAhead = aheadOf(ft, focus.name, qt, q.name); // focus ahead now
    const wasAhead = aheadOf(focus.basePoints, focus.name, q.basePoints, q.name);
    if (!nowAhead) ahead++;
    if (nowAhead && !wasAhead) passes.push(q.name);
    if (!nowAhead && wasAhead) overtaken.push(q.name);
  }

  return {
    basePoints: focus.basePoints,
    newPoints: ft,
    delta,
    baseRank: focus.baseRank,
    newRank: ahead + 1,
    passes,
    overtaken,
  };
}

/**
 * The standing objective: across every plausible result, what it takes to reach
 * (or keep) #1. Independent of the dialed score.
 */
export function top1Objective(
  players: BasePlayer[],
  focusId: string,
  teamA: string,
  teamB: string,
): Insight | null {
  const focus = players.find((p) => p.player_id === focusId);
  if (!focus) return null;
  const others = players.filter((p) => p.player_id !== focus.player_id);
  const candidates = candidateScorelines(players);

  const isOne = candidates.map(([a, b]) => {
    const ft = focus.basePoints + deltaFor(focus, a, b);
    for (const q of others) {
      const qt = q.basePoints + deltaFor(q, a, b);
      if (aheadOf(qt, q.name, ft, focus.name)) return false;
    }
    return true;
  });
  const ph = phraseFor(candidates, (i) => isOne[i], teamA, teamB);
  if (ph.all)
    return {
      tone: "good",
      text:
        focus.baseRank === 1
          ? "Para el #1: lo conservas pase lo que pase."
          : "Para el #1: te basta cualquier resultado.",
    };
  if (ph.none)
    return { tone: "neutral", text: "Para el #1: no es posible en este partido." };
  return { tone: "good", text: `Para el #1: ${ph.text}.` };
}
