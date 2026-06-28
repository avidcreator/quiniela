"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeImageFile } from "@/lib/image-resize";
import { updatePlayerAction } from "../actions";

export function EditPlayerForm({
  id,
  defaultName,
  hasAvatar,
}: {
  id: string;
  defaultName: string;
  hasAvatar: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePlayerAction, {});
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
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5 rounded-2xl border bg-card p-6"
    >
      <input type="hidden" name="id" value={id} />

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">
          {hasAvatar ? "Reemplazar foto (opcional)" : "Foto (opcional)"}
        </Label>
        <Input id="avatar" name="avatar" type="file" accept="image/*" />
        <p className="text-xs text-muted-foreground">
          {hasAvatar
            ? "Deja vacío para mantener la foto actual."
            : "Si no subes una foto, se usa el avatar con sus iniciales."}
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
