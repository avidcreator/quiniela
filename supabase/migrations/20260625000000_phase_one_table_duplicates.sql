-- Phase 1 preparation: exact duplicates of the live tables, prefixed phase_one_.
-- Originals are left fully intact (production keeps using them and the cron keeps
-- writing to public.matches / public.match_events). app_settings stays global; the
-- avatars storage bucket is unchanged. The local app will be repointed at these copies.
-- Data is NOT copied here (this migration is schema-only / re-runnable on a fresh DB);
-- a one-time backfill from the originals was run separately during this prep.

-- 1) Structures: LIKE ... INCLUDING ALL copies columns, defaults, NOT NULL, CHECK
--    constraints, primary keys and indexes (but NOT foreign keys or RLS state).
create table public.phase_one_players      (like public.players      including all);
create table public.phase_one_matches      (like public.matches      including all);
create table public.phase_one_predictions  (like public.predictions  including all);
create table public.phase_one_match_events (like public.match_events including all);
create table public.phase_one_winners      (like public.winners      including all);

-- 2) Foreign keys, repointed within the phase_one_ set (delete rules match the originals).
alter table public.phase_one_predictions
  add constraint phase_one_predictions_player_id_fkey
    foreign key (player_id) references public.phase_one_players(id) on delete cascade,
  add constraint phase_one_predictions_match_number_fkey
    foreign key (match_number) references public.phase_one_matches(match_number) on delete restrict;

alter table public.phase_one_match_events
  add constraint phase_one_match_events_match_number_fkey
    foreign key (match_number) references public.phase_one_matches(match_number) on delete cascade;

alter table public.phase_one_winners
  add constraint phase_one_winners_player_id_fkey
    foreign key (player_id) references public.phase_one_players(id) on delete cascade;

-- 3) RLS: enable and recreate the public-read policy on each (writes use the service role).
alter table public.phase_one_players      enable row level security;
alter table public.phase_one_matches      enable row level security;
alter table public.phase_one_predictions  enable row level security;
alter table public.phase_one_match_events enable row level security;
alter table public.phase_one_winners      enable row level security;

create policy "phase_one_players public read"      on public.phase_one_players      for select to anon, authenticated using (true);
create policy "phase_one_matches public read"      on public.phase_one_matches      for select to anon, authenticated using (true);
create policy "phase_one_predictions public read"  on public.phase_one_predictions  for select to anon, authenticated using (true);
create policy "phase_one_match_events public read" on public.phase_one_match_events for select to anon, authenticated using (true);
create policy "phase_one_winners public read"      on public.phase_one_winners      for select to anon, authenticated using (true);
