"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadRoundScheduleAction } from "./actions";

/** Per-round CSV uploader for phase 2. One instance per knockout round. */
export function RoundUploadForm({
  round,
  count,
}: {
  round: string;
  count: number;
}) {
  const [state, formAction, pending] = useActionState(
    uploadRoundScheduleAction,
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-3">
      <input type="hidden" name="round" value={round} />
      <Input
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="max-w-xs"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Subiendo…" : `Subir ${count} partido${count === 1 ? "" : "s"}`}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="w-full text-sm font-medium text-primary">{state.ok}</p>
      ) : null}
    </form>
  );
}
