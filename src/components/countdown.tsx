"use client";

import { useEffect, useState } from "react";

type Segment = { value: number; label: string; pad: boolean };

function segmentsFor(totalSec: number): Segment[] {
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  // > 48h → days + hours + minutes + seconds
  if (totalSec > 2 * 86400) {
    return [
      { value: days, label: days === 1 ? "Día" : "Días", pad: false },
      { value: hours, label: "Hrs", pad: true },
      { value: minutes, label: "Min", pad: true },
      { value: seconds, label: "Seg", pad: true },
    ];
  }
  // ≤ 48h and ≥ 1h → hours (up to 48) + minutes + seconds
  if (totalSec >= 3600) {
    return [
      { value: Math.floor(totalSec / 3600), label: "Horas", pad: false },
      { value: minutes, label: "Min", pad: true },
      { value: seconds, label: "Seg", pad: true },
    ];
  }
  // < 1h and ≥ 1m → minutes + seconds
  if (totalSec >= 60) {
    return [
      { value: minutes, label: "Min", pad: false },
      { value: seconds, label: "Seg", pad: true },
    ];
  }
  // < 1m → seconds
  return [{ value: seconds, label: "Seg", pad: false }];
}

export function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSec = mounted
    ? Math.max(0, Math.floor((target - nowMs) / 1000))
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Live indicator */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="font-heading text-[10px] font-black uppercase tracking-[0.28em] text-primary">
          Cuenta regresiva
        </span>
      </div>

      {totalSec === null ? (
        <div className="h-[72px] sm:h-[112px]" aria-hidden />
      ) : totalSec <= 0 ? (
        <div className="font-heading text-4xl font-black uppercase tracking-tight text-primary sm:text-6xl">
          ¡Arrancó!
        </div>
      ) : (
        (() => {
          const segments = segmentsFor(totalSec);
          const dense = segments.length >= 4;
          const numClass = dense
            ? "text-4xl sm:text-7xl"
            : "text-6xl sm:text-8xl";
          const colonClass = dense
            ? "text-3xl sm:text-5xl"
            : "text-4xl sm:text-6xl";
          const minW = dense ? "min-w-[2.5rem] sm:min-w-[4.5rem]" : "min-w-[3rem] sm:min-w-[5rem]";
          return (
            <div className="flex items-stretch justify-center gap-0.5 sm:gap-2">
              {segments.map((s, i) => (
                <div key={s.label} className="flex items-stretch">
                  {i > 0 ? (
                    <span
                      className={`cd-colon self-start pt-1 font-heading font-black leading-none text-primary/50 sm:pt-2 ${colonClass}`}
                    >
                      :
                    </span>
                  ) : null}
                  <SegmentTile
                    value={
                      s.pad
                        ? String(s.value).padStart(2, "0")
                        : String(s.value)
                    }
                    label={s.label}
                    numClass={numClass}
                    minW={minW}
                  />
                </div>
              ))}
            </div>
          );
        })()
      )}

      <style>{`
        @keyframes cd-tick {
          0% { transform: translateY(-0.18em); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .cd-digit { display: inline-block; animation: cd-tick 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes cd-blink { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.15; } }
        .cd-colon { animation: cd-blink 1s steps(1, end) infinite; }
      `}</style>
    </div>
  );
}

function SegmentTile({
  value,
  label,
  numClass = "text-6xl sm:text-8xl",
  minW = "min-w-[3rem] sm:min-w-[5rem]",
}: {
  value: string;
  label: string;
  numClass?: string;
  minW?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${minW}`}>
      {/* keyed by value so it re-mounts and replays the tick animation on change */}
      <span
        key={value}
        className={`cd-digit font-heading font-black leading-none tabular-nums ${numClass}`}
      >
        {value}
      </span>
      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  );
}
