-- Baseline schema snapshot of production (Supabase project: quiniela), 2026-06-25.
--
-- SQUASHED BASELINE: this single file recreates the entire current `public` schema
-- from scratch, replacing the earlier piecemeal migration files that had drifted out
-- of sync with the live database. It mirrors production exactly:
--   * phase_one_* tables — the active phase-1 data set
--   * app_settings        — global key/value settings (e.g. live_enabled)
-- The original unprefixed tables (matches/players/predictions/winners/match_events)
-- were dropped after the phase-1 cutover and are intentionally absent here.
--
-- NOT captured here (managed outside the public schema): the `avatars` storage bucket.
--
-- NOTE: the remote migration log (supabase_migrations.schema_migrations) still lists
-- the historical migrations. This file is the source of truth for schema STRUCTURE;
-- if you ever adopt the CLI push/reset workflow, run `supabase migration repair`
-- to reconcile that log before pushing.

-- ============================ Tables ============================

create table app_settings (
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  constraint app_settings_pkey primary key (key)
);

create table phase_one_players (
  id         uuid not null default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  avatar_url text,
  constraint phase_one_players_pkey primary key (id)
);

create table phase_one_matches (
  match_number       smallint not null,
  kickoff_at         timestamptz not null,
  team_a             text not null,
  team_b             text not null,
  actual_a           smallint,
  actual_b           smallint,
  completed_at       timestamptz,
  "group"            text,
  api_fixture_id     bigint,
  api_home_is_a      boolean,
  live_status        text,
  live_elapsed       smallint,
  live_elapsed_extra smallint,
  live_home          smallint,
  live_away          smallint,
  live_updated_at    timestamptz,
  constraint phase_one_matches_pkey primary key (match_number),
  constraint matches_actual_a_check check (actual_a >= 0),
  constraint matches_actual_b_check check (actual_b >= 0),
  constraint matches_actual_pair check (
    (actual_a is null and actual_b is null)
    or (actual_a is not null and actual_b is not null)
  ),
  constraint matches_match_number_check check (match_number >= 1 and match_number <= 72)
);

create table phase_one_predictions (
  player_id    uuid not null,
  match_number smallint not null,
  pred_a       smallint not null,
  pred_b       smallint not null,
  constraint phase_one_predictions_pkey primary key (player_id, match_number),
  constraint predictions_pred_a_check check (pred_a >= 0),
  constraint predictions_pred_b_check check (pred_b >= 0)
);

create table phase_one_match_events (
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
  constraint phase_one_match_events_pkey primary key (id),
  constraint phase_one_match_events_match_number_signature_key unique (match_number, signature)
);

create table phase_one_winners (
  player_id   uuid not null,
  declared_at timestamptz not null default now(),
  constraint phase_one_winners_pkey primary key (player_id)
);

-- ============================ Foreign keys ============================

alter table phase_one_predictions
  add constraint phase_one_predictions_player_id_fkey
    foreign key (player_id) references phase_one_players (id) on delete cascade,
  add constraint phase_one_predictions_match_number_fkey
    foreign key (match_number) references phase_one_matches (match_number) on delete restrict;

alter table phase_one_match_events
  add constraint phase_one_match_events_match_number_fkey
    foreign key (match_number) references phase_one_matches (match_number) on delete cascade;

alter table phase_one_winners
  add constraint phase_one_winners_player_id_fkey
    foreign key (player_id) references phase_one_players (id) on delete cascade;

-- ============================ Indexes ============================

create unique index phase_one_players_lower_idx
  on phase_one_players (lower(name));
create index phase_one_matches_kickoff_at_idx
  on phase_one_matches (kickoff_at);
create index phase_one_predictions_match_number_idx
  on phase_one_predictions (match_number);
create index phase_one_match_events_match_number_sort_index_idx
  on phase_one_match_events (match_number, sort_index);

-- ============================ Row Level Security ============================
-- Public read on every table; all writes go through the service role (which
-- bypasses RLS), so no insert/update/delete policies are defined.

alter table app_settings          enable row level security;
alter table phase_one_players      enable row level security;
alter table phase_one_matches      enable row level security;
alter table phase_one_predictions  enable row level security;
alter table phase_one_match_events enable row level security;
alter table phase_one_winners      enable row level security;

create policy "app_settings public read"
  on app_settings for select to public using (true);
create policy "phase_one_players public read"
  on phase_one_players for select to anon, authenticated using (true);
create policy "phase_one_matches public read"
  on phase_one_matches for select to anon, authenticated using (true);
create policy "phase_one_predictions public read"
  on phase_one_predictions for select to anon, authenticated using (true);
create policy "phase_one_match_events public read"
  on phase_one_match_events for select to anon, authenticated using (true);
create policy "phase_one_winners public read"
  on phase_one_winners for select to anon, authenticated using (true);
