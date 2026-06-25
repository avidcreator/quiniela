import Papa from "papaparse";
import { roundFirst, roundLast, type RoundDef } from "@/lib/rounds";
import type { ParseResult } from "./schedule";

export type RoundScorecardRow = {
  match_number: number; // global 1..32
  pred_a: number;
  pred_b: number;
};

const REQUIRED_COLUMNS = [
  "match_number",
  "date",
  "team_a",
  "team_b",
  "predicted_team_a",
  "predicted_team_b",
];

/**
 * Parse one knockout round's scorecard for a single player. Same columns as the
 * phase-1 scorecard; `match_number` is the official tournament number, which
 * must fall inside this round's range. Exactly `round.count` rows.
 *
 * Predictions are the regular-time score (90' + stoppage), excluding extra time
 * and penalties.
 */
export function parseRoundScorecardCsv(
  text: string,
  round: RoundDef,
): ParseResult<RoundScorecardRow> {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return { ok: false, error: `CSV inválido: ${parsed.errors[0].message}` };
  }

  const headers = parsed.meta.fields ?? [];
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      return { ok: false, error: `Falta la columna "${col}".` };
    }
  }

  const data = parsed.data;
  if (data.length !== round.count) {
    return {
      ok: false,
      error: `${round.label}: se esperan ${round.count} fila${round.count === 1 ? "" : "s"}, llegaron ${data.length}.`,
    };
  }

  const first = roundFirst(round);
  const last = roundLast(round);
  const rows: RoundScorecardRow[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const lineNo = i + 2;

    const num = Number(row.match_number);
    if (!Number.isInteger(num) || num < first || num > last) {
      return {
        ok: false,
        error: `Fila ${lineNo}: match_number "${row.match_number}" debe estar entre ${first} y ${last} (${round.label}).`,
      };
    }
    if (seen.has(num)) {
      return { ok: false, error: `Fila ${lineNo}: match_number ${num} duplicado.` };
    }
    seen.add(num);

    const predA = Number(row.predicted_team_a);
    const predB = Number(row.predicted_team_b);
    if (!Number.isInteger(predA) || predA < 0) {
      return {
        ok: false,
        error: `Fila ${lineNo}: predicted_team_a "${row.predicted_team_a}" debe ser entero >= 0.`,
      };
    }
    if (!Number.isInteger(predB) || predB < 0) {
      return {
        ok: false,
        error: `Fila ${lineNo}: predicted_team_b "${row.predicted_team_b}" debe ser entero >= 0.`,
      };
    }

    rows.push({
      match_number: num,
      pred_a: predA,
      pred_b: predB,
    });
  }

  rows.sort((a, b) => a.match_number - b.match_number);
  return { ok: true, rows };
}
