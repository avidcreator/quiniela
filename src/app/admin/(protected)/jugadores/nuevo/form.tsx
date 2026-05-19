"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlayerAction } from "../actions";

export function NewPlayerForm() {
  const [state, formAction, pending] = useActionState(createPlayerAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Quiniela CSV</Label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar jugador"}
      </Button>
    </form>
  );
}
