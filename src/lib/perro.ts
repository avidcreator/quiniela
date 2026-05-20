import "server-only";
import { isCompleted, type Snapshot, type Match } from "./data";
import {
  computeMatchPredictions,
  type LeaderboardEntry,
  type PredictionWithPoints,
} from "./stats";

export type PerroQuote = {
  text: string;
  context?: string;
};

const ICONIC = [
  "Aquí en el América, aquí en el ABC, en el Aplus de la quiniela familiar.",
  "Esto va a quedar al horno con yuca, no se diga más.",
  "Las patadas se las dan a los burros — en la quiniela hay que pensar.",
  "Como dijo el filósofo: el que no la mete, se queda en la fila.",
  "Y la quiniela sigue. ¡No le aflojen ni un milímetro!",
  "Esto se está madurando como pera en agua.",
  "Quien no le entra al chile, no come pozole.",
  "El que sabe sabe, y el que no, a ver el fútbol por la tele.",
  "Y aquí en la cabina no nos perdemos ni una jugada, carnal.",
  "Esto es fútbol, esto es quiniela, esto es pura emoción del bueno.",
];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function nameUpper(s: string): string {
  return s.toUpperCase();
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h;
}

function namesList(players: PredictionWithPoints[]): string {
  const names = players.map((p) => nameUpper(p.name));
  if (names.length <= 2) return names.join(" y ");
  return names.slice(0, 2).join(", ") + " y otros";
}

function matchContext(m: Match): string {
  return `${m.team_a} ${m.actual_a}–${m.actual_b} ${m.team_b}`;
}

export function generatePerroQuotes(
  snap: Snapshot,
  leaderboard: LeaderboardEntry[],
  limit = 1,
): PerroQuote[] {
  const completed = snap.matches
    .filter(isCompleted)
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.kickoff_at).getTime() -
        new Date(a.completed_at ?? a.kickoff_at).getTime(),
    );

  const stateSeed =
    completed.length * 1009 +
    (completed[0]?.match_number ?? 0) * 17 +
    ((completed[0]?.actual_a ?? 0) + (completed[0]?.actual_b ?? 0));

  // No matches yet — show a leader nod or iconic line.
  if (completed.length === 0) {
    const leader = leaderboard[0];
    if (leader && leader.points > 0) {
      return [
        {
          text: `${nameUpper(leader.name)} arranca al frente. A ver si aguanta el ritmo.`,
          context: `#1 · ${leader.points} pts`,
        },
      ];
    }
    return [{ text: pick(ICONIC, stateSeed) }];
  }

  const mostRecent = completed[0];
  const preds = computeMatchPredictions(snap, mostRecent.match_number);
  const strikers = preds.filter((p) => p.points === 3);
  const winners = preds.filter((p) => p.points === 1);
  const losers = preds.filter((p) => p.points === 0);
  const ctx = matchContext(mostRecent);
  const goals = (mostRecent.actual_a ?? 0) + (mostRecent.actual_b ?? 0);
  const draw = mostRecent.actual_a === mostRecent.actual_b;

  // 1) Solo striker
  if (strikers.length === 1) {
    const s = strikers[0];
    const lines = [
      `¡Y se la sacó del sombrero ${nameUpper(s.name)}! Solito le atinó al marcador.`,
      `Y se le aparece la Virgen a ${nameUpper(s.name)} — qué puntería tan !@#$%*!.`,
      `${nameUpper(s.name)} es brujo, o qué !@#$%*!@#. ¡Le atinó solito!`,
      `¡Tin marín de don pingüé, ${nameUpper(s.name)} le acertó porqué! Los demás, a chillar.`,
      `${nameUpper(s.name)} se la sabe de pe a pa. Los otros pa' la calle.`,
      `Cómo le pegó ${nameUpper(s.name)} — le hizo lo que el viento a Juárez al marcador.`,
      `Hijole, ${nameUpper(s.name)} le clavó el marcador. Cosa de magos.`,
      `${nameUpper(s.name)} le calculó hasta los suspiros del balón.`,
      `Qué barbaridad, ${nameUpper(s.name)} salió con la jugada perfecta. Solito.`,
    ];
    return [{ text: pick(lines, hashStr(s.name) + stateSeed), context: ctx }];
  }

  // 2) Multi-striker (2+ exact-score hits)
  if (strikers.length >= 2) {
    const names = namesList(strikers);
    const lines = [
      `¡Y la cantaron ${names}! ¡Qué partido más sabroso, carnal!`,
      `${strikers.length} le adivinaron el marcador exacto. Esto es quiniela del bueno.`,
      `Mira nada más — ${names} salieron con el marcador justito.`,
      `Qué barbaridad, ${strikers.length} marcadores clavados. La cabina aplaude.`,
      `Esto fue para conocedores: ${names} le atinaron al marcador exacto.`,
    ];
    return [{ text: pick(lines, hashStr(names) + stateSeed), context: ctx }];
  }

  // 3) Total whiff — nobody scored
  if (preds.length > 0 && losers.length === preds.length) {
    const lines = [
      `Aquí no la metió ni el águila. Patinaron todos como cabros sueltos.`,
      `Quedaron como burros en cancha de pelos. ¡Cero aciertos en este!`,
      `Falló hasta el de los aires. La pelota se les rió en la cara.`,
      `Nadie, nadie le atinó. Una masacre — pero al revés, compadre.`,
      `Todos a echar palo. Ni con escalera le hubieran acertado a este resultado.`,
      `Patearon como gallinas sin cabeza. Cero, cero, cero. Increíble.`,
    ];
    return [
      { text: pick(lines, hashStr(ctx) + stateSeed), context: ctx },
    ];
  }

  // 4) Festival de goles (5+)
  if (goals >= 5) {
    const lines = [
      `¡Qué festival de goles, ${goals} mandados a guardar! Y los pronósticos, con la boca abierta.`,
      `Aquí hubo gol pa' donde quiera, ${goals} en total. La quiniela no daba abasto.`,
      `${goals} goles, ¿quién pensó que era ${ctx}? ¡Qué partidazo!`,
      `Esto fue cancha abierta, ${goals} pelotazos. Nadie esperaba semejante reventón.`,
    ];
    return [
      {
        text: pick(lines, hashStr(ctx) + stateSeed),
        context: ctx,
      },
    ];
  }

  // 5) Goalless cero-cero
  if (goals === 0) {
    const lines = [
      `Cero a cero, ni un suspiro. Los que se la jugaron al empate insulso, se la llevaron.`,
      `Bostezo de partido. Cero goles y cero emociones — pero los del empate sin goles, contentitos.`,
      `Aquí no se rompió ni un calcetín. ${winners.length > 0 ? `${winners.length} le adivinaron al chasco.` : "Nadie esperaba este aburrimiento."}`,
    ];
    return [
      { text: pick(lines, hashStr(ctx) + stateSeed), context: ctx },
    ];
  }

  // 6) Draw with goals
  if (draw) {
    const lines = [
      `Empatazo de los buenos. Los que se la jugaron al medio se la llevaron.`,
      `Y se repartieron los puntos, mi compa. ${winners.length} adivinaron el empate.`,
      `Empate justo, dirían algunos. Otros, a roer huesos. ${winners.length} se llevaron tantito.`,
    ];
    return [
      { text: pick(lines, hashStr(ctx) + stateSeed), context: ctx },
    ];
  }

  // 7) Ordinary winner picked by some
  const winnerName = (mostRecent.actual_a ?? 0) > (mostRecent.actual_b ?? 0)
    ? mostRecent.team_a
    : mostRecent.team_b;

  const lines = [
    `Ganó ${winnerName}, y ${winners.length} le adivinaron al ganador. Los demás, pal' burro.`,
    `${winnerName} se llevó los tres puntos. ${winners.length} pronosticador${winners.length === 1 ? "" : "es"} con sonrisa.`,
    `Aquí ganó ${winnerName} — ${winners.length === 0 ? "y nadie lo vio venir" : `${winners.length} le atinaron al ganador`}.`,
    `Y la pelota fue para ${winnerName}. ${winners.length} salieron contentos, otros a chillar.`,
  ];
  return [{ text: pick(lines, hashStr(ctx) + stateSeed), context: ctx }];
}
