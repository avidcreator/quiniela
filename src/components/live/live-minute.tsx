"use client";

import { useEffect, useState } from "react";

const RUNNING = new Set(["1H", "2H", "ET"]);

export function LiveMinute({
  elapsed,
  extra,
  status,
  updatedAt,
}: {
  elapsed: number | null;
  extra: number | null;
  status: string;
  updatedAt: string | null;
}) {
  const running = RUNNING.has(status);
  const [mins, setMins] = useState(elapsed ?? 0);

  useEffect(() => {
    if (!running || elapsed == null || !updatedAt) {
      setMins(elapsed ?? 0);
      return;
    }
    const base = elapsed;
    const t0 = new Date(updatedAt).getTime();
    const tick = () => {
      const add = Math.floor((Date.now() - t0) / 60000);
      setMins(base + Math.max(0, add));
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [elapsed, running, updatedAt]);

  if (status === "HT") return <span>Descanso</span>;
  if (status === "P") return <span>Penales</span>;
  if (status === "BT") return <span>Pausa</span>;
  const label = extra ? `${mins}+${extra}'` : `${mins}'`;
  return <span suppressHydrationWarning>{label}</span>;
}
