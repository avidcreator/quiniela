-- Phase 2 schema: knockout-stage quiniela (Round of 32 → Final), 2026-06-25.
--
-- ADDITIVE ONLY. This migration introduces a fresh `phase_two_*` table set and a
-- single global `app_settings` row. It does NOT touch any existing phase_one_*
-- table or any existing app_settings row.
--
-- Differences from the phase_one_* tables (see 20260519000000_baseline_schema.sql):
--   * matches carry a `round` field (R32|R16|QF|SF|3RD|FINAL); there is no `group`.
--   * match_number ranges 1..32 (32 knockout matches) instead of 1..72.
--   * predictions are populated incrementally per round — there is intentionally
--     NO constraint that a player has a prediction for every match.
-- actual_a/actual_b hold the REGULAR-TIME score only (90' + stoppage), excluding
-- extra time and penalties; scoring rules are identical to phase 1.

-- ============================ Tables ============================

create table phase_two_players (
  id         uuid not null default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  avatar_url text,
  constraint phase_two_players_pkey primary key (id)
);

create table phase_two_matches (
  match_number       smallint not null,
  round              text not null,
  kickoff_at         timestamptz not null,
  team_a             text not null,
  team_b             text not null,
  actual_a           smallint,
  actual_b           smallint,
  completed_at       timestamptz,
  api_fixture_id     bigint,
  api_home_is_a      boolean,
  live_status        text,
  live_elapsed       smallint,
  live_elapsed_extra smallint,
  live_home          smallint,
  live_away          smallint,
  live_updated_at    timestamptz,
  constraint phase_two_matches_pkey primary key (match_number),
  constraint phase_two_matches_actual_a_check check (actual_a >= 0),
  constraint phase_two_matches_actual_b_check check (actual_b >= 0),
  constraint phase_two_matches_actual_pair check (
    (actual_a is null and actual_b is null)
    or (actual_a is not null and actual_b is not null)
  ),
  constraint phase_two_matches_match_number_check check (match_number >= 1 and match_number <= 32),
  constraint phase_two_matches_round_check check (round in ('R32','R16','QF','SF','3RD','FINAL'))
);

create table phase_two_predictions (
  player_id    uuid not null,
  match_number smallint not null,
  pred_a       smallint not null,
  pred_b       smallint not null,
  constraint phase_two_predictions_pkey primary key (player_id, match_number),
  constraint phase_two_predictions_pred_a_check check (pred_a >= 0),
  constraint phase_two_predictions_pred_b_check check (pred_b >= 0)
);

create table phase_two_match_events (
  id            uuid not null default gen_random_uuid(),
  match_number  smallint not null,
  signature     text not null,
  sort_index    integer not null default 0,
  elapsed       smallint,
  elapsed_extra smallint,
  type          text not null,
  detail        text,
  side          text,
  player        text,
  assist        text,
  comments      text,
  created_at    timestamptz not null default now(),
  constraint phase_two_match_events_pkey primary key (id),
  constraint phase_two_match_events_match_number_signature_key unique (match_number, signature)
);

create table phase_two_winners (
  player_id   uuid not null,
  declared_at timestamptz not null default now(),
  constraint phase_two_winners_pkey primary key (player_id)
);

-- ============================ Foreign keys ============================

alter table phase_two_predictions
  add constraint phase_two_predictions_player_id_fkey
    foreign key (player_id) references phase_two_players (id) on delete cascade,
  add constraint phase_two_predictions_match_number_fkey
    foreign key (match_number) references phase_two_matches (match_number) on delete restrict;

alter table phase_two_match_events
  add constraint phase_two_match_events_match_number_fkey
    foreign key (match_number) references phase_two_matches (match_number) on delete cascade;

alter table phase_two_winners
  add constraint phase_two_winners_player_id_fkey
    foreign key (player_id) references phase_two_players (id) on delete cascade;

-- ============================ Indexes ============================

create unique index phase_two_players_lower_idx
  on phase_two_players (lower(name));
create index phase_two_matches_kickoff_at_idx
  on phase_two_matches (kickoff_at);
create index phase_two_predictions_match_number_idx
  on phase_two_predictions (match_number);
create index phase_two_match_events_match_number_sort_index_idx
  on phase_two_match_events (match_number, sort_index);

-- ============================ Row Level Security ============================
-- Public read on every table; all writes go through the service role (which
-- bypasses RLS), so no insert/update/delete policies are defined.

alter table phase_two_players      enable row level security;
alter table phase_two_matches      enable row level security;
alter table phase_two_predictions  enable row level security;
alter table phase_two_match_events enable row level security;
alter table phase_two_winners      enable row level security;

create policy "phase_two_players public read"
  on phase_two_players for select to anon, authenticated using (true);
create policy "phase_two_matches public read"
  on phase_two_matches for select to anon, authenticated using (true);
create policy "phase_two_predictions public read"
  on phase_two_predictions for select to anon, authenticated using (true);
create policy "phase_two_match_events public read"
  on phase_two_match_events for select to anon, authenticated using (true);
create policy "phase_two_winners public read"
  on phase_two_winners for select to anon, authenticated using (true);

-- ============================ Global settings ============================
-- Which phase the PUBLIC sees. Admins can preview the other phase via cookie;
-- this row is the published default and stays phase_one until launch.
insert into app_settings (key, value) values ('active_phase', 'phase_one')
  on conflict (key) do nothing;
