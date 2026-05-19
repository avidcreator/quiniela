# World Cup 2026 Quiniela — PRD

## Overview
A web app for a family FIFA World Cup 2026 prediction pool ("quiniela"). Family members submit a scorecard with predicted scores for all 72 group stage matches before the tournament begins. As matches finish, the admin enters the real scores, and the app tracks points, leaderboard standings, and stats for each player. Anyone with the link can view everything; only the admin can modify data.

## Goals
- Provide a single source of truth for the family quiniela.
- Show standings, stats, and predictions in near real time as the tournament progresses.
- Make it fun to check between matches.
- Stay extremely lean: no auth, no notifications, no extra mechanics.

## Non-goals
- Knockout stage predictions.
- Player self-service (no signup, no self-editing of scorecards).
- Live score syncing from an external API.
- Push or email notifications.
- Multi-tournament reuse (single instance for WC 2026).

## Users
- **Admin (one person).** Manages players, scorecards, schedule, and match results. Access via a password-gated admin portal.
- **Viewers (family members with the link).** Read-only access to everything: leaderboard, stats, all scorecards, match details. No login required.

## Scoring rules
For each completed match, each player's prediction is compared to the real score:

- **3 points** — exact score match (a "strike"). Example: predicted Mexico 2–0 South Africa; actual Mexico 2–0 South Africa.
- **1 point** — correct outcome but not exact score. Either:
  - Predicted the winning team (e.g. predicted Qatar 1–2 Switzerland; actual Qatar 0–1 Switzerland), OR
  - Predicted a tie and the match was a tie but the score didn't match (e.g. predicted 1–1; actual 0–0).
- **0 points** — wrong outcome.

A strike (3 points) also counts as a "win" for the win ratio stat — strikes are a subset of wins.

## CSV templates

### Schedule CSV (one-time, admin)
One row per match, 72 rows total.

- `match_number` — integer, 1–72
- `date` — ISO date with kickoff time
- `team_a` — string
- `team_b` — string

### Scorecard CSV (one per player, admin)
One row per match, 72 rows total. Match order must align with the schedule.

- `match_number`
- `date`
- `team_a`
- `team_b`
- `predicted_team_a` — integer score
- `predicted_team_b` — integer score

The team and date columns are included for human verification when transcribing from photographed scorecards.

## Stats (per player)
- **Points** — sum of points across all completed matches.
- **Match strikes** — count of matches where the player earned 3 points (exact score).
- **Strike ratio** — match strikes ÷ matches played.
- **Wins** — count of matches where the player earned at least 1 point (includes strikes).
- **Win ratio** — wins ÷ matches played.
- **Matches played** — total completed matches across the tournament. Same value for every player; represents tournament progress out of 72.

## Match states
- **Pending** — no real score entered yet.
- **Completed** — real score has been entered by the admin.

A match flips from pending to completed when the admin enters its score. There is no "live" state.

## Views

### Home / Dashboard
The default landing page. Sections in order:

- **Today's matches.** Any matches scheduled today, sorted by kickoff. Each links to its match detail page. If there are no matches today, this section is hidden or shows a brief placeholder.
- **Recent results feed.** Last 6 completed matches, most recent first. This ensures the feed always covers at least a full match day, since some days have up to 6 matches. Each entry shows match info, real score, and a tappable expansion with aces, winners, and the full prediction list.
- **Leaderboard preview.** Top 5 placements with rank, name, and points. Link to the full leaderboard.

### Leaderboard
Full ranked list of all players.

- Placement, with co-placement on point ties (multiple players can share rank 1, 2, etc.).
- Player name.
- Total points.
- Quick stats: match strikes, wins, matches played.

Tapping a player goes to their detail page.

### Match detail page
- Schedule info: match number, date, kickoff time, teams.
- Match state: pending or completed.
- Real score, if completed.
- Every player's prediction with points earned, sorted by points descending.

### Player detail page
- Player name.
- Stats card: points, match strikes, strike ratio, wins, win ratio, matches played.
- Full scorecard: all 72 predictions. Each row shows match info, prediction, real score (if completed), and points earned for that match.
- Player switcher: a dropdown or tabs allowing the viewer to jump to any other player's scorecard without leaving the page.

### Recent results (full page)
Linked from the dashboard's recent results section. Same content as the dashboard preview but expanded to all completed matches, scrollable, most recent first.

## Admin features
Accessed via a password-gated admin portal.

- **Seed schedule.** One-time CSV upload of all 72 matches. After seeding, the admin can edit individual schedule entries if FIFA reschedules a match.
- **Add player.** Provide a player name and upload a scorecard CSV. The scorecard is immutable after creation.
- **Remove player.** Removes the player and their scorecard from all views.
- **Enter or edit match score.** For any match, the admin can set or update the real score. The leaderboard and all stats recalculate immediately. This is also the fallback for correcting accidental entries.

## UX direction
- UX is a first-class concern. The app should feel fluid, natural, and fun while remaining modern and clean.
- Mobile-first responsive design that also reads well on desktop.
- Interactions feel smooth: thoughtful transitions between views, animations on data changes, no jarring loads.
- Stats are presented clearly but with personality — never dry tables for their own sake.
- Light moments of delight: badges for recent strikes, animations on leaderboard rank changes, contextual callouts (e.g. "Only Beto called this one" when exactly one player aced a match).
- Visual style: contemporary, well-spaced, confident typography. Clean by default with small touches of personality.
- No splashy gamification, celebration screens, or leaderboard fireworks.

## Out of scope
- Knockout stage predictions or any post-group-stage features.
- Player self-service signup or scorecard editing.
- External score API integration.
- Push or email notifications.
- User accounts, password resets, or any auth beyond the admin password.
- Tournament archive or multi-tournament support.
