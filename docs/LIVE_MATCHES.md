# Live matches (API-Football)

Shows in-progress matches on the home page with a live score, minute, a
minute-by-minute event feed (goals, cards, subs, penalties, VAR), and a "si
queda así" projection of who would earn points if the score held.

## How it works

1. A Vercel **cron** hits `/api/cron/live` every minute.
2. That endpoint polls **API-Football** for live fixtures of the configured
   league/season and writes the score, status, minute and events into Supabase
   (`matches.live_*` columns + the `match_events` table).
3. Viewers read from our DB (one API call serves everyone). The home page
   auto-refreshes every ~20s while a match is live.

## Setup

1. Create an account at <https://www.api-football.com/> (api-sports.io) and copy
   your API key. The free tier works for testing; a paid tier is recommended for
   real-time polling during the tournament.
2. Set env vars (locally in `.env.local`, and in **Vercel → Settings → Env**):
   - `API_FOOTBALL_KEY` — your key
   - `API_FOOTBALL_LEAGUE` — `1` (FIFA World Cup)
   - `API_FOOTBALL_SEASON` — `2026`
   - `CRON_SECRET` — any long random string (`openssl rand -base64 32`). Vercel
     sends it to the cron automatically; the endpoint rejects calls without it.
3. Deploy. `vercel.json` already registers the cron (`* * * * *`).
4. In the admin portal → **En vivo**:
   - Click **Mapear partidos automáticamente** to link each of our matches to its
     API fixture (matched by country + date). Review/fix any in the table; the
     "Local = A" checkbox sets which API side is your Equipo A.
   - Use **Actualizar en vivo ahora** to poll on demand.

## Notes

- If `API_FOOTBALL_KEY` is unset, the cron is a no-op and nothing breaks — the
  rest of the app works as before.
- API-Football rate limits apply per plan. To avoid burning quota around the
  clock, `pollLive()` first checks whether any mapped match is in its play
  window (from ~5 min before kickoff to ~3.5 h after, or any match still flagged
  live from the previous poll). **If none is, the cron returns immediately and
  makes no API call.** Only during an actual match does it hit the API (~1 call
  for the live list + 1 per live match for events). Size your plan and the cron
  frequency (`vercel.json`) for that in-match rate, not 24/7.
- The live feed **never** writes the official result. When the API reports a
  final status (`FT`/`AET`/`PEN`) the card shows as finalized and lingers for 5
  minutes, but `actual_a`/`actual_b` (and therefore every player's points) are
  set **only** from the admin portal → **Resultados**. This keeps scoring under
  manual control and avoids a wrong/early feed result moving the leaderboard.
