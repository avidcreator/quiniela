import Papa from "papaparse";

export type ScheduleRow = {
  match_number: number;
  kickoff_at: string;
  team_a: string;
  team_b: string;
  group: string | null;
};

export type ParseResult<T> =
  | { ok: true; rows: T[] }
  | { ok: false; error: string };

const REQUIRED_COLUMNS = ["match_number", "date", "team_a", "team_b"];

export function parseScheduleCsv(text: string): ParseResult<ScheduleRow> {
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

  const rows: ScheduleRow[] = [];
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

    const groupRaw = (row.group ?? row.grupo ?? "").trim().toUpperCase();
    const group = groupRaw.length > 0 ? groupRaw : null;

    rows.push({
      match_number: matchNum,
      kickoff_at: kickoff.toISOString(),
      team_a: teamA,
      team_b: teamB,
      group,
    });
  }

  rows.sort((a, b) => a.match_number - b.match_number);
  return { ok: true, rows };
}
