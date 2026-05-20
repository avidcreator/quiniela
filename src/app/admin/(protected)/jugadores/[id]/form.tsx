"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <form
      action={formAction}
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

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
