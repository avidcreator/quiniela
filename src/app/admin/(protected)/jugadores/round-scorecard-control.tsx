"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeRoundScorecardAction,
  uploadRoundScorecardAction,
} from "./actions";

/**
 * Per-player, per-round scorecard control (phase 2). Shows the upload state and
 * lets the admin upload, replace, or remove a round's scorecard for one player.
 */
export function RoundScorecardControl({
  playerId,
  round,
  loaded,
}: {
  playerId: string;
  round: string;
  loaded: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    uploadRoundScorecardAction,
    {},
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {loaded ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Cargada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Pendiente
          </span>
        )}
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="player_id" value={playerId} />
          <input type="hidden" name="round" value={round} />
          <Input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="h-8 w-44 text-xs"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? "…" : loaded ? "Reemplazar" : "Subir"}
          </Button>
        </form>
        {loaded ? (
          <form action={removeRoundScorecardAction}>
            <input type="hidden" name="player_id" value={playerId} />
            <input type="hidden" name="round" value={round} />
            <Button type="submit" size="sm" variant="ghost">
              Quitar
            </Button>
          </form>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs font-medium text-primary">{state.ok}</p>
      ) : null}
    </div>
  );
}
