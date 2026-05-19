"use client";

import { Button } from "@/components/ui/button";

export function RemovePlayerButton({ name }: { name: string }) {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={(e) => {
        if (
          !confirm(
            `¿Quitar a ${name}? Se borra su quiniela y todos los puntos asociados.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      Quitar
    </Button>
  );
}
