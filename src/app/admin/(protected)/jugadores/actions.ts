"use server";

import { TABLES } from "@/lib/supabase/tables";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { parseScorecardCsv } from "@/lib/csv/scorecard";
import { createServiceClient } from "@/lib/supabase/server";

type State = { error?: string };

function fileExtension(file: File): string {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  const ext = name.slice(dot + 1).replace(/[^a-z0-9]/g, "");
  return ext.length > 0 && ext.length <= 5 ? ext : "";
}

export async function createPlayerAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const csvFile = formData.get("file");
  const avatarFile = formData.get("avatar");

  if (!name) return { error: "El nombre es obligatorio." };
  if (!(csvFile instanceof File) || csvFile.size === 0) {
    return { error: "Sube la quiniela del jugador en CSV." };
  }

  const text = await csvFile.text();
  const parsed = parseScorecardCsv(text);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createServiceClient();

  const { count } = await supabase
    .from(TABLES.matches)
    .select("match_number", { count: "exact", head: true });
  if ((count ?? 0) !== 72) {
    return {
      error:
        "Antes de agregar jugadores, sube el calendario completo (72 partidos).",
    };
  }

  const { data: player, error: playerErr } = await supabase
    .from(TABLES.players)
    .insert({ name })
    .select("id")
    .single();

  if (playerErr) {
    if (playerErr.code === "23505") {
      return { error: "Ya hay un jugador con ese nombre." };
    }
    return { error: `Error al crear jugador: ${playerErr.message}` };
  }

  // Optional avatar upload — if any failure, roll back the player + abort.
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/")) {
      await supabase.from(TABLES.players).delete().eq("id", player.id);
      return { error: "La foto debe ser una imagen." };
    }
    const ext = fileExtension(avatarFile) || "png";
    const path = `${player.id}.${ext}`;
    const buffer = Buffer.from(await avatarFile.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: avatarFile.type,
        upsert: true,
      });
    if (upErr) {
      await supabase.from(TABLES.players).delete().eq("id", player.id);
      return { error: `Error al subir la foto: ${upErr.message}` };
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase
      .from(TABLES.players)
      .update({ avatar_url: pub.publicUrl })
      .eq("id", player.id);
    if (updErr) {
      await supabase.from(TABLES.players).delete().eq("id", player.id);
      return { error: `Error al guardar la foto: ${updErr.message}` };
    }
  }

  const predictions = parsed.rows.map((r) => ({
    player_id: player.id,
    match_number: r.match_number,
    pred_a: r.pred_a,
    pred_b: r.pred_b,
  }));

  const { error: predErr } = await supabase
    .from(TABLES.predictions)
    .insert(predictions);

  if (predErr) {
    await supabase.from(TABLES.players).delete().eq("id", player.id);
    return { error: `Error al guardar quiniela: ${predErr.message}` };
  }

  revalidatePath("/admin/jugadores");
  revalidatePath("/admin");
  redirect("/admin/jugadores");
}

export async function updatePlayerAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const avatarFile = formData.get("avatar");

  if (!id) return { error: "id requerido" };
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = createServiceClient();

  const { error: nameErr } = await supabase
    .from(TABLES.players)
    .update({ name })
    .eq("id", id);
  if (nameErr) {
    if (nameErr.code === "23505") {
      return { error: "Ya hay un jugador con ese nombre." };
    }
    return { error: `Error al guardar: ${nameErr.message}` };
  }

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "La foto debe ser una imagen." };
    }
    const ext = fileExtension(avatarFile) || "png";
    const path = `${id}.${ext}`;
    const buffer = Buffer.from(await avatarFile.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: avatarFile.type,
        upsert: true,
      });
    if (upErr) return { error: `Error al subir la foto: ${upErr.message}` };

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    // Bust CDN cache so the new image loads immediately.
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    const { error: updErr } = await supabase
      .from(TABLES.players)
      .update({ avatar_url: url })
      .eq("id", id);
    if (updErr) return { error: `Error al guardar la foto: ${updErr.message}` };
  }

  revalidatePath("/admin/jugadores");
  revalidatePath(`/admin/jugadores/${id}`);
  revalidatePath("/");
  revalidatePath(`/jugador/${id}`);
  redirect("/admin/jugadores");
}

export async function removePlayerAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id requerido");

  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLES.players).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/jugadores");
  revalidatePath("/admin");
}
