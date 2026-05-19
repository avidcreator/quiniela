"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { parseScorecardCsv } from "@/lib/csv/scorecard";
import { createServiceClient } from "@/lib/supabase/server";

type State = { error?: string };

export async function createPlayerAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");

  if (!name) return { error: "El nombre es obligatorio." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube la quiniela del jugador en CSV." };
  }

  const text = await file.text();
  const parsed = parseScorecardCsv(text);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createServiceClient();

  const { count } = await supabase
    .from("matches")
    .select("match_number", { count: "exact", head: true });
  if ((count ?? 0) !== 72) {
    return {
      error:
        "Antes de agregar jugadores, sube el calendario completo (72 partidos).",
    };
  }

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .insert({ name })
    .select("id")
    .single();

  if (playerErr) {
    if (playerErr.code === "23505") {
      return { error: "Ya hay un jugador con ese nombre." };
    }
    return { error: `Error al crear jugador: ${playerErr.message}` };
  }

  const predictions = parsed.rows.map((r) => ({
    player_id: player.id,
    match_number: r.match_number,
    pred_a: r.pred_a,
    pred_b: r.pred_b,
  }));

  const { error: predErr } = await supabase.from("predictions").insert(predictions);

  if (predErr) {
    await supabase.from("players").delete().eq("id", player.id);
    return { error: `Error al guardar quiniela: ${predErr.message}` };
  }

  revalidatePath("/admin/jugadores");
  revalidatePath("/admin");
  redirect("/admin/jugadores");
}

export async function removePlayerAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id requerido");

  const supabase = createServiceClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/jugadores");
  revalidatePath("/admin");
}
