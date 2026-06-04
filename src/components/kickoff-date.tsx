"use client";

import { useEffect, useState } from "react";

type Variant = "long" | "short" | "time";

function format(iso: string, variant: Variant, timeZone?: string): string {
  const base: Intl.DateTimeFormatOptions =
    variant === "long"
      ? {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
        }
      : variant === "time"
        ? { hour: "numeric", minute: "2-digit" }
        : {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          };
  const opts = timeZone ? { ...base, timeZone } : base;
  return new Intl.DateTimeFormat("es-MX", opts).format(new Date(iso));
}

export function KickoffDate({
  iso,
  variant = "short",
  className,
}: {
  iso: string;
  variant?: Variant;
  className?: string;
}) {
  // Render a deterministic UTC value on the server and during hydration (so it
  // matches the server HTML), then re-render after mount to format in the
  // viewer's own timezone — never the server's.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const text = mounted ? format(iso, variant) : format(iso, variant, "UTC");

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
