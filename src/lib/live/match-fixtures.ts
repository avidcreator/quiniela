import "server-only";
import { countryCode } from "@/lib/countries";
import type { ApiFixture } from "./api-football";

/**
 * Suggest which API fixture corresponds to one of our matches, by comparing
 * country codes (our Spanish names → ISO via countries.ts, API English names →
 * ISO via a small lookup) and the kickoff date. Returns the best fixture plus
 * whether the API "home" team is our team_a.
 */

// Minimal English-name → flag-icons code map for the API team names.
const EN_CODES: Record<string, string> = {
  mexico: "mx",
  "south africa": "za",
  "south korea": "kr",
  "korea republic": "kr",
  "czech republic": "cz",
  czechia: "cz",
  canada: "ca",
  "bosnia and herzegovina": "ba",
  "bosnia & herzegovina": "ba",
  usa: "us",
  "united states": "us",
  paraguay: "py",
  qatar: "qa",
  switzerland: "ch",
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb-sct",
  australia: "au",
  "türkiye": "tr",
  turkey: "tr",
  germany: "de",
  "curaçao": "cw",
  curacao: "cw",
  netherlands: "nl",
  japan: "jp",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  ecuador: "ec",
  sweden: "se",
  tunisia: "tn",
  spain: "es",
  "cape verde": "cv",
  belgium: "be",
  egypt: "eg",
  "saudi arabia": "sa",
  uruguay: "uy",
  iran: "ir",
  "new zealand": "nz",
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",
  portugal: "pt",
  "dr congo": "cd",
  "congo dr": "cd",
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
  uzbekistan: "uz",
  colombia: "co",
};

function apiCode(name: string): string | null {
  const k = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
  // try exact, then with original (accented) key
  return EN_CODES[name.toLowerCase()] ?? EN_CODES[k] ?? null;
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

export type FixtureSuggestion = {
  fixtureId: number;
  homeIsA: boolean;
  apiHome: string;
  apiAway: string;
  date: string;
};

export function suggestFixture(
  ourMatch: { team_a: string; team_b: string; kickoff_at: string },
  fixtures: ApiFixture[],
): FixtureSuggestion | null {
  const codeA = countryCode(ourMatch.team_a);
  const codeB = countryCode(ourMatch.team_b);
  if (!codeA || !codeB) return null;

  for (const f of fixtures) {
    const home = apiCode(f.teams.home.name);
    const away = apiCode(f.teams.away.name);
    if (!home || !away) continue;
    const pairMatches =
      (home === codeA && away === codeB) || (home === codeB && away === codeA);
    if (!pairMatches) continue;
    // Prefer same calendar day, but accept if the pair is unique.
    const dayOk = sameDay(f.fixture.date, ourMatch.kickoff_at);
    if (!dayOk) continue;
    return {
      fixtureId: f.fixture.id,
      homeIsA: home === codeA,
      apiHome: f.teams.home.name,
      apiAway: f.teams.away.name,
      date: f.fixture.date,
    };
  }
  // Fallback: ignore the day if the team pair matches exactly once.
  const pairOnly = fixtures.filter((f) => {
    const home = apiCode(f.teams.home.name);
    const away = apiCode(f.teams.away.name);
    return (
      (home === codeA && away === codeB) || (home === codeB && away === codeA)
    );
  });
  if (pairOnly.length === 1) {
    const f = pairOnly[0];
    const home = apiCode(f.teams.home.name);
    return {
      fixtureId: f.fixture.id,
      homeIsA: home === codeA,
      apiHome: f.teams.home.name,
      apiAway: f.teams.away.name,
      date: f.fixture.date,
    };
  }
  return null;
}
