"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function MatchSwiper({
  prevHref,
  nextHref,
  children,
}: {
  prevHref: string | null;
  nextHref: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  // Prefetch neighbours so the swap is instant.
  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [prevHref, nextHref, router]);

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        // Require a clearly horizontal swipe.
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx > 0 && prevHref) router.push(prevHref); // swipe right → previous
        else if (dx < 0 && nextHref) router.push(nextHref); // swipe left → next
      }}
    >
      {children}
    </div>
  );
}
