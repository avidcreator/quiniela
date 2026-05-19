"use client";

import { useRouter } from "next/navigation";

export function PlayerSwitcher({
  players,
  currentId,
}: {
  players: Array<{ id: string; name: string }>;
  currentId: string;
}) {
  const router = useRouter();

  if (players.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Cambiar a:</span>
      <select
        value={currentId}
        onChange={(e) => router.push(`/jugador/${e.target.value}`)}
        className="rounded-full border bg-background px-3 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
