import Papa from "papaparse";
import { roundFirst, roundLast, type RoundDef } from "@/lib/rounds";
import type { ParseResult } from "./schedule";

export type RoundScheduleRow = {
  match_number: number; // global 1..32
  round: string;
  kickoff_at: string;
  team_a: string;
  team_b: string;
};

const REQUIRED_COLUMNS = ["match_number", "date", "team_a", "team_b"];

/**
 * Parse one knockout round's CSV. Same columns as the phase-1 schedule;
 * `match_number` is the official tournament number, which must fall inside this
 * round's range (e.g. 73-88 for R32). Exactly `round.count` rows are expected.
 */
export function parseRoundScheduleCsv(
  text: string,
  round: RoundDef,
): ParseResult<RoundScheduleRow> {
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
  const rows: RoundScheduleRow[] = [];
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

    const dateRaw = (row.date ?? "").trim();
    const kickoff = new Date(dateRaw);
    if (!dateRaw || Number.isNaN(kickoff.getTime())) {
      return {
        ok: false,
        error: `Fila ${lineNo}: fecha "${dateRaw}" no es válida (usa ISO 8601 con zona horaria).`,
      };
    }

    const teamA = (row.team_a ?? "").trim();
    const teamB = (row.team_b ?? "").trim();
    if (!teamA || !teamB) {
      return {
        ok: false,
        error: `Fila ${lineNo}: team_a y team_b son obligatorios.`,
      };
    }

    rows.push({
      match_number: num,
      round: round.key,
      kickoff_at: kickoff.toISOString(),
      team_a: teamA,
      team_b: teamB,
    });
  }

  rows.sort((a, b) => a.match_number - b.match_number);
  return { ok: true, rows };
}
