"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getActivePhase, getTables, type TableMap } from "@/lib/phase";
import { isRoundKey, roundDef } from "@/lib/rounds";
import { parseScorecardCsv } from "@/lib/csv/scorecard";
import { parseRoundScorecardCsv } from "@/lib/csv/round-scorecard";
import { createServiceClient } from "@/lib/supabase/server";

type State = { error?: string };
type RoundState = { error?: string; ok?: string };
type ServiceClient = ReturnType<typeof createServiceClient>;

function fileExtension(file: File): string {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  const ext = name.slice(dot + 1).replace(/[^a-z0-9]/g, "");
  return ext.length > 0 && ext.length <= 5 ? ext : "";
}

/** Upload an avatar and store its URL on the player. Returns an error message or null. */
async function attachAvatar(
  supabase: ServiceClient,
  playersTable: TableMap["players"],
  playerId: string,
  avatarFile: File,
  bustCache: boolean,
): Promise<string | null> {
  if (!avatarFile.type.startsWith("image/")) return "La foto debe ser una imagen.";
  const ext = fileExtension(avatarFile) || "png";
  const path = `${playerId}.${ext}`;
  const buffer = Buffer.from(await avatarFile.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: avatarFile.type, upsert: true });
  if (upErr) return `Error al subir la foto: ${upErr.message}`;

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = bustCache ? `${pub.publicUrl}?v=${Date.now()}` : pub.publicUrl;
  const { error: updErr } = await supabase
    .from(playersTable)
    .update({ avatar_url: url })
    .eq("id", playerId);
  if (updErr) return `Error al guardar la foto: ${updErr.message}`;
  return null;
}

export async function createPlayerAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const phase = await getActivePhase();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = createServiceClient();
  const TABLES = await getTables();

  // ---- Phase 2: name + optional photo only. Scorecards arrive per round. ----
  if (phase === "phase_two") {
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

    const avatarFile = formData.get("avatar");
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const avatarErr = await attachAvatar(
        supabase,
        TABLES.players,
        player.id,
        avatarFile,
        false,
      );
      if (avatarErr) {
        await supabase.from(TABLES.players).delete().eq("id", player.id);
        return { error: avatarErr };
      }
    }

    revalidatePath("/admin/jugadores");
    revalidatePath("/admin");
    redirect("/admin/jugadores");
  }

  // ---- Phase 1: name + optional photo + full 72-prediction scorecard. ----
  const csvFile = formData.get("file");
  const avatarFile = formData.get("avatar");

  if (!(csvFile instanceof File) || csvFile.size === 0) {
    return { error: "Sube la quiniela del jugador en CSV." };
  }

  const text = await csvFile.text();
  const parsed = parseScorecardCsv(text);
  if (!parsed.ok) return { error: parsed.error };

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
    const avatarErr = await attachAvatar(
      supabase,
      TABLES.players,
      player.id,
      avatarFile,
      false,
    );
    if (avatarErr) {
      await supabase.from(TABLES.players).delete().eq("id", player.id);
      return { error: avatarErr };
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

/** Phase 2: upload (or replace) one player's scorecard for one knockout round. */
export async function uploadRoundScorecardAction(
  _prev: RoundState,
  formData: FormData,
): Promise<RoundState> {
  await requireAdmin();

  const playerId = String(formData.get("player_id") ?? "");
  const roundKey = String(formData.get("round") ?? "");
  if (!playerId) return { error: "Jugador inválido." };
  if (!isRoundKey(roundKey)) return { error: "Ronda inválida." };
  const round = roundDef(roundKey);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sube un archivo CSV." };
  }

  const text = await file.text();
  const parsed = parseRoundScorecardCsv(text, round);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createServiceClient();

  // Each predicted match must already be on the schedule. Rounds load in waves,
  // so we check the specific matches in the file rather than the whole round.
  const { data: scheduled } = await supabase
    .from("phase_two_matches")
    .select("match_number")
    .eq("round", round.key);
  const scheduledSet = new Set((scheduled ?? []).map((m) => m.match_number));
  const missing = parsed.rows
    .map((r) => r.match_number)
    .filter((n) => !scheduledSet.has(n));
  if (missing.length > 0) {
    return {
      error: `Estos partidos aún no están en el calendario: ${missing.join(", ")}. Súbelos primero en Calendario.`,
    };
  }

  const rows = parsed.rows.map((r) => ({
    player_id: playerId,
    match_number: r.match_number,
    pred_a: r.pred_a,
    pred_b: r.pred_b,
  }));

  const { error } = await supabase
    .from("phase_two_predictions")
    .upsert(rows, { onConflict: "player_id,match_number" });
  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidatePath("/admin/jugadores");
  return { ok: `${round.label}: quiniela cargada.` };
}

/** Phase 2: remove one player's scorecard for one knockout round. */
export async function removeRoundScorecardAction(formData: FormData) {
  await requireAdmin();

  const playerId = String(formData.get("player_id") ?? "");
  const roundKey = String(formData.get("round") ?? "");
  if (!playerId) throw new Error("Jugador inválido");
  if (!isRoundKey(roundKey)) throw new Error("Ronda inválida");
  const round = roundDef(roundKey);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("phase_two_predictions")
    .delete()
    .eq("player_id", playerId)
    .gte("match_number", round.base + 1)
    .lte("match_number", round.base + round.count);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/jugadores");
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
  const TABLES = await getTables();

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
    const avatarErr = await attachAvatar(
      supabase,
      TABLES.players,
      id,
      avatarFile,
      true,
    );
    if (avatarErr) return { error: avatarErr };
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
  const TABLES = await getTables();
  const { error } = await supabase.from(TABLES.players).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/jugadores");
  revalidatePath("/admin");
}
