"use server";

import { getActivePhase, getTables } from "@/lib/phase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceClient } from "@/lib/supabase/server";

/** Parse an optional score field: blank → null, else a non-negative integer. */
function optScore(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export async function setScoreAction(formData: FormData) {
  await requireAdmin();

  const matchNumber = Number(formData.get("match_number"));
  const actualA = Number(formData.get("actual_a"));
  const actualB = Number(formData.get("actual_b"));

  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");
  if (
    !Number.isInteger(actualA) ||
    !Number.isInteger(actualB) ||
    actualA < 0 ||
    actualB < 0
  ) {
    throw new Error("Marcadores deben ser enteros >= 0");
  }

  const supabase = createServiceClient();
  const phase = await getActivePhase();

  if (phase === "phase_two") {
    // Extra-time final + penalties are optional and stored as a pair (both or
    // neither), so a stray single value is ignored.
    const finalA = optScore(formData.get("final_a"));
    const finalB = optScore(formData.get("final_b"));
    const penA = optScore(formData.get("pen_a"));
    const penB = optScore(formData.get("pen_b"));
    const hasFinal = finalA !== null && finalB !== null;
    const hasPen = penA !== null && penB !== null;

    // Saving the score does NOT end the match — the cron keeps polling and the
    // live card keeps showing extra time / penalties until "Finalizar".
    const { error } = await supabase
      .from("phase_two_matches")
      .update({
        actual_a: actualA,
        actual_b: actualB,
        final_a: hasFinal ? finalA : null,
        final_b: hasFinal ? finalB : null,
        pen_a: hasPen ? penA : null,
        pen_b: hasPen ? penB : null,
      })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("phase_one_matches")
      .update({
        actual_a: actualA,
        actual_b: actualB,
        completed_at: new Date().toISOString(),
      })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath(`/partido/${matchNumber}`);
}

/** Phase 2: mark a match as ended (stops live updates, moves it to results). */
export async function endMatchAction(formData: FormData) {
  await requireAdmin();
  const matchNumber = Number(formData.get("match_number"));
  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("phase_two_matches")
    .update({ completed_at: new Date().toISOString() })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/partido/${matchNumber}`);
}

/** Phase 2: re-open a match marked ended too early (back to live). */
export async function resumeMatchAction(formData: FormData) {
  await requireAdmin();
  const matchNumber = Number(formData.get("match_number"));
  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("phase_two_matches")
    .update({ completed_at: null })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/partido/${matchNumber}`);
}

export async function setWinnersAction(formData: FormData) {
  await requireAdmin();

  const ids = formData
    .getAll("winner_ids")
    .map((v) => String(v))
    .filter(Boolean);

  const supabase = createServiceClient();
  const TABLES = await getTables();

  // Replace the whole winners set: clear, then insert.
  const { error: delErr } = await supabase
    .from(TABLES.winners)
    .delete()
    .neq("player_id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw new Error(delErr.message);

  if (ids.length > 0) {
    const rows = ids.map((player_id) => ({ player_id }));
    const { error: insErr } = await supabase.from(TABLES.winners).insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/resultados");
}

export async function clearScoreAction(formData: FormData) {
  await requireAdmin();

  const matchNumber = Number(formData.get("match_number"));
  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");

  const supabase = createServiceClient();
  const phase = await getActivePhase();

  if (phase === "phase_two") {
    const { error } = await supabase
      .from("phase_two_matches")
      .update({
        actual_a: null,
        actual_b: null,
        completed_at: null,
        final_a: null,
        final_b: null,
        pen_a: null,
        pen_b: null,
      })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("phase_one_matches")
      .update({ actual_a: null, actual_b: null, completed_at: null })
      .eq("match_number", matchNumber);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath(`/partido/${matchNumber}`);
}
