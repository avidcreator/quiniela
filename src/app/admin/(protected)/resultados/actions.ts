"use server";

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
    .from("matches")
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

export async function clearScoreAction(formData: FormData) {
  await requireAdmin();

  const matchNumber = Number(formData.get("match_number"));
  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("matches")
    .update({ actual_a: null, actual_b: null, completed_at: null })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/resultados");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath(`/partido/${matchNumber}`);
}
