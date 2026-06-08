import "server-only";

/**
 * Thin client for API-Football (api-sports.io).
 *
 * Env:
 *   API_FOOTBALL_KEY      — your api-sports.io key
 *   API_FOOTBALL_LEAGUE   — league id (FIFA World Cup = 1)
 *   API_FOOTBALL_SEASON   — season year (e.g. 2026)
 *
 * Docs: https://www.api-football.com/documentation-v3
 */

const BASE = "https://v3.football.api-sports.io";

function headers() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY no está configurado");
  return { "x-apisports-key": key };
}

export function apiConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

function leagueParams() {
  return {
    league: process.env.API_FOOTBALL_LEAGUE ?? "1",
    season: process.env.API_FOOTBALL_SEASON ?? "2026",
  };
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football ${path} → ${res.status}`);
  }
  const json = (await res.json()) as { response: T; errors?: unknown };
  return json.response;
}

export type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
};

export type ApiEvent = {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string; // Goal | Card | subst | Var
  detail: string;
  comments: string | null;
};

/** All fixtures of the configured league+season (for fixture mapping). */
export async function fetchSeasonFixtures(): Promise<ApiFixture[]> {
  return get<ApiFixture[]>("/fixtures", leagueParams());
}

/** Currently-live fixtures of the configured league. Note: no `season` param —
 *  live fixtures are inherently the current season, and omitting it keeps the
 *  call working on API-Football's free plan (which blocks future seasons). */
export async function fetchLiveFixtures(): Promise<ApiFixture[]> {
  return get<ApiFixture[]>("/fixtures", {
    league: process.env.API_FOOTBALL_LEAGUE ?? "1",
    live: "all",
  });
}

/** One fixture by id (status + score). */
export async function fetchFixture(id: number): Promise<ApiFixture | null> {
  const res = await get<ApiFixture[]>("/fixtures", { id: String(id) });
  return res[0] ?? null;
}

/** Event feed for a fixture. */
export async function fetchFixtureEvents(id: number): Promise<ApiEvent[]> {
  return get<ApiEvent[]>("/fixtures/events", { fixture: String(id) });
}
