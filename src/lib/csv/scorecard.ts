import Papa from "papaparse";
import type { ParseResult } from "./schedule";

export type ScorecardRow = {
  match_number: number;
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

export function parseScorecardCsv(text: string): ParseResult<ScorecardRow> {
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
  if (data.length !== 72) {
    return {
      ok: false,
      error: `Se esperan 72 filas, llegaron ${data.length}.`,
    };
  }

  const rows: ScorecardRow[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const lineNo = i + 2;

    const matchNum = Number(row.match_number);
    if (!Number.isInteger(matchNum) || matchNum < 1 || matchNum > 72) {
      return {
        ok: false,
        error: `Fila ${lineNo}: match_number "${row.match_number}" debe ser entero 1-72.`,
      };
    }
    if (seen.has(matchNum)) {
      return { ok: false, error: `Fila ${lineNo}: match_number ${matchNum} duplicado.` };
    }
    seen.add(matchNum);

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

    rows.push({ match_number: matchNum, pred_a: predA, pred_b: predB });
  }

  rows.sort((a, b) => a.match_number - b.match_number);
  return { ok: true, rows };
}
