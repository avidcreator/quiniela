import "server-only";
import { createClient } from "./supabase/server";
import { pointsFor, type Points } from "./scoring";

export type Match = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  actual_a: number | null;
  actual_b: number | null;
  completed_at: string | null;
};

export type Player = { id: string; name: string };

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
};

export async function loadSnapshot(): Promise<Snapshot> {
  const supabase = await createClient();
  const [matchesRes, playersRes, predictionsRes] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "match_number, kickoff_at, team_a, team_b, actual_a, actual_b, completed_at",
      )
      .order("match_number", { ascending: true }),
    supabase.from("players").select("id, name").order("name", { ascending: true }),
    supabase
      .from("predictions")
      .select("player_id, match_number, pred_a, pred_b"),
  ]);

  return {
    matches: matchesRes.data ?? [],
    players: playersRes.data ?? [],
    predictions: predictionsRes.data ?? [],
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
