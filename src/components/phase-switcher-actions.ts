"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin/session";
import { isPhase, setPreviewPhase, setPublishedPhase } from "@/lib/phase";

/** Admin-only: switch which phase THIS browser previews (no public effect). */
export async function selectPreviewPhaseAction(phase: string) {
  if (!(await isAdmin())) return;
  if (!isPhase(phase)) return;
  await setPreviewPhase(phase);
  revalidatePath("/", "layout");
}

/** Admin-only: publish a phase to the public, and keep previewing it. */
export async function publishPhaseAction(phase: string) {
  if (!(await isAdmin())) return;
  if (!isPhase(phase)) return;
  await setPublishedPhase(phase);
  await setPreviewPhase(phase);
  revalidatePath("/", "layout");
}
