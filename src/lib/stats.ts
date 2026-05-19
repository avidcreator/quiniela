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
  rank: number;
  prev_rank: number | null;
  points: number;
  strikes: number;
  recent_strikes: number;
  wins: number;
  matches_played: number;
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
  pred_a: number;
  pred_b: number;
  points: 0 | 1 | 3 | null;
};

const RECENT_WINDOW = 6;

function indexPredictions(predictions: Prediction[]): Map<string, Prediction> {
  const map = new Map<string, Prediction>();
  for (const p of predictions) map.set(`${p.player_id}:${p.match_number}`, p);
  return map;
}

function completedMatches(matches: Match[]): Match[] {
  return matches.filter(isCompleted);
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

function tallyPoints(
  players: Player[],
  matches: Match[],
  predIdx: Map<string, Prediction>,
): {
  points: Map<string, number>;
  strikes: Map<string, number>;
  wins: Map<string, number>;
} {
  const points = new Map<string, number>();
  const strikes = new Map<string, number>();
  const wins = new Map<string, number>();
  for (const player of players) {
    let p = 0,
      s = 0,
      w = 0;
    for (const match of matches) {
      const pred = predIdx.get(`${player.id}:${match.match_number}`);
      if (!pred) continue;
      const earned = pointsForMatch(match, pred);
      if (earned === null) continue;
      p += earned;
      if (earned === 3) s += 1;
      if (earned >= 1) w += 1;
    }
    points.set(player.id, p);
    strikes.set(player.id, s);
    wins.set(player.id, w);
  }
  return { points, strikes, wins };
}

export function computeLeaderboard(snap: Snapshot): LeaderboardEntry[] {
  const completed = completedMatches(snap.matches).sort(
    (a, b) => completionTime(b) - completionTime(a),
  );
  const predIdx = indexPredictions(snap.predictions);
  const matchesPlayed = completed.length;

  const current = tallyPoints(snap.players, completed, predIdx);
  const currentRanks = rankByPoints(snap.players, current.points);

  const prior =
    completed.length > 0
      ? tallyPoints(snap.players, completed.slice(1), predIdx)
      : null;
  const priorRanks =
    prior && completed.length > 1
      ? rankByPoints(snap.players, prior.points)
      : null;

  const recentWindow = completed.slice(0, RECENT_WINDOW);
  const recentStrikes = new Map<string, number>();
  for (const player of snap.players) {
    let count = 0;
    for (const match of recentWindow) {
      const pred = predIdx.get(`${player.id}:${match.match_number}`);
      if (!pred) continue;
      if (pointsForMatch(match, pred) === 3) count += 1;
    }
    recentStrikes.set(player.id, count);
  }

  const rows: LeaderboardEntry[] = snap.players.map((p) => ({
    player_id: p.id,
    name: p.name,
    rank: currentRanks.get(p.id) ?? 0,
    prev_rank: priorRanks?.get(p.id) ?? null,
    points: current.points.get(p.id) ?? 0,
    strikes: current.strikes.get(p.id) ?? 0,
    recent_strikes: recentStrikes.get(p.id) ?? 0,
    wins: current.wins.get(p.id) ?? 0,
    matches_played: matchesPlayed,
  }));

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
