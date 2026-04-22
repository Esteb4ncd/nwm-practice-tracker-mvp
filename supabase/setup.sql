-- NewWest Music School - Full backend logic setup
-- Run this file in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Base entities
create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  username text not null,
  pin_hash text,
  class_code text,
  share_token text not null default gen_random_uuid()::text,
  level int default 1,
  created_at timestamptz default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date,
  duration_minutes int,
  logged_by text check (logged_by in ('teacher', 'parent', 'student')),
  created_at timestamptz default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type text check (type in ('star', 'practice', 'achievement', 'effort')),
  assigned_by uuid references public.teachers(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

-- Progression and economy tables
create table if not exists public.worlds (
  id int primary key check (id between 1 and 3),
  label text not null,
  step_count int not null check (step_count > 0),
  theme text not null,
  sort_order int not null unique
);

create table if not exists public.student_progress (
  student_id uuid primary key references public.students(id) on delete cascade,
  total_steps int not null default 0 check (total_steps between 0 and 65),
  current_world_id int not null default 1 references public.worlds(id),
  current_world_step int not null default 1 check (current_world_step >= 1),
  unlocked_world_id int not null default 1 references public.worlds(id),
  milestone_badges int not null default 0,
  world_badges int not null default 0,
  total_badges int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.student_coin_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount int not null,
  entry_type text not null check (
    entry_type in ('step_reward', 'world_bonus', 'prize_redeem', 'manual_adjustment')
  ),
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  badge_key text not null,
  badge_type text not null check (badge_type in ('milestone', 'world')),
  world_id int not null references public.worlds(id),
  step_number int not null,
  badge_label text not null,
  created_at timestamptz not null default now(),
  unique (student_id, badge_key)
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete set null,
  sticker_type text not null check (sticker_type in ('star', 'practice', 'achievement', 'effort')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.prize_catalog (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  description text,
  coin_cost int not null check (coin_cost > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.prize_redemptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  prize_id uuid not null references public.prize_catalog(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  request_note text,
  review_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.teachers(id) on delete set null,
  ledger_entry_id uuid references public.student_coin_ledger(id) on delete set null
);

create index if not exists idx_students_teacher_id on public.students(teacher_id);
create index if not exists idx_sessions_student_id on public.sessions(student_id);
create index if not exists idx_rewards_student_id on public.rewards(student_id);
create index if not exists idx_progress_student on public.student_progress(student_id);
create index if not exists idx_coin_ledger_student on public.student_coin_ledger(student_id);
create index if not exists idx_badges_student on public.student_badges(student_id);
create index if not exists idx_reward_events_student on public.reward_events(student_id);
create index if not exists idx_prizes_teacher on public.prize_catalog(teacher_id);
create index if not exists idx_redemptions_teacher_status on public.prize_redemptions(teacher_id, status);

-- Seed worlds
insert into public.worlds (id, label, step_count, theme, sort_order)
values
  (1, 'Level 1', 15, 'starting_mountain', 1),
  (2, 'Level 2', 20, 'middle_climb', 2),
  (3, 'Level 3', 30, 'final_ascent', 3)
on conflict (id) do update
set
  label = excluded.label,
  step_count = excluded.step_count,
  theme = excluded.theme,
  sort_order = excluded.sort_order;

-- Utility helpers
create or replace function public.ensure_student_progress_row(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_progress (student_id)
  values (p_student_id)
  on conflict (student_id) do nothing;
end;
$$;

create or replace function public.get_coin_balance(p_student_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::int
  from public.student_coin_ledger
  where student_id = p_student_id
$$;

create or replace function public.compute_progress_state(p_total_steps int)
returns table (
  current_world_id int,
  current_world_step int,
  unlocked_world_id int
)
language plpgsql
immutable
as $$
begin
  if p_total_steps <= 0 then
    return query select 1, 1, 1;
  elsif p_total_steps < 15 then
    return query select 1, p_total_steps + 1, 1;
  elsif p_total_steps = 15 then
    return query select 2, 1, 2;
  elsif p_total_steps < 35 then
    return query select 2, (p_total_steps - 15) + 1, 2;
  elsif p_total_steps = 35 then
    return query select 3, 1, 3;
  elsif p_total_steps < 65 then
    return query select 3, (p_total_steps - 35) + 1, 3;
  else
    return query select 3, 30, 3;
  end if;
end;
$$;

create or replace function public.assert_teacher_owns_student(p_student_id uuid, p_teacher_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owned boolean;
begin
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.teacher_id = p_teacher_id
  )
  into owned;

  if not owned then
    raise exception 'Teacher cannot access this student';
  end if;
end;
$$;

create or replace function public.assert_student_share_token(
  p_student_id uuid,
  p_share_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  valid boolean;
begin
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.share_token = p_share_token
  )
  into valid;

  if not valid then
    raise exception 'Invalid student share token';
  end if;
end;
$$;

-- Main transactional write: instructor sticker award -> full progression state update
create or replace function public.award_sticker(
  p_student_id uuid,
  p_sticker_type text,
  p_note text default null
)
returns table (
  student_id uuid,
  total_steps int,
  current_world_id int,
  current_world_step int,
  unlocked_world_id int,
  coin_balance int,
  milestone_badges int,
  world_badges int,
  total_badges int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_reward_id uuid;
  v_total_steps int;
  v_new_total int;
  v_world_id int;
  v_world_step int;
  v_world_unlocked int;
  v_completed_world_id int;
  v_step_in_world int;
  v_is_milestone boolean := false;
  v_is_world_complete boolean := false;
begin
  if v_teacher_id is null then
    raise exception 'Teacher authentication required';
  end if;

  perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  perform public.ensure_student_progress_row(p_student_id);

  select sp.total_steps
  into v_total_steps
  from public.student_progress sp
  where sp.student_id = p_student_id
  for update;

  if v_total_steps >= 65 then
    raise exception 'Student already completed all 65 steps';
  end if;

  insert into public.rewards (student_id, type, assigned_by, note)
  values (p_student_id, p_sticker_type, v_teacher_id, p_note)
  returning id into v_reward_id;

  insert into public.reward_events (student_id, teacher_id, reward_id, sticker_type, note)
  values (p_student_id, v_teacher_id, v_reward_id, p_sticker_type, p_note);

  v_new_total := v_total_steps + 1;

  if v_new_total <= 15 then
    v_completed_world_id := 1;
    v_step_in_world := v_new_total;
  elsif v_new_total <= 35 then
    v_completed_world_id := 2;
    v_step_in_world := v_new_total - 15;
  else
    v_completed_world_id := 3;
    v_step_in_world := v_new_total - 35;
  end if;

  v_is_milestone := (v_step_in_world % 5 = 0);
  v_is_world_complete := (v_new_total = 15 or v_new_total = 35 or v_new_total = 65);

  select cps.current_world_id, cps.current_world_step, cps.unlocked_world_id
  into v_world_id, v_world_step, v_world_unlocked
  from public.compute_progress_state(v_new_total) cps;

  update public.student_progress sp
  set
    total_steps = v_new_total,
    current_world_id = v_world_id,
    current_world_step = v_world_step,
    unlocked_world_id = v_world_unlocked,
    milestone_badges = sp.milestone_badges + case when v_is_milestone then 1 else 0 end,
    world_badges = sp.world_badges + case when v_is_world_complete then 1 else 0 end,
    total_badges = sp.total_badges
      + case when v_is_milestone then 1 else 0 end
      + case when v_is_world_complete then 1 else 0 end,
    updated_at = now()
  where sp.student_id = p_student_id;

  insert into public.student_coin_ledger (
    student_id,
    amount,
    entry_type,
    reference_id,
    description
  )
  values (
    p_student_id,
    10,
    'step_reward',
    v_reward_id,
    'Sticker completed one checkpoint'
  );

  if v_is_milestone then
    insert into public.student_badges (
      student_id,
      badge_key,
      badge_type,
      world_id,
      step_number,
      badge_label
    )
    values (
      p_student_id,
      format('milestone-w%s-s%s', v_completed_world_id, v_step_in_world),
      'milestone',
      v_completed_world_id,
      v_new_total,
      format('Level %s milestone (%s steps)', v_completed_world_id, v_step_in_world)
    )
    on conflict (student_id, badge_key) do nothing;
  end if;

  if v_is_world_complete then
    insert into public.student_badges (
      student_id,
      badge_key,
      badge_type,
      world_id,
      step_number,
      badge_label
    )
    values (
      p_student_id,
      format('world-%s-complete', v_completed_world_id),
      'world',
      v_completed_world_id,
      v_new_total,
      format('Level %s completion trophy', v_completed_world_id)
    )
    on conflict (student_id, badge_key) do nothing;

    insert into public.student_coin_ledger (
      student_id,
      amount,
      entry_type,
      reference_id,
      description
    )
    values (
      p_student_id,
      30,
      'world_bonus',
      v_reward_id,
      format('World %s completion bonus', v_completed_world_id)
    );
  end if;

  return query
  select
    gps.student_id,
    gps.total_steps,
    gps.current_world_id,
    gps.current_world_step,
    gps.unlocked_world_id,
    gps.coin_balance,
    gps.milestone_badges,
    gps.world_badges,
    gps.total_badges
  from public.get_student_progress_snapshot(p_student_id, null) gps;
end;
$$;

-- Snapshot + read RPCs
create or replace function public.get_student_progress_snapshot(
  p_student_id uuid,
  p_share_token text default null
)
returns table (
  student_id uuid,
  total_steps int,
  current_world_id int,
  current_world_step int,
  unlocked_world_id int,
  coin_balance int,
  milestone_badges int,
  world_badges int,
  total_badges int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is not null then
    perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  else
    perform public.assert_student_share_token(p_student_id, p_share_token);
  end if;

  perform public.ensure_student_progress_row(p_student_id);

  return query
  select
    sp.student_id,
    sp.total_steps,
    sp.current_world_id,
    sp.current_world_step,
    sp.unlocked_world_id,
    public.get_coin_balance(sp.student_id) as coin_balance,
    sp.milestone_badges,
    sp.world_badges,
    sp.total_badges
  from public.student_progress sp
  where sp.student_id = p_student_id;
end;
$$;

create or replace function public.get_student_coin_balance(
  p_student_id uuid,
  p_share_token text default null
)
returns table (
  student_id uuid,
  coin_balance int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is not null then
    perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  else
    perform public.assert_student_share_token(p_student_id, p_share_token);
  end if;

  return query
  select p_student_id, public.get_coin_balance(p_student_id);
end;
$$;

create or replace function public.get_student_badges(
  p_student_id uuid,
  p_share_token text default null
)
returns table (
  id uuid,
  student_id uuid,
  badge_key text,
  badge_type text,
  world_id int,
  step_number int,
  badge_label text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is not null then
    perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  else
    perform public.assert_student_share_token(p_student_id, p_share_token);
  end if;

  return query
  select
    b.id,
    b.student_id,
    b.badge_key,
    b.badge_type,
    b.world_id,
    b.step_number,
    b.badge_label,
    b.created_at
  from public.student_badges b
  where b.student_id = p_student_id
  order by b.created_at desc;
end;
$$;

create or replace function public.get_student_reward_history(
  p_student_id uuid,
  p_share_token text default null
)
returns table (
  id uuid,
  student_id uuid,
  type text,
  assigned_by uuid,
  note text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is not null then
    perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  else
    perform public.assert_student_share_token(p_student_id, p_share_token);
  end if;

  return query
  select
    r.id,
    r.student_id,
    r.type,
    r.assigned_by,
    r.note,
    r.created_at
  from public.rewards r
  where r.student_id = p_student_id
  order by r.created_at desc;
end;
$$;

-- Prize flow RPCs
create or replace function public.get_prize_catalog(
  p_student_id uuid default null,
  p_share_token text default null
)
returns table (
  id uuid,
  teacher_id uuid,
  title text,
  description text,
  coin_cost int,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_owner_teacher_id uuid;
begin
  if p_student_id is not null then
    if v_teacher_id is not null then
      perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
    else
      perform public.assert_student_share_token(p_student_id, p_share_token);
    end if;

    select s.teacher_id into v_owner_teacher_id
    from public.students s
    where s.id = p_student_id;

    return query
    select
      pc.id,
      pc.teacher_id,
      pc.title,
      pc.description,
      pc.coin_cost,
      pc.is_active,
      pc.created_at
    from public.prize_catalog pc
    where pc.teacher_id = v_owner_teacher_id
      and pc.is_active = true
    order by pc.coin_cost asc;
  end if;

  if v_teacher_id is null then
    raise exception 'Teacher authentication required';
  end if;

  return query
  select
    pc.id,
    pc.teacher_id,
    pc.title,
    pc.description,
    pc.coin_cost,
    pc.is_active,
    pc.created_at
  from public.prize_catalog pc
  where pc.teacher_id = v_teacher_id
  order by pc.coin_cost asc;
end;
$$;

create or replace function public.request_prize_redemption(
  p_student_id uuid,
  p_prize_id uuid,
  p_share_token text default null,
  p_request_note text default null
)
returns table (
  redemption_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_coin_cost int;
  v_balance int;
begin
  perform public.assert_student_share_token(p_student_id, p_share_token);

  select s.teacher_id
  into v_teacher_id
  from public.students s
  where s.id = p_student_id;

  select pc.coin_cost
  into v_coin_cost
  from public.prize_catalog pc
  where pc.id = p_prize_id
    and pc.teacher_id = v_teacher_id
    and pc.is_active = true;

  if v_coin_cost is null then
    raise exception 'Prize not available for this student';
  end if;

  v_balance := public.get_coin_balance(p_student_id);
  if v_balance < v_coin_cost then
    raise exception 'Insufficient coin balance';
  end if;

  return query
  insert into public.prize_redemptions (
    student_id,
    prize_id,
    teacher_id,
    status,
    request_note
  )
  values (
    p_student_id,
    p_prize_id,
    v_teacher_id,
    'requested',
    p_request_note
  )
  returning id, status;
end;
$$;

create or replace function public.approve_prize_redemption(
  p_redemption_id uuid,
  p_review_note text default null
)
returns table (
  redemption_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_student_id uuid;
  v_coin_cost int;
  v_balance int;
  v_ledger_id uuid;
begin
  if v_teacher_id is null then
    raise exception 'Teacher authentication required';
  end if;

  select pr.student_id, pc.coin_cost
  into v_student_id, v_coin_cost
  from public.prize_redemptions pr
  join public.prize_catalog pc on pc.id = pr.prize_id
  where pr.id = p_redemption_id
    and pr.teacher_id = v_teacher_id
    and pr.status = 'requested'
  for update of pr;

  if v_student_id is null then
    raise exception 'Redemption not found or already processed';
  end if;

  v_balance := public.get_coin_balance(v_student_id);
  if v_balance < v_coin_cost then
    raise exception 'Insufficient balance at approval time';
  end if;

  insert into public.student_coin_ledger (
    student_id,
    amount,
    entry_type,
    reference_id,
    description
  )
  values (
    v_student_id,
    -v_coin_cost,
    'prize_redeem',
    p_redemption_id,
    'Prize redemption approved by teacher'
  )
  returning id into v_ledger_id;

  return query
  update public.prize_redemptions pr
  set
    status = 'approved',
    review_note = p_review_note,
    reviewed_at = now(),
    reviewed_by = v_teacher_id,
    ledger_entry_id = v_ledger_id
  where pr.id = p_redemption_id
  returning pr.id, pr.status;
end;
$$;

create or replace function public.reject_prize_redemption(
  p_redemption_id uuid,
  p_review_note text default null
)
returns table (
  redemption_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is null then
    raise exception 'Teacher authentication required';
  end if;

  return query
  update public.prize_redemptions pr
  set
    status = 'rejected',
    review_note = p_review_note,
    reviewed_at = now(),
    reviewed_by = v_teacher_id
  where pr.id = p_redemption_id
    and pr.teacher_id = v_teacher_id
    and pr.status = 'requested'
  returning pr.id, pr.status;
end;
$$;

create or replace function public.get_redemption_history(
  p_student_id uuid,
  p_share_token text default null
)
returns table (
  id uuid,
  student_id uuid,
  prize_id uuid,
  teacher_id uuid,
  status text,
  request_note text,
  review_note text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  prize_title text,
  prize_coin_cost int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is not null then
    perform public.assert_teacher_owns_student(p_student_id, v_teacher_id);
  else
    perform public.assert_student_share_token(p_student_id, p_share_token);
  end if;

  return query
  select
    pr.id,
    pr.student_id,
    pr.prize_id,
    pr.teacher_id,
    pr.status,
    pr.request_note,
    pr.review_note,
    pr.requested_at,
    pr.reviewed_at,
    pr.reviewed_by,
    pc.title as prize_title,
    pc.coin_cost as prize_coin_cost
  from public.prize_redemptions pr
  join public.prize_catalog pc on pc.id = pr.prize_id
  where pr.student_id = p_student_id
  order by pr.requested_at desc;
end;
$$;

create or replace function public.get_teacher_redemption_queue()
returns table (
  id uuid,
  student_id uuid,
  prize_id uuid,
  teacher_id uuid,
  status text,
  request_note text,
  review_note text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  prize_title text,
  prize_coin_cost int,
  student_username text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
begin
  if v_teacher_id is null then
    raise exception 'Teacher authentication required';
  end if;

  return query
  select
    pr.id,
    pr.student_id,
    pr.prize_id,
    pr.teacher_id,
    pr.status,
    pr.request_note,
    pr.review_note,
    pr.requested_at,
    pr.reviewed_at,
    pr.reviewed_by,
    pc.title as prize_title,
    pc.coin_cost as prize_coin_cost,
    s.username as student_username
  from public.prize_redemptions pr
  join public.prize_catalog pc on pc.id = pr.prize_id
  join public.students s on s.id = pr.student_id
  where pr.teacher_id = v_teacher_id
  order by pr.requested_at desc;
end;
$$;

-- Student login helper RPC used by StudentLoginPage.
create or replace function public.students_by_class_code(class_code_input text)
returns table (
  id uuid,
  teacher_id uuid,
  username text,
  pin_hash text,
  class_code text,
  share_token text,
  level int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.teacher_id,
    s.username,
    s.pin_hash,
    s.class_code,
    s.share_token,
    s.level,
    s.created_at
  from public.students s
  where upper(s.class_code) = upper(class_code_input)
  order by s.username asc;
$$;

-- RLS policies
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.rewards enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_coin_ledger enable row level security;
alter table public.student_badges enable row level security;
alter table public.reward_events enable row level security;
alter table public.prize_catalog enable row level security;
alter table public.prize_redemptions enable row level security;

drop policy if exists "teacher read self" on public.teachers;
create policy "teacher read self"
on public.teachers
for select
to authenticated
using (id = auth.uid());

drop policy if exists "teacher write self" on public.teachers;
create policy "teacher write self"
on public.teachers
for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "teachers manage own students" on public.students;
create policy "teachers manage own students"
on public.students
for all
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "teachers manage sessions for own students" on public.sessions;
create policy "teachers manage sessions for own students"
on public.sessions
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = sessions.student_id
      and s.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = sessions.student_id
      and s.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers manage rewards for own students" on public.rewards;
create policy "teachers manage rewards for own students"
on public.rewards
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = rewards.student_id
      and s.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = rewards.student_id
      and s.teacher_id = auth.uid()
  )
  and assigned_by = auth.uid()
);

drop policy if exists "teachers select student progress" on public.student_progress;
create policy "teachers select student progress"
on public.student_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_progress.student_id
      and s.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers select student coin ledger" on public.student_coin_ledger;
create policy "teachers select student coin ledger"
on public.student_coin_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_coin_ledger.student_id
      and s.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers select student badges" on public.student_badges;
create policy "teachers select student badges"
on public.student_badges
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_badges.student_id
      and s.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers select reward events" on public.reward_events;
create policy "teachers select reward events"
on public.reward_events
for select
to authenticated
using (teacher_id = auth.uid());

drop policy if exists "teachers manage own prizes" on public.prize_catalog;
create policy "teachers manage own prizes"
on public.prize_catalog
for all
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "teachers manage own redemptions" on public.prize_redemptions;
create policy "teachers manage own redemptions"
on public.prize_redemptions
for all
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- Grants
grant execute on function public.ensure_student_progress_row(uuid) to authenticated;
grant execute on function public.get_coin_balance(uuid) to authenticated;
grant execute on function public.compute_progress_state(int) to authenticated;
grant execute on function public.assert_teacher_owns_student(uuid, uuid) to authenticated;
grant execute on function public.assert_student_share_token(uuid, text) to anon, authenticated;
grant execute on function public.award_sticker(uuid, text, text) to authenticated;
grant execute on function public.get_student_progress_snapshot(uuid, text) to anon, authenticated;
grant execute on function public.get_student_coin_balance(uuid, text) to anon, authenticated;
grant execute on function public.get_student_badges(uuid, text) to anon, authenticated;
grant execute on function public.get_student_reward_history(uuid, text) to anon, authenticated;
grant execute on function public.get_prize_catalog(uuid, text) to anon, authenticated;
grant execute on function public.request_prize_redemption(uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.approve_prize_redemption(uuid, text) to authenticated;
grant execute on function public.reject_prize_redemption(uuid, text) to authenticated;
grant execute on function public.get_redemption_history(uuid, text) to anon, authenticated;
grant execute on function public.get_teacher_redemption_queue() to authenticated;
grant execute on function public.students_by_class_code(text) to anon, authenticated;

-- Seed sample prizes for every teacher
insert into public.prize_catalog (teacher_id, title, description, coin_cost, is_active)
select
  t.id,
  p.title,
  p.description,
  p.coin_cost,
  true
from public.teachers t
cross join (
  values
    ('Candy', 'Teacher-approved candy reward', 30),
    ('Stickers Pack', 'Pick a prize-box sticker pack', 60),
    ('Mini Toy', 'Small toy from the class prize shelf', 120)
) as p(title, description, coin_cost)
on conflict do nothing;
