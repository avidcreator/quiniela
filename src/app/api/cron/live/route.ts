import { NextResponse } from "next/server";
import { pollLive } from "@/lib/live/ingest";
import { apiConfigured } from "@/lib/live/api-football";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Polls API-Football for live matches and writes updates to our DB.
 * Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET:
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!apiConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "API_FOOTBALL_KEY no configurado" },
      { status: 200 },
    );
  }

  try {
    const result = await pollLive();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
