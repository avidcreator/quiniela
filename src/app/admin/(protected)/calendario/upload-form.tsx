"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadScheduleAction } from "./actions";

export function ScheduleUploadForm() {
  const [state, formAction, pending] = useActionState(uploadScheduleAction, {});

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Archivo CSV</Label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm font-medium text-primary">{state.ok}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Subiendo…" : "Subir calendario"}
      </Button>
    </form>
  );
}
