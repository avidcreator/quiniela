"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export type PagedSlide = {
  key: string;
  href: string | null;
  current: boolean;
  node: React.ReactNode;
};

/**
 * Native-feeling paged scroll for mobile: the current match is centered with the
 * neighbours peeking on each side. Dragging brings a neighbour into view (real
 * scroll-snap feedback); when it settles on a neighbour we navigate to it.
 */
export function MatchSwiper({ slides }: { slides: PagedSlide[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const ready = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndex = slides.findIndex((s) => s.current);

  // Center the current slide on mount (instantly, without triggering nav).
  useEffect(() => {
    ready.current = false;
    const c = containerRef.current;
    const cur = slideEls.current[currentIndex];
    if (c && cur) {
      c.scrollLeft = cur.offsetLeft - (c.clientWidth - cur.clientWidth) / 2;
    }
    if (slides.length > 0) {
      slides.forEach((s) => {
        if (s.href) router.prefetch(s.href);
      });
    }
    const t = setTimeout(() => {
      ready.current = true;
    }, 80);
    return () => clearTimeout(t);
  }, [currentIndex, slides, router]);

  function onScroll() {
    if (!ready.current) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const c = containerRef.current;
      if (!c) return;
      const center = c.scrollLeft + c.clientWidth / 2;
      let best = -1;
      let bestDist = Infinity;
      slideEls.current.forEach((el, i) => {
        if (!el) return;
        const mid = el.offsetLeft + el.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      if (best >= 0 && best !== currentIndex) {
        const s = slides[best];
        if (s.href) {
          ready.current = false;
          router.push(s.href);
        }
      }
    }, 120);
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="-mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-[8vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {slides.map((s, i) => (
        <div
          key={s.key}
          ref={(el) => {
            slideEls.current[i] = el;
          }}
          className="w-[84vw] shrink-0 snap-center px-1.5"
        >
          {s.node}
        </div>
      ))}
    </div>
  );
}
