"use server";

import { TABLES } from "@/lib/supabase/tables";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceClient } from "@/lib/supabase/server";

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
  const { error } = await supabase
    .from(TABLES.matches)
    .update({
      actual_a: actualA,
      actual_b: actualB,
      completed_at: new Date().toISOString(),
    })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath(`/partido/${matchNumber}`);
}

export async function setWinnersAction(formData: FormData) {
  await requireAdmin();

  const ids = formData
    .getAll("winner_ids")
    .map((v) => String(v))
    .filter(Boolean);

  const supabase = createServiceClient();

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
  const { error } = await supabase
    .from(TABLES.matches)
    .update({ actual_a: null, actual_b: null, completed_at: null })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath(`/partido/${matchNumber}`);
}
