"use server";

import { TABLES } from "@/lib/supabase/tables";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { parseScheduleCsv } from "@/lib/csv/schedule";
import { createServiceClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

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
  const { error } = await supabase.from(TABLES.matches).upsert(parsed.rows, {
    onConflict: "match_number",
  });
  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidatePath("/admin/calendario");
  revalidatePath("/admin");
  return { ok: `Se cargaron ${parsed.rows.length} partidos.` };
}

export async function updateMatchAction(formData: FormData) {
  await requireAdmin();

  const matchNumber = Number(formData.get("match_number"));
  const kickoff = String(formData.get("kickoff_at") ?? "").trim();
  const teamA = String(formData.get("team_a") ?? "").trim();
  const teamB = String(formData.get("team_b") ?? "").trim();
  const groupRaw = String(formData.get("group") ?? "").trim().toUpperCase();

  if (!Number.isInteger(matchNumber)) throw new Error("match_number inválido");
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida");
  if (!teamA || !teamB) throw new Error("Equipos requeridos");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from(TABLES.matches)
    .update({
      kickoff_at: date.toISOString(),
      team_a: teamA,
      team_b: teamB,
      group: groupRaw.length > 0 ? groupRaw : null,
    })
    .eq("match_number", matchNumber);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/calendario");
  revalidatePath(`/partido/${matchNumber}`);
  redirect("/admin/calendario");
}
