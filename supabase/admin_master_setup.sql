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
  teacher_name text,
  pin_hash text,
  pin_is_hashed boolean
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
    t.name as teacher_name,
    s.pin_hash,
    case when s.pin_hash like '$2%' then true else false end as pin_is_hashed
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

create or replace function public.admin_create_teacher_account(
  p_email text,
  p_password text,
  p_name text default null
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
declare
  v_email text := lower(trim(p_email));
  v_user_id uuid := gen_random_uuid();
begin
  perform public.admin_assert_access();

  if nullif(v_email, '') is null then
    raise exception 'Teacher email is required';
  end if;

  if length(trim(p_password)) < 8 then
    raise exception 'Teacher password must be at least 8 characters';
  end if;

  if exists (
    select 1
    from auth.users u
    where lower(u.email::text) = v_email
  ) then
    raise exception 'An auth account already exists for this email';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(trim(p_password), extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_email,
    now(),
    now()
  );

  insert into public.teachers (id, name, email)
  values (v_user_id, nullif(trim(p_name), ''), v_email);

  return query
  select
    t.id,
    t.name,
    t.email
  from public.teachers t
  where t.id = v_user_id;
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
  teacher_name text,
  pin_hash text,
  pin_is_hashed boolean
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
    v_teacher_name,
    students.pin_hash,
    case when students.pin_hash like '$2%' then true else false end;
end;
$$;

create or replace function public.admin_update_student_pin(
  p_student_id uuid,
  p_new_pin text
)
returns table (
  id uuid,
  teacher_id uuid,
  username text,
  class_code text,
  share_token text,
  created_at timestamptz,
  teacher_name text,
  pin_hash text,
  pin_is_hashed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_name text;
begin
  perform public.admin_assert_access();

  if length(trim(p_new_pin)) < 4 then
    raise exception 'Student PIN must be at least 4 characters';
  end if;

  update public.students s
  set pin_hash = extensions.crypt(trim(p_new_pin), extensions.gen_salt('bf'))
  where s.id = p_student_id;

  if not found then
    raise exception 'Student not found';
  end if;

  select t.name
  into v_teacher_name
  from public.students s
  left join public.teachers t on t.id = s.teacher_id
  where s.id = p_student_id;

  return query
  select
    s.id,
    s.teacher_id,
    s.username,
    s.class_code,
    s.share_token,
    s.created_at,
    v_teacher_name,
    s.pin_hash,
    case when s.pin_hash like '$2%' then true else false end
  from public.students s
  where s.id = p_student_id;
end;
$$;

grant execute on function public.admin_assert_access() to authenticated;
grant execute on function public.admin_is_current_user() to authenticated;
grant execute on function public.admin_list_auth_users() to authenticated;
grant execute on function public.admin_list_teachers() to authenticated;
grant execute on function public.admin_list_students() to authenticated;
grant execute on function public.admin_create_teacher_profile(uuid, text, text) to authenticated;
grant execute on function public.admin_create_teacher_account(text, text, text) to authenticated;
grant execute on function public.admin_create_student_profile(uuid, text, text, text) to authenticated;
grant execute on function public.admin_update_student_pin(uuid, text) to authenticated;
