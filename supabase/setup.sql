-- NewWest Music School - Supabase setup
-- Run this file in Supabase SQL editor.

create extension if not exists pgcrypto;

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
  share_token text default gen_random_uuid()::text,
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

create index if not exists idx_students_teacher_id on public.students(teacher_id);
create index if not exists idx_sessions_student_id on public.sessions(student_id);
create index if not exists idx_rewards_student_id on public.rewards(student_id);

alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.rewards enable row level security;

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

-- Student portal does not use Supabase Auth. Keep reads controlled via RPC or share_token endpoints.

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

-- Student login helper RPC used by StudentLoginPage.
create or replace function public.students_by_class_code(class_code_input text)
returns table (
  id uuid,
  teacher_id uuid,
  username text,
  pin_hash text,
  class_code text,
  level int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.teacher_id, s.username, s.pin_hash, s.class_code, s.level, s.created_at
  from public.students s
  where upper(s.class_code) = upper(class_code_input)
  order by s.username asc;
$$;

grant execute on function public.students_by_class_code(text) to anon, authenticated;
