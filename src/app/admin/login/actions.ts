"use server";

import { redirect } from "next/navigation";
import { checkPassword, setAdminSession } from "@/lib/admin/session";

type State = { error?: string };

export async function loginAction(_prev: State, formData: FormData): Promise<State> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Escribe la contraseña." };
  if (!checkPassword(password)) return { error: "Contraseña incorrecta." };

  await setAdminSession();
  redirect("/admin");
}
