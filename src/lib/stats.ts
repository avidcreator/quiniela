import "server-only";
import {
  isCompleted,
  pointsForMatch,
  type Match,
  type Player,
  type Prediction,
  type Snapshot,
} from "./data";

export type LeaderboardEntry = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  rank: number;
  prev_rank: number | null;
  points: number;
  strikes: number;
  recent_strikes: number;
  wins: number;
  matches_played: number;
  hot: boolean;
  cold: boolean;
  history: number[];
};

export type PlayerStats = {
  player_id: string;
  name: string;
  points: number;
  strikes: number;
  strike_ratio: number;
  wins: number;
  win_ratio: number;
  matches_played: number;
};

export type PredictionWithPoints = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  pred_a: number;
  pred_b: number;
  points: 0 | 1 | 3 | null;
};

const RECENT_WINDOW = 6;
const HOT_WINDOW = 4;
const HOT_THRESHOLD = 2;
const COLD_WINDOW = 6;

function indexPredictions(predictions: Prediction[]): Map<string, Prediction> {
  const map = new Map<string, Prediction>();
  for (const p of predictions) map.set(`${p.player_id}:${p.match_number}`, p);
  return map;
}

function completionTime(m: Match): number {
  return new Date(m.completed_at ?? m.kickoff_at).getTime();
}

function rankByPoints(
  players: Player[],
  pointsByPlayer: Map<string, number>,
): Map<string, number> {
  const rows = players.map((p) => ({
    id: p.id,
    name: p.name,
    points: pointsByPlayer.get(p.id) ?? 0,
  }));
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, "es");
  });
  const ranks = new Map<string, number>();
  let lastPoints: number | null = null;
  let lastRank = 0;
  rows.forEach((row, idx) => {
    if (row.points !== lastPoints) {
      lastRank = idx + 1;
      lastPoints = row.points;
    }
    ranks.set(row.id, lastRank);
  });
  return ranks;
}

type PerMatch = { match_number: number; points: 0 | 1 | 3; cumulative: number };

function playerJourney(
  player: Player,
  matchesAsc: Match[],
  predIdx: Map<string, Prediction>,
): {
  perMatch: PerMatch[];
  points: number;
  strikes: number;
  wins: number;
  hot: boolean;
  cold: boolean;
} {
  let cumulative = 0;
  let strikes = 0;
  let wins = 0;
  const perMatch: PerMatch[] = [];

  for (const match of matchesAsc) {
    const pred = predIdx.get(`${player.id}:${match.match_number}`);
    const earned = pred ? (pointsForMatch(match, pred) ?? 0) : 0;
    cumulative += earned;
    if (earned === 3) strikes += 1;
    if (earned >= 1) wins += 1;
    perMatch.push({
      match_number: match.match_number,
      points: earned as 0 | 1 | 3,
      cumulative,
    });
  }

  const tail = (n: number) => perMatch.slice(Math.max(0, perMatch.length - n));
  const hotTail = tail(HOT_WINDOW);
  const coldTail = tail(COLD_WINDOW);
  const hot = hotTail.filter((m) => m.points === 3).length >= HOT_THRESHOLD;
  const cold =
    coldTail.length >= COLD_WINDOW && coldTail.every((m) => m.points === 0);

  return { perMatch, points: cumulative, strikes, wins, hot, cold };
}

export function leaderboardFromMatches(
  snap: Snapshot,
  matches: Match[],
): LeaderboardEntry[] {
  return computeLeaderboard({ ...snap, matches });
}

export function computeLeaderboard(snap: Snapshot): LeaderboardEntry[] {
  const completedAsc = snap.matches
    .filter(isCompleted)
    .sort((a, b) => completionTime(a) - completionTime(b));
  const predIdx = indexPredictions(snap.predictions);
  const matchesPlayed = completedAsc.length;

  const journeys = new Map<string, ReturnType<typeof playerJourney>>();
  for (const player of snap.players) {
    journeys.set(player.id, playerJourney(player, completedAsc, predIdx));
  }

  const pointsByPlayer = new Map<string, number>();
  for (const player of snap.players) {
    pointsByPlayer.set(player.id, journeys.get(player.id)!.points);
  }
  const currentRanks = rankByPoints(snap.players, pointsByPlayer);

  const priorPointsByPlayer = new Map<string, number>();
  if (completedAsc.length > 0) {
    const priorMatches = completedAsc.slice(0, -1);
    for (const player of snap.players) {
      const j = playerJourney(player, priorMatches, predIdx);
      priorPointsByPlayer.set(player.id, j.points);
    }
  }
  const priorRanks =
    completedAsc.length > 1
      ? rankByPoints(snap.players, priorPointsByPlayer)
      : null;

  const recentMatchNumbers = new Set(
    completedAsc.slice(-RECENT_WINDOW).map((m) => m.match_number),
  );

  const rows: LeaderboardEntry[] = snap.players.map((p) => {
    const j = journeys.get(p.id)!;
    const recentStrikes = j.perMatch
      .filter((m) => recentMatchNumbers.has(m.match_number))
      .filter((m) => m.points === 3).length;
    const history = j.perMatch.map((m) => m.cumulative);

    return {
      player_id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      rank: currentRanks.get(p.id) ?? 0,
      prev_rank: priorRanks?.get(p.id) ?? null,
      points: j.points,
      strikes: j.strikes,
      recent_strikes: recentStrikes,
      wins: j.wins,
      matches_played: matchesPlayed,
      hot: j.hot,
      cold: j.cold,
      history,
    };
  });

  rows.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.name.localeCompare(b.name, "es");
  });

  return rows;
}

export function computePlayerStats(
  snap: Snapshot,
  playerId: string,
): PlayerStats | null {
  const player = snap.players.find((p) => p.id === playerId);
  if (!player) return null;
  const entry = computeLeaderboard(snap).find((e) => e.player_id === playerId);
  if (!entry) return null;
  const denom = entry.matches_played || 1;
  return {
    player_id: player.id,
    name: player.name,
    points: entry.points,
    strikes: entry.strikes,
    strike_ratio: entry.matches_played === 0 ? 0 : entry.strikes / denom,
    wins: entry.wins,
    win_ratio: entry.matches_played === 0 ? 0 : entry.wins / denom,
    matches_played: entry.matches_played,
  };
}

export function computeMatchPredictions(
  snap: Snapshot,
  matchNumber: number,
): PredictionWithPoints[] {
  const match = snap.matches.find((m) => m.match_number === matchNumber);
  if (!match) return [];

  const rows: PredictionWithPoints[] = snap.players.map((player) => {
    const pred = snap.predictions.find(
      (p) => p.player_id === player.id && p.match_number === matchNumber,
    );
    return {
      player_id: player.id,
      name: player.name,
      avatar_url: player.avatar_url,
      pred_a: pred?.pred_a ?? 0,
      pred_b: pred?.pred_b ?? 0,
      points: pred ? pointsForMatch(match, pred) : null,
    };
  });

  rows.sort((a, b) => {
    const ap = a.points ?? -1;
    const bp = b.points ?? -1;
    if (bp !== ap) return bp - ap;
    return a.name.localeCompare(b.name, "es");
  });
  return rows;
}

export type PlayerExtendedStats = {
  avg_per_match: number;
  best_day_points: number;
  longest_strike_streak: number;
  longest_dry_streak: number;
  total_matches_with_points: number;
};

export function playerExtendedStats(
  snap: Snapshot,
  playerId: string,
): PlayerExtendedStats {
  const completedAsc = snap.matches
    .filter(isCompleted)
    .sort(
      (a, b) =>
        new Date(a.completed_at ?? a.kickoff_at).getTime() -
        new Date(b.completed_at ?? b.kickoff_at).getTime(),
    );
  const predIdx = indexPredictions(snap.predictions);

  let totalPoints = 0;
  let strikeRun = 0;
  let longestStrike = 0;
  let dryRun = 0;
  let longestDry = 0;
  let matchesWithPoints = 0;
  const dayTotals = new Map<string, number>();

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (const m of completedAsc) {
    const pred = predIdx.get(`${playerId}:${m.match_number}`);
    const pts = pred ? (pointsForMatch(m, pred) ?? 0) : 0;
    totalPoints += pts;
    if (pts > 0) matchesWithPoints += 1;

    if (pts === 3) {
      strikeRun += 1;
      longestStrike = Math.max(longestStrike, strikeRun);
    } else {
      strikeRun = 0;
    }
    if (pts === 0) {
      dryRun += 1;
      longestDry = Math.max(longestDry, dryRun);
    } else {
      dryRun = 0;
    }

    const dayKey = fmt.format(new Date(m.kickoff_at));
    dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + pts);
  }

  const matchesPlayed = completedAsc.length;
  const bestDay = Array.from(dayTotals.values()).reduce(
    (m, v) => Math.max(m, v),
    0,
  );

  return {
    avg_per_match:
      matchesPlayed > 0 ? Math.round((totalPoints / matchesPlayed) * 10) / 10 : 0,
    best_day_points: bestDay,
    longest_strike_streak: longestStrike,
    longest_dry_streak: longestDry,
    total_matches_with_points: matchesWithPoints,
  };
}

export type BestMatch = {
  match_number: number;
  team_a: string;
  team_b: string;
  actual_a: number;
  actual_b: number;
  pred_a: number;
  pred_b: number;
  points: 1 | 3;
};

export function bestMatchesForPlayer(
  snap: Snapshot,
  playerId: string,
  limit = 3,
): BestMatch[] {
  const out: BestMatch[] = [];
  const completed = snap.matches.filter(isCompleted);
  const predIdx = indexPredictions(snap.predictions);
  for (const m of completed) {
    const pred = predIdx.get(`${playerId}:${m.match_number}`);
    if (!pred) continue;
    const pts = pointsForMatch(m, pred);
    if (pts !== 1 && pts !== 3) continue;
    out.push({
      match_number: m.match_number,
      team_a: m.team_a,
      team_b: m.team_b,
      actual_a: m.actual_a as number,
      actual_b: m.actual_b as number,
      pred_a: pred.pred_a,
      pred_b: pred.pred_b,
      points: pts,
    });
  }
  out.sort(
    (a, b) => b.points - a.points || a.match_number - b.match_number,
  );
  return out.slice(0, limit);
}

export function commentatorLine(
  match: Match,
  preds: PredictionWithPoints[],
): string | null {
  if (match.actual_a === null || match.actual_b === null) return null;

  const strikers = preds.filter((p) => p.points === 3);
  const winners = preds.filter((p) => p.points === 1);
  const losers = preds.filter((p) => p.points === 0);
  const total = preds.length;
  const goals = match.actual_a + match.actual_b;
  const draw = match.actual_a === match.actual_b;

  if (total === 0) return null;
  if (strikers.length === 1) return `¡Y la acertó ${strikers[0].name.toUpperCase()}!`;
  if (strikers.length >= 3) return `${strikers.length} aciertos — masacre.`;
  if (strikers.length === 2) return `Dos la vieron clarita.`;
  if (losers.length === total) return `Nadie le vio la jugada.`;
  if (winners.length === total) return `Todos olieron el resultado.`;
  if (goals >= 5) return `Festival de goles.`;
  if (goals === 0) return `Cero goles, cero emociones.`;
  if (draw) return `Se repartieron los puntos.`;
  return `${winners.length} ${winners.length === 1 ? "adivinó" : "adivinaron"} el ganador.`;
}
