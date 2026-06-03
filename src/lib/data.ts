import "server-only";
import { createClient } from "./supabase/server";
import { pointsFor, type Points } from "./scoring";

export type Match = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  group: string | null;
  actual_a: number | null;
  actual_b: number | null;
  completed_at: string | null;
};

export type Player = { id: string; name: string; avatar_url: string | null };

export type Prediction = {
  player_id: string;
  match_number: number;
  pred_a: number;
  pred_b: number;
};

export type Snapshot = {
  matches: Match[];
  players: Player[];
  predictions: Prediction[];
  winner_ids: string[];
};

export async function loadSnapshot(): Promise<Snapshot> {
  const supabase = await createClient();
  const [matchesRes, playersRes, predictionsRes, winnersRes] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "match_number, kickoff_at, team_a, team_b, group, actual_a, actual_b, completed_at",
      )
      .order("match_number", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, avatar_url")
      .order("name", { ascending: true }),
    supabase
      .from("predictions")
      .select("player_id, match_number, pred_a, pred_b"),
    supabase.from("winners").select("player_id"),
  ]);

  return {
    matches: matchesRes.data ?? [],
    players: playersRes.data ?? [],
    predictions: predictionsRes.data ?? [],
    winner_ids: (winnersRes.data ?? []).map((w) => w.player_id),
  };
}

export function isCompleted(m: Match): m is Match & { actual_a: number; actual_b: number } {
  return m.actual_a !== null && m.actual_b !== null;
}

export function pointsForMatch(
  match: Match,
  pred: { pred_a: number; pred_b: number },
): Points | null {
  if (!isCompleted(match)) return null;
  return pointsFor(pred.pred_a, pred.pred_b, match.actual_a, match.actual_b);
}
