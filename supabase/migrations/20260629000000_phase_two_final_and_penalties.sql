-- Phase 2 knockout matches can be decided after 90'. Store the final score
-- (incl. extra time) and the penalty-shootout score so the admin can enter them
-- and the results cards can show them. These are DISPLAY-ONLY — points are still
-- awarded solely on the regulation score (actual_a/actual_b).
--
-- All four columns are nullable and default null: existing matches (and any
-- match decided in regulation) simply leave them blank.

alter table phase_two_matches
  add column final_a smallint,
  add column final_b smallint,
  add column pen_a   smallint,
  add column pen_b   smallint,
  add constraint phase_two_matches_final_a_check check (final_a >= 0),
  add constraint phase_two_matches_final_b_check check (final_b >= 0),
  add constraint phase_two_matches_pen_a_check check (pen_a >= 0),
  add constraint phase_two_matches_pen_b_check check (pen_b >= 0),
  add constraint phase_two_matches_final_pair check ((final_a is null) = (final_b is null)),
  add constraint phase_two_matches_pen_pair check ((pen_a is null) = (pen_b is null));
