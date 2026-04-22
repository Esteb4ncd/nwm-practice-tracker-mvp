-- Manual validation script for progression + economy logic.
-- Run after setup.sql with a teacher session in SQL editor (or impersonation).

-- 1) Verify worlds are seeded as 15 / 20 / 30
select id, label, step_count, theme from public.worlds order by id;

-- 2) Pick a test student
-- replace with an actual student id if needed
-- select id, username, teacher_id from public.students limit 1;

-- 3) Snapshot before awarding stickers
-- select * from public.get_student_progress_snapshot('<student_uuid>'::uuid, null);

-- 4) Award stickers and verify milestone/world boundaries:
-- Step 14 -> 15 should trigger world 1 completion + 30 bonus.
-- Step 34 -> 35 should trigger world 2 completion + 30 bonus.
-- Step 64 -> 65 should trigger world 3 completion + 30 bonus and stop progression.
--
-- repeat call example:
-- select * from public.award_sticker('<student_uuid>'::uuid, 'star', 'validation run');

-- 5) Verify no progression beyond 65
-- Expected: raises exception "Student already completed all 65 steps"
-- select * from public.award_sticker('<student_uuid>'::uuid, 'star', 'overflow test');

-- 6) Verify ledger totals (10 per step + world bonuses - redemptions)
-- select student_id, sum(amount) as balance from public.student_coin_ledger
-- where student_id = '<student_uuid>'::uuid
-- group by student_id;

-- 7) Verify badge cadence every 5 world-steps + world trophies
-- select badge_type, world_id, step_number, badge_label
-- from public.student_badges
-- where student_id = '<student_uuid>'::uuid
-- order by step_number;

-- 8) Verify insufficient coin redemption is rejected
-- set a too-expensive prize and request redemption:
-- select * from public.request_prize_redemption(
--   '<student_uuid>'::uuid,
--   '<prize_uuid>'::uuid,
--   '<share_token>',
--   'validation insufficient test'
-- );

-- 9) Verify redemption approval deducts coins exactly once
-- select * from public.get_teacher_redemption_queue();
-- select * from public.approve_prize_redemption('<redemption_uuid>'::uuid, 'approved');
-- select * from public.get_redemption_history('<student_uuid>'::uuid, '<share_token>');
