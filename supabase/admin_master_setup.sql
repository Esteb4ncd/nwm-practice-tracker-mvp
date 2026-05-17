-- NewWest Music - Master admin portal setup
-- Run this after setup.sql.

create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

drop policy if exists "admin read self" on public.admin_profiles;
create policy "admin read self"
on public.admin_profiles
for select
to authenticated
using (id = auth.uid());

create or replace function public.admin_assert_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.admin_profiles a
    where a.id = auth.uid()
  ) then
    raise exception 'Admin access required';
  end if;
end;
$$;

create or replace function public.admin_is_current_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles a
    where a.id = auth.uid()
  );
$$;

create or replace function public.admin_list_auth_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_access();

  return query
  select
    u.id,
    u.email::text,
    u.created_at
  from auth.users u
  order by u.created_at desc
  limit 300;
end;
$$;

create or replace function public.admin_list_teachers()
returns table (
  id uuid,
  name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_access();

  return query
  select
    t.id,
    t.name,
    t.email
  from public.teachers t
  order by coalesce(t.name, t.email, t.id::text) asc;
end;
$$;

create or replace function public.admin_list_students()
returns table (
  id uuid,
  teacher_id uuid,
  username text,
  class_code text,
  share_token text,
  created_at timestamptz,
  teacher_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_access();

  return query
  select
    s.id,
    s.teacher_id,
    s.username,
    s.class_code,
    s.share_token,
    s.created_at,
    t.name as teacher_name
  from public.students s
  left join public.teachers t on t.id = s.teacher_id
  order by s.created_at desc;
end;
$$;

create or replace function public.admin_create_teacher_profile(
  p_teacher_id uuid,
  p_name text default null,
  p_email text default null
)
returns table (
  id uuid,
  name text,
  email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_access();

  if not exists (
    select 1
    from auth.users u
    where u.id = p_teacher_id
  ) then
    raise exception 'Auth user not found for teacher profile';
  end if;

  insert into public.teachers (id, name, email)
  values (p_teacher_id, nullif(trim(p_name), ''), nullif(trim(p_email), ''))
  on conflict (id) do update
  set
    name = coalesce(excluded.name, teachers.name),
    email = coalesce(excluded.email, teachers.email);

  return query
  select
    t.id,
    t.name,
    t.email
  from public.teachers t
  where t.id = p_teacher_id;
end;
$$;

create or replace function public.admin_create_student_profile(
  p_teacher_id uuid,
  p_username text,
  p_pin text,
  p_class_code text default null
)
returns table (
  id uuid,
  teacher_id uuid,
  username text,
  class_code text,
  share_token text,
  created_at timestamptz,
  teacher_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_name text;
begin
  perform public.admin_assert_access();

  if nullif(trim(p_username), '') is null then
    raise exception 'Student username is required';
  end if;

  if length(trim(p_pin)) < 4 then
    raise exception 'Student PIN must be at least 4 characters';
  end if;

  select t.name
  into v_teacher_name
  from public.teachers t
  where t.id = p_teacher_id;

  if v_teacher_name is null then
    raise exception 'Teacher profile not found';
  end if;

  return query
  insert into public.students (teacher_id, username, pin_hash, class_code)
  values (
    p_teacher_id,
    trim(p_username),
    extensions.crypt(trim(p_pin), extensions.gen_salt('bf')),
    nullif(upper(trim(p_class_code)), '')
  )
  returning
    students.id,
    students.teacher_id,
    students.username,
    students.class_code,
    students.share_token,
    students.created_at,
    v_teacher_name;
end;
$$;

grant execute on function public.admin_assert_access() to authenticated;
grant execute on function public.admin_is_current_user() to authenticated;
grant execute on function public.admin_list_auth_users() to authenticated;
grant execute on function public.admin_list_teachers() to authenticated;
grant execute on function public.admin_list_students() to authenticated;
grant execute on function public.admin_create_teacher_profile(uuid, text, text) to authenticated;
grant execute on function public.admin_create_student_profile(uuid, text, text, text) to authenticated;
