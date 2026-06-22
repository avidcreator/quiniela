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

  const word = "font-heading text-xl font-black uppercase tracking-[0.12em] leading-none";
  if (status === "HT") return <span className={word}>Descanso</span>;
  if (status === "BT") return <span className={word}>Pausa</span>;
  // INT = interrupted (e.g. weather), SUSP = suspended. The API sends
  // `elapsed: null` here, so without these the clock falls back to "0′".
  if (status === "INT") return <span className={word}>Interrumpido</span>;
  if (status === "SUSP") return <span className={word}>Suspendido</span>;

  const clock = (
    <span
      suppressHydrationWarning
      className="flex items-baseline font-mono text-4xl font-black leading-none tabular-nums tracking-tight sm:text-5xl"
    >
      {mins}
      {extra ? <span className="ml-px text-2xl sm:text-3xl">+{extra}</span> : null}
      <span className="animate-live ml-0.5 text-2xl sm:text-3xl">′</span>
    </span>
  );

  if (status === "P") {
    return (
      <span className="flex flex-col items-end gap-0.5">
        {clock}
        <span className="animate-live font-heading text-[10px] font-black uppercase tracking-[0.2em]">
          Penales
        </span>
      </span>
    );
  }

  return clock;
}
