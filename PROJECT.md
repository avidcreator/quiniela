# World Cup 2026 Quiniela

A web app for a family World Cup 2026 prediction pool. Family members submit predicted scores for all 72 group stage matches before the tournament begins. As matches finish, the admin enters real scores, and the app tracks points, leaderboard standings, and stats for each player. Anyone with the link can view everything; only the admin can modify data.

## How it works

Each player submits a scorecard with predictions for all 72 group stage matches before the tournament starts. The admin enters the real score for each match as it finishes. The app compares each player's prediction to the real score, awards points, and updates the leaderboard and per-player stats.

There is no authentication for viewers — anyone with the link sees the full state of the pool. Only the admin (via a password-gated portal) can seed the schedule, add or remove players, or enter match scores.

## Scoring

For each completed match, each player earns:

- **3 points** — exact score match (a "strike"). Example: predicted Mexico 2–0; actual Mexico 2–0.
- **1 point** — correct outcome but not exact score. Either the winning team was predicted, or a tie was predicted and the match was a tie but the score didn't match.
- **0 points** — wrong outcome.

A strike (3 points) also counts as a "win" — strikes are a subset of wins.

## Stats (per player)

- **Points** — total points across all completed matches
- **Match strikes** — count of 3-point predictions
- **Strike ratio** — strikes ÷ matches played
- **Wins** — count of matches where the player earned at least 1 point (includes strikes)
- **Win ratio** — wins ÷ matches played
- **Matches played** — total completed matches (same for every player; tournament progress out of 72)

## Match states

- **Pending** — no real score entered
- **Completed** — real score entered by admin

A match flips from pending to completed when the admin enters its score. There is no live state.

Leaderboard ties are co-placed: multiple players can share rank 1, 2, etc.

## CSV templates

### Schedule (one-time, admin)
72 rows. Columns: `match_number`, `date`, `team_a`, `team_b`.

### Scorecard (one per player, admin)
72 rows. Columns: `match_number`, `date`, `team_a`, `team_b`, `predicted_team_a`, `predicted_team_b`. Team and date columns are included for human verification when transcribing from photographed scorecards. Scorecards are immutable after upload.

## Views

- **Home / dashboard** — today's matches, recent results feed (last 6 matches), leaderboard preview (top 5).
- **Leaderboard** — full ranked list with co-placement on ties.
- **Match detail** — schedule info, real score if completed, every player's prediction with points earned.
- **Player detail** — stats card and full scorecard, with a player switcher to jump between scorecards.
- **Recent results** — full page of all completed matches.

## Admin

Password-gated portal. The admin can:

- Seed the 72-match schedule via one-time CSV upload (and edit individual entries if FIFA reschedules)
- Add a player by providing a name and uploading a scorecard CSV
- Remove a player
- Enter or edit any match's real score at any time (the edit path is the fallback for accidental entries)

## UX direction

UX is a first-class concern. The app should feel fluid, natural, and fun while remaining modern and clean. Mobile-first responsive design that also reads well on desktop. Interactions are smooth; stats are presented clearly but with personality. Light moments of delight — badges for recent strikes, animations on leaderboard rank changes, contextual callouts (e.g. "Only Beto called this one"). No splashy gamification or celebration screens.

## Out of scope

- Knockout stage predictions
- Player self-service signup or scorecard editing
- External score API integration
- Push or email notifications
- User accounts or auth beyond the admin password
- Multi-tournament support

## Current state

Setup. PRD is locked. No code written yet.
