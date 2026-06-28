"use client";

import { Button } from "@/components/ui/button";

/** Confirm + clear all of a round's uploaded matches (and any scorecards). */
export function RoundClearButton({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={(e) => {
        if (
          !confirm(
            `¿Borrar los ${count} partido${count === 1 ? "" : "s"} de ${label}? También se eliminarán las quinielas que se hayan subido para esta ronda.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Borrar partidos
    </Button>
  );
}
