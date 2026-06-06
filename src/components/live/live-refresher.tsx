"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page periodically so live data stays fresh. */
export function LiveRefresher({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
