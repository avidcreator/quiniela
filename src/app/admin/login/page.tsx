import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { isAdmin } from "@/lib/admin/session";

export const metadata = { title: "Admin · Quiniela 26" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
          Portal admin
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo el admin puede entrar. Los demás siguen viendo todo sin clave.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
