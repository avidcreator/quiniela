"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeImageFile } from "@/lib/image-resize";
import { createPlayerAction } from "../actions";

export function NewPlayerForm({
  requireScorecard = true,
}: {
  requireScorecard?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createPlayerAction, {});
  const [preparing, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const avatar = fd.get("avatar");
      if (avatar instanceof File && avatar.size > 0) {
        const resized = await resizeImageFile(avatar);
        fd.set("avatar", resized, resized.name);
      }
      formAction(fd);
    });
  }

  const busy = pending || preparing;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar">Foto (opcional)</Label>
        <Input id="avatar" name="avatar" type="file" accept="image/*" />
        <p className="text-xs text-muted-foreground">
          Si no subes una foto, se usará un avatar con sus iniciales.
        </p>
      </div>
      {requireScorecard ? (
        <div className="space-y-2">
          <Label htmlFor="file">Quiniela CSV</Label>
          <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Agregar jugador"}
      </Button>
    </form>
  );
}
