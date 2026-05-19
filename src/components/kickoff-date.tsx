"use client";

import { useEffect, useState } from "react";

type Variant = "long" | "short" | "time";

function format(iso: string, variant: Variant): string {
  const opts: Intl.DateTimeFormatOptions =
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
  const [text, setText] = useState(() => format(iso, variant));

  useEffect(() => {
    setText(format(iso, variant));
  }, [iso, variant]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
