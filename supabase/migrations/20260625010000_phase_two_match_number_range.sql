-- Phase 2 uses the official tournament match numbers, which continue from the
-- 72 group-stage matches: knockouts are 73..104 (R32 73-88, R16 89-96, QF
-- 97-100, SF 101-102, 3rd 103, Final 104). Relax the match_number check from the
-- earlier 1..32 placeholder. phase_two_matches is empty, so this is safe.

alter table phase_two_matches
  drop constraint phase_two_matches_match_number_check,
  add constraint phase_two_matches_match_number_check
    check (match_number >= 73 and match_number <= 104);
