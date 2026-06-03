"use client";

import { useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { setWinnersAction } from "./actions";

type Player = {
  player_id: string;
  name: string;
  avatar_url: string | null;
  rank: number;
  points: number;
};

type Step = "select" | "confirm";

export function WinnerDialog({
  players,
  currentWinnerIds,
}: {
  players: Player[];
  currentWinnerIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(currentWinnerIds),
  );
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const hasWinners = currentWinnerIds.length > 0;
  const selectedCount = selected.size;
  const selectedPlayers = players.filter((p) => selected.has(p.player_id));

  function reset() {
    setSelected(new Set(currentWinnerIds));
    setStep("select");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const primaryLabel =
    selectedCount === 0
      ? "Quitar ganadores"
      : selectedCount === 1
        ? "Declarar Ganador"
        : "Declarar Ganadores";

  const confirmTitle =
    selectedCount === 0
      ? "¿Quitar a todos los ganadores?"
      : selectedCount === 1
        ? "¿Declarar a este ganador?"
        : "¿Declarar a estos ganadores?";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={hasWinners ? "outline" : "default"}>
          {hasWinners ? "Cambiar ganadores" : "Declarar Ganador"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <form
          ref={formRef}
          action={setWinnersAction}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              await setWinnersAction(fd);
              setOpen(false);
            });
          }}
        >
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="winner_ids" value={id} />
          ))}

          {step === "select" ? (
            <>
              <DialogHeader>
                <DialogTitle>Declarar ganador(es)</DialogTitle>
                <DialogDescription>
                  Aparecerá un banner de campeón en la portada. Puedes elegir
                  varios si hay empate.
                </DialogDescription>
              </DialogHeader>

              <ul className="my-4 max-h-[50vh] space-y-1 overflow-y-auto">
                {players.map((p) => {
                  const checked = selected.has(p.player_id);
                  return (
                    <li key={p.player_id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 transition ${
                          checked
                            ? "border-emerald-600/60"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.player_id)}
                          className="size-4 accent-emerald-600"
                        />
                        <span className="font-heading text-xs font-black tabular-nums text-muted-foreground">
                          #{p.rank}
                        </span>
                        <Avatar
                          name={p.name}
                          imageUrl={p.avatar_url}
                          size="sm"
                        />
                        <span className="flex-1 truncate font-medium">
                          {p.name}
                        </span>
                        <span className="font-heading text-sm font-black tabular-nums">
                          {p.points}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          pts
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={selectedCount === 0 && !hasWinners}
                  onClick={() => setStep("confirm")}
                >
                  {primaryLabel}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{confirmTitle}</DialogTitle>
                <DialogDescription>
                  {selectedCount === 0
                    ? "Se quitará el banner de campeón de la portada."
                    : "Esto mostrará el banner de campeón en la portada."}
                </DialogDescription>
              </DialogHeader>

              {selectedPlayers.length > 0 ? (
                <ul className="my-4 flex flex-wrap gap-2">
                  {selectedPlayers.map((p) => (
                    <li
                      key={p.player_id}
                      className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-1"
                    >
                      <Avatar
                        name={p.name}
                        imageUrl={p.avatar_url}
                        size="xs"
                      />
                      <span className="text-sm font-medium">{p.name}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("select")}
                  disabled={pending}
                >
                  Atrás
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando…" : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
