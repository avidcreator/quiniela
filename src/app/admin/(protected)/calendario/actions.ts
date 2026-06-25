"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getActivePhase } from "@/lib/phase";
import { parseScheduleCsv } from "@/lib/csv/schedule";
import { parseRoundScheduleCsv } from "@/lib/csv/round-schedule";
import { isRoundKey, roundDef } from "@/lib/rounds";
import { createServiceClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

/**
 * Phase 1: the whole 72-match group-stage schedule in one CSV.
 * Writes to `phase_one_matches` explicitly — the row shape (with `group`) is
 * phase-1-specific.
 */
export async function uploadScheduleAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube un archivo CSV." };
  }

  const text = await file.text();
  const parsed = parseScheduleCsv(text);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createServiceClient();
  const { error } = await supabase.from("phase_one_matches").upsert(parsed.rows, {
    onConflict: "match_number",
  });
  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidatePath("/admin/calendario");
  revalidatePath("/admin");
  return { ok: `Se cargaron ${parsed.rows.length} partidos.` };
}

/**
 * Phase 2: one knockout round's matches. Each round is uploaded on its own once
 * the previous round's bracket is known. Writes to `phase_two_matches`.
 */
export async function uploadRoundScheduleAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const roundKey = String(formData.get("round") ?? "");
  if (!isRoundKey(roundKey)) return { error: "Ronda inválida." };
  const round = roundDef(roundKey);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube un archivo CSV." };
  }

  const text = await file.text();
  const parsed = parseRoundScheduleCsv(text, round);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createServiceClient();
  const { error } = await supabase.from("phase_two_matches").upsert(parsed.rows, {
    onConflict: "match_number",
  });
  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidatePath("/admin/calendario");
  revalidatePath("/admin");
  return { ok: `${round.label}: se cargaron ${parsed.rows.length} partidos.` };
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();

  const matchNumber = Number(formData.get("match_number"));
  const kickoff = String(formData.get("kickoff_at") ?? "").trim();
  const teamA = String(formData.get("team_a") ?? "").trim();
  const teamB = String(formData.get("team_b") ?? "").trim();

  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida");
  if (!teamA || !teamB) throw new Error("Equipos requeridos");

  const supabase = createServiceClient();
  const phase = await getActivePhase();

  if (phase === "phase_two") {
    // Round is fixed by match_number; only kickoff/teams are editable.
    const { error } = await supabase
      .from("phase_two_matches")
      .update({ kickoff_at: date.toISOString(), team_a: teamA, team_b: teamB })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  } else {
    const groupRaw = String(formData.get("group") ?? "").trim().toUpperCase();
    const { error } = await supabase
      .from("phase_one_matches")
      .update({
        kickoff_at: date.toISOString(),
        team_a: teamA,
        team_b: teamB,
        group: groupRaw.length > 0 ? groupRaw : null,
      })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/calendario");
  revalidatePath(`/partido/${matchNumber}`);
  redirect("/admin/calendario");
}
