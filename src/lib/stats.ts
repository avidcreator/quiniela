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
  points: number;
  strikes: number;
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

function indexPredictions(predictions: Prediction[]): Map<string, Prediction> {
  const map = new Map<string, Prediction>();
  for (const p of predictions) map.set(`${p.player_id}:${p.match_number}`, p);
  return map;
}

function completedMatches(matches: Match[]): Match[] {
  return matches.filter(isCompleted);
}

export function computeLeaderboard(snap: Snapshot): LeaderboardEntry[] {
  const completed = completedMatches(snap.matches);
  const predIdx = indexPredictions(snap.predictions);
  const matchesPlayed = completed.length;

  const rows = snap.players.map((player) => {
    let points = 0;
    let strikes = 0;
    let wins = 0;

    for (const match of completed) {
      const pred = predIdx.get(`${player.id}:${match.match_number}`);
      if (!pred) continue;
      const earned = pointsForMatch(match, pred);
      if (earned === null) continue;
      points += earned;
      if (earned === 3) strikes += 1;
      if (earned >= 1) wins += 1;
    }

    return {
      player_id: player.id,
      name: player.name,
      points,
      strikes,
      wins,
      matches_played: matchesPlayed,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, "es");
  });

  let lastPoints: number | null = null;
  let lastRank = 0;
  return rows.map((row, idx) => {
    if (row.points !== lastPoints) {
      lastRank = idx + 1;
      lastPoints = row.points;
    }
    return { ...row, rank: lastRank };
  });
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
