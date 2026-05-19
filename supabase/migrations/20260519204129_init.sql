-- Initial schema for World Cup 2026 Quiniela.
-- Three tables: matches (the 72 group-stage fixtures), players, predictions.
-- All tables are publicly readable via the anon key; writes are performed
-- exclusively by the admin server using the service-role key (which bypasses RLS).

create extension if not exists "pgcrypto";

create table public.matches (
  match_number smallint primary key check (match_number between 1 and 72),
  kickoff_at  timestamptz not null,
  team_a      text not null,
  team_b      text not null,
  actual_a    smallint check (actual_a >= 0),
  actual_b    smallint check (actual_b >= 0),
  completed_at timestamptz,
  constraint matches_actual_pair check (
    (actual_a is null and actual_b is null) or
    (actual_a is not null and actual_b is not null)
  )
);

create index matches_kickoff_idx on public.matches (kickoff_at);

create table public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create unique index players_name_lower_idx on public.players (lower(name));

create table public.predictions (
  player_id    uuid     not null references public.players(id)        on delete cascade,
  match_number smallint not null references public.matches(match_number) on delete restrict,
  pred_a       smallint not null check (pred_a >= 0),
  pred_b       smallint not null check (pred_b >= 0),
  primary key (player_id, match_number)
);

create index predictions_match_idx on public.predictions (match_number);

alter table public.matches      enable row level security;
alter table public.players      enable row level security;
alter table public.predictions  enable row level security;

create policy "matches public read"     on public.matches      for select to anon, authenticated using (true);
create policy "players public read"     on public.players      for select to anon, authenticated using (true);
create policy "predictions public read" on public.predictions  for select to anon, authenticated using (true);
